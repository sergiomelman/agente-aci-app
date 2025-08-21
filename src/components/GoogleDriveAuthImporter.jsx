import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import ImporterModal from './ImporterModal';

// Função para buscar arquivos da API do Google Drive
const fetchGoogleDriveFiles = async (token) => {
  const response = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType!%3D%27application%2Fvnd.google-apps.folder%27&fields=files(id,name,mimeType)', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Falha ao buscar arquivos do Google Drive.');
  }

  const data = await response.json();
  return data.files.map(file => ({
    id: file.id,
    title: file.name,
    mimeType: file.mimeType,
  }));
};

// Função para buscar o conteúdo de um arquivo específico
const fetchFileContent = async (file, token) => {
    const isGoogleDoc = file.mimeType.includes('google-apps');
    const exportMimeType = 'text/plain';
    const url = isGoogleDoc
        ? `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${exportMimeType}`
        : `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Falha ao buscar conteúdo do arquivo: ${file.title}`);
    }

    return response.text();
};

export default function GoogleDriveAuthImporter({ onImport }) {
  const [token, setToken] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
        setError('');
        // O backend agora lidará com a troca do código pelo access_token
        fetch('http://localhost:3001/api/google-drive/exchange-code', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: codeResponse.code }),
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.access_token) {
                setToken(data.access_token);
                setModalOpen(true); // Abre o modal após obter o token
            } else {
                throw new Error(data.error || 'Falha ao obter o token de acesso.');
            }
        })
        .catch((err) => setError(err.message || 'Erro ao obter o token de acesso do Google Drive.'));
    },
    onError: () => setError('Falha no login com o Google.'),
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    flow: 'auth-code', // Fluxo recomendado e mais seguro
  });

  const handleCloseModal = () => {
    setModalOpen(false);
    setToken(null); // Limpa o token ao fechar o modal para permitir novo login se necessário
    setError('');
  };

  return (
    <div className="p-4 border rounded mb-4 bg-white dark:bg-gray-800">
      <h2 className="font-bold mb-2 text-gray-800 dark:text-gray-200">Importar do Google Drive</h2>
      <button
        onClick={() => login()}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Conectar ao Google Drive
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {modalOpen && token && (
        <ImporterModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onImport={onImport}
          title="Importar do Google Drive"
          fetchPages={() => fetchGoogleDriveFiles(token)}
          getPageContent={(file) => fetchFileContent(file, token)}
          sourceName="Google Drive"
        />
      )}
    </div>
  );
}
