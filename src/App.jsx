import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import NotionImporter from './components/NotionImporter';
import OneDrivePicker from './components/OneDrivePicker';

function App() {
  // --- ESTADO PARA O AGENTE DE CAPTURA (ACI) ---
  const [isNotionOpen, setIsNotionOpen] = useState(false);
  const [captureMessage, setCaptureMessage] = useState('');
  const [captureError, setCaptureError] = useState('');

  // --- ESTADO PARA O AGENTE DE RECUPERAÇÃO (ARS) ---
  const [searchResults, setSearchResults] = useState(null); // null: sem busca, []: sem resultados, [...]: com resultados
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // URL do backend (idealmente, viria de uma variável de ambiente)
  const BACKEND_URL = 'http://localhost:3001';

  /**
   * Função para lidar com a importação de dados.
   * Agora, ela envia os dados para o endpoint /api/notes do nosso backend.
   */
  const handleImport = async (data) => {
    setCaptureMessage('Salvando no Segundo Cérebro...');
    setCaptureError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          normalizedText: data.normalizedText,
          title: data.title || 'Nota Importada',
          source: data.source || 'Desconhecida',
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Falha ao salvar a nota.');
      }
      setCaptureMessage(`Nota importada com sucesso!`);
    } catch (e) {
      setCaptureError(`Erro ao salvar: ${e.message}`);
    }
  };

  /**
   * Função para lidar com a busca semântica.
   * Ela chama o endpoint /api/search do backend.
   */
  const handleSearch = async (query) => {
    setIsSearching(true);
    setSearchError('');
    setSearchResults(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'A busca falhou.');
      }

      setSearchResults(data.results);
    } catch (error) {
      setSearchError(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <main className="container mx-auto p-4">
        <header className="text-center my-8">
          <h1 className="text-5xl font-extrabold tracking-tight">Segundo Cérebro</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Sua base de conhecimento inteligente.</p>
        </header>

        {/* --- Seção do Agente de Recuperação e Síntese (ARS) --- */}
        <section id="search-section" className="my-12">
          <h2 className="text-3xl font-semibold text-center mb-4">Busca Inteligente</h2>
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
          {searchError && <div className="text-center text-red-500 p-2 mt-4 bg-red-100 dark:bg-red-900/20 rounded-md">{searchError}</div>}
          <SearchResults results={searchResults} isLoading={isSearching} />
        </section>

        <hr className="my-16 border-gray-300 dark:border-gray-700" />

        {/* --- Seção do Agente de Captura e Ingestão (ACI) --- */}
        <section id="capture-section" className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-semibold mb-4">Agente de Captura</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Importe conhecimento de suas fontes favoritas. Os dados serão processados e salvos na sua base de conhecimento.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setIsNotionOpen(true)}
              className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Importar do Notion
            </button>
          </div>
          <div className="mt-6 border-t pt-6 dark:border-gray-700">
            {/* O OneDrivePicker é um painel, então o integramos diretamente aqui */}
            <OneDrivePicker onFileSelect={() => {}} setMessage={setCaptureMessage} setOcrProgress={() => {}} />
          </div>
          {captureMessage && <div className="mt-4 text-green-600 dark:text-green-400">{captureMessage}</div>}
          {captureError && <div className="mt-4 text-red-600 dark:text-red-400">{captureError}</div>}
        </section>

        {/* Modals e outros componentes flutuantes */}
        <NotionImporter
          isOpen={isNotionOpen}
          onClose={() => setIsNotionOpen(false)}
          onImport={(data) => handleImport({ ...data, source: 'Notion' })}
        />
      </main>
    </div>
  );
}

export default App;
