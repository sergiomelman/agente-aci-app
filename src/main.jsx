import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { msalConfig } from './authConfig';
import AgenteAci from './agents/AgenteAci.jsx';
import './index.css'; // Adicione esta linha para carregar os estilos do Tailwind

/**
 * A instância do MSAL deve ser criada fora da árvore de componentes para evitar que seja recriada em re-renderizações.
 */
const msalInstance = new PublicClientApplication(msalConfig);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <MsalProvider instance={msalInstance}>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AgenteAci />
    </GoogleOAuthProvider>
  </MsalProvider>
);
