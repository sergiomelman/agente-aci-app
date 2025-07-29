import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { listAllFilesRecursive, downloadFile, getDocxContent } from '../services/microsoftApi';
import { processContent } from '../utils/processContent';
import { runOCR } from '../utils/ocr';

export default function OneDrivePicker({ onFileSelect, setMessage, setOcrProgress }) {
  const { instance, inProgress, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const login = () => {
    instance.loginRedirect({ scopes: ['User.Read', 'Files.Read.All'] });
  };

  useEffect(() => {
    // A condição `files.length === 0` previne a busca de arquivos se eles já foram carregados.
    if (isAuthenticated && inProgress === InteractionStatus.None && files.length === 0) {
      setIsLoading(true);
      setMessage('Buscando arquivos no OneDrive (todas as pastas)...');
      listAllFilesRecursive(instance, accounts[0])
        .then(allFiles => {
          setFiles(allFiles);
        })
        .catch(error => {
          console.error('Erro ao listar arquivos do OneDrive:', error);
          setMessage('Erro ao buscar arquivos do OneDrive.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isAuthenticated, inProgress, instance, accounts, setMessage]);

  const handleFileClick = async (file) => {
    if (!file.file) {
      setMessage(`O item '${file.name}' não é um arquivo suportado.`);
      return;
    }


    setIsLoading(true);
    setMessage(`Baixando e processando '${file.name}'...`);
    setOcrProgress(0); // Sempre reseta o progresso

    try {
      const blob = await downloadFile(instance, accounts[0], file.id);
      setOcrProgress(50);
      let content = '';


      if (file.name.toLowerCase().endsWith('.docx')) {
        // DOCX nunca passa pelo OCR
        content = await getDocxContent(blob);
        setOcrProgress(80);
      } else if (file.name.toLowerCase().endsWith('.pdf')) {
        const ocrFile = new File([blob], file.name, { type: blob.type });
        content = await runOCR(ocrFile, { setMessage, setOcrProgress });
      } else if (file.name.toLowerCase().match(/\.(jpe?g|png|bmp|gif)$/)) {
        // Imagens suportadas pelo OCR
        const ocrFile = new File([blob], file.name, { type: blob.type });
        content = await runOCR(ocrFile, { setMessage, setOcrProgress });
      } else {
        // Outros tipos: tenta ler como texto
        content = await blob.text();
        setOcrProgress(80);
      }

      setOcrProgress(90);
      const processed = await processContent(content);
      onFileSelect(processed);
    } catch (error) {
      console.error('Erro ao baixar ou processar o arquivo:', error);
      setMessage(`Erro ao processar o arquivo '${file.name}'.`);
      setOcrProgress(0); // Garante reset do progresso em erro
    } finally {
      setIsLoading(false);
      setTimeout(() => setOcrProgress(100), 200); // Finaliza barra após sucesso
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 border-t">
        <p className="mb-2">Você precisa entrar com sua conta Microsoft para ver os arquivos do OneDrive.</p>
        <button onClick={login} className="px-4 py-2 bg-blue-500 text-white rounded">
          Entrar com a Microsoft
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-4 text-center">Carregando...</div>;
  }

  // Filtro de busca
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 border-t max-h-60 overflow-y-auto">
      <h3 className="font-bold mb-2">Seus Arquivos do OneDrive</h3>
      <input
        type="text"
        className="mb-2 p-1 border rounded w-full"
        placeholder="Buscar arquivo..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <ul className="list-disc pl-5">
        {filteredFiles.length > 0 ? (
          filteredFiles.map(file => (
            <li key={file.id} onClick={() => handleFileClick(file)} className="cursor-pointer hover:underline">
              {file.parentReference && file.parentReference.path
                ? `${file.parentReference.path.replace('/drive/root:', '')}/` : ''}{file.name}
            </li>
          ))
        ) : (
          <li>Nenhum arquivo encontrado.</li>
        )}
      </ul>
    </div>
  );
}

OneDrivePicker.propTypes = {
  onFileSelect: PropTypes.func.isRequired,
  setMessage: PropTypes.func.isRequired,
  setOcrProgress: PropTypes.func.isRequired,
};
