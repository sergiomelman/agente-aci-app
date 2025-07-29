import React, { useState, useEffect } from 'react';
import { useAciProcessor } from '../hooks/useAciProcessor';
import { useApo } from '../hooks/useApo';
import OneDrivePicker from '../components/OneDrivePicker';
import ObsidianImporter from '../components/ObsidianImporter';
import GoogleDriveImporter from '../components/GoogleDriveImporter';
import GoogleDriveAuthImporter from '../components/GoogleDriveAuthImporter';
import TrelloImporter from '../components/TrelloImporter';
import NotionImporter from '../components/NotionImporter';
import OneNoteImporter from '../components/OneNoteImporter';
import PropTypes from 'prop-types';

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

  // Este efeito conecta os dois agentes:
  // Quando o ACI produz um resultado, ele é enviado como entrada para o APO.
  useEffect(() => {
    if (normalizedDataForAPO) {
      setApoInput(normalizedDataForAPO);
    }
  }, [normalizedDataForAPO, setApoInput]);

  const [showOneDrive, setShowOneDrive] = useState(false);
  const [showObsidian, setShowObsidian] = useState(false);
  // Estados para modais dos importadores
  const [showGoogleDrive, setShowGoogleDrive] = useState(false);
  const [showTrello, setShowTrello] = useState(false);
  const [showNotion, setShowNotion] = useState(false);
  const [showOneNote, setShowOneNote] = useState(false);

  // Handlers para cada importador
  const handleObsidianImport = (items) => {
    if (items && items.length > 0) handleTextChange(items[0].normalizedText);
    setShowObsidian(false);
  };
  const handleGoogleDriveImport = (processed) => {
    handleTextChange(processed.normalizedText);
    setShowGoogleDrive(false);
  };
  const handleTrelloImport = (processed) => {
    handleTextChange(processed.normalizedText);
    setShowTrello(false);
  };
  const handleNotionImport = (processed) => {
    handleTextChange(processed.normalizedText);
    setShowNotion(false);
  };
  const handleOneNoteImport = (processed) => {
    handleTextChange(processed.normalizedText);
    setShowOneNote(false);
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
    setShowOneDrive(false);
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
          <button onClick={() => setShowTrello(true)} className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800">Trello</button>
          <div className="flex flex-col items-center"><GoogleDriveAuthImporter onImport={handleGoogleDriveImport} /></div>
          <button onClick={() => setShowObsidian(!showObsidian)} className="px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-800">Obsidian</button>
        {showObsidian && <ObsidianImporter onImport={handleObsidianImport} />}
          <button onClick={() => setShowOneDrive(!showOneDrive)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">OneDrive</button>
          <button onClick={() => setShowOneNote(true)} className="px-4 py-2 bg-indigo-700 text-white rounded hover:bg-indigo-800">OneNote</button>
          <button onClick={() => setShowNotion(true)} className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">Notion</button>
        {showGoogleDrive && (
          <GoogleDriveImporter
            isOpen={showGoogleDrive}
            onClose={() => setShowGoogleDrive(false)}
            handleTextSelect={handleGoogleDriveImport}
          />
        )}
        {showTrello && (
          <TrelloImporter
            isOpen={showTrello}
            onClose={() => setShowTrello(false)}
            onImport={handleTrelloImport}
          />
        )}
        {showNotion && (
          <NotionImporter
            isOpen={showNotion}
            onClose={() => setShowNotion(false)}
            onImport={handleNotionImport}
          />
        )}
        {showOneNote && (
          <OneNoteImporter
            isOpen={showOneNote}
            onClose={() => setShowOneNote(false)}
            onImport={handleOneNoteImport}
          />
        )}
        </div>

        {showOneDrive && <OneDrivePicker onFileSelect={handleOneDriveFileSelect} setMessage={setMessage} setOcrProgress={setOcrProgress} />}

        <button onClick={processContent} disabled={isProcessing} className="w-full p-2 mt-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400">
          {isProcessing ? 'Processando...' : 'Processar'}
        </button>

        <div className="mt-4">
          <h2 className="text-xl font-semibold">Resultados</h2>
          <div className="p-2 mt-2 border rounded-md bg-white dark:bg-gray-700 min-h-[50px]">
            <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
            {isProcessing && ocrProgress > 0 && <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${ocrProgress}%` }}></div></div>}
            {extractedText && <pre className="whitespace-pre-wrap text-sm mt-2">{extractedText}</pre>}
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
