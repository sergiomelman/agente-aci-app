// backend/trello-proxy.js

import express from 'express';
import fetch from 'node-fetch'; // Garante que o fetch esteja disponível

const router = express.Router();

// Carrega as credenciais do arquivo .env
const { TRELLO_API_KEY, TRELLO_API_TOKEN } = process.env;
const TRELLO_API_BASE = 'https://api.trello.com/1';

// Middleware para verificar se as credenciais do Trello estão configuradas
const checkTrelloCredentials = (req, res, next) => {
    if (!TRELLO_API_KEY || !TRELLO_API_TOKEN) {
        const errorMessage = 'Credenciais da API do Trello não configuradas no servidor. Verifique o arquivo .env no diretório do backend.';
        console.error(`[Trello Proxy] ${errorMessage}`);
        return res.status(500).json({ message: 'Credenciais da API do Trello não configuradas no servidor.' });
    }
    next();
};

router.use(checkTrelloCredentials);

// Função auxiliar para fazer chamadas à API do Trello
const trelloFetch = async (path) => {
    const separator = path.includes('?') ? '&' : '?';
    const url = `${TRELLO_API_BASE}${path}${separator}key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}`;
    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API do Trello: ${response.status} - ${errorText}`);
    }
    return response.json();
};

// Rota para buscar todos os quadros do usuário
router.get('/boards', async (req, res) => {
    try {
        const boards = await trelloFetch('/members/me/boards');
        res.json(boards);
    } catch (error) {
        console.error("Erro ao buscar quadros do Trello:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para buscar as listas de um quadro específico
router.get('/boards/:boardId/lists', async (req, res) => {
    try {
        const { boardId } = req.params;
        const lists = await trelloFetch(`/boards/${boardId}/lists`);
        res.json(lists);
    } catch (error) {
        console.error("Erro ao buscar listas do Trello:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para buscar os cartões de uma lista específica
router.get('/lists/:listId/cards', async (req, res) => {
    try {
        const { listId } = req.params;
        const cards = await trelloFetch(`/lists/${listId}/cards`);
        res.json(cards);
    } catch (error) {
        console.error("Erro ao buscar cartões do Trello:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para buscar os detalhes de um cartão específico
router.get('/cards/:cardId', async (req, res) => {
    try {
        const { cardId } = req.params;
        // Adicionamos 'fields=name,desc' para garantir que sempre recebemos o título e a descrição
        const cardDetails = await trelloFetch(`/cards/${cardId}?fields=name,desc`);
        res.json(cardDetails);
    } catch (error) {
        console.error("Erro ao buscar detalhes do cartão do Trello:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
