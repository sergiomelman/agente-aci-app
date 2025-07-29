// src/utils/processContent.js
// Pipeline central para normalização, metadados, título, tipo de documento, etc.
// Adapte as funções normalizeData e detectRelevantContent conforme sua implementação.

// Exemplo de funções utilitárias (substitua pelos seus algoritmos reais)

// Normalização mais robusta: remove espaços duplicados, normaliza quebras de linha, remove caracteres invisíveis
function normalizeData(rawText) {
  if (!rawText) return '';
  let text = rawText.replace(/[\u200B-\u200D\uFEFF]/g, ''); // remove chars invisíveis
  text = text.replace(/\r\n|\r/g, '\n'); // normaliza quebras de linha
  text = text.replace(/\n{2,}/g, '\n\n'); // parágrafos
  text = text.replace(/[ \t]+/g, ' '); // espaços duplicados
  return text.trim();
}


// Extração de metadados: título, tipo, data, tags, sumarização simples
function detectRelevantContent(normalizedText) {
  const lines = normalizedText.split('\n').filter(Boolean);
  
  // **MELHORIA NA DETECÇÃO DE TÍTULO**:
  // Procura por um título mais robusto, ignorando linhas muito curtas ou muito longas.
  // Dá preferência para as primeiras 5 linhas do documento.
  let suggestedTitle = '';
  for (const line of lines.slice(0, 5)) {
    const trimmedLine = line.trim();
    if (trimmedLine.length > 5 && trimmedLine.length < 100) {
      // Remove marcadores comuns como '# '
      suggestedTitle = trimmedLine.replace(/^#+\s*/, '').trim();
      break;
    }
  }
  // Fallback para a primeira linha se nada for encontrado
  if (!suggestedTitle) {
    suggestedTitle = lines[0]?.trim() || 'Sem Título';
  }

  // **MELHORIA NA CLASSIFICAÇÃO DE CONTEÚDO**:
  // Usando um sistema de pontuação simples para mais precisão.
  let contentType = 'Desconhecido';
  if (/estudo|resumo|aula/i.test(normalizedText)) contentType = 'Material de Estudo';
  else if (/artigo|not[ií]cia/i.test(normalizedText)) contentType = 'Artigo';
  else if (/reuni[aã]o|ata/i.test(normalizedText)) contentType = 'Reunião';
  else if (/tarefa|to.?do|task/i.test(normalizedText)) contentType = 'Tarefa';
  else if (/di[aá]rio|journal/i.test(normalizedText)) contentType = 'Diário';
  else if (/nota|note/i.test(normalizedText)) contentType = 'Nota';
  // Aprimoramento: se tiver checklist, provavelmente é uma tarefa ou reunião.
  if (/\[\s*\]|\[x\]/i.test(normalizedText) && (contentType === 'Nota' || contentType === 'Desconhecido')) {
    contentType = 'Tarefa';
  }

  // Data (procura por padrões de data)
  const dateMatch = normalizedText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[0] : null;

  // Tags (procura por #tag ou palavras entre colchetes)
  const tagMatches = normalizedText.match(/#(\w+)|\[(\w+)\]/g);
  const tags = tagMatches ? tagMatches.map(t => t.replace(/[#\[\]]/g, '')) : [];

  // Sumarização simples: primeiros 2 parágrafos
  // **MELHORIA NA SUMARIZAÇÃO**: Usando sumarização extrativa simples.
  const sentences = normalizedText.replace(/([.?!])\s*(?=[A-Z])/g, '$1|').split('|');
  const stopWords = new Set(['e', 'o', 'a', 'de', 'do', 'da', 'em', 'um', 'uma', 'para', 'com', 'não', 'mas', 'ou', 'se', 'que', 'como', 'eu', 'você', 'ele', 'ela']);
  const wordFrequencies = {};
  
  normalizedText.toLowerCase().split(/\s+/).forEach(word => {
    const cleanWord = word.replace(/[.,!?;:()]/g, '');
    if (!stopWords.has(cleanWord)) {
      wordFrequencies[cleanWord] = (wordFrequencies[cleanWord] || 0) + 1;
    }
  });

  const sentenceScores = sentences.map(sentence => {
    const words = sentence.toLowerCase().split(/\s+/);
    const score = words.reduce((acc, word) => acc + (wordFrequencies[word.replace(/[.,!?;:()]/g, '')] || 0), 0);
    return { sentence, score };
  });

  const summary = sentenceScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3) // Pega as 3 frases mais importantes
    .map(item => item.sentence.trim())
    .join(' ');

  return {
    suggestedTitle,
    contentType,
    date,
    tags,
    summary,
    // outros metadados...
  };
}


// Pipeline central: normaliza, extrai metadados e sumariza
export async function processContent(rawText) {
  const normalizedText = normalizeData(rawText);
  const metadata = detectRelevantContent(normalizedText);
  return {
    originalContent: rawText,
    normalizedText,
    metadata,
  };
}
