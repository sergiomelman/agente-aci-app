// A URL base da sua API backend.
// Com o proxy do Vite configurado, podemos usar um caminho relativo.
// O servidor de desenvolvimento do Vite irá interceptar e redirecionar para http://localhost:3001/api.
const API_BASE_URL = '/api';

/**
 * Salva uma nova nota no backend.
 * @param {object} noteData - Os dados da nota a serem salvos.
 * @param {string} noteData.normalizedText - O texto principal da nota.
 * @param {string} [noteData.title] - O título da nota.
 * @param {string} [noteData.source] - A fonte da nota (ex: 'Notion', 'Upload').
 * @returns {Promise<object>} A resposta da API.
 */
export const saveNote = async (noteData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });

    if (!response.ok) {
      // Tenta extrair uma mensagem de erro do corpo da resposta
      const errorBody = await response.json().catch(() => ({ message: 'Erro desconhecido ao processar a resposta.' }));
      throw new Error(`Erro na API: ${response.status} - ${errorBody.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Falha ao salvar a nota:", error);
    // Re-lança o erro para que o chamador possa tratá-lo (ex: exibir na UI)
    throw error;
  }
};

// No futuro, você pode adicionar a função de busca aqui também.
// export const searchNotes = async (query) => { ... };