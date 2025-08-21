import { PublicClientApplication, LogLevel } from "@azure/msal-browser";

/**
 * Configuração do MSAL. Substitua o clientId pelo ID do seu aplicativo Azure.
 */
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID, // Obrigatório, carregado do .env
    authority: "https://login.microsoftonline.com/common", // Para contas pessoais e de trabalho/escola
    // Para desenvolvimento local, é mais seguro usar um valor fixo que corresponda
    // exatamente ao que está registrado no Portal do Azure.
    redirectUri: "http://localhost:5173/",
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    // Adiciona logs detalhados para facilitar a depuração.
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
      // Habilita logs mais detalhados apenas em ambiente de desenvolvimento para facilitar a depuração.
      // Em produção, apenas erros serão registrados.
      logLevel: import.meta.env.DEV ? LogLevel.Verbose : LogLevel.Error,
    },
  },
};

/**
 * Escopos necessários para ler dados do usuário e anotações do OneNote.
 */
export const loginRequest = {
  scopes: [
    "User.Read",
    "Files.Read",
    "Files.Read.All",
    "Notes.Read",
    "Notes.Read.All",
  ],
  // Força o usuário a selecionar uma conta, ignorando sessões em cache.
  // Ótimo para depuração e para resolver problemas de cache corrompido.
  prompt: "select_account"
};

/**
 * Endpoints da API do Microsoft Graph que usaremos.
 */
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphFilesEndpoint: "https://graph.microsoft.com/v1.0/me/drive/root/children"
};
