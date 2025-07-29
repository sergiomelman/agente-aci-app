// src/hooks/useOneDriveFiles.js (Novo arquivo)
import { useState, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { Client } from '@microsoft/microsoft-graph-client';

// Função para inicializar o cliente do Graph de forma autenticada
const getAuthenticatedGraphClient = (msalInstance, accounts) => {
  if (!accounts || accounts.length === 0) {
    throw new Error('Nenhum usuário autenticado encontrado.');
  }

  const authProvider = {
    getAccessToken: async () => {
      const response = await msalInstance.acquireTokenSilent({
        scopes: ['Files.Read.All'],
        account: accounts[0],
      });
      return response.accessToken;
    },
  };

  return Client.initWithMiddleware({ authProvider });
};

export const useOneDriveFiles = () => {
  const { instance, accounts } = useMsal();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextLink, setNextLink] = useState(null);

  const fetchFiles = useCallback(async (link = null) => {
    setIsLoading(true);
    setError(null);

    try {
      const graphClient = getAuthenticatedGraphClient(instance, accounts);
      let response;

      if (link) {
        // Se temos um nextLink, usamos ele para a próxima página
        response = await graphClient.api(link).get();
      } else {
        // Primeira chamada, buscando a primeira página (top 100)
        setFiles([]); // Limpa a lista para uma nova busca
        response = await graphClient
          .api('/me/drive/root/children')
          .select('id,name,file,size,webUrl')
          .top(100) // Define o tamanho da página
          .get();
      }

      const newFiles = response.value;
      setFiles(prevFiles => (link ? [...prevFiles, ...newFiles] : newFiles));
      setNextLink(response['@odata.nextLink'] || null);

    } catch (err) {
      console.error(err);
      setError('Falha ao buscar os arquivos do OneDrive. Verifique o console.');
    } finally {
      setIsLoading(false);
    }
  }, [instance, accounts]);

  return { files, isLoading, error, nextLink, fetchFiles };
};
