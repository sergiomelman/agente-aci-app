// src/context/ApoContext.jsx
import { createContext, useState, useContext } from 'react';
import PropTypes from 'prop-types';

const ApoContext = createContext();

export const ApoProvider = ({ children }) => {
  const [apoData, setApoData] = useState(null);

  // Função que o ACI usará para enviar os dados
  const sendToApo = (data) => {
    console.log("Enviando dados para o APO:", data);
    setApoData(data);
  };

  return (
    <ApoContext.Provider value={{ apoData, sendToApo }}>
      {children}
    </ApoContext.Provider>
  );
};

ApoProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useApo = () => useContext(ApoContext);
