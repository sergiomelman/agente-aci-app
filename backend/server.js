import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { v4 as uuidv4 } from 'uuid';

// --- 1. CONFIGURAÇÃO INICIAL ---
dotenv.config(); // Carrega as variáveis do arquivo .env
const app = express();
app.use(cors()); // Permite requisições do frontend
app.use(express.json({ limit: '10mb' })); // Permite que o servidor entenda JSON no corpo da requisição

// --- 2. INICIALIZAÇÃO DOS SERVIÇOS ---
// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Pinecone
const pinecone = new Pinecone();
// NOTA: Certifique-se de ter um índice criado no Pinecone.
// O nome do índice e a dimensão do vetor devem corresponder ao que você usa.
// Ex: 'segundo-cerebro', dimensão 1536 para 'text-embedding-3-small'
const pineconeIndex = pinecone.index('segundo-cerebro');


// --- 3. FUNÇÃO AUXILIAR PARA GERAR EMBEDDINGS ---
async function getEmbedding(text) {
  if (!text || typeof text !== 'string') {
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
// Este é o trabalho do Agente de Processamento e Organização (APO)
app.post('/api/notes', async (req, res) => {
  try {
    // Pega o texto e os metadados do corpo da requisição enviada pelo frontend
    const { normalizedText, ...metadata } = req.body;

    if (!normalizedText) {
      return res.status(400).json({ error: 'O campo normalizedText é obrigatório.' });
    }

    console.log("Recebido para processamento:", metadata.title || 'Nova Nota');

    // 1. Gerar o embedding (a representação vetorial do texto)
    const vector = await getEmbedding(normalizedText);
    console.log("Embedding gerado com sucesso.");

    // 2. Gerar um ID único para esta nota
    const id = uuidv4();

    // 3. Preparar os dados para o Pinecone
    const record = {
      id: id,
      values: vector, // O vetor numérico
      metadata: {     // Informações adicionais que queremos associar
        originalText: normalizedText,
        ...metadata,
        createdAt: new Date().toISOString()
      }
    };

    // 4. Salvar (upsert) no banco de dados vetorial
    await pineconeIndex.upsert([record]);
    console.log("Nota salva no Pinecone com ID:", id);

    res.status(201).json({ success: true, message: "Nota processada e salva com sucesso!", id: id });

  } catch (error) {
    console.error("Erro no endpoint /api/notes:", error);
    res.status(500).json({ success: false, message: "Erro interno do servidor.", error: error.message });
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

// --- 6. INICIAR O SERVIDOR ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor do Segundo Cérebro rodando na porta ${PORT}`);
});
