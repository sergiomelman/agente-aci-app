import React, { useCallback, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus, InteractionRequiredAuthError } from "@azure/msal-browser";
import ImporterModal from './ImporterModal';
import { loginRequest } from '../authConfig';

const fetchOneNotePages = async (instance, accounts, inProgress) => {
  if (inProgress !== InteractionStatus.None) {
    throw new Error('Autenticação em andamento. Aguarde...');
  }

  const request = {
    ...loginRequest,
    account: accounts[0],
  };

  try {
    const tokenResponse = await instance.acquireTokenSilent(request);
    const accessToken = tokenResponse.accessToken;
    
    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me/onenote/pages', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await graphResponse.json();
    return data.value || [];

  } catch (error) {
    if (error instanceof InteractionRequiredAuthError && inProgress === InteractionStatus.None) {
      await instance.acquireTokenPopup(request);
      // Retry the fetch after getting new token
      return fetchOneNotePages(instance, accounts, inProgress);
    }
    throw error;
  }
};

const OneNoteImporter = ({ isOpen, onClose, onImport }) => {
  const { instance, accounts, inProgress } = useMsal();
  const [error, setError] = useState(null);

  // Use useCallback para evitar recriar a função a cada renderização
  const getPages = useCallback(async () => {
    try {
      const pages = await fetchOneNotePages(instance, accounts, inProgress);
      if (!pages.length) {
        setError("Nenhuma página encontrada no OneNote");
      }
      return pages;
    } catch (error) {
      console.error("Erro ao buscar páginas:", error);
      setError("Erro ao acessar o OneNote. Tente novamente.");
      return [];
    }
  }, [instance, accounts, inProgress]);

  return (
    <ImporterModal
      isOpen={isOpen}
      onClose={onClose}
      onImport={onImport}
      title="Importar do OneNote"
      fetchPages={getPages}
      sourceName="OneNote"
    />
  );
};

export default OneNoteImporter;