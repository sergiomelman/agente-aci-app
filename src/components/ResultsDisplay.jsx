import React from 'react';

const MetadataItem = ({ label, value }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return null;
  }
  const displayValue = Array.isArray(value) ? value.join(', ') : value;
  return (
    <div className="mb-2">
      <span className="font-semibold text-gray-600">{label}: </span>
      <span className="text-gray-800">{displayValue}</span>
    </div>
  );
};

const ResultsDisplay = ({ results, isLoading, error, onSendToApo }) => {
  if (isLoading) {
    return (
      <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Resultados</h3>
        <div className="text-center py-10">
          <p className="text-gray-500">Processando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50">
        <h3 className="text-lg font-semibold text-red-700 mb-2">Erro</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Resultados</h3>
        <div className="text-center py-10">
          <p className="text-gray-500">Aguardando entrada para processamento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Resultados do Processamento</h3>

      <div className="mb-4 p-3 bg-white rounded-md shadow-sm">
        <h4 className="text-md font-semibold text-gray-800 mb-2 border-b pb-1">Metadados Sugeridos</h4>
        <MetadataItem label="Título" value={results.metadata.suggestedTitle} />
        <MetadataItem label="Tipo de Conteúdo" value={results.metadata.contentType} />
      </div>

      <div className="mb-4">
        <h4 className="text-md font-semibold text-gray-800 mb-2">Texto Normalizado</h4>
        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans bg-white p-3 rounded-md shadow-sm">{results.normalizedText}</pre>
      </div>

      <button onClick={onSendToApo} className="w-full p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">Enviar para APO</button>
    </div>
  );
};

export default ResultsDisplay;

