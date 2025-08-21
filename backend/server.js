import './config.js'; // IMPORTANTE: Deve ser a primeira linha para carregar as variáveis de ambiente
import express from 'express';
import cors from 'cors';
import { Client, APIErrorCode } from '@notionhq/client';
import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { v4 as uuidv4 } from 'uuid';
import trelloProxyRouter from './trello-proxy.js'; // Importe o roteador do Trello

// --- 1. CONFIGURAÇÃO INICIAL ---
const app = express();
const fetch = (await import('node-fetch')).default; // Garante que o fetch esteja disponível

// Validação de variáveis de ambiente essenciais
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'PINECONE_API_KEY',
  'PINECONE_INDEX_NAME',
  'TRELLO_API_KEY',
  'TRELLO_API_TOKEN',
  'NOTION_API_KEY',
  'NOTION_DATABASE_ID'
];
if (requiredEnvVars.some(v => !process.env[v])) {
  console.error(`Erro: As seguintes variáveis de ambiente são obrigatórias, mas não foram encontradas: ${requiredEnvVars.filter(v => !process.env[v]).join(', ')}`);
  process.exit(1);
}

app.use(cors()); // Permite requisições do frontend
app.use(express.json({ limit: '10mb' })); // Permite que o servidor entenda JSON no corpo da requisição

// --- 2. INICIALIZAÇÃO DOS SERVIÇOS ---
// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Pinecone
let pineconeIndex; // Será inicializado na função main


// --- 3. FUNÇÃO AUXILIAR PARA GERAR EMBEDDINGS ---
async function getEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error("Texto inválido para gerar embedding.");
  }
  // Substitui caracteres de nova linha por espaços, uma boa prática para embeddings.
  const inputText = text.replace(/\n/g, ' ');

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small", // Modelo de embedding da OpenAI
    input: inputText,
  });
  // O embedding é um vetor (array de números) que representa o significado do texto.
  return embeddingResponse.data[0].embedding;
}


// --- 4. ROTA DA API (ENDPOINT DE INGESTÃO) ---
// Este é o trabalho do Agente de Recuperação e Síntese (ARS), que armazena o conhecimento validado.
app.post('/api/ingest', async (req, res) => {
  console.log("Recebida solicitação para /api/ingest com dados validados...");
  try {
    // 1. Destructure dos dados validados pelo usuário, com valores padrão.
    const {
      title = 'Sem Título',
      summary = '',
      tags = [],
      category = 'Geral',
      originalText = '',
      source = 'Desconhecida'
    } = req.body;

    // 2. Combina os campos mais relevantes para um embedding semanticamente rico.
    const textToEmbed = `Título: ${title}\nResumo: ${summary}\n\n${originalText}`.trim();
    if (!textToEmbed) {
      return res.status(400).json({ success: false, message: 'É necessário fornecer um título, resumo ou texto original para a ingestão.' });
    }

    // 3. Gerar o embedding (a representação vetorial do texto)
    let vector;
    try {
      vector = await getEmbedding(textToEmbed);
      console.log("Embedding para dados validados gerado com sucesso.");
    } catch (embeddingError) {
      console.error("Erro ao gerar embedding com OpenAI:", embeddingError);
      throw new Error(`Falha ao gerar embedding. Detalhes: ${embeddingError.message}`);
    }

    // 4. Gerar um ID único para esta nota
    const id = uuidv4();

    // 5. Preparar os metadados completos para o Pinecone.
    // O Pinecone aceita arrays de strings para metadados, o que é ótimo para tags.
    const metadata = {
      title,
      summary,
      tags, // Salva como um array de strings
      category,
      originalText,
      source,
      createdAt: new Date().toISOString()
    };

    // 6. Preparar o registro completo para o Pinecone
    const record = {
      id: id,
      values: vector, // O vetor numérico
      metadata: metadata
    };

    // 7. Salvar (upsert) no banco de dados vetorial
    try {
      await pineconeIndex.upsert([record]);
      console.log("Nota salva no Pinecone com ID:", id);
    } catch (pineconeError) {
      console.error("Erro ao salvar no Pinecone:", pineconeError);
      // Lança o erro original para o catch principal, adicionando contexto.
      throw new Error(`Falha ao salvar no Pinecone. Detalhes: ${pineconeError.message}`);
    }

    res.status(201).json({ success: true, message: "Nota processada e salva com sucesso!", id: id });

  } catch (error) {
    console.error("Erro no endpoint /api/ingest:", error);
    // Distinguir o tipo de erro para uma resposta mais clara ao frontend
    if (error.message.includes("Falha ao gerar embedding")) {
        // 502 Bad Gateway indica um erro do serviço externo (OpenAI)
        return res.status(502).json({ success: false, message: "Erro de comunicação com o serviço de IA (OpenAI). Verifique a chave de API e o status do serviço.", error: error.message });
    }
    if (error.message.includes("Falha ao salvar no Pinecone")) {
        // 502 Bad Gateway indica um erro do serviço externo (Pinecone)
        return res.status(502).json({ success: false, message: "Erro de comunicação com o banco de dados vetorial (Pinecone).", error: error.message });
    }
    res.status(500).json({ success: false, message: "Ocorreu um erro inesperado no servidor.", error: error.message });
  }
});

