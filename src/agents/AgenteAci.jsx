import React, { useState } from 'react'; // Embora o React esteja no escopo global no Vite agora, é uma boa prática mantê-lo.
import { useAciProcessor } from '@/hooks/useAciProcessor';
import { useApo } from '@/context/ApoContext';
import { useGoogleLogin } from '@react-oauth/google';
import GoogleDriveImporter from '@/components/GoogleDriveImporter';
import TrelloImporter from '@/components/TrelloImporter';


// Componente para a seção de resultados
const ResultsDisplay = ({ data }) => (
  <div className="mt-8 pt-8 border-t border-gray-200">
    <h2 className="text-2xl font-bold text-gray-800 mb-4">Resultados do ACI:</h2>
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Conteúdo Original (Pré-Normalização):</h3>
        <p className="text-gray-800 whitespace-pre-wrap break-words text-sm">{data.originalContent}</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Conteúdo Normalizado (Pronto para APO):</h3>
        <p className="text-gray-800 whitespace-pre-wrap break-words text-sm">{data.normalizedText}</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Metadados Detectados:</h3>
        <ul className="list-disc list-inside text-gray-800 text-sm space-y-1">
          <li><strong>ID do Item:</strong> {data.id}</li>
          <li><strong>Timestamp:</strong> {new Date(data.timestamp).toLocaleString()}</li>
          <li><strong>Fonte:</strong> {data.source}</li>
          {data.detectedMetadata.links.length > 0 && (
            <li>
              <strong>Links:</strong>
              <ul className="list-circle list-inside ml-4">
                {data.detectedMetadata.links.map((link, index) => (
                  <li key={`link-${index}`}><a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{link}</a></li>
                ))}
              </ul>
            </li>
          )}
          {data.detectedMetadata.emails.length > 0 && (
            <li>
              <strong>E-mails:</strong>
              <ul className="list-circle list-inside ml-4">
                {data.detectedMetadata.emails.map((email, index) => (
                  <li key={`email-${index}`}>{email}</li>
                ))}
              </ul>
            </li>
          )}
          {data.detectedMetadata.types.length > 0 && (
            <li>
              <strong>Tipos de Conteúdo:</strong>
              <span className="ml-2">{data.detectedMetadata.types.join(', ')}</span>
            </li>
          )}
          {data.detectedMetadata.title && (
            <li>
              <strong>Título Sugerido:</strong>
              <span className="ml-2 italic">{data.detectedMetadata.title}</span>
            </li>
          )}
          {data.detectedMetadata.listItems.length > 0 && (
            <li>
              <strong>Itens de Lista Detectados:</strong>
              <ul className="list-decimal list-inside ml-4 mt-1">
                {data.detectedMetadata.listItems.map((item, index) => (
                  <li key={`list-item-${index}`}>{item}</li>
                ))}
              </ul>
            </li>
          )}
          {data.detectedMetadata.dates.length > 0 && (
            <li>
              <strong>Datas:</strong>
              <ul className="list-circle list-inside ml-4">
                {data.detectedMetadata.dates.map((date, index) => (
                  <li key={`date-${index}`}>{date}</li>
                ))}
              </ul>
            </li>
          )}
          {data.detectedMetadata.links.length === 0 &&
           data.detectedMetadata.emails.length === 0 &&
           data.detectedMetadata.types.length === 0 &&
           data.detectedMetadata.dates.length === 0 &&
           !data.detectedMetadata.title &&
           data.detectedMetadata.listItems.length === 0 && (
            <li>Nenhum metadado relevante detectado automaticamente.</li>
          )}
        </ul>
      </div>
    </div>
  </div>
);

