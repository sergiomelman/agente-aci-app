import React, { useState } from 'react';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import GoogleDriveImporter from './GoogleDriveImporter';

export default function GoogleDriveAuthImporter({ onImport }) {
  const [accessToken, setAccessToken] = useState(null);
  const [showImporter, setShowImporter] = useState(false);

  const handleLoginSuccess = (credentialResponse) => {
    // O token de acesso está em credentialResponse.access_token
    setAccessToken(credentialResponse.access_token);
    setShowImporter(true);
  };

  const handleLogout = () => {
    setAccessToken(null);
    setShowImporter(false);
    googleLogout();
  };

  return (
    <div className="p-4 border rounded mb-4">
      <h2 className="font-bold mb-2">Importar do Google Drive</h2>
      {!accessToken ? (
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={() => alert('Erro ao autenticar com o Google')}
          useOneTap
          scope="https://www.googleapis.com/auth/drive.readonly"
        />
      ) : (
        <>
          <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded mb-2">Sair do Google</button>
          <button onClick={() => setShowImporter(true)} className="bg-blue-600 text-white px-4 py-2 rounded mb-2 ml-2">Abrir Importador</button>
        </>
      )}
      {showImporter && accessToken && (
        <GoogleDriveImporter
          isOpen={showImporter}
          onClose={() => setShowImporter(false)}
          accessToken={accessToken}
          handleTextSelect={onImport}
        />
      )}
    </div>
  );
}
