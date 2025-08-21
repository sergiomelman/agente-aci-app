import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@microsoft/microsoft-graph-client'],
  },
  server: {
    // Adiciona a configuração de proxy
    proxy: {
      // Redireciona qualquer requisição que comece com /api para o seu backend
      '/api': {
        target: 'http://localhost:3001', // O endereço do seu servidor backend
        changeOrigin: true, // Necessário para hosts virtuais
        secure: false,      // Não é necessário validar o certificado SSL em desenvolvimento
      },
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      // Unificando a Content-Security-Policy para incluir todas as fontes necessárias
      'Content-Security-Policy':
        [
          "connect-src",
          "'self'", // Permite conexões para a mesma origem (Vite dev server, que usa o proxy)
          "http://localhost:3001", // Permite conexões diretas para o backend (se não usar o proxy)
          "https://api.trello.com", // API do Trello
          "https://login.microsoftonline.com", // Autenticação Microsoft
          "https://graph.microsoft.com", // Microsoft Graph API
          "https://*.googleapis.com", // APIs do Google (Drive, etc.)
          "https://apis.google.com", // APIs do Google
          "https://oauth2.googleapis.com", // OAuth2 do Google
          "https://accounts.google.com/gsi/", // Google Sign-In
          "http://gc.kis.v2.scr.kaspersky-labs.com ws://gc.kis.v2.scr.kaspersky-labs.com", // Kaspersky (provavelmente adicionado por uma extensão)
        ].join(" ") + ";",
    },
  },
});