// Componente principal da aplicação
const AgenteAci = () => {
  const {
    inputContent,
    selectedFile,
    normalizedDataForAPO,
    isLoading,
    message,
    ocrProgress,
    handleFileChange,
    handleInputChange,
    handleFileSelect,
    handleTextSelect,
    processContent,
  } = useAciProcessor();

  const { sendToApo } = useApo();

  // Estado e handlers para o modal do Google
  const [isGoogleDriveImporterOpen, setIsGoogleDriveImporterOpen] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState(null);

  // Handlers para o login do Google
  const handleGoogleLoginSuccess = (tokenResponse) => {
    console.log('Token de Acesso do Google:', tokenResponse.access_token);
    setGoogleAccessToken(tokenResponse.access_token);
    setIsGoogleDriveImporterOpen(true);
  };

  const handleGoogleLoginError = (error) => {
    console.error('Falha no login com Google.');
    // O erro 'access_denied' geralmente significa que o usuário não está na lista de testadores.
    if (error && error.type === 'access_denied') {
      alert('Acesso negado. Verifique se seu e-mail está na lista de "Usuários de teste" no Google Cloud Console.');
    } else {
      alert('Falha no login com Google.');
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: handleGoogleLoginError,
    scope: 'https://www.googleapis.com/auth/drive.readonly', // Escopo para ler arquivos do Drive/Docs
  });
  // Estado e handlers para o modal do Trello
  const [isTrelloImporterOpen, setIsTrelloImporterOpen] = useState(false);

  const handleTrelloImport = (content) => {
    handleTextSelect(content); // Popula o textarea com o conteúdo do cartão
    setIsTrelloImporterOpen(false); // Fecha o modal após a importação
  };

  const openTrelloImporter = () => setIsTrelloImporterOpen(true);
  const closeTrelloImporter = () => setIsTrelloImporterOpen(false);

  const closeGoogleDriveImporter = () => {
    setIsGoogleDriveImporterOpen(false);
    setGoogleAccessToken(null); // Limpa o token ao fechar
  };

  const handleSendToApo = () => {
    if (normalizedDataForAPO) {
      // Mapeia os dados do ACI para o formato que o APO espera
      const dataForApo = {
        ...normalizedDataForAPO, // Mantém todos os dados originais
        suggestedTitle: normalizedDataForAPO.detectedMetadata.title || 'Sem título',
        contentType: normalizedDataForAPO.detectedMetadata.types.join(', ') || 'Não classificado',
      };
      sendToApo(dataForApo);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <TrelloImporter
        isOpen={isTrelloImporterOpen}
        onClose={closeTrelloImporter}
        onImport={handleTrelloImport}
      />
      <GoogleDriveImporter
        isOpen={isGoogleDriveImporterOpen}
        onClose={closeGoogleDriveImporter}
        accessToken={googleAccessToken}
        handleFileSelect={handleFileSelect}
        handleTextSelect={handleTextSelect}
      />
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Agente de Captura e Ingestão (ACI)
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Este agente coleta, extrai (OCR), detecta relevância e normaliza dados para o seu "Segundo Cérebro".
        </p>

        {/* Seção de Inputs (Textarea e File) */}
        <div className="mb-6">
          <label htmlFor="contentInput" className="block text-gray-700 text-sm font-semibold mb-2">
            Colar Conteúdo:
          </label>
          <textarea
            id="contentInput"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out resize-y min-h-[120px]"
            placeholder="Cole aqui textos de e-mails, conversas, ou notas..."
            value={inputContent}
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-center my-6">
          <span className="text-gray-500 text-sm mx-4">OU</span>
        </div>

        <div className="mb-8">
          <label htmlFor="fileInput" className="block text-gray-700 text-sm font-semibold mb-2">
            Upload de Arquivo (Imagem, PDF, .md, .txt):
          </label>
          <input
            type="file"
            id="fileInput"
            className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition duration-200 ease-in-out"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.md,.txt"
            disabled={isLoading}
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-600">Arquivo: <span className="font-medium">{selectedFile.name}</span></p>
          )}
          {isLoading && selectedFile && ocrProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${ocrProgress}%` }}></div>
              <p className="text-xs text-blue-600 text-center mt-1">{ocrProgress}%</p>
            </div>
          )}
        </div>

        {/* Seção de Integrações com outras plataformas */}
        <div className="my-8">
           <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center border-t pt-6">
            Ou importe de outras fontes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* O handler onClick aqui iniciaria o fluxo de autenticação e busca de dados da API específica */}
            <button onClick={() => googleLogin()} className="p-3 bg-blue-100 text-blue-800 rounded-md font-semibold hover:bg-blue-200 transition duration-200 ease-in-out">
              Importar do Google Drive
            </button>
            <button onClick={openTrelloImporter} className="p-3 bg-green-100 text-green-800 rounded-md font-semibold hover:bg-green-200 transition duration-200 ease-in-out">
              Importar do Trello
            </button>
            <button disabled className="p-3 bg-purple-100 text-purple-800 rounded-md font-semibold hover:bg-purple-200 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
              Importar do Obsidian
            </button>
          </div>
        </div>

        {/* Botão de Ação */}
        <button
          onClick={processContent}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-semibold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={isLoading || (!inputContent.trim() && !selectedFile)}
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : 'Processar com ACI'}
        </button>

        {message && (
          <p className={`mt-4 text-center text-sm ${message.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}

        {normalizedDataForAPO && (
          <>
            <ResultsDisplay data={normalizedDataForAPO} />
            <div className="mt-6 text-center">
              <button
                onClick={handleSendToApo}
                className="px-6 py-2 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-transform transform hover:scale-105"
              >
                Enviar para Processamento (APO)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AgenteAci;
