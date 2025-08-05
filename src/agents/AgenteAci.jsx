import React, { useState, useEffect } from 'react';
import { useAciProcessor } from '../hooks/useAciProcessor';
import { useGoogleLogin } from '@react-oauth/google';
import { useApo } from '../hooks/useApo';
import OneDrivePicker from '../components/OneDrivePicker';
import ObsidianImporter from '../components/ObsidianImporter';
import GoogleDriveImporter from '../components/GoogleDriveImporter';
import { MetadataItem } from '../components/ResultsDisplay';
import TrelloImporter from '../components/TrelloImporter';
import NotionImporter from '../components/NotionImporter';
import OneNoteImporter from '../components/OneNoteImporter'; // PropTypes import removed as it was unused

export default function AgenteAci() {
  const {
    inputContent,
    selectedFile,
    extractedText,
    message,
    ocrProgress,
    isProcessing,
    normalizedDataForAPO,
    handleFileSelect,
    handleTextChange,
    processContent,
    setMessage,
    setOcrProgress,
  } = useAciProcessor({});

  const { apoResult, setApoInput } = useApo();

  const handleSendToApo = () => {
    if (normalizedDataForAPO) {
      setApoInput(normalizedDataForAPO);
      setMessage("Resultados enviados para o Agente APO para organização.");
    }
  };

  // Centralized state for managing which importer modal is active
  const [activeImporter, setActiveImporter] = useState(null); // e.g., 'googleDrive', 'trello', 'oneDrive'
  const [googleAccessToken, setGoogleAccessToken] = useState(null);

  // Handlers para cada importador
  const handleObsidianImport = (items) => {
    if (items && items.length > 0) {
      handleTextChange(items[0].normalizedText);
    } else {
      setMessage('Nenhum item foi selecionado do Obsidian.');
    }
    setActiveImporter(null);
  };
  const handleGoogleDriveImport = (processed) => {
    handleTextChange(processed.normalizedText);
    setActiveImporter(null);
  };
  const handleTrelloImport = (processed) => {
    handleTextChange(processed.normalizedText);
    setActiveImporter(null);
  };
  const handleNotionImport = (processed) => {
    handleTextChange(processed.normalizedText);
    setActiveImporter(null);
  };
  const handleOneNoteImport = (processed) => {
    handleTextChange(processed.normalizedText);
    setActiveImporter(null);
  };

  // Lógica de autenticação e importação do Google Drive
  const handleGoogleLoginSuccess = (tokenResponse) => {
    setGoogleAccessToken(tokenResponse.access_token);
    setActiveImporter('googleDrive'); // Abre o seletor de arquivos após o login
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: () => {
      setMessage('Falha na autenticação com o Google.');
    },
    scope: 'https://www.googleapis.com/auth/drive.readonly',
  });

  const handleGoogleDriveClick = () => {
    googleLogin(); // Inicia o fluxo de login, que então abre o importador
  };

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

  const handleOneDriveFileSelect = (content) => {
    handleTextChange(content);
    setActiveImporter(null);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      {/* Agente ACI */}
      <div className="flex-1 flex flex-col gap-4 p-6 border rounded-lg shadow-lg bg-gray-50 dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-center">Agente ACI (Agente de Captura Inteligente)</h1>
        <textarea
          className="w-full h-48 p-2 border rounded-md bg-white dark:bg-gray-700"
          placeholder="Cole seu texto aqui..."
          value={inputContent}
          onChange={(e) => handleTextChange(e.target.value)}
        />
        <div className="text-center">ou</div>
        <div
          className="flex justify-center items-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
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
        <div className="text-center">Ou importe de outras fontes</div>
        <div className="flex justify-center gap-2">
          <button onClick={() => setActiveImporter('trello')} className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800">Trello</button>
          <button onClick={handleGoogleDriveClick} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">GoogleDrive</button>
          <button onClick={() => setActiveImporter('obsidian')} className="px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-800">Obsidian</button>
          <button onClick={() => setActiveImporter('oneDrive')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">OneDrive</button>
          <button onClick={() => setActiveImporter('oneNote')} className="px-4 py-2 bg-indigo-700 text-white rounded hover:bg-indigo-800">OneNote</button>
          <button onClick={() => setActiveImporter('notion')} className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">Notion</button>
        </div>

        {/* Modals are now rendered based on the activeImporter state */}
        {activeImporter === 'obsidian' && <ObsidianImporter onImport={handleObsidianImport} onClose={() => setActiveImporter(null)} />}
        {activeImporter === 'googleDrive' && googleAccessToken && (
          <GoogleDriveImporter
            isOpen={activeImporter === 'googleDrive'}
            onClose={() => setActiveImporter(null)}
            accessToken={googleAccessToken}
            developerKey={import.meta.env.VITE_GOOGLE_API_KEY}
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
        {activeImporter === 'oneDrive' && <OneDrivePicker onFileSelect={handleOneDriveFileSelect} setMessage={setMessage} setOcrProgress={setOcrProgress} />}

        <button onClick={processContent} disabled={isProcessing} className="w-full p-2 mt-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400">
          {isProcessing ? 'Processando...' : 'Processar'}
        </button>

        <div className="mt-4">
          <h2 className="text-xl font-semibold">Resultados</h2>
          <div className="p-2 mt-2 border rounded-md bg-white dark:bg-gray-700 min-h-[50px]">
            <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
            {isProcessing && ocrProgress > 0 && <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${ocrProgress}%` }}></div></div>}
            
            {normalizedDataForAPO && normalizedDataForAPO.metadata && (
              <div className="my-4 p-3 bg-gray-100 dark:bg-gray-600 rounded-md shadow-sm">
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2 border-b pb-1">Metadados Sugeridos</h4>
                <MetadataItem label="Título" value={normalizedDataForAPO.metadata.suggestedTitle} />
                <MetadataItem label="Tipo de Conteúdo" value={normalizedDataForAPO.metadata.contentType} />
              </div>
            )}

            {extractedText && (
              <div className="mt-2">
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">Texto Extraído</h4>
                <pre className="whitespace-pre-wrap text-sm">{extractedText}</pre>
              </div>
            )}
            {normalizedDataForAPO && (
              <button onClick={handleSendToApo} className="w-full p-2 mt-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Enviar para APO
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Agente APO */}
      <div className="flex-1 flex flex-col gap-4 p-6 border rounded-lg shadow-lg bg-gray-50 dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-center">Agente APO</h1>
        <div className="p-2 mt-2 border rounded-md bg-white dark:bg-gray-700 min-h-[50px]">
          <pre className="whitespace-pre-wrap text-sm">{apoResult}</pre>
        </div>
      </div>
    </div>
  );
}
