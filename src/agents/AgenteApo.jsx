import { useState, useEffect } from 'react';

// O componente agora recebe os dados e funções via props
const AgenteApo = ({ apoData, saveContent, isSaving }) => {

    // Estado local para os campos editáveis
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [tags, setTags] = useState([]);
    const [category, setCategory] = useState('');

    // Efeito para popular o formulário quando os dados do APO chegam
    useEffect(() => {
        if (apoData) {
            setTitle(apoData.title || '');
            setSummary(apoData.summary || '');
            setTags(apoData.tags || []);
            setCategory(apoData.category || '');
        } else {
            // Limpa o formulário se não houver dados
            setTitle(''); setSummary(''); setTags([]); setCategory('');
        }
    }, [apoData]);

    // Se não houver dados (estado inicial), exibe a mensagem de espera
    if (!apoData) {
        return (
            <div className="mt-12 bg-gray-50 p-8 rounded-lg shadow-lg w-full max-w-3xl border border-gray-200 mx-auto">
                <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">Agente APO</h2>
                <p className="text-gray-500 text-center">Aguardando dados do ACI para processamento...</p>
            </div>
        );
    }

    const handleSave = () => {
        if (typeof saveContent === 'function') {
            const finalData = {
                title,
                summary,
                // Converte a string de tags de volta para um array antes de salvar
                tags: typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags,
                category,
                originalText: apoData.originalText, // Mantém o texto original
                source: apoData.source, // Preserva a fonte original, se houver
            };
            saveContent(finalData);
        }
    };

    // Quando os dados chegam, exibe o formulário de validação
    return (
        <div className="mt-12 bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl border border-gray-200 mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Agente de Processamento e Organização (APO)</h2>
            <div className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título Sugerido</label>
                    <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>

                <div>
                    <label htmlFor="summary" className="block text-sm font-medium text-gray-700">Resumo</label>
                    <textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows="4" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>

                <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (separadas por vírgula)</label>
                    <input type="text" id="tags" value={Array.isArray(tags) ? tags.join(', ') : tags} onChange={(e) => setTags(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>

                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria</label>
                    <input type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>

                <div className="pt-4">
                    <button onClick={handleSave} disabled={isSaving} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed">
                        {isSaving ? 'Salvando...' : 'Salvar no Segundo Cérebro'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgenteApo;
