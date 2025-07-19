import { useState, useEffect, useCallback } from 'react';

// Para que este hook funcione, a biblioteca Tesseract.js deve ser carregada globalmente
// via CDN no seu arquivo HTML (por exemplo, index.html).
// <script src="https://unpkg.com/tesseract.js@5.0.0/dist/tesseract.min.js"></script>

export const useAciProcessor = () => {
  const [inputContent, setInputContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [normalizedDataForAPO, setNormalizedDataForAPO] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);

  // Limpa a mensagem de status após 5 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Função de OCR (memoizada com useCallback)
  const performOCR = useCallback(async (file) => { // eslint-disable-line
    setMessage('Iniciando OCR...');
    setOcrProgress(0);

    if (typeof window.Tesseract === 'undefined') {
      setMessage('Erro: Tesseract.js não foi carregado. Verifique o script CDN no HTML.');
      console.error('Tesseract.js is not loaded.');
      return '';
    }

    // Lógica para processar PDFs
    if (file.type === 'application/pdf') {
      const pdfjsLib = await import('https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.min.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      setMessage('Processando PDF...');
      const fileReader = new FileReader();

      return new Promise((resolve, reject) => {
        fileReader.onload = async function() {
          try {
            const typedarray = new Uint8Array(this.result);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
              setMessage(`Processando página ${i} de ${pdf.numPages}...`);
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 2.0 }); // Aumentar a escala melhora a precisão do OCR
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              await page.render({ canvasContext: context, viewport }).promise;

              const { data: { text } } = await window.Tesseract.recognize(
                canvas,
                'por',
                {
                  logger: m => {
                    if (m.status === 'recognizing text') {
                      const pageProgress = m.progress / pdf.numPages;
                      const totalProgress = ((i - 1) / pdf.numPages) + pageProgress;
                      setOcrProgress(Math.round(totalProgress * 100));
                    }
                  }
                }
              );
              fullText += text + '\n\n';
            }
            setMessage('Processamento de PDF concluído!');
            resolve(fullText);
          } catch (error) {
            console.error('Erro ao processar PDF:', error);
            setMessage('Erro ao processar PDF. Tente novamente.');
            reject('');
          }
        };
        fileReader.readAsArrayBuffer(file);
      });
    }

    // Lógica original para imagens
    const { data: { text } } = await window.Tesseract.recognize(
      file,
      'por',
      {
        logger: m => {
          if (m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100));
        }
      }
    );
    return text;
  }, [setOcrProgress, setMessage]);

  // Função de detecção de conteúdo (memoizada com useCallback)
  const detectRelevantContent = useCallback((text) => {
    const detected = {
      title: '',
      links: [],
      emails: [],
      types: [],
      dates: [],
      listItems: [],
    };
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const emailRegex = /[\w.-]+@([\w-]+\.)+[\w-]{2,4}/g;
    // Regex para datas como "25 de julho"
    const dateRegex = /(\d{1,2} de \w+)/gi;
    const listItemRegex = /^\s*(?:\d+\.|-|\*|—)\s+(.*)/gm;
    
    const lines = text.trim().split('\n');
    // Procura pelo primeiro título que faça sentido, ignorando ruído.
    for (const line of lines) {
        const trimmedLine = line.trim().replace(/^[|O]\s*/, '').trim();
        // Um bom candidato a título:
        // - não é um item de lista
        // - tem um tamanho razoável (entre 10 e 150 caracteres)
        // - tem uma alta proporção de caracteres alfabéticos para filtrar ruído
        const isListItem = /^\s*(?:\d+\.|-|\*|—)/.test(trimmedLine);
        if (isListItem || trimmedLine.length < 10 || trimmedLine.length > 150) continue;

        const alphaChars = (trimmedLine.match(/[a-zA-Z]/g) || []).length;
        const totalChars = trimmedLine.length;
        
        if (totalChars > 0 && (alphaChars / totalChars > 0.6)) {
            detected.title = trimmedLine;
            break; // Para no primeiro candidato válido.
        }
    }

    detected.links = [...new Set(text.match(urlRegex) || [])];
    detected.emails = [...new Set(text.match(emailRegex) || [])];
    detected.dates = [...new Set(text.match(dateRegex) || [])];

    const lowerText = text.toLowerCase();
    const typeKeywords = {
      'Material de Estudo': ['aula', 'sistema definitivo', 'investidores', 'mercado financeiro', 'dividendos'],
      'Artigo': ['artigo', 'reportagem', 'notícia'],
      'Documento': [
        'documento', 'relatório', 'ata', 
        // Adicionando palavras-chave mais específicas para o exemplo
        'fatura', 'boleto', 'pagamento', 'vencimento'
      ],
      'Projeto/Plano': ['projeto', 'plano', 'briefing'],
      'Ideia/Conceito': ['ideia', 'conceito', 'brainstorm'],
    };

    for (const type in typeKeywords) {
      if (typeKeywords[type].some(keyword => lowerText.includes(keyword.toLowerCase()))) {
        detected.types.push(type);
      }
    }

    // Regra para preferir 'Material de Estudo' sobre 'Artigo' se ambos forem detectados
    if (detected.types.includes('Material de Estudo') && detected.types.includes('Artigo')) {
        detected.types = detected.types.filter(t => t !== 'Artigo');
    }

    detected.types = [...new Set(detected.types)];

    let match;
    while ((match = listItemRegex.exec(text)) !== null) {
      detected.listItems.push(match[1].trim());
    }
    
    return detected;
  }, []);

  // Função de normalização (memoizada com useCallback)
  const normalizeData = useCallback((text) => {
    if (!text) return '';

    // 1. Divide em linhas e faz uma limpeza inicial de ruídos comuns do OCR
    const lines = text.split('\n').map(line => 
      line.trim().replace(/^[|O]\s*/, '').trim()
    ).filter(line => {
      // Filtra linhas que são provavelmente ruído (ex: muito curtas, sem palavras reais)
      if (line.length < 10 && !/[a-zA-Z]{3,}/.test(line)) {
        return false;
      }
      return Boolean(line);
    });

    // 2. Reconstrói linhas que foram quebradas incorretamente pelo OCR
    const reconstructedLines = [];
    for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i];
        const nextLine = lines[i + 1];
        // Heurística para decidir se uma linha deve ser juntada com a próxima.
        // Uma linha é considerada "completa" se termina com pontuação forte (. ! ?)
        // ou se a próxima linha é claramente um novo item.
        const endsWithStrongPunctuation = /[.!?]$/.test(currentLine);
        const nextIsListItem = nextLine && /^\s*(?:\d+\.|-|\*|—)/.test(nextLine);
        const isLastLine = i === lines.length - 1;

        if (isLastLine || endsWithStrongPunctuation || nextIsListItem) {
            reconstructedLines.push(currentLine);
        } else {
            // É uma linha quebrada, então junta com a próxima.
            lines[i + 1] = currentLine + ' ' + nextLine;
        }
    }

    // 3. Formatação final: garante que parágrafos sejam separados por linhas duplas
    return reconstructedLines.join('\n').replace(/(\r\n|\n|\r){2,}/g, '\n\n').trim();
  }, []);

  // Função principal de processamento (memoizada com useCallback)
  const processContent = useCallback(async () => {
    setIsLoading(true);
    setExtractedText('');
    setNormalizedDataForAPO(null);
    setMessage('');
    setOcrProgress(0);

    let rawContent = '';
    if (selectedFile) {
      rawContent = await performOCR(selectedFile);
      setExtractedText(rawContent);
    } else if (inputContent.trim()) {
      rawContent = inputContent;
      setExtractedText(rawContent);
    } else {
      setMessage('Por favor, insira algum texto ou selecione um arquivo para processar.');
      setIsLoading(false);
      return;
    }

    const normalizedText = normalizeData(rawContent);
    const detectedInfo = detectRelevantContent(normalizedText);

    const dataForAPO = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      source: selectedFile ? selectedFile.name : 'Input Manual',
      originalContent: rawContent,
      normalizedText,
      detectedMetadata: detectedInfo,
    };

    setNormalizedDataForAPO(dataForAPO);
    setMessage('Processamento do ACI concluído! Dados prontos para o APO.');
    setIsLoading(false);
  }, [selectedFile, inputContent, performOCR, normalizeData, detectRelevantContent]);

  // Funções para atualizar o estado a partir dos componentes de UI
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setInputContent('');
    setExtractedText('');
    setNormalizedDataForAPO(null);
    setMessage('');
    setOcrProgress(0);
  };

  const handleInputChange = (event) => {
    setInputContent(event.target.value);
    setSelectedFile(null);
    setExtractedText('');
    setNormalizedDataForAPO(null);
    setMessage('');
    setOcrProgress(0);
  };

  return {
    inputContent,
    selectedFile,
    normalizedDataForAPO,
    isLoading,
    message,
    ocrProgress,
    handleFileChange,
    handleInputChange,
    processContent,
  };
};
