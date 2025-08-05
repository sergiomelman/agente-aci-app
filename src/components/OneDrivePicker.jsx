import React, { useState, useEffect, useCallback } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest, graphConfig } from "../authConfig";
import PropTypes from 'prop-types';

const OneDrivePicker = ({ onFileSelect, setMessage, setOcrProgress }) => {
    const { instance, inProgress, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [files, setFiles] = useState([]);
    const [nextLink, setNextLink] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchFiles = useCallback(async (url) => {
        setLoading(true);
        setError(null);
        if (inProgress !== InteractionStatus.None || !accounts.length) {
            setLoading(false);
            return;
        }

        try {
            const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${tokenResponse.accessToken}` }
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Falha ao buscar arquivos.');
            }

            // Se for a primeira página, substitui os arquivos. Se for "carregar mais", anexa.
            setFiles(prevFiles => url === graphConfig.onedriveRootChildrenEndpoint ? data.value : [...prevFiles, ...data.value]);
            setNextLink(data['@odata.nextLink'] || null);
        } catch (e) {
            setError(`Erro ao buscar arquivos: ${e.message}`);
            if (e.name === "InteractionRequiredAuthError" || e.name === "BrowserAuthError") {
                instance.loginPopup(loginRequest);
            }
        } finally {
            setLoading(false);
        }
    }, [instance, inProgress, accounts]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchFiles(graphConfig.onedriveRootChildrenEndpoint);
        }
    }, [isAuthenticated, fetchFiles]);

    const handleLogin = () => {
        instance.loginPopup(loginRequest).catch(e => setError(e.message));
    };

    const handleLoadMore = () => {
        if (nextLink) {
            fetchFiles(nextLink);
        }
    };

    // Função para chamar nosso novo backend
    const saveToSecondBrain = async (fileContent, fileName) => {
        setMessage("Salvando no Segundo Cérebro...");
        setOcrProgress(0); // Reset progress
        try {
            const response = await fetch('http://localhost:3001/api/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    normalizedText: fileContent,
                    source: 'OneDrive',
                    title: fileName,
                }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Falha ao salvar a nota.');

            setMessage(`Nota "${fileName}" salva com sucesso!`);
            setOcrProgress(100);

        } catch (e) {
            setError(`Erro ao salvar: ${e.message}`);
            setMessage("Falha ao salvar a nota no Segundo Cérebro.");
            setOcrProgress(0);
        }
    };

    const handleFileClick = async (file) => {
        const downloadUrl = file['@microsoft.graph.downloadUrl'];
        if (!downloadUrl) {
            setError("Este arquivo não pode ser baixado (pode ser uma pasta).");
            return;
        }
        // Em vez de chamar onFileSelect, agora chamamos a função que salva no backend.
        // NOTA: A chamada direta para downloadUrl pode falhar por CORS. O ideal é que o backend faça o download.
        // Para este exemplo, vamos assumir que a chamada funciona ou que um proxy é usado.
        setMessage(`Processando ${file.name}...`);
        const response = await fetch(downloadUrl);
        const fileText = await response.text(); // Assumindo que é um arquivo de texto
        await saveToSecondBrain(fileText, file.name);
    };

    return (
        <div className="p-4 border rounded-lg mt-4 bg-gray-50 dark:bg-gray-700">
            <h3 className="font-bold mb-2">Seus arquivos no OneDrive</h3>
            {error && <div className="text-red-500 p-2 bg-red-100 rounded mb-4">{error}</div>}

            {!isAuthenticated && !loading && (
                <div className="text-center">
                    <p className="mb-4">Faça login para ver seus arquivos.</p>
                    <button onClick={handleLogin} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Entrar com a Microsoft
                    </button>
                </div>
            )}

            {loading && files.length === 0 && <p>Carregando arquivos...</p>}

            {files.length > 0 && (
                <ul className="max-h-60 overflow-y-auto">
                    {files.map(file => (
                        <li key={file.id} onClick={() => handleFileClick(file)}
                            className="p-2 border-b cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                            {file.name}
                        </li>
                    ))}
                </ul>
            )}

            {loading && files.length > 0 && <p className="text-center mt-2">Carregando mais...</p>}

            {nextLink && !loading && (
                <button
                    onClick={handleLoadMore}
                    className="w-full mt-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Carregar Mais
                </button>
            )}
        </div>
    );
};

OneDrivePicker.propTypes = {
    onFileSelect: PropTypes.func.isRequired,
    setMessage: PropTypes.func.isRequired,
    setOcrProgress: PropTypes.func.isRequired,
};

export default OneDrivePicker;
