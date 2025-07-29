import React, { useReducer, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import * as googleApi from '@/services/googleApi';
import { processContent } from '../utils/processContent';

// Constantes para tipos de arquivo, evitando "magic strings"
const MIME_TYPES = {
  GOOGLE_DOC: 'application/vnd.google-apps.document',
  PDF: 'application/pdf',
  IMAGE_PREFIX: 'image/',
};

// Estado inicial para o reducer
const initialState = {
  files: [],
  nextPageToken: null,
  loading: false,
  error: '',
};

// Reducer para gerenciar o estado complexo do componente
function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: '' };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        files: action.payload.isLoadMore ? [...state.files, ...action.payload.files] : action.payload.files,
        nextPageToken: action.payload.nextPageToken,
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SELECT_START':
      return { ...state, loading: true, error: '' };
    case 'SELECT_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      throw new Error(`Ação não tratada: ${action.type}`);
  }
}

// Subcomponente para o item da lista, melhorando a acessibilidade e a organização
const FileItem = ({ file, onSelect, disabled }) => {
  const getFileIcon = (mimeType) => {
    if (mimeType === MIME_TYPES.GOOGLE_DOC) return '📄';
    if (mimeType === MIME_TYPES.PDF) return '📕';
    if (mimeType.startsWith(MIME_TYPES.IMAGE_PREFIX)) return '🖼️';
    return '❓';
  };

  return (
    <li>
      <button
        onClick={() => onSelect(file)}
        disabled={disabled}
        className="w-full text-left p-3 bg-gray-100 rounded-md hover:bg-blue-100 cursor-pointer transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="mr-3 text-xl">{getFileIcon(file.mimeType)}</span>
        <span className="truncate">{file.name}</span>
      </button>
    </li>
  );
};

const GoogleDriveImporter = ({ isOpen, onClose, handleFileSelect, handleTextSelect, accessToken }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { files, nextPageToken, loading, error } = state;

  // Função centralizada para buscar arquivos, evitando duplicação de código
  const fetchDriveFiles = useCallback(async (token = null) => {
    if (!accessToken) return;
    dispatch({ type: 'FETCH_START' });
    try {
      const { files: data, nextPageToken: newToken } = await googleApi.listFiles(accessToken, token);
      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          files: data || [],
          nextPageToken: newToken || null,
          isLoadMore: !!token,
        },
      });
    } catch (err) {
      const message = `Falha ao buscar arquivos. ${err.message}`;
      dispatch({ type: 'FETCH_ERROR', payload: message });
      console.error(message, err);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isOpen) {
      fetchDriveFiles();
    }
  }, [isOpen, fetchDriveFiles]);

  const handleSelectFile = async (file) => {
    dispatch({ type: 'SELECT_START' });
    try {
      let rawText = '';
      if (file.mimeType === MIME_TYPES.GOOGLE_DOC) {
        rawText = await googleApi.getDocumentContent(accessToken, file.id);
      } else if (
        file.mimeType === MIME_TYPES.PDF ||
        file.mimeType.startsWith(MIME_TYPES.IMAGE_PREFIX)
      ) {
        const blob = await googleApi.downloadFile(accessToken, file.id);
        const fileObject = new File([blob], file.name, { type: file.mimeType });
        // Aqui você pode chamar o OCR se desejar
        // rawText = await runOCR(fileObject, ...);
        rawText = '';
        handleFileSelect(fileObject);
        handleClose();
        return;
      } else if (
        file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimeType === 'text/plain' ||
        file.mimeType === 'text/markdown'
      ) {
        // Baixa o arquivo e lê como texto
        const blob = await googleApi.downloadFile(accessToken, file.id);
        if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // DOCX: usa getDocxContent
          // Importação dinâmica para evitar dependência desnecessária
          const { getDocxContent } = await import('../services/microsoftApi');
          rawText = await getDocxContent(blob);
        } else {
          // TXT ou MD
          rawText = await blob.text();
        }
      } else {
        throw new Error(`Tipo de arquivo não suportado: ${file.mimeType}`);
      }
      const processed = await processContent(rawText);
      handleTextSelect(processed);
      handleClose();
    } catch (err) {
      const message = `Falha ao importar o arquivo. ${err.message}`;
      dispatch({ type: 'SELECT_ERROR', payload: message });
      console.error(message, err);
    }
  };

  const handleLoadMore = () => {
    if (!nextPageToken || loading) return;
    fetchDriveFiles(nextPageToken);
  };

  const handleClose = () => {
    dispatch({ type: 'RESET' });
    onClose();
  };

  const renderContent = () => {
    if (loading && files.length === 0) return <div className="text-center p-8 text-gray-500">Carregando arquivos...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
    if (files.length === 0) return <div className="text-center p-8 text-gray-500">Nenhum arquivo compatível encontrado.</div>;

    return (
      <div>
        <ul className="space-y-2 max-h-96 overflow-y-auto p-1">{files.map((file) => (
          <FileItem key={file.id} file={file} onSelect={handleSelectFile} disabled={loading} />
        ))}
        </ul>
        {nextPageToken && (
          <div className="text-center mt-4 pt-4 border-t">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Carregando...' : 'Carregar Mais'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar do Google Drive">
      {renderContent()}
    </Modal>
  );
};

export default GoogleDriveImporter;
