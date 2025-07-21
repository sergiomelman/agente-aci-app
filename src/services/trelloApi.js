const API_KEY = import.meta.env.VITE_TRELLO_API_KEY;
const API_TOKEN = import.meta.env.VITE_TRELLO_API_TOKEN;
const BASE_URL = 'https://api.trello.com/1';

// Função auxiliar para lidar com as requisições fetch para o Trello
const trelloFetch = async (path) => {
  // Verifica se as credenciais foram configuradas no arquivo .env.local
  if (!API_KEY || !API_TOKEN) {
    throw new Error('Chave de API ou Token do Trello não configurados. Verifique seu arquivo .env.local');
  }
  const separator = path.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${path}${separator}key=${API_KEY}&token=${API_TOKEN}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API do Trello: ${response.statusText} - ${errorText}`);
  }
  return response.json();
};

export const getBoards = () => {
  return trelloFetch('/members/me/boards');
};

export const getLists = (boardId) => {
  return trelloFetch(`/boards/${boardId}/lists`);
};

export const getCards = (listId) => {
  return trelloFetch(`/lists/${listId}/cards`);
};

// Busca um cartão com todos os seus detalhes, incluindo checklists
export const getCardDetails = (cardId) => {
  return trelloFetch(`/cards/${cardId}?checklists=all`);
};
