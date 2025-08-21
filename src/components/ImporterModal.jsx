import React, { useState, useEffect } from 'react';
import Modal from './Modal'; // Usando o seu componente de Modal existente
import { processContent } from '../utils/processContent';
import { saveNote } from '../services/api';

const ImporterModal = ({ isOpen, onClose, onImport, title, fetchPages, getPageContent, sourceName }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pages, setPages] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError('');
      fetchPages()
        .then(data => setPages(data))
        .catch((err) => {
          // Se o erro for um cancelamento pelo usuário (comum em fluxos OAuth),
          // apenas fechamos o modal sem mostrar uma mensagem de erro.
          if (err && err.message && err.message.includes('user_cancelled')) {
            handleClose();
          } else {
            setError(err.message || `Erro ao buscar páginas do ${sourceName}.`);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, fetchPages, sourceName]);

  const handleSelectPage = async (page) => {
    setLoading(true);
    setError('');
    try {
      // 1. Busca o conteúdo da página. Usa uma função específica se for fornecida.
      const content = getPageContent ? await getPageContent(page) : page.content;

      // 2. Normaliza o conteúdo no cliente.
      const normalizedText = await processContent(content);

      // 3. Prepara os dados para o backend.
      const noteData = {
        normalizedText: normalizedText,
        title: page.title,
        source: sourceName, // ex: 'Notion', 'OneNote'
      };

      // 4. Envia para o backend para ser processado e salvo pelo APO.
      const savedNote = await saveNote(noteData);

      // 5. Notifica o componente pai sobre o sucesso e fecha o modal.
      onImport(savedNote);
      onClose();
    } catch (err) {
      setError(err.message || `Erro ao importar página do ${sourceName}.`);
    } finally {
      setLoading(false);
    }
  };

  // Garante que o estado seja limpo ao fechar o modal
  const handleClose = () => {
    setPages([]);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      {loading && pages.length === 0 ? (
        <div className="p-4 text-center">Carregando...</div>
      ) : error ? (
        <div className="p-4 text-red-500">{error}</div>
      ) : (
        <ul className="space-y-2">
          {pages.map(page => (
            <li key={page.id} onClick={() => handleSelectPage(page)} className="p-3 bg-gray-100 rounded-md hover:bg-blue-100 cursor-pointer transition-colors">
              {page.title}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

export default ImporterModal;