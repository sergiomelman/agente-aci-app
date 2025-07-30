// src/utils/processContent.js
// Pipeline central para normalização, metadados, título, tipo de documento, etc.

function normalizeData(rawText) {
  if (!rawText) return '';

  // 1. Remove caracteres invisíveis e normaliza quebras de linha
  let text = rawText.replace(/[\u200B-\u200D\uFEFF]/g, '');
  text = text.replace(/\r\n|\r/g, '\n');

  const lines = text.split('\n');
  const reconstructedLines = [];
  let currentParagraph = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine === '') {
      if (currentParagraph) {
        reconstructedLines.push(currentParagraph);
        currentParagraph = '';
      }
      reconstructedLines.push(''); // Mantém o parágrafo
    } else {
      // Une a linha se não for um item de lista e a linha anterior não terminar com pontuação.
      const endsWithPunctuation = /[.?!:;]$/.test(currentParagraph);
      const isListItem = /^\s*([-*•]|\d+\.)\s/.test(trimmedLine);

      if (currentParagraph && !endsWithPunctuation && !isListItem) {
        currentParagraph += ' ' + trimmedLine;
      } else {
        if (currentParagraph) {
          reconstructedLines.push(currentParagraph);
        }
        currentParagraph = trimmedLine;
      }
    }
  }

  if (currentParagraph) {
    reconstructedLines.push(currentParagraph);
  }

  // Junta palavras separadas por hífen no final da linha e limpa espaços extras.
  return reconstructedLines.join('\n').replace(/-\n/g, '').replace(/\n\n\n+/g, '\n\n').trim();
}

function detectRelevantContent(normalizedText) {
  const lines = normalizedText.split('\n').filter(Boolean);

  // **MELHORIA NA DETECÇÃO DE TÍTULO**:
  let suggestedTitle = '';
  for (const line of lines.slice(0, 5)) {
    const trimmedLine = line.trim();
    if (trimmedLine.length > 5 && trimmedLine.length < 100) {
      suggestedTitle = trimmedLine.replace(/^#+\s*/, '').trim();
      break;
    }
  }
  if (!suggestedTitle) {
    suggestedTitle = lines[0]?.trim() || 'Sem Título';
  }

  // **MELHORIA NA CLASSIFICAÇÃO DE CONTEÚDO**:
  let contentType = 'Desconhecido';
  if (/estudo|resumo|aula/i.test(normalizedText)) contentType = 'Material de Estudo';
  else if (/artigo|not[ií]cia/i.test(normalizedText)) contentType = 'Artigo';
  else if (/reuni[aã]o|ata/i.test(normalizedText)) contentType = 'Reunião';
  else if (/tarefa|to.?do|task/i.test(normalizedText)) contentType = 'Tarefa';
  else if (/di[aá]rio|journal/i.test(normalizedText)) contentType = 'Diário';
  else if (/nota|note/i.test(normalizedText)) contentType = 'Nota';
  if (/\[\s*\]|\[x\]/i.test(normalizedText) && (contentType === 'Nota' || contentType === 'Desconhecido')) {
    contentType = 'Tarefa';
  }

  // Data (procura por padrões de data)
  const dateMatch = normalizedText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[0] : null;

  // Tags (procura por #tag ou palavras entre colchetes)
  const tagMatches = normalizedText.match(/#(\w+)|\[(\w+)\]/g);
  const tags = tagMatches ? [...new Set(tagMatches.map(t => t.replace(/[#\[\]]/g, '')))] : [];

  // **NOVO**: Extração de links, emails e itens de lista
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
  const listItemRegex = /^\s*([-*•]|\d+\.)\s+(.*)/;

  const links = [...new Set(normalizedText.match(urlRegex) || [])];
  const emails = [...new Set(normalizedText.match(emailRegex) || [])];
  const listItems = lines.map(line => line.match(listItemRegex)).filter(Boolean).map(match => match[2]);

  // **MELHORIA NA SUMARIZAÇÃO**: Usando sumarização extrativa simples.
  const sentences = normalizedText.replace(/([.?!])\s*(?=[A-Z])/g, '$1|').split('|');
  const stopWords = new Set(['e', 'o', 'a', 'de', 'do', 'da', 'em', 'um', 'uma', 'para', 'com', 'não', 'mas', 'ou', 'se', 'que', 'como', 'eu', 'você', 'ele', 'ela', 'nós', 'eles', 'elas', 'este', 'esta', 'isto', 'aquele', 'aquela', 'aquilo']);
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
    links,
    emails,
    listItems,
    summary,
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
