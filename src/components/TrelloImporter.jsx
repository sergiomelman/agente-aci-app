import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';

// Helper para fazer chamadas à API do backend que atua como proxy para o Trello.
const fetchFromApi = async (endpoint) => {
  const response = await fetch(endpoint);
  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorBody = JSON.parse(errorText);
      throw new Error(errorBody.message || `Falha na API do Trello (Status: ${response.status})`);
    } catch (e) {
      // Se o erro for de parse, significa que a resposta não foi JSON (provavelmente HTML de erro)
      if (e instanceof SyntaxError) {
        throw new Error(`Falha na API. O servidor respondeu com status ${response.status}. Detalhes: ${errorText || '(sem corpo na resposta)'}`);
      }
      throw e; // Relança o erro vindo do `try` block
    }
  }
  return response.json();
};

const TrelloImporter = ({ isOpen, onClose, onImport }) => {
  const [step, setStep] = useState('boards'); // 'boards', 'lists', 'cards'
  const [items, setItems] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('Importar do Trello: Quadros');

  const resetState = useCallback(() => {
    setStep('boards');
    setItems([]);
    setSelectedBoard(null);
    setError('');
    setTitle('Importar do Trello: Quadros');
  }, []);

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchFromApi('/api/trello/boards');
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch boards when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchBoards();
    } else {
      resetState();
    }
  }, [isOpen, resetState, fetchBoards]);

  const handleBoardSelect = useCallback(async (board) => {
    setLoading(true);
    setError('');
    setSelectedBoard(board);
    setTitle(`Quadro: ${board.name} > Listas`);
    setStep('lists');
    try {
      const data = await fetchFromApi(`/api/trello/boards/${board.id}/lists`);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleListSelect = useCallback(async (list) => {
    setLoading(true);
    setError('');
    setTitle(`Quadro: ${selectedBoard.name} > Lista: ${list.name} > Cartões`);
    setStep('cards');
    try {
      const data = await fetchFromApi(`/api/trello/lists/${list.id}/cards`);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedBoard]);

  const handleCardSelect = useCallback(async (card) => {
    setLoading(true);
    setError('');
    try {
      const cardDetails = await fetchFromApi(`/api/trello/cards/${card.id}`);
      onImport({
        title: cardDetails.name,
        normalizedText: cardDetails.desc,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onImport, onClose]);

  const handleBack = useCallback(async () => {
    setError('');
    if (step === 'cards') {
      await handleBoardSelect(selectedBoard); // Go back to lists
    } else if (step === 'lists') {
      resetState();
      await fetchBoards();
    }
  }, [step, selectedBoard, handleBoardSelect, resetState, fetchBoards]);

  const renderContent = () => {
    if (loading) return <div className="p-4 text-center">Carregando...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (items.length === 0) return <div className="p-4 text-center text-gray-500">Nenhum item encontrado.</div>;

    const handler = {
      boards: handleBoardSelect,
      lists: handleListSelect,
      cards: handleCardSelect,
    }[step];

    return (
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.id} onClick={() => handler(item)} className="p-3 bg-gray-100 rounded-md hover:bg-blue-100 cursor-pointer transition-colors">
            {item.name}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {step !== 'boards' && (
        <button onClick={handleBack} className="mb-4 text-sm text-blue-600 hover:underline">
          &larr; Voltar
        </button>
      )}
      {renderContent()}
    </Modal>
  );
};

export default TrelloImporter;