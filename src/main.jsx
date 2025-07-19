import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AgenteAci from './agents/AgenteAci.jsx' // Caminho atualizado para a nova estrutura

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AgenteAci />
  </StrictMode>,
)
