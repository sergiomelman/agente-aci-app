import React, { useState } from 'react';
import { processContent } from '../utils/processContent';

// Esqueleto funcional para importação de notas do Obsidian (Markdown local)
// Integração real com o sistema de arquivos pode ser feita via backend ou API customizada

const mockObsidianNotes = [
  {
    id: 'obsidian-1',
    name: 'Resumo de Aula.md',
    content: `Resumo de Aula de História\nAula sobre Revolução Francesa\n- Contexto\n- Causas\n- Consequências`
  },
  {
    id: 'obsidian-2',
    name: 'Artigo sobre IA.md',
    content: `Artigo: Inteligência Artificial\nA IA está transformando o mundo...`
  }
];

export default function ObsidianImporter({ onImport }) {
  const [imported, setImported] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    // Simula processamento de múltiplas notas Obsidian
    const processed = await Promise.all(
      mockObsidianNotes.map(async (note) => {
        const result = await processContent(note.content);
        return {
          id: note.id,
          name: note.name,
          ...result
        };
      })
    );
    setImported(processed);
    if (onImport) onImport(processed);
    setLoading(false);
  };

  return (
    <div className="border p-4 rounded mb-4">
      <h2 className="font-bold mb-2">Importar do Obsidian (Markdown)</h2>
      <button onClick={handleImport} disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded">
        {loading ? 'Importando...' : 'Importar Notas Mock'}
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
