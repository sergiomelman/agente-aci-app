import React, { useState } from 'react';

const AgenteAci = () => {
  // Estado para armazenar o conteúdo de entrada do usuário
  const [inputContent, setInputContent] = useState('');
  // Estado para armazenar o nome do arquivo selecionado (simula PDF/imagem)
  const [selectedFile, setSelectedFile] = useState(null);
  // Estado para armazenar o conteúdo processado pelo ACI
  const [processedContent, setProcessedContent] = useState('');
  // Estado para armazenar os itens relevantes detectados
  const [detectedItems, setDetectedItems] = useState([]);
  // Estado para controlar o estado de carregamento durante o processamento
  const [isLoading, setIsLoading] = useState(false);
  // Estado para mensagens de erro ou sucesso
  const [message, setMessage] = useState('');

  /**
   * Função para simular a extração de texto de PDFs e imagens (OCR).
   * Em uma aplicação real, aqui seria feita a integração com uma API de OCR
   * ou uma biblioteca local.
   * @param {File} file - O arquivo (PDF ou imagem) a ser processado.
   * @returns {Promise<string>} Uma promessa que resolve com o texto extraído.
   */
  const simulateOCR = async (file) => {
    // Simula um atraso para representar o processamento de OCR
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (file) {
      // Para demonstração, apenas retorna uma string indicando que o OCR foi aplicado
      return `[Texto extraído via OCR de: ${file.name}] Este é um exemplo de conteúdo de um documento ou imagem. Ele pode conter links como https://www.example.com/artigo-relevante e menções a documentos importantes.`;
    }
    return '';
  };

  /**
   * Função para detectar conteúdo relevante (artigos, links, documentos).
   * Utiliza expressões regulares e verificação de palavras-chave.
   * @param {string} text - O texto a ser analisado.
   * @returns {Array<string>} Uma lista de itens relevantes detectados.
   */
  const detectRelevantContent = (text) => {
    const relevantItems = [];

    // Detecção de links (URLs)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      relevantItems.push(`Link: ${match[0]}`);
    }

    // Detecção de palavras-chave para artigos e documentos
    const lowerText = text.toLowerCase();
    if (lowerText.includes('artigo') || lowerText.includes('reportagem')) {
      relevantItems.push('Tipo: Artigo');
    }
    if (lowerText.includes('documento') || lowerText.includes('relatório')) {
      relevantItems.push('Tipo: Documento');
    }
    if (lowerText.includes('projeto') || lowerText.includes('plano')) {
      relevantItems.push('Tipo: Projeto/Plano');
    }

    return relevantItems;
  };

  /**
   * Função para normalização e formatação inicial dos dados.
   * Remove espaços em branco extras, converte para minúsculas (opcional para detecção).
   * @param {string} text - O texto a ser normalizado.
   * @returns {string} O texto normalizado.
   */
  const normalizeData = (text) => {
    // Remove espaços em branco no início e fim, e múltiplos espaços internos
    return text.trim().replace(/\s\s+/g, ' ');
  };

  /**
   * Manipulador para a mudança no input de arquivo.
   * @param {Object} event - O evento de mudança.
   */
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    // Limpa o conteúdo do textarea quando um arquivo é selecionado
    setInputContent('');
    setMessage('');
  };

  /**
   * Manipulador para a mudança no textarea de entrada.
   * @param {Object} event - O evento de mudança.
   */
  const handleInputChange = (event) => {
    setInputContent(event.target.value);
    // Limpa o arquivo selecionado quando o textarea é editado
    setSelectedFile(null);
    setMessage('');
  };

  /**
   * Função principal para processar o conteúdo usando o ACI.
   * Orquestra as capacidades de OCR, detecção e normalização.
   */
  const processContent = async () => {
    setIsLoading(true);
    setProcessedContent('');
    setDetectedItems([]);
    setMessage('');

    let rawContent = inputContent;

    if (selectedFile) {
      // Se um arquivo foi selecionado, simula o OCR para obter o conteúdo
      setMessage('Simulando OCR e extração de texto do arquivo...');
      rawContent = await simulateOCR(selectedFile);
    } else if (!inputContent.trim()) {
      // Se não há arquivo e nem texto no input, exibe uma mensagem de erro
      setMessage('Por favor, insira algum texto ou selecione um arquivo para processar.');
      setIsLoading(false);
      return;
    }

    // Normalização dos dados
    const normalized = normalizeData(rawContent);
    setProcessedContent(normalized);

    // Detecção de conteúdo relevante
    const detected = detectRelevantContent(normalized);
    setDetectedItems(detected);

    setMessage('Processamento do ACI concluído!');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Agente de Captura e Ingestão (ACI)
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Simule a ingestão de dados para o seu "Segundo Cérebro" Digital.
          Este agente lida com OCR, detecção de conteúdo relevante e normalização.
        </p>

        {/* Área de entrada de texto */}
        <div className="mb-6">
          <label htmlFor="contentInput" className="block text-gray-700 text-sm font-semibold mb-2">
            Colar Conteúdo (E-mails, Mensagens, Notas):
          </label>
          <textarea
            id="contentInput"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out resize-y min-h-[120px]"
            placeholder="Cole aqui textos de e-mails, conversas, ou notas..."
            value={inputContent}
            onChange={handleInputChange}
            disabled={isLoading}
          ></textarea>
        </div>

        {/* Separador ou opção de upload de arquivo */}
        <div className="flex items-center justify-center my-6">
          <span className="text-gray-500 text-sm mx-4">OU</span>
        </div>

        {/* Input de arquivo para simular PDF/Imagem */}
        <div className="mb-8">
          <label htmlFor="fileInput" className="block text-gray-700 text-sm font-semibold mb-2">
            Upload de PDF/Imagem (Simular OCR):
          </label>
          <input
            type="file"
            id="fileInput"
            className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition duration-200 ease-in-out"
            onChange={handleFileChange}
            accept=".pdf, .jpg, .jpeg, .png"
            disabled={isLoading}
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-600">Arquivo selecionado: <span className="font-medium">{selectedFile.name}</span></p>
          )}
        </div>

        {/* Botão de processamento */}
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
          ) : (
            'Processar com ACI'
          )}
        </button>

        {/* Mensagem de status */}
        {message && (
          <p className={`mt-4 text-center text-sm ${message.includes('erro') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}

        {/* Resultados do processamento */}
        {(processedContent || detectedItems.length > 0) && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Resultados do ACI:</h2>

            {processedContent && (
              <div className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Conteúdo Normalizado:</h3>
                <p className="text-gray-800 whitespace-pre-wrap break-words">{processedContent}</p>
              </div>
            )}

            {detectedItems.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Conteúdo Relevante Detectado:</h3>
                <ul className="list-disc list-inside text-gray-800">
                  {detectedItems.map((item, index) => (
                    <li key={index} className="mb-1">{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgenteAci;