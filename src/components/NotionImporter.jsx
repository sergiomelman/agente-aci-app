import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { processContent } from '../utils/processContent';

// Exemplo de páginas mockadas (substitua pela busca real na API do Notion)
const mockPages = [
  { id: '1', title: 'Resumo de Livro', content: 'Este é o conteúdo do resumo do livro.' },
  { id: '2', title: 'Artigo sobre IA', content: 'Texto do artigo sobre inteligência artificial.' },
];

const NotionImporter = ({ isOpen, onClose, onImport }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectPage = async (page) => {
    setLoading(true);
    setError('');
    try {
      // Aqui você faria a requisição real à API do Notion para obter o conteúdo da página
      const processed = await processContent(page.content);
      onImport(processed);
      onClose();
    } catch (err) {
      setError('Erro ao importar página do Notion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importar do Notion">
      {loading ? (
        <div className="p-4 text-center">Carregando...</div>
      ) : error ? (
        <div className="p-4 text-red-500">{error}</div>
      ) : (
        <ul className="space-y-2">
          {mockPages.map(page => (
            <li key={page.id} onClick={() => handleSelectPage(page)} className="p-3 bg-gray-100 rounded-md hover:bg-blue-100 cursor-pointer transition-colors">
              {page.title}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

export default NotionImporter;