// --- 5. ROTA DA API (ENDPOINT DE BUSCA SEMÂNTICA) ---
// Este é o trabalho do Agente de Recuperação e Síntese (ARS)
app.get('/api/search', async (req, res) => {
  try {
    const { q: query, topK = 5 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'O parâmetro de busca "q" é obrigatório.' });
    }

    console.log(`Recebida busca por: "${query}"`);

    // 1. Gerar o embedding para a query de busca
    const queryVector = await getEmbedding(String(query));
    console.log("Embedding da busca gerado com sucesso.");

    // 2. Consultar o Pinecone para encontrar os vetores mais similares
    const searchResponse = await pineconeIndex.query({
      vector: queryVector,
      topK: parseInt(topK, 10), // Número de resultados a retornar
      includeMetadata: true,    // Incluir os metadados que salvamos
    });

    console.log(`Encontrados ${searchResponse.matches.length} resultados.`);

    // 3. Formatar os resultados para o frontend
    const results = searchResponse.matches.map(match => ({
      id: match.id,
      score: match.score, // A pontuação de similaridade
      ...match.metadata
    }));

    res.status(200).json({ success: true, results });

  } catch (error) {
    console.error("Erro no endpoint /api/search:", error);
    res.status(500).json({ success: false, message: "Erro interno do servidor.", error: error.message });
  }
});

