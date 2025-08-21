import React, { useState } from 'react';
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from '../authConfig';
import { useAciProcessor } from '../hooks/useAciProcessor';
import { useGoogleLogin } from '@react-oauth/google';
import ObsidianImporter from '../components/ObsidianImporter';
import GoogleDriveImporter from '../components/GoogleDriveImporter';
import ResultsDisplay from '../components/ResultsDisplay';
import TrelloImporter from '../components/TrelloImporter';
import NotionImporter from '../components/NotionImporter';
import OneNoteImporter from '../components/OneNoteImporter';
import OneDriveImporter from '../components/OneDriveImporter';
import AgenteApo from './AgenteApo'; // Importar o componente de exibição do APO

const AgenteAci = () => {
  const { instance, accounts, inProgress } = useMsal();
  const [googleAccessToken, setGoogleAccessToken] = useState(null);
  const [activeImporter, setActiveImporter] = useState(null);

  const {
    message,
    ocrProgress,
    isProcessing,
    error,
    inputContent,
    selectedFile,
    extractedText,
    apoResponse,
    setApoResponse, // Para permitir edições no formulário do APO
    handleFileSelect,
    handleTextChange,
    analyzeContent,
    saveContent,
    setMessage,
  } = useAciProcessor({ googleAccessToken, msalInstance: instance, msalAccounts: accounts });

  // Desabilita os botões enquanto uma interação do MSAL (login, logout, etc.) estiver em andamento.
  const isInteractionInProgress = inProgress !== InteractionStatus.None;

  // --- MSAL Authentication Handlers ---
  const handleMicrosoftLogin = async () => {
    try {
      const loginResponse = await instance.loginPopup({
        ...loginRequest,
        redirectUri: "/popup.html" // Força o popup a usar a página em branco
      });
      // Opcional: definir a conta ativa explicitamente para forçar a atualização em alguns casos
      instance.setActiveAccount(loginResponse.account);
      setMessage(`Conectado com sucesso como ${loginResponse.account.name}! Agora você pode usar os importadores da Microsoft.`);
    } catch (e) {
      // Não mostrar um erro se o usuário simplesmente fechou o popup
      if (e.errorCode !== "user_cancelled") {
          console.error(e);
          setMessage('Falha no login com a Microsoft.');
      }
    }
  };

  const handleMicrosoftLogout = () => {
    const currentAccount = accounts[0];
    if (currentAccount) {
      instance.logoutPopup({
        account: currentAccount,
        postLogoutRedirectUri: "/",
      });
    }
  };

  // --- Importer Handlers ---
  const createImportHandler = (importerName) => (processedData) => {
    // Espera um objeto como { title: "...", normalizedText: "..." }
    if (processedData && (processedData.title || processedData.normalizedText)) {
      // Formata o título e o conteúdo para exibição na área de texto
      const title = processedData.title ? `# ${processedData.title}\n\n` : "";
      const content = processedData.normalizedText || "";
      const fullText = `${title}${content}`.trim();

      handleTextChange(fullText);
      setMessage(`${importerName} importado com sucesso.`);
    } else {
      setMessage(`Nenhum item foi importado de ${importerName}.`);
    }
    setActiveImporter(null);
  };

  const handleObsidianImport = createImportHandler('Obsidian');
  const handleGoogleDriveImport = createImportHandler('Google Drive');
  const handleTrelloImport = createImportHandler('Trello');
  const handleNotionImport = createImportHandler('Notion');
  const handleOneNoteImport = createImportHandler('OneNote');

  // Adicionado para lidar com a seleção de arquivos do OneDrive
  const handleOneDriveFileSelect = (file) => {
    handleFileSelect(file);
    setActiveImporter(null);
  };

  const handleGoogleLoginSuccess = (tokenResponse) => {
    setGoogleAccessToken(tokenResponse.access_token);
    setMessage('Conectado com sucesso ao Google! Abrindo o importador do Drive...');
    setActiveImporter('googleDrive');
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: (error) => {
      console.error('Falha no login com o Google:', error);
      setMessage('Falha na autenticação com o Google. Verifique se os pop-ups estão bloqueados ou tente novamente.');
    },
    scope: 'https://www.googleapis.com/auth/drive.readonly',
  });

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // --- Render Logic ---
  return (
    <div className="flex flex-col xl:flex-row gap-8 p-4 sm:p-6 md:p-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      {/* Agente ACI */}
      <div className="flex-1 flex flex-col gap-4 p-6 border rounded-lg shadow-lg bg-gray-50 dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-center">Agente ACI (Agente de Captura Inteligente)</h1>
        <textarea
          className="w-full h-48 p-3 border rounded-md bg-white dark:bg-gray-700 shadow-inner focus:ring-2 focus:ring-blue-500"
          placeholder="Cole seu texto aqui..."
          value={inputContent}
          onChange={(e) => handleTextChange(e.target.value)}
        />
        <div className="text-center">ou</div>
        <div
          className={`flex justify-center items-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg ${isInteractionInProgress || isProcessing ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-700' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <div className="text-center">
            <p>Clique para enviar ou arraste e solte</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, PDF, etc.</p>
          </div>
          <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
        </div>
        {selectedFile && <p className="text-center text-sm">Arquivo escolhido: {selectedFile.name}</p>}
        <div className="text-center font-semibold">Ou importe de outras fontes</div>
        
        {/* --- Painel de Botões de Importação --- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <button onClick={() => setActiveImporter('trello')} disabled={isInteractionInProgress} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100">Trello</button>
          <button onClick={() => googleLogin()} disabled={isInteractionInProgress} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100">Google Drive</button>
          <button onClick={() => setActiveImporter('obsidian')} disabled={isInteractionInProgress} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100">Obsidian</button>
          <button onClick={() => setActiveImporter('notion')} disabled={isInteractionInProgress} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100">Notion</button>
          
          <AuthenticatedTemplate>
            <button onClick={() => setActiveImporter('oneDrive')} disabled={isInteractionInProgress} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100">OneDrive</button>
            <button onClick={() => setActiveImporter('oneNote')} disabled={isInteractionInProgress} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100">OneNote</button>
          </AuthenticatedTemplate>

          <UnauthenticatedTemplate>
            <button onClick={handleMicrosoftLogin} disabled={isInteractionInProgress} className="w-full col-span-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100">
              Conectar com a Microsoft
            </button>
          </UnauthenticatedTemplate>
        </div>
        
        <AuthenticatedTemplate>
            <div className="text-center">
                <button onClick={handleMicrosoftLogout} disabled={isInteractionInProgress} className="px-4 py-1 text-sm bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-400" title="Desconectar da Microsoft">
                    Sair da conta Microsoft
                </button>
            </div>
        </AuthenticatedTemplate>

        {activeImporter === 'obsidian' && <ObsidianImporter onImport={handleObsidianImport} onClose={() => setActiveImporter(null)} />}
        {activeImporter === 'googleDrive' && googleAccessToken && (
          <GoogleDriveImporter
            isOpen={activeImporter === 'googleDrive'}
            onClose={() => setActiveImporter(null)}
            accessToken={googleAccessToken}
            handleTextSelect={handleGoogleDriveImport}
          />
        )}
        {activeImporter === 'trello' && (
          <TrelloImporter
            isOpen={activeImporter === 'trello'}
            onClose={() => setActiveImporter(null)}
            onImport={handleTrelloImport}
          />
        )}
        {activeImporter === 'notion' && (
          <NotionImporter
            isOpen={activeImporter === 'notion'}
            onClose={() => setActiveImporter(null)}
            onImport={handleNotionImport}
          />
        )}
        {activeImporter === 'oneNote' && (
          <OneNoteImporter
            isOpen={activeImporter === 'oneNote'}
            onClose={() => setActiveImporter(null)}
            onImport={handleOneNoteImport}
          />
        )}
        {activeImporter === 'oneDrive' && (
          <OneDriveImporter
            isOpen={activeImporter === 'oneDrive'}
            onClose={() => setActiveImporter(null)}
            onFileSelect={handleOneDriveFileSelect}
          />
        )}

        <button onClick={analyzeContent} disabled={isProcessing || isInteractionInProgress || (!inputContent && !selectedFile)} className="w-full p-3 mt-4 bg-green-600 text-white font-bold text-lg rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg">
          {isProcessing ? 'Analisando...' : 'Analisar Conteúdo'}
        </button>

        <div className="mt-4">
          <ResultsDisplay
            isLoading={isProcessing}
            error={error}
            message={message}
            ocrProgress={ocrProgress}
            extractedText={extractedText}
            apoResponse={apoResponse}
          />
        </div>
      </div>

      {/* Agente APO */}
      <div className="flex-1 flex flex-col">
        <AgenteApo
          apoData={apoResponse}
          saveContent={saveContent}
          isSaving={isProcessing}
        />
      </div>
    </div>
  );
};

export default AgenteAci;
