import React, { useState } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import GoogleDriveImporter from './GoogleDriveImporter';

export default function GoogleDriveAuthImporter({ onImport }) {
  const [accessToken, setAccessToken] = useState(null);
  const [showImporter, setShowImporter] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLoginSuccess = (credentialResponse) => {
    // O token de acesso está em credentialResponse.access_token com useGoogleLogin
    setAccessToken(credentialResponse.access_token);
    setShowImporter(true);
  };

  const login = useGoogleLogin({
    onSuccess: handleLoginSuccess,
    onError: () => alert('Erro ao autenticar com o Google'),
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    flow: 'implicit', // Garante que o access_token seja retornado
  });

  const handleLogout = () => {
    setAccessToken(null);
    setShowImporter(false);
    setIsExpanded(false);
    googleLogout();
  };

  return (
    <div className="p-4 border rounded mb-4">
      <h2 className="font-bold mb-2">Importar do Google Drive</h2>
      {!accessToken ? (
        <>
          <button
            onClick={() => setIsExpanded(true)}
            disabled={isExpanded}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:bg-gray-400"
          >
            Google Drive
          </button>
          {isExpanded && (
            <div className="mt-4">
              <p className="mb-2">Faça login para importar seus arquivos do Google Drive.</p>
              <button onClick={() => login()} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Entrar com o Google
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded mb-2">Sair do Google</button>
          <button onClick={() => setShowImporter(true)} className="bg-blue-600 text-white px-4 py-2 rounded mb-2 ml-2">Abrir Importador</button>
        </>
      )}
      {showImporter && accessToken && <GoogleDriveImporter isOpen={showImporter} onClose={() => setShowImporter(false)} accessToken={accessToken} handleTextSelect={onImport} />}
    </div>
  );
}
