import React, { useReducer, useEffect, useCallback } from 'react';
import { useMsal, useIsAuthenticated, InteractionStatus } from '@azure/msal-react';
import Modal from '@/components/Modal';
import * as microsoftApi from '@/services/microsoftApi';
import PropTypes from 'prop-types';

const initialState = {
  files: [],
  nextPageToken: null,
  loading: false,
  loadingMore: false,
  error: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: '', files: [], nextPageToken: null };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        files: action.payload.files,
        nextPageToken: action.payload.nextPageToken,
      };
    case 'FETCH_MORE_START':
      return { ...state, loadingMore: true, error: '' };
    case 'FETCH_MORE_SUCCESS':
      return {
        ...state,
        loadingMore: false,
        files: [...state.files, ...action.payload.files],
        nextPageToken: action.payload.nextPageToken,
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, loadingMore: false, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      throw new Error(`Ação não tratada: ${action.type}`);
  }
}

const getFileIcon = (fileName) => {
  if (fileName.endsWith('.docx')) return '📄';
  if (fileName.endsWith('.pdf')) return '📕';
  if (fileName.endsWith('.txt') || fileName.endsWith('.md')) return '📝';
  return '❓';
};

const FileItem = ({ file, onSelect }) => (
  <li>
    <button
      onClick={() => onSelect(file)}
      className="w-full text-left p-3 bg-gray-100 rounded-md hover:bg-blue-100 cursor-pointer transition-colors flex items-center"
    >
      <span className="mr-3 text-xl">{getFileIcon(file.name)}</span>
      <span className="truncate">{file.name}</span>
    </button>
  </li>
);
FileItem.propTypes = { file: PropTypes.object.isRequired, onSelect: PropTypes.func.isRequired };

const OneDriveImporter = ({ isOpen, onClose, onFileSelect }) => {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { files, loading, loadingMore, error, nextPageToken } = state;

  const account = accounts[0];

  const fetchFiles = useCallback(async (token) => {
    if (!isAuthenticated || !account) return;

    dispatch({ type: token ? 'FETCH_MORE_START' : 'FETCH_START' });
    try {
      const result = await microsoftApi.listFiles(instance, account, token);
      dispatch({
        type: token ? 'FETCH_MORE_SUCCESS' : 'FETCH_SUCCESS',
        payload: result,
      });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: `Falha ao buscar arquivos do OneDrive. ${err.message}` });
    }
  }, [instance, account, isAuthenticated]);

  useEffect(() => {
    if (isOpen && isAuthenticated && inProgress === InteractionStatus.None && files.length === 0) {
      fetchFiles(null);
    }
  }, [isOpen, isAuthenticated, inProgress, files.length, fetchFiles]);

  const handleSelectFile = (file) => {
    // Passa o objeto de arquivo da API diretamente para o processador
    onFileSelect(file);
    handleClose();
  };

  const handleClose = () => {
    dispatch({ type: 'RESET' });
    onClose();
  };

  const renderContent = () => {
    if (loading && files.length === 0) return <div className="text-center p-8 text-gray-500">Carregando arquivos do OneDrive...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
    if (files.length === 0) return <div className="text-center p-8 text-gray-500">Nenhum arquivo compatível (.docx, .pdf, .txt) encontrado.</div>;

    return (
      <ul className="space-y-2 max-h-96 overflow-y-auto p-1">
        {files.map((file) => <FileItem key={file.id} file={file} onSelect={handleSelectFile} disabled={loading} />)}
      </ul>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar do OneDrive">
      {renderContent()}
    </Modal>
  );
};

export default OneDriveImporter;
