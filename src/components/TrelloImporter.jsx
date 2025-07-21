import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import * as trelloApi from '@/services/trelloApi';

// Helper para formatar os dados do cartão em um texto limpo
const formatCardContent = (card) => {
  const parts = [`Título: ${card.name}`];

  if (card.desc) {
    parts.push(`Descrição:\n${card.desc}`);
  }

  if (card.checklists && card.checklists.length > 0) {
    card.checklists.forEach(checklist => {
      const checklistItems = [`Checklist "${checklist.name}":`];
      checklist.checkItems.forEach(item => {
        checklistItems.push(`- [${item.state === 'complete' ? 'x' : ' '}] ${item.name}`);
      });
      parts.push(checklistItems.join('\n'));
    });
  }
  return parts.join('\n\n');
};

const TrelloImporter = ({ isOpen, onClose, onImport }) => {
  const [step, setStep] = useState('boards'); // boards, lists, cards
  const [boards, setBoards] = useState([]);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedList, setSelectedList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Busca os quadros quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError('');
      trelloApi.getBoards()
        .then(data => {
          setBoards(data.filter(b => !b.closed)); // Filtra quadros fechados
          setStep('boards');
        })
        .catch(err => setError(`Falha ao buscar quadros. ${err.message}`))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleSelectBoard = (board) => {
    setSelectedBoard(board);
    setLoading(true);
    setError('');
    trelloApi.getLists(board.id)
      .then(data => { setLists(data); setStep('lists'); })
      .catch(err => setError(`Falha ao buscar listas. ${err.message}`))
      .finally(() => setLoading(false));
  };

  const handleSelectList = (list) => {
    setSelectedList(list);
    setLoading(true);
    setError('');
    trelloApi.getCards(list.id)
      .then(data => { setCards(data); setStep('cards'); })
      .catch(err => setError(`Falha ao buscar cartões. ${err.message}`))
      .finally(() => setLoading(false));
  };

  const handleSelectCard = async (card) => {
    setLoading(true);
    setError('');
    try {
      const cardDetails = await trelloApi.getCardDetails(card.id);
      const formattedContent = formatCardContent(cardDetails);
      onImport(formattedContent);
      handleClose();
    } catch (err) {
      setError(`Falha ao buscar detalhes do cartão. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'cards') setStep('lists');
    if (step === 'lists') setStep('boards');
  };

  const handleClose = () => {
    setStep('boards'); setBoards([]); setLists([]); setCards([]);
    setSelectedBoard(null); setSelectedList(null); setError('');
    onClose();
  };

  const renderContent = () => {
    if (loading) return <div className="text-center p-8">Carregando...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    const renderList = (items, onSelect, key, name) => (
      <ul className="space-y-2">{items.map(item => (
          <li key={item[key]} onClick={() => onSelect(item)}
              className="p-3 bg-gray-100 rounded-md hover:bg-blue-100 cursor-pointer transition-colors">
            {item[name]}
          </li>))}
      </ul>
    );

    switch (step) {
      case 'boards': return renderList(boards, handleSelectBoard, 'id', 'name');
      case 'lists': return renderList(lists, handleSelectList, 'id', 'name');
      case 'cards': return renderList(cards, handleSelectCard, 'id', 'name');
      default: return null;
    }
  };

  const getTitle = () => {
    if (step === 'lists') return `Quadro: ${selectedBoard?.name} > Selecione uma Lista`;
    if (step === 'cards') return `Lista: ${selectedList?.name} > Selecione um Cartão`;
    return 'Importar do Trello: Selecione um Quadro';
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getTitle()}>
      {step !== 'boards' && !loading && (
        <button onClick={handleBack} className="mb-4 text-sm text-blue-600 hover:underline">&larr; Voltar</button>
      )}
      {renderContent()}
    </Modal>
  );
};

export default TrelloImporter;