// --- 5.5 ROTA DA API (ENDPOINT DE ANÁLISE) ---
// Este é o trabalho do Agente de Processamento e Organização (APO)
app.post('/api/analyze', async (req, res) => {
  const { normalizedText } = req.body;

  if (!normalizedText || typeof normalizedText !== 'string' || normalizedText.trim() === '') {
    return res.status(400).json({ success: false, message: 'O texto para análise (normalizedText) é obrigatório.' });
  }

  console.log("Recebida solicitação para /api/analyze...");

  try {
    const prompt = `
      Analise o seguinte texto e retorne um objeto JSON com as seguintes chaves:
      - "title": Um título conciso e informativo para o texto (máximo 10 palavras).
      - "summary": Um resumo executivo do conteúdo (2-4 frases).
      - "tags": Um array com 3 a 5 palavras-chave ou tags relevantes em português.
      - "category": Uma única categoria sugerida para o texto (ex: "Trabalho", "Pessoal", "Estudo", "Tecnologia", "Finanças").

      Texto para análise:
      ---
      ${normalizedText}
      ---
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106", // Este modelo suporta o modo JSON
      messages: [
        {
          role: "system",
          content: "Você é um assistente de organização de conhecimento altamente eficiente. Sua tarefa é analisar o texto fornecido e extrair informações estruturadas. Responda sempre com um objeto JSON válido, sem nenhum texto ou formatação adicional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }, // Garante que a saída seja um JSON válido
      temperature: 0.5, // Um pouco de criatividade, mas ainda focado
    });

    const analysisResult = JSON.parse(response.choices[0].message.content);
    console.log("Análise da OpenAI concluída com sucesso:", analysisResult);

    res.status(200).json({ success: true, data: analysisResult });

  } catch (error) {
    console.error("Erro no endpoint /api/analyze:", error);
    if (error.response) {
      console.error("Detalhes do erro da OpenAI:", error.response.data);
    }
    res.status(502).json({ success: false, message: "Erro ao comunicar com o serviço de IA para análise.", error: error.message });
  }
});

// --- 5.5 ROTAS PROXY PARA SERVIÇOS EXTERNOS ---
// Monta o roteador do Trello sob o caminho /api/trello
app.use('/api/trello', trelloProxyRouter);

// --- 5.6 ROTA PROXY PARA O NOTION ---
const notion = process.env.NOTION_API_KEY ? new Client({ auth: process.env.NOTION_API_KEY }) : null;

app.get('/api/notion/pages', async (req, res) => {
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID?.trim();

  if (!notion || !NOTION_DATABASE_ID) {
    return res.status(500).json({ success: false, message: 'Chaves da API do Notion não configuradas no servidor.' });
  }

  try {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      // Você pode adicionar filtros ou ordenação aqui se necessário
    });

    // Esta parte precisa ser adaptada à estrutura da sua base de dados do Notion.
    // O código abaixo assume que você tem uma propriedade 'Name' (ou similar) para o título.
    const pages = response.results.map((page) => {
      // Simplificação: assume que a propriedade do título é do tipo 'title'
      const titleProperty = Object.values(page.properties).find(
        (prop) => prop.type === 'title',
      );
      const title = titleProperty?.title[0]?.plain_text || 'Sem Título';

      return {
        id: page.id,
        title: title,
        // Nota: O conteúdo real da página exige buscar os blocos, o que é uma chamada de API separada por página.
        // Para simplificar, podemos retornar um placeholder ou apenas o título por enquanto.
        content: `(Conteúdo da página ${title} a ser buscado)`
      };
    });

    res.status(200).json({ pages });
  } catch (error) {
    console.error("Erro ao buscar páginas do Notion:", error);
    if (error.code) { // It's a Notion API error
      switch (error.code) {
        case APIErrorCode.ObjectNotFound:
          return res.status(404).json({
            success: false,
            message: `Database not found. Please ensure the NOTION_DATABASE_ID is correct and the integration has been shared with the database.`
          });
        case APIErrorCode.InvalidRequestURL:
          return res.status(400).json({
            success: false,
            message: `The Notion Database ID appears to be invalid. Please check your .env file for NOTION_DATABASE_ID and ensure it does not contain extra characters or quotes.`
          });
        case APIErrorCode.Unauthorized:
        case APIErrorCode.RestrictedResource:
          return res.status(401).json({
            success: false,
            message: `The Notion integration is not authorized. Please check your NOTION_API_KEY and ensure the integration has the correct permissions (e.g., "Read content").`
          });
        default:
          // Handle other Notion API errors
          return res.status(500).json({ success: false, message: `Notion API Error: ${error.message}`, error: { code: error.code } });
      }
    }
    // Handle other non-API errors (e.g., TypeError from mapping)
    res.status(500).json({ success: false, message: 'Erro interno ao buscar dados do Notion.', error: { message: error.message } });
  }
});

// --- 6. FUNÇÃO PRINCIPAL E INICIALIZAÇÃO DO SERVIDOR ---
async function main() {
  try {
    console.log("Inicializando conexão com Pinecone...");
    const pinecone = new Pinecone();
    const indexName = process.env.PINECONE_INDEX_NAME;

    const indexes = await pinecone.listIndexes();
    if (!indexes.indexes.some(index => index.name === indexName)) {
      console.error(`Erro: O índice "${indexName}" não existe no Pinecone.`);
      console.log(`Por favor, crie o índice no dashboard do Pinecone com a dimensão correta (1536 para text-embedding-3-small).`);
      process.exit(1);
    }

    const indexDescription = await pinecone.describeIndex(indexName);
    console.log("Descrição do índice:", indexDescription);

    const expectedDimension = 1536; // Dimensão para o modelo 'text-embedding-3-small'
    if (indexDescription.dimension !== expectedDimension) {
      console.error(`Erro: A dimensão do índice "${indexName}" (${indexDescription.dimension}) não corresponde à dimensão esperada do modelo (${expectedDimension}).`);
      process.exit(1);
    }

    // Melhoria: Aguardar o índice ficar pronto em vez de sair imediatamente.
    if (!indexDescription.status?.ready) {
      console.log(`O índice "${indexName}" não está pronto. Status: ${indexDescription.status?.state}. Aguardando...`);
      const waitUntilReady = async (retries = 12) => { // Tenta por até 1 minuto (12 * 5s)
        if (retries === 0) {
          console.error(`Erro: O índice "${indexName}" não ficou pronto a tempo.`);
          process.exit(1);
        }
        const desc = await pinecone.describeIndex(indexName);
        if (desc.status?.ready) {
          console.log(`Índice "${indexName}" está pronto.`);
          return;
        }
        await new Promise(res => setTimeout(res, 5000)); // Espera 5 segundos
        await waitUntilReady(retries - 1);
      };
      await waitUntilReady();
    }

    pineconeIndex = pinecone.index(indexName);
    console.log(`Conectado com sucesso ao índice "${indexName}" do Pinecone.`);

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Servidor do Segundo Cérebro rodando na porta ${PORT}`);
    });

  } catch (error) {
    console.error("Falha ao inicializar o servidor:", error);
    process.exit(1);
  }
}

main();
