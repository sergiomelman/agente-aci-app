import { useState, useEffect } from 'react';

// Este hook gerencia o estado e a lógica para o Agente APO
export const useApo = () => {
  const [apoInput, setApoInput] = useState(null);
  const [apoResult, setApoResult] = useState('Aguardando dados do ACI para processamento...');
  const [isProcessing, setIsProcessing] = useState(false);

  // Este efeito será acionado quando o input do APO mudar
  useEffect(() => {
    if (apoInput) {
      setIsProcessing(true);
      setApoResult(`Processando dados recebidos...`);
      // Aqui entraria a lógica de processamento do APO
      // Por enquanto, vamos apenas exibir os dados recebidos.
      setApoResult(JSON.stringify(apoInput, null, 2));
      setIsProcessing(false);
    }
  }, [apoInput]);

  // Garante que o hook retorne um objeto com os valores necessários
  return { apoInput, setApoInput, apoResult, isProcessing };
};