// src/hooks/useAciProcessor.js
import { useState, useCallback } from 'react';
import { runOCR } from '../utils/ocr';
import { getDocxContent as getMsDocxContent } from '../services/microsoftApi';
import { getDocumentContent as getGoogleDocContent, downloadFile as downloadGoogleDriveFile } from '../services/googleApi';
import { processContent as processTextContent } from '../utils/processContent';

// Supondo que estas funções existam em outro arquivo de utilitário
// import { normalizeData, detectRelevantContent } from '../utils/textProcessing';

export const useAciProcessor = ({ googleAccessToken }) => {
  // Estados do ACI
  const [inputContent, setInputContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [message, setMessage] = useState('Aguardando entrada para processamento.');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados do APO (passados para o próximo agente)
  const [normalizedDataForAPO, setNormalizedDataForAPO] = useState(null);

  // --- Funções de extração refatoradas ---

  const _handleLocalFile = useCallback(async (file) => {
    setMessage('Arquivo local selecionado. Iniciando extração de texto...');
    const name = file.name?.toLowerCase() || '';
    if (name.endsWith('.docx')) {
      setMessage('Extraindo texto do DOCX...');
      return getMsDocxContent(file);
    }
    if (name.endsWith('.pdf') || name.match(/\.(jpe?g|png|bmp|gif)$/)) {
      return runOCR(file, { setMessage, setOcrProgress });
    }
    // Outros tipos: tenta ler como texto
    return file.text();
  }, []);

  const _handleOneDriveFile = useCallback(async (file) => {
    setMessage('Baixando arquivo do OneDrive...');
    setOcrProgress(0);
    const response = await fetch(file['@microsoft.graph.downloadUrl']);
    if (!response.ok) {
      throw new Error(`Falha ao baixar o arquivo: ${response.statusText}`);
    }
    const blob = await response.blob();

    if (file.name.toLowerCase().endsWith('.docx')) {
      setMessage('Extraindo texto do DOCX do OneDrive...');
      return getMsDocxContent(blob);
    }

    // Para PDF e imagens, passa para o OCR
    const fileObject = new File([blob], file.name, { type: file.file?.mimeType });
    setMessage('Arquivo do OneDrive baixado. Iniciando extração de texto...');
    return runOCR(fileObject, { setMessage, setOcrProgress });
  }, []);

  const _handleGoogleDriveFile = useCallback(async (file) => {
    setMessage('Acessando arquivo do Google Drive...');
    setOcrProgress(0);

    if (!googleAccessToken) {
      throw new Error('O token de acesso do Google Drive está ausente. Por favor, faça o login.');
    }

    // Se for um Google Doc, usa a API do Google Docs para pegar o texto
    if (file.mimeType === 'application/vnd.google-apps.document') {
      setMessage('Extraindo texto do Google Doc...');
      return getGoogleDocContent(googleAccessToken, file.id);
    }

    // Para outros tipos de arquivo (PDF, imagens, docx), faz o download
    const blob = await downloadGoogleDriveFile(googleAccessToken, file.id);

    // Se for um .docx, extrai o texto diretamente
    if (file.name.toLowerCase().endsWith('.docx')) {
      setMessage('Extraindo texto do DOCX do Google Drive...');
      return getMsDocxContent(blob);
    }

    // Para PDF e imagens, passa para o OCR
    const fileObject = new File([blob], file.name, { type: file.mimeType });
    setMessage('Arquivo do Google Drive baixado. Iniciando extração de texto...');
    return runOCR(fileObject, { setMessage, setOcrProgress });
  }, [googleAccessToken]);

  // Função interna que decide como obter o conteúdo e rodar o OCR
  const extractTextFromFile = useCallback(async (file) => {
    if (!file) return '';

    try {
      // Verifica se é um arquivo da nuvem (OneDrive)
      if (file['@microsoft.graph.downloadUrl']) {
        return await _handleOneDriveFile(file);
      }
      // Verifica se é um arquivo do Google Drive
      if (file.kind === 'drive#file') {
        return await _handleGoogleDriveFile(file);
      }
      // Trata como um arquivo local
      if (file instanceof File) {
        return await _handleLocalFile(file);
      }
    } catch (error) {
      console.error('Erro ao extrair texto do arquivo:', error);
      setMessage(`Erro: ${error.message}`);
      // Lançar o erro novamente para que seja capturado pelo `processContent`
      throw error;
    }

    throw new Error('Tipo de arquivo não suportado para processamento.');
  }, [_handleLocalFile, _handleOneDriveFile, _handleGoogleDriveFile]);

  // Função principal que orquestra o processamento
  const processContent = useCallback(async () => {
    setIsProcessing(true);
    let rawContent = '';
    setNormalizedDataForAPO(null); // Limpa resultados anteriores

    try {
      if (selectedFile) {
        setMessage('Arquivo selecionado. Iniciando extração...');
        rawContent = await extractTextFromFile(selectedFile);
        setExtractedText(rawContent);
      } else if (inputContent) {
        setMessage('Texto inserido. Processando...');
        rawContent = inputContent;
        setExtractedText(rawContent);
      } else {
        setMessage('Nenhuma entrada fornecida.');
        setIsProcessing(false);
        return;
      }

      if (rawContent) {
        setMessage('Analisando conteúdo...');
        // **MELHORIA**: Ativando o pipeline de processamento de texto.
        const processedData = await processTextContent(rawContent);
        setNormalizedDataForAPO(processedData);
        setMessage('Processamento concluído.');
      } else {
        setMessage('Não foi possível extrair conteúdo.');
      }
    } catch (error) {
      console.error("Erro ao processar conteúdo:", error);
      setMessage(`Erro: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, inputContent, extractTextFromFile, processTextContent]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setInputContent(''); // Limpa o texto se um arquivo for selecionado
    setNormalizedDataForAPO(null);
    setMessage(file ? `Arquivo "${file.name}" selecionado.` : 'Aguardando entrada para processamento.');
  };

  const handleTextChange = (text) => {
    setInputContent(text);
    setSelectedFile(null); // Limpa o arquivo se texto for inserido
    setNormalizedDataForAPO(null);
    if (text) {
      setMessage('Pronto para processar o texto.');
    } else {
      setMessage('Aguardando entrada para processamento.');
    }
  };

  return {
    inputContent,
    selectedFile,
    extractedText,
    message,
    ocrProgress,
    isProcessing,
    normalizedDataForAPO,
    handleFileSelect,
    handleTextChange,
    processContent, // Adicione os setters abaixo
    setNormalizedDataForAPO,
    setMessage,
    setOcrProgress,
  };
};
