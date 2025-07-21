import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import AgenteAci from './agents/AgenteAci.jsx' // Caminho atualizado para a nova estrutura
import AgenteApo from './agents/AgenteApo.jsx'
import { ApoProvider } from './context/ApoContext.jsx'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <ApoProvider>
        <div className="container p-4 mx-auto">
          <AgenteAci />
          <AgenteApo />
        </div>
      </ApoProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
