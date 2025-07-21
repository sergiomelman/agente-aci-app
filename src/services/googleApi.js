// Função auxiliar para fazer chamadas autenticadas para as APIs do Google
const googleFetch = async (url, accessToken) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Erro na API do Google: ${errorData.error.message}`);
  }
  return response.json();
};

// Lista os arquivos do Google Drive do usuário, filtrando por Google Docs
export const listFiles = async (accessToken, pageToken = null) => {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  // Procura por Google Docs, PDFs e todos os tipos de imagem
  const q = "mimeType='application/vnd.google-apps.document' or mimeType='application/pdf' or mimeType contains 'image/'";
  url.searchParams.append('q', q);
  url.searchParams.append('fields', 'files(id, name, mimeType),nextPageToken');
  url.searchParams.append('orderBy', 'modifiedTime desc');
  url.searchParams.append('pageSize', '100'); // Aumenta o limite de resultados por página

  if (pageToken) {
    url.searchParams.append('pageToken', pageToken);
  }

  const data = await googleFetch(url.toString(), accessToken);
  return {
    files: data.files || [],
    nextPageToken: data.nextPageToken || null,
  };
};

// Busca o conteúdo de um documento específico do Google Docs
export const getDocumentContent = async (accessToken, documentId) => {
  const url = `https://docs.googleapis.com/v1/documents/${documentId}?fields=body.content`;
  const data = await googleFetch(url, accessToken);

  // Extrai e formata o texto do corpo do documento
  let text = '';
  data.body.content.forEach(element => {
    if (element.paragraph) {
      element.paragraph.elements.forEach(pElem => {
        if (pElem.textRun) {
          text += pElem.textRun.content;
        }
      });
    }
  });
  return text.trim();
};

// Baixa o conteúdo de um arquivo do Google Drive (para PDFs, imagens, etc.)
export const downloadFile = async (accessToken, fileId) => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Erro na API do Google: ${errorData.error.message}`);
  }
  return response.blob();
};
