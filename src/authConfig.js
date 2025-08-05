import { LogLevel } from "@azure/msal-browser";

/**
 * Configuração do MSAL. Substitua o clientId pelo ID do seu aplicativo Azure.
 */
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID, // Obrigatório, carregado do .env
    authority: "https://login.microsoftonline.com/common", // Para contas pessoais e de trabalho/escola
    redirectUri: window.location.origin, // Onde o usuário é redirecionado após o login
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        if (level <= LogLevel.Warning) {
          console.log(message);
        }
      },
    },
  },
};

/**
 * Escopos necessários para ler dados do usuário e anotações do OneNote.
 */
export const loginRequest = {
  scopes: ["User.Read", "Files.Read.All"],
};

/**
 * Endpoints da API do Microsoft Graph que usaremos.
 */
export const graphConfig = {
    onenotePagesEndpoint: "https://graph.microsoft.com/v1.0/me/onenote/pages?select=id,title,contentUrl",
    onedriveRootChildrenEndpoint: "https://graph.microsoft.com/v1.0/me/drive/root/children?select=id,name,@microsoft.graph.downloadUrl"
};
