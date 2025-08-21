// src/hooks/useAciProcessor.js
import { useState, useCallback } from 'react';
import { runOCR } from '../utils/ocr';
import { loginRequest } from '../authConfig';
import { getDocxContent as getMsDocxContent } from '../services/microsoftApi';
import {
  getDocumentContent as getGoogleDocContent,
  downloadFile as downloadGoogleDriveFile,
} from '../services/googleApi';

/**
 * Envia o texto bruto para o backend para análise (Agente APO).
 * @param {string} normalizedText - O texto extraído e normalizado pelo ACI.
 * @returns {Promise<object>} A resposta do backend.
 */
const analyzeWithAPO = async (normalizedText) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ normalizedText }),
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Falha ao analisar texto com o backend (APO).' }));
    throw new Error(errorData.message || 'Falha ao analisar texto com o backend (APO).');
  }

  return response.json();
};

/**
 * Envia os dados finais e validados para o backend para armazenamento (Agente ARS).
 * @param {object} finalData - O objeto de conhecimento validado pelo usuário.
 * @returns {Promise<object>} A resposta do backend.
 */
const saveWithARS = async (finalData) => {
  const response = await fetch('/api/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(finalData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Falha ao salvar dados no backend (ARS).' }));
    throw new Error(errorData.message || 'Falha ao salvar dados no backend (ARS).');
  }

  return response.json();
};

// Supondo que estas funções existam em outro arquivo de utilitário
// import { normalizeData, detectRelevantContent } from '../utils/textProcessing';

export const useAciProcessor = ({ googleAccessToken, msalInstance, msalAccounts }) => {
  // Estados do ACI
  const [inputContent, setInputContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [message, setMessage] = useState('Aguardando entrada para processamento.');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Estados do APO (passados para o próximo agente)
  const [apoResponse, setApoResponse] = useState(null);

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
    if (!msalInstance || !msalAccounts || msalAccounts.length === 0) {
      throw new Error("Conta da Microsoft não autenticada.");
    }
    setMessage('Adquirindo permissão para o OneDrive...');
    setOcrProgress(0);

    try {
      const request = {
        ...loginRequest,
        account: msalAccounts[0],
      };
      const tokenResponse = await msalInstance.acquireTokenSilent(request);
      const downloadUrl = file['@microsoft.graph.downloadUrl'];
      if (!downloadUrl) {
        throw new Error("URL de download não encontrada para este arquivo.");
      }
      setMessage('Baixando arquivo do OneDrive...');
      const response = await fetch(downloadUrl, {
        headers: {
          "Authorization": `Bearer ${tokenResponse.accessToken}`
        }
      });
      if (!response.ok) {
        throw new Error(`Falha ao baixar o arquivo: ${response.statusText}`);
      }
      const blob = await response.blob();
      const fileObject = new File([blob], file.name, { type: file.file?.mimeType });
      return _handleLocalFile(fileObject);
    } catch (err) {
      if (err.name === "InteractionRequiredAuthError") {
        setMessage("Permissão adicional necessária. Abrindo popup...");
        await msalInstance.acquireTokenPopup(loginRequest);
        throw new Error("Permissão concedida. Por favor, tente importar o arquivo novamente.");
      }
      throw err;
    }
  }, [msalInstance, msalAccounts, _handleLocalFile]);

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

  // ETAPA 1: Extrai o texto e envia para análise do APO
  const analyzeContent = useCallback(async () => {
    setIsProcessing(true);
    let rawContent = '';
    setError(null);
    setApoResponse(null); // Limpa resposta anterior do backend

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
        setMessage('Enviando texto para análise do Agente APO...');
        const analysisResult = await analyzeWithAPO(rawContent);
        // Adiciona o texto original ao objeto de resposta do APO
        setApoResponse({ ...analysisResult.data, originalText: rawContent });
        setMessage('Análise do APO concluída. Revise os dados abaixo.');
      } else {
        setMessage('Não foi possível extrair conteúdo.');
      }
    } catch (error) {
      console.error("Erro no fluxo de processamento do ACI:", error);
      setError(error.message);
      setMessage("Ocorreu um erro durante o processamento.");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, inputContent, extractTextFromFile]);

  // ETAPA 2: Salva o conteúdo validado com o ARS
  const saveContent = useCallback(async (finalData) => {
    if (!finalData) {
      const message = "Não há dados analisados para salvar.";
      setMessage(message);
      setError(message);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setMessage('Enviando dados validados para o Agente ARS...');

    try {
      const result = await saveWithARS(finalData);
      setMessage(`Nota salva com sucesso! ID: ${result.id}`);
      
      // Limpa o estado para um novo processamento
      setInputContent('');
      setSelectedFile(null);
      setExtractedText('');
      setApoResponse(null);
      setOcrProgress(0);
    } catch (error) {
      console.error("Erro ao salvar com ARS:", error);
      setError(error.message);
      setMessage("Ocorreu um erro ao salvar a nota.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setInputContent(''); // Limpa o texto se um arquivo for selecionado
    setApoResponse(null);
    setMessage(file ? `Arquivo "${file.name}" selecionado.` : 'Aguardando entrada para processamento.');
  };

  const handleTextChange = (text) => {
    setInputContent(text);
    setSelectedFile(null); // Limpa o arquivo se texto for inserido
    setApoResponse(null);
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
    error,
    apoResponse,
    handleFileSelect,
    handleTextChange,
    analyzeContent, // Nova função de análise
    saveContent, // Nova função de salvamento
    setApoResponse, // Para permitir edições
    setMessage,
    setOcrProgress,
  };
};
