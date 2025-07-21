import { useApo } from '../context/ApoContext';

const AgenteApo = () => {
    const { apoData } = useApo();

    // Se não houver dados (estado inicial), exibe a mensagem de espera
    if (!apoData) {
        return (
            <div className="mt-12 bg-gray-50 p-8 rounded-lg shadow-lg w-full max-w-3xl border border-gray-200 mx-auto">
                <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">Agente APO</h2>
                <p className="text-gray-500 text-center">Aguardando dados do ACI para processamento...</p>
            </div>
        );
    }

    // Quando os dados chegam do ACI, exibe a UI de processamento do APO
    return (
        <div className="mt-12 bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl border border-gray-200 mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Agente de Processamento e Organização (APO)</h2>
            <div className="space-y-4">
                <p className="text-lg"><strong>Título Sugerido:</strong> <span className="font-light">{apoData.suggestedTitle}</span></p>
                <p className="text-lg"><strong>Tipo de Conteúdo:</strong> <span className="font-light">{apoData.contentType}</span></p>
                
                <h3 className="text-xl font-semibold text-gray-700 pt-4 mt-4 border-t">Dados Completos Recebidos:</h3>
                <pre className="mt-2 bg-gray-100 p-4 rounded-md overflow-auto text-xs">
                    {JSON.stringify(apoData, null, 2)}
                </pre>
            </div>
        </div>
    );
};

export default AgenteApo;
