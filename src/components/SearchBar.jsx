import React, { useState } from 'react';
import PropTypes from 'prop-types';

const SearchBar = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto my-4">
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
