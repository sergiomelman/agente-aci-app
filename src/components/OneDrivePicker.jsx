import React, { useEffect, useState } from 'react';

const OneDrivePicker = ({ onFileSelect, setMessage }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Busca arquivos do nosso backend seguro
  useEffect(() => {
    const fetchFilesFromBackend = async () => {
      try {
        setLoading(true);
        setMessage(''); // Limpa mensagens anteriores
        // A autenticação do usuário com o backend (ex: via JWT na sessão) já deve ter ocorrido
        const response = await fetch('/api/onedrive/files'); // Novo endpoint no seu backend
        if (!response.ok) {
          throw new Error('Falha ao buscar arquivos do OneDrive via backend.');
        }
        const data = await response.json();
        setFiles(data.files || []);
      } catch (error) {
        console.error("Erro ao listar arquivos:", error);
        setMessage("Erro ao buscar arquivos do OneDrive.");
      } finally {
        setLoading(false);
      }
    };

    fetchFilesFromBackend();
  }, [setMessage]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Selecione um arquivo do OneDrive</h2>
      {loading && (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}
      <div className="space-y-3">
        {files.map((file) => (
          <button
            key={file.id}
            onClick={() => onFileSelect(file)}
            className="w-full p-4 text-left bg-white hover:bg-blue-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200"
          >
            <p className="font-medium text-gray-800">{file.name}</p>
            {file.path && <p className="text-sm text-gray-500 mt-1">{file.path}</p>}
          </button>
        ))}
        {!loading && files.length === 0 && (
          <p className="text-center text-gray-600 py-4">Nenhum arquivo encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default OneDrivePicker;
