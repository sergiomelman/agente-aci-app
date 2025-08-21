import React, { useEffect } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser"; // Corrigido
import Modal from '@/components/Modal';
import PropTypes from 'prop-types';
import { useOneDriveFiles } from '@/hooks/useOneDriveFiles';

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
  const { inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  // Utiliza o hook centralizado para buscar os arquivos
  const { files, isLoading, error, fetchFiles, reset } = useOneDriveFiles();

  useEffect(() => {
    // Busca os arquivos quando o modal é aberto e o usuário está autenticado.
    if (isOpen && isAuthenticated && inProgress === InteractionStatus.None) {
      fetchFiles();
    }
    // Limpa o estado quando o modal é fechado.
    if (!isOpen) {
      reset();
    }
  }, [isOpen, isAuthenticated, inProgress, fetchFiles, reset]);

  const handleSelectFile = (file) => {
    // Passa o objeto de arquivo da API diretamente para o processador
    onFileSelect(file);
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  const renderContent = () => {
    if (isLoading && files.length === 0) return <div className="text-center p-8 text-gray-500">Carregando arquivos do OneDrive...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
    if (files.length === 0) return <div className="text-center p-8 text-gray-500">Nenhum arquivo compatível (.docx, .pdf, .txt) encontrado.</div>;

    return (
      <ul className="space-y-2 max-h-96 overflow-y-auto p-1">
        {files.map((file) => <FileItem key={file.id} file={file} onSelect={handleSelectFile} />)}
      </ul>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar do OneDrive">
      {renderContent()}
    </Modal>
  );
};

OneDriveImporter.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onFileSelect: PropTypes.func.isRequired,
};

export default OneDriveImporter;
