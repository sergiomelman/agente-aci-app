// src/utils/ocr.js
import { createScheduler, createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configura o caminho para os "workers" do pdf.js.
// Isso é necessário para que o pdf.js funcione corretamente em um ambiente de build como o Vite.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

/**
 * Realiza o Reconhecimento Óptico de Caracteres (OCR) em um arquivo (imagem ou PDF).
 * @param {File} file - O arquivo de imagem ou PDF.
 * @param {object} callbacks - Funções de callback para atualizar a UI.
 * @param {(message: string) => void} callbacks.setMessage - Atualiza a mensagem de status.
 * @param {(progress: number) => void} callbacks.setOcrProgress - Atualiza o progresso do OCR.
 * @returns {Promise<string>} O texto extraído do arquivo.
 */
export const runOCR = async (file, { setMessage, setOcrProgress }) => {
  setMessage('Iniciando OCR...');
  setOcrProgress(0);

  // Usar um scheduler é a abordagem correta para processar múltiplas imagens (como páginas de PDF)
  const scheduler = createScheduler();

  try {
    // CORREÇÃO: A API do Tesseract.js v5 mudou.
    // O idioma e o OEM são passados diretamente para `createWorker`.
    // As funções `loadLanguage` e `initialize` foram removidas.
    const worker = await createWorker('por', 1, { // 1 = OEM.LSTM_ONLY
      logger: (m) => {
        if (m.status === 'recognizing text') {
          // ATENÇÃO: Ao processar um PDF com várias páginas, este progresso
          // se refere a uma única página por vez, o que pode fazer a barra de progresso "pular".
          // Isso é esperado com a abordagem de processamento em paralelo.
          setOcrProgress(Math.round(m.progress * 100));
        }
      },
    });
    scheduler.addWorker(worker);

    let fullText = '';

    if (file.type.startsWith('image/')) {
      setMessage('Processando imagem...');
      const { data: { text } } = await scheduler.addJob('recognize', file);
      fullText = text;
    } else if (file.type === 'application/pdf') {
      setMessage('Processando PDF...');
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const numPages = pdf.numPages;
      const promises = [];

      for (let i = 1; i <= numPages; i++) {
        setMessage(`Processando página ${i} de ${numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Aumenta a escala para melhor precisão
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
        promises.push(scheduler.addJob('recognize', canvas.toDataURL()));
      }

      const results = await Promise.all(promises);
      fullText = results.map((r) => r.data.text).join('\n\n');
    } else {
      throw new Error('Tipo de arquivo não suportado para OCR.');
    }

    return fullText;
  } catch (error) {
    console.error('Erro durante o OCR:', error);
    setMessage(`Erro no OCR: ${error.message || 'Ocorreu um erro desconhecido.'}`);
    return '';
  } finally {
    await scheduler.terminate();
    setMessage('OCR concluído.');
    setOcrProgress(100);
  }
};
