/**
 * Busca recursivamente arquivos com extensões desejadas em todas as pastas do OneDrive.
 * @param {object} msalInstance - Instância do MSAL.
 * @param {object} account - Conta do usuário.
 * @param {string} [folderId='root'] - ID da pasta para iniciar a busca.
 * @param {Array} [accumulator=[]] - Acumulador interno para recursão.
 * @returns {Promise<Array>} - Lista de arquivos encontrados.
 */
export const listAllFilesRecursive = async (msalInstance, account, folderId = 'root', accumulator = []) => {
  const graphClient = getAuthenticatedClient(msalInstance, account);
  const allowedExtensions = ['.docx', '.pdf', '.txt', '.md'];
  let nextLink = null;
  do {
    let fileRequest;
    if (nextLink) {
      fileRequest = graphClient.api(nextLink);
    } else {
      fileRequest = graphClient
        .api(`/me/drive/items/${folderId}/children`)
        .select("id,name,file,size,webUrl,@microsoft.graph.downloadUrl,folder")
        .top(50);
    }
    const response = await fileRequest.get();
    for (const item of response.value || []) {
      if (item.folder) {
        // Recursivamente busca em subpastas
        await listAllFilesRecursive(msalInstance, account, item.id, accumulator);
      } else if (item.name && allowedExtensions.some(ext => item.name.toLowerCase().endsWith(ext))) {
        accumulator.push(item);
      }
    }
    nextLink = response['@odata.nextLink'] || null;
  } while (nextLink);
  return accumulator;
};
import { Client, ResponseType } from '@microsoft/microsoft-graph-client';
import mammoth from 'mammoth';

/**
 * Cria e retorna um cliente do Microsoft Graph autenticado.
 * Centraliza a lógica de autenticação para reutilização.
 * @param {import('@azure/msal-browser').IPublicClientApplication} msalInstance
 * @param {import('@azure/msal-browser').AccountInfo} account
 * @returns {Client}
 */
const getAuthenticatedClient = (msalInstance, account) => Client.initWithMiddleware({
  authProvider: {
    getAccessToken: async () => {
      try {
        const response = await msalInstance.acquireTokenSilent({
          scopes: ['Files.Read.All'],
          account,
        });
        return response.accessToken;
      } catch (error) {
        console.error('Falha ao adquirir token silenciosamente, tentando interativamente...', error);
        throw new Error('Falha na autenticação com a Microsoft. Tente fazer login novamente.');
      }
    }
  }
});

/**
 * Lista arquivos da raiz do OneDrive do usuário, com suporte a paginação.
 * @param {object} msalInstance - A instância do MSAL.
 * @param {object} account - A conta do usuário.
 * @param {string|null} nextLink - A URL para a próxima página de resultados.
 * @returns {Promise<{files: Array, nextPageToken: string|null}>}
 */
export const listFiles = async (msalInstance, account, nextLink = null) => {
  const graphClient = getAuthenticatedClient(msalInstance, account);
  try {
    // Se um `nextLink` for fornecido, usamos ele para buscar a próxima página.
    // Caso contrário, fazemos a requisição inicial para a raiz do drive.
    let fileRequest;
    const allowedExtensions = ['.docx', '.pdf', '.txt', '.md'];
    if (nextLink) {
      fileRequest = graphClient.api(nextLink); // Paginação
    } else {
      // Busca arquivos da raiz do drive
      fileRequest = graphClient
        .api('/me/drive/root/children')
        .select("id,name,file,size,webUrl,@microsoft.graph.downloadUrl")
        .top(50);
    }
    console.log('URL da API do Graph sendo chamada:', fileRequest.buildFullUrl());
    const response = await fileRequest.get();

    // Filtra arquivos pelas extensões desejadas
    const filteredFiles = (response.value || []).filter(file =>
      file.name && allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    );

    return {
      files: filteredFiles,
      nextPageToken: response['@odata.nextLink'] || null,
    };
  } catch (error) {
    console.error('Erro ao listar arquivos do OneDrive:', error);
    throw new Error(`Falha ao buscar arquivos do OneDrive. ${error.message}`);
  }
};

/**
 * Baixa um arquivo do OneDrive.
 * @param {import('@azure/msal-browser').IPublicClientApplication} msalInstance
 * @param {import('@azure/msal-browser').AccountInfo} account
 * @param {string} fileId - O ID do arquivo.
 * @returns {Promise<Blob>} - O conteúdo do arquivo como um Blob.
 */
export async function downloadFile(msalInstance, account, fileId) {
  const client = getAuthenticatedClient(msalInstance, account);
  try {
    // É crucial especificar o tipo de resposta como 'blob' para garantir que o conteúdo do arquivo
    // seja retornado como um Blob, que pode ser processado posteriormente.
    const response = await client.api(`/me/drive/items/${fileId}/content`).responseType(ResponseType.BLOB).get();
    return response;
  } catch (error) {
    console.error(`Erro ao baixar o arquivo ${fileId}:`, error);
    throw new Error(`Falha ao baixar o arquivo. ${error.message}`);
  }
}
/**
 * Extrai o conteúdo de texto de um arquivo .docx (Blob).
 * @param {Blob} blob - O blob do arquivo .docx.
 * @returns {Promise<string>}
 */
export const getDocxContent = async (blob) => {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Erro ao extrair conteúdo do DOCX:', error);
    throw new Error(`Falha ao processar arquivo .docx. ${error.message}`);
  }
};