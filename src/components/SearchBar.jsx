import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const SearchBar = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  // Lógica de Debounce
  useEffect(() => {
    // Não aciona a busca se a query for vazia ou se já estiver buscando
    if (query.trim() === '' || isLoading) {
      return;
    }

    const timer = setTimeout(() => {
      onSearch(query);
    }, 300); // Atraso de 300ms antes de fazer a busca

    // Limpa o timer se o usuário continuar digitando
    return () => {
      clearTimeout(timer);
    };
    // A dependência `onSearch` foi removida para evitar recriação do timer
    // se a função for recriada no componente pai. Use useCallback no App.jsx se necessário.
  }, [query, isLoading]);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="w-full max-w-4xl mx-auto my-4">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pergunte ao seu Segundo Cérebro..."
          className="w-full p-4 pr-20 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 transition"
          disabled={isLoading}
        />
        <button
          // O botão agora é opcional, mas pode ser mantido para acessibilidade e preferência do usuário
          type="submit"
          className="absolute top-1/2 right-2 -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 transition"
          disabled={isLoading}
        >
          {isLoading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
    </form>
  );
};

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default SearchBar;
