import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Garante que o .env seja carregado a partir do diretório 'backend'
// Isso torna o script robusto, não importa de onde ele seja executado.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });