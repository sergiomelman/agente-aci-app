import React, { useState } from 'react';
import { processContent } from '../utils/processContent';

// Esqueleto funcional para importação de notas do Obsidian (Markdown local)

export default function ObsidianImporter({ onImport }) {
  const [imported, setImported] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!window.showDirectoryPicker) {
      alert('Seu navegador não suporta a API de Acesso ao Sistema de Arquivos. Tente usar Chrome, Edge ou Opera.');
      return;
    }

    setLoading(true);
    try {
      const dirHandle = await window.showDirectoryPicker();
      const notes = [];

      async function getFilesRecursively(dir) {
        for await (const entry of dir.values()) {
          if (entry.kind === 'file' && entry.name.endsWith('.md')) {
            const file = await entry.getFile();
            const content = await file.text();
            notes.push({
              id: `obsidian-${file.name}-${file.lastModified}`,
              name: file.name,
              content,
            });
          } else if (entry.kind === 'directory') {
            await getFilesRecursively(entry);
          }
        }
      }

      await getFilesRecursively(dirHandle);

      const processed = await Promise.all(
        notes.map(async (note) => {
          const result = await processContent(note.content);
          return { id: note.id, name: note.name, ...result };
        })
      );

      setImported(processed);
      if (onImport) onImport(processed);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao importar notas do Obsidian:', err);
        alert('Ocorreu um erro ao ler o diretório.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded mb-4">
      <h2 className="font-bold mb-2">Importar do Obsidian (Markdown)</h2>
      <button onClick={handleImport} disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded">
        {loading ? 'Importando...' : 'Selecionar Pasta do Obsidian'}
      </button>
      <ul className="mt-4">
        {imported.map((item) => (
          <li key={item.id} className="mb-2">
            <strong>{item.metadata.suggestedTitle || item.name}</strong> <span className="text-xs text-gray-500">({item.metadata.contentType})</span>
            <pre className="bg-gray-100 p-2 mt-1 text-xs whitespace-pre-wrap">{item.normalizedText}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
