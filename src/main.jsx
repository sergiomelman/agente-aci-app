import React from 'react';
import ReactDOM from 'react-dom/client';
import AgenteAci from './agents/AgenteAci.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';

// Configuração do MSAL (Microsoft Authentication Library)
const MSAL_CLIENT_ID = import.meta.env.VITE_MSAL_CLIENT_ID;
const msalConfig = {
  auth: {
    // O Client ID é carregado a partir das variáveis de ambiente para segurança.
    // Certifique-se de que VITE_MSAL_CLIENT_ID está definido no seu arquivo .env
    clientId: MSAL_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <MsalProvider instance={msalInstance}>
        <AgenteAci />
      </MsalProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
