import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import * as googleApi from '@/services/googleApi';

const GoogleDriveImporter = ({ isOpen, onClose, handleFileSelect, handleTextSelect, accessToken }) => {
  const [files, setFiles] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper para mostrar um ícone baseado no mimeType
  const getFileIcon = (mimeType) => {
    if (mimeType === 'application/vnd.google-apps.document') {
      return '📄'; // Ícone de Documento
    }
    if (mimeType === 'application/pdf') {
      return '📕'; // Ícone de PDF
    }
    if (mimeType.startsWith('image/')) {
      return '🖼️'; // Ícone de Imagem
    }
    return '❓';
  };

  // Busca os arquivos quando o modal abre e temos um token
  useEffect(() => {
    if (isOpen && accessToken) {
      setLoading(true);
      setError('');
      setFiles([]); // Limpa arquivos anteriores ao reabrir
      setNextPageToken(null);
      googleApi.listFiles(accessToken)
        .then(({ files: data, nextPageToken: token }) => {
          setFiles(data || []);
          setNextPageToken(token || null);
        })
        .catch(err => {
          setError(`Falha ao buscar arquivos. ${err.message}`);
          console.error(err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, accessToken]);

  const handleLoadMore = async () => {
    if (!nextPageToken || loading) return;

    setLoading(true);
    googleApi.listFiles(accessToken, nextPageToken)
      .then(({ files: newFiles, nextPageToken: newToken }) => {
        setFiles(prevFiles => [...prevFiles, ...newFiles]);
        setNextPageToken(newToken || null);
      })
      .catch(err => {
        setError(`Falha ao buscar mais arquivos. ${err.message}`);
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  const handleSelectFile = async (file) => {
    setLoading(true);
    setError('');
    try {
      if (file.mimeType === 'application/vnd.google-apps.document') {
        const content = await googleApi.getDocumentContent(accessToken, file.id);
        handleTextSelect(content);
      } else if (file.mimeType === 'application/pdf' || file.mimeType.startsWith('image/')) {
        const blob = await googleApi.downloadFile(accessToken, file.id);
        // O ACI espera um objeto File, então convertemos o Blob
        const fileObject = new File([blob], file.name, { type: file.mimeType });
        handleFileSelect(fileObject);
      } else {
        throw new Error(`Tipo de arquivo não suportado: ${file.mimeType}`);
      }
      handleClose(); // Fecha o modal em caso de sucesso
    } catch (err) {
      setError(`Falha ao importar o arquivo. ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setNextPageToken(null);
    setError('');
    onClose();
  };

  const renderContent = () => {
    if (loading && files.length === 0) return <div className="text-center p-8">Carregando arquivos...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
    if (files.length === 0) return <div className="text-center p-8 text-gray-500">Nenhum arquivo compatível encontrado.</div>;

    return (
      <div>
        <ul className="space-y-2 max-h-96 overflow-y-auto p-1">{files.map(file => (
          <li key={file.id} onClick={() => handleSelectFile(file)}
              className="p-3 bg-gray-100 rounded-md hover:bg-blue-100 cursor-pointer transition-colors flex items-center">
            <span className="mr-3 text-xl">{getFileIcon(file.mimeType)}</span>
            <span className="truncate">{file.name}</span>
          </li>))}
        </ul>
        {nextPageToken && (
          <div className="text-center mt-4 pt-4 border-t">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Carregando...' : 'Carregar mais'}
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
