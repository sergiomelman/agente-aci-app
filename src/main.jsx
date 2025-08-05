import React from 'react';
import ReactDOM from 'react-dom/client';
import AgenteAci from './agents/AgenteAci.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import { PublicClientApplication, BrowserUtils } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './authConfig.js';

const msalInstance = new PublicClientApplication(msalConfig);

/**
 * A MSAL recomenda chamar handleRedirectPromise em todos os carregamentos de página.
 * Ele lidará com quaisquer respostas de autenticação retornadas de um fluxo de redirecionamento.
 * No caso de um pop-up, ele processará o hash e fechará a janela.
 * Na janela principal, ele resolverá com null e o aplicativo será renderizado.
 */

// MSAL v3+ requer que `initialize` seja chamado antes de qualquer outra API MSAL.
// É assíncrono e retorna uma promessa que resolve quando a inicialização está completa.
msalInstance
  .initialize()
  .then(() => {
    msalInstance
      .handleRedirectPromise()
      .then((response) => {
        // Se não estivermos em um pop-up, renderize o aplicativo.
        if (!BrowserUtils.isInPopup() && !BrowserUtils.isInIframe()) {
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(
            <React.StrictMode>
              <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <MsalProvider instance={msalInstance}>
                  <AgenteAci />
                </MsalProvider>
              </GoogleOAuthProvider>
            </React.StrictMode>
          );
        }
      })
      .catch((error) => {
        console.error('MSAL handleRedirectPromise error:', error);
      });
  })
  .catch((error) => {
    console.error('MSAL initialize error:', error);
  });
