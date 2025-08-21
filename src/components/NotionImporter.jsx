import React from 'react';
import ImporterModal from './ImporterModal';

const fetchNotionPages = async () => {
  try {
    const response = await fetch('/api/notion/pages'); // Endpoint no seu backend
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Falha ao buscar páginas do Notion');
    }
    const data = await response.json();
    return data.pages;
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
};

const NotionImporter = ({ isOpen, onClose, onImport }) => (
  <ImporterModal
    isOpen={isOpen}
    onClose={onClose}
    onImport={onImport}
    title="Importar do Notion"
    fetchPages={fetchNotionPages}
    sourceName="Notion"
  />
);
export default NotionImporter;
