import React from 'react';
import PropTypes from 'prop-types';

const SearchResults = ({ results, isLoading }) => {
  if (isLoading) {
    return <div className="text-center p-4">Carregando resultados...</div>;
  }

  // Não renderiza nada se não houver busca ou resultados
  if (!results) {
    return null;
  }
  
  if (results.length === 0) {
    return <div className="text-center p-4 text-gray-500">Nenhum resultado encontrado.</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-4 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Resultados da Busca</h2>
      {results.map((item) => (
        <div key={item.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">{item.title || 'Nota sem título'}</h3>
          <p className="text-sm text-gray-500 mb-2">
            Fonte: {item.source || 'Desconhecida'} | Similaridade: {(item.score * 100).toFixed(2)}%
          </p>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.originalText}</p>
        </div>
      ))}
    </div>
  );
};

SearchResults.propTypes = {
  results: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string,
      source: PropTypes.string,
      score: PropTypes.number.isRequired,
      originalText: PropTypes.string.isRequired,
    })
  ),
  isLoading: PropTypes.bool.isRequired,
};

export default SearchResults;
