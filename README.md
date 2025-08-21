
# Agente ACI - Projeto Segundo Cérebro

Este projeto é a implementação de um agente de conversação (ACI - Agente de Conversação Inteligente) construído como parte de um sistema de "Segundo Cérebro". O objetivo é criar uma interface interativa para gerenciar e consultar informações.

Construído com React, Vite e Tailwind CSS.

## Setup e Instalação

Para rodar este projeto localmente, siga os passos abaixo:

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd agente-aci-app
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

## Rodando o Projeto

Para iniciar o servidor de desenvolvimento, execute:

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:5173` (ou outra porta indicada no terminal).

## Scripts Disponíveis

-   `npm run dev`: Inicia o servidor de desenvolvimento com Hot-Module-Replacement (HMR).
-   `npm run build`: Compila o projeto para produção.
-   `npm run lint`: Executa o linter (ESLint) para verificar a qualidade do código.
-   `npm run preview`: Inicia um servidor local para visualizar a build de produção.

## Configuração do Backend (Servidor)

O código do servidor de backend está localizado no diretório `backend/` deste repositório. Ele é responsável por lidar com a lógica de negócio segura, como:
1.  Atuar como proxy para APIs externas (Trello, Notion) para proteger as chaves de API.
2.  Processar dados com o **Agente APO** (usando OpenAI).
3.  Armazenar e recuperar informações em bancos de dados vetoriais (Pinecone) com o **Agente ARS**.

O frontend está configurado para se comunicar com o backend na porta `3001` através de um proxy configurado no `vite.config.js`.

### Rodando o Backend

1.  **Navegue até o diretório do backend:**
    ```bash
    cd backend
    ```

2.  **Instale as dependências do backend:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    - Crie um arquivo chamado `.env` dentro do diretório `backend/`.
    - Adicione as chaves de API necessárias. Consulte a seção "Configuração de APIs Externas" para saber quais chaves são obrigatórias.

4.  **Inicie o servidor de backend:**
    ```bash
    node server.js
    ```
    O servidor estará disponível em `http://localhost:3001`. O frontend se comunicará com ele automaticamente.

---

## Configuração de APIs Externas (Obrigatório)

Para que os importadores de serviços de nuvem (OneDrive, Google Drive, etc.) funcionem, é crucial configurar corretamente as permissões nos respectivos painéis de desenvolvedor.

### Microsoft Azure (OneDrive & OneNote)

1.  **Acesse o Portal do Azure** e navegue até **Azure Active Directory > Registros de aplicativo**.
2.  Selecione o aplicativo correspondente a este projeto.
3.  Vá para a seção **Permissões de API**.
4.  Clique em **+ Adicionar uma permissão** > **Microsoft Graph** > **Permissões delegadas**.
5.  Adicione as seguintes permissões:
    -   `Files.Read` (para ler arquivos do usuário)
    -   `Files.Read.All` (se necessário para acessar todos os arquivos)
    -   `Sites.Read.All` (pode ser necessário para algumas integrações do SharePoint)
    -   `User.Read` (para informações básicas do perfil)
6.  Após adicionar, clique no botão **"Conceder consentimento de administrador para..."** para que as permissões tenham efeito.

### Google Cloud (Google Drive)

1.  **Acesse o Google Cloud Console** e selecione seu projeto.
2.  No menu, navegue até **APIs e Serviços > Biblioteca**.
3.  Procure por **"Google Drive API"** e certifique-se de que ela está **ATIVADA**.
4.  Vá para **APIs e Serviços > Tela de consentimento OAuth**.
5.  Em **"Escopos"**, clique em **"Adicionar ou remover escopos"**.
6.  Adicione o escopo para leitura de arquivos do Drive: `https://www.googleapis.com/auth/drive.readonly`.
7.  Vá para **APIs e Serviços > Credenciais**.
8.  Crie ou verifique seu **ID do Cliente OAuth 2.0**.
9.  Copie o "ID do Cliente" e adicione-o ao seu arquivo `.env` na raiz do projeto:
    ```
    VITE_GOOGLE_CLIENT_ID="SEU_ID_DE_CLIENTE_AQUI"
    ```

### Trello

Para que o importador do Trello funcione, o backend precisa de uma Chave de API e um Token de API.

1.  **Obtenha sua Chave de API**:
    -   Faça login no Trello e acesse https://trello.com/app-key.
    -   Sua "Chave de Desenvolvedor" pessoal estará visível. Copie este valor.

2.  **Gere um Token de API**:
    -   Na mesma página, clique no link "Token" abaixo da sua chave.
    -   Você será levado a uma página de autorização. Clique em "Permitir".
    -   Copie o token que é exibido.

3.  **Configure as Variáveis de Ambiente do Backend**:
    -   No seu diretório de backend, crie um arquivo `.env` (se ainda não existir).
    -   Adicione as seguintes linhas, substituindo pelos valores que você copiou:
    ```
    TRELLO_API_KEY="SUA_CHAVE_DE_API_AQUI"
    TRELLO_API_TOKEN="SEU_TOKEN_DE_API_AQUI"
    ```

---

## Arquitetura de Agentes

O coração do sistema são os agentes de IA, cada um com uma função específica, mas trabalhando em conjunto:

### Agente de Captura e Ingestão (ACI)

**Função:** Coleta informações de fontes configuradas pelo usuário. A aplicação React atual é a principal interface deste agente.
- **Capacidades:**
    - Captura de texto, upload de arquivos (PDF, imagens).
    - Extração de texto com OCR (Tesseract.js).
    - Conexão com serviços externos (Notion, OneNote, Trello) para importação.
    - Normalização e formatação inicial dos dados antes de enviá-los ao próximo agente.

### Agente de Processamento e Organização (APO)

**Função:** Analisa o conteúdo capturado, extrai entidades, classifica e organiza. Reside no backend.
- **Capacidades:**
    - Processamento de Linguagem Natural (PLN) para sumarização, extração de palavras-chave.
    - Classificação automática em categorias.
    - Identificação de entidades (pessoas, locais, datas).
    - Criação de links e relações entre informações.
    - Sugestão de tags e aplicação de princípios PARA.

### Agente de Recuperação e Síntese (ARS)

**Função:** Permite a busca inteligente e a geração de sínteses a partir da base de conhecimento.
- **Capacidades:**
    - Busca semântica por significado.
    - Geração de resumos e respostas a perguntas.
    - Conexão de informações para gerar novos insights.

### Agente de Automação e Execução (AAE)

**Função:** Transforma insights em ações automatizadas.
- **Capacidades:**
    - Criação automática de tarefas, lembretes e eventos.
    - Geração de rascunhos de e-mails e relatórios.
    - Integração com ferramentas de produtividade (Trello, Google Calendar).

### Agente de Reflexão e Aprendizagem (ARA)

**Função:** Monitora o uso do sistema e otimiza o desempenho dos outros agentes.
- **Capacidades:**
    - Análise de padrões de uso e feedback.
    - Refinamento dos modelos de PLN.
    - Sugestão de revisões e identificação de informações desatualizadas.

## Fluxo de Trabalho do Sistema

O projeto segue um fluxo claro, orquestrado pelos agentes:

1.  **Captura (ACI - Frontend):**
    -   O usuário interage com a aplicação React para fornecer informações, seja colando texto, fazendo upload de arquivos (`.jpg`, `.png`, `.pdf`) ou importando de serviços como Notion.
    -   Para arquivos, **Tesseract.js** e **pdf.js** são usados no cliente para extrair o texto bruto (OCR).
    -   Uma limpeza e normalização inicial ocorre no frontend para melhorar a coesão do texto.

2.  **Envio para Processamento (ACI → APO):**
    -   O conteúdo bruto e pré-processado é enviado via uma chamada de API para o backend.

3.  **Análise e Organização (APO - Backend):**
    -   O APO recebe os dados.
    -   Aplica algoritmos avançados de PLN para sumarizar, extrair palavras-chave, identificar entidades (pessoas, locais, datas), classificar o conteúdo e sugerir tags.
    -   O resultado é um objeto de conhecimento estruturado, pronto para ser armazenado.

4.  **Armazenamento e Consulta (ARS - Backend):**
    -   Os dados estruturados são salvos em uma base de conhecimento (ex: um banco de dados vetorial).
    -   O ARS utiliza essa base para responder a buscas semânticas e gerar sínteses.

5.  **Ação e Automação (AAE - Backend):**
    -   Com base nos insights gerados, o AAE pode interagir com APIs externas para criar tarefas, agendar eventos, etc.

6.  **Apresentação dos Resultados (ACI - Frontend):**
    -   A interface do ACI exibe os resultados processados pelo APO (título, resumo, tags, etc.), permitindo que o usuário valide e refine as informações.

## Estado Atual e Próximos Passos

O projeto avançou significativamente, com o frontend (Agente ACI) em um estágio maduro e funcional.

### Estado Atual (Concluído)

-   **Frontend (ACI) Funcional**: A interface de captura está implementada, permitindo entrada de texto, upload de arquivos e importação de serviços de nuvem.
-   **Extração de Múltiplas Fontes**: O hook `useAciProcessor` orquestra a extração de texto de arquivos locais (`.docx`, `.pdf`, imagens com OCR), OneDrive e Google Drive.
-   **Refatoração do Fluxo de Frontend**: O fluxo de dados no frontend foi refatorado. O `useAciProcessor` agora orquestra uma chamada de duas etapas: primeiro para análise (`/api/analyze`) e depois para salvamento (`/api/ingest`).
-   **Interface de Validação do APO**: O componente `AgenteApo.jsx` foi transformado em um formulário de validação, pronto para receber, exibir e permitir a edição dos dados analisados pela IA.

### Próximos Passos (Foco Atual)

O foco principal agora é a construção do backend que dará vida aos agentes APO e ARS, seguindo um fluxo de trabalho mais robusto e inteligente, alinhado com a visão original do projeto.

1.  **Passo 1: Implementar o Endpoint de Análise do APO (`/api/analyze`)**
    -   **Objetivo:** Criar um endpoint que executa a principal função do Agente de Processamento e Organização (APO): analisar um texto bruto e devolver uma estrutura de conhecimento para validação do usuário.
    -   **Lógica do Endpoint:**
        1.  Receber o texto bruto (`normalizedText`) enviado pelo frontend (ACI).
        2.  Conectar-se a um serviço de LLM (ex: API de Chat da OpenAI) com um prompt bem definido para realizar as seguintes tarefas:
            -   Gerar um título conciso e informativo.
            -   Criar um resumo executivo do conteúdo.
            -   Extrair de 3 a 5 palavras-chave ou tags relevantes.
            -   Sugerir uma categoria (ex: Trabalho, Pessoal, Estudo).
        3.  Retornar esses dados processados como um objeto JSON para o frontend, para que o usuário possa revisar.

2.  **Passo 2: Atualizar o Frontend (ACI) para o Fluxo de Revisão**
    -   **Objetivo:** Permitir que o usuário valide e edite as sugestões da IA antes de salvar permanentemente a nota. Este é um passo crucial para garantir a qualidade da base de conhecimento.
    -   **Lógica da Interface:**
        1.  Após o processamento inicial (upload, OCR, etc.), o ACI chama o novo endpoint `/api/analyze`.
        2.  A resposta do APO é exibida em uma nova tela ou modal, com campos para o usuário editar o título, o resumo e as tags.
        3.  O usuário revisa as informações e clica em um botão final, como "Salvar no Segundo Cérebro".

3.  **Passo 3: Aprimorar o Endpoint de Ingestão do ARS (`/api/ingest`)**
    -   **Objetivo:** Transformar o endpoint `/api/ingest` na porta de entrada para o Agente de Recuperação e Síntese (ARS), responsável por armazenar o conhecimento final e validado.
    -   **Lógica do Endpoint:**
        1.  Receber o objeto de conhecimento **final e validado pelo usuário** (contendo título, texto original, tags, fonte, etc.).
        2.  Gerar o embedding vetorial a partir do texto e do título, usando a API de embeddings da OpenAI (`text-embedding-3-small`).
        3.  Salvar o vetor e os metadados associados no banco de dados vetorial (Pinecone).
        4.  Retornar uma confirmação de sucesso para o frontend.

## Sugestões de Implementação e Evolução

Para guiar o desenvolvimento contínuo do projeto, aqui estão algumas sugestões de tecnologias e arquiteturas.

### Backend (APO/ARS)

-   **Stack Principal:** **Node.js com Express ou Fastify** é uma escolha natural, mantendo o ecossistema em JavaScript. Alternativamente, **Python com FastAPI ou Flask** é extremamente popular para aplicações de IA devido ao seu robusto ecossistema de bibliotecas (ex: LangChain, Transformers).
-   **Orquestração de IA (APO):** Em vez de chamadas diretas às APIs de LLMs, considere usar frameworks como o **LangChain.js**. Ele simplifica a criação de "chains" e "agents" que podem, por exemplo, primeiro resumir um texto e depois extrair entidades em etapas conectadas.
-   **Segurança:** Como a aplicação lida com dados sensíveis de múltiplas fontes, proteja os endpoints do backend com autenticação, mesmo que sejam chamados apenas pelo seu frontend. Um token **JWT (JSON Web Token)** pode garantir que apenas o frontend autenticado possa se comunicar com a API.

### Banco de Dados Vetorial (ARS)

-   **Produção:** **Pinecone** é uma excelente escolha gerenciada e escalável.
-   **Desenvolvimento/Alternativas:** Para desenvolvimento local ou projetos menores, considere alternativas como **ChromaDB**, **Weaviate**, ou até mesmo uma solução baseada em arquivos como **HNSWLib** (com o wrapper `hnswlib-node`) para evitar custos iniciais.

### Deployment

-   **Frontend (ACI):** Sendo uma aplicação estática (build do Vite), pode ser facilmente hospedada em serviços como **Vercel**, **Netlify** ou **GitHub Pages**.
-   **Backend (APO/ARS):** Para o servidor Node.js/Python, plataformas como **Render**, **Fly.io** ou provedores de nuvem tradicionais (AWS, Google Cloud, Azure) oferecem ótimas opções para hospedar a API.

### Melhorias Futuras para os Agentes

-   **Agente AAE (Automação):** Após a recuperação de informações pelo ARS, o AAE poderia usar ferramentas como **Zapier** ou **n8n** (via webhooks) para automatizar a criação de tarefas no Trello, eventos no Google Calendar, etc., com base no conteúdo analisado.
-   **Agente ARA (Reflexão):** Implementar um sistema de feedback simples na interface, onde o usuário pode avaliar a qualidade dos resumos e tags gerados. Esses dados podem ser usados futuramente para refinar os prompts enviados aos LLMs, talvez até utilizando técnicas de fine-tuning.

## Solução de Problemas (Troubleshooting)

### Erro: `fatal: refusing to merge unrelated histories`

Este erro ocorre quando o repositório local e o remoto (ex: no GitHub) são iniciados de forma independente e não compartilham um histórico de commits em comum. Isso geralmente acontece se você cria um repositório no GitHub com um arquivo `README.md` e, separadamente, inicia um repositório local com `git init`.

Para resolver, siga estes passos:

1.  **Tente unir os históricos permitindo a junção de históricos não relacionados:**
    ```bash
    git pull origin main --allow-unrelated-histories
    ```

2.  **Resolva os conflitos de mesclagem (merge conflicts):**
    O Git irá marcar os arquivos que possuem conflitos. Abra cada arquivo conflitado (ex: `index.html`, `AgenteAci.jsx`) no seu editor de código, remova as marcações de conflito (`<<<<<<< HEAD`, `=======`, `>>>>>>>`) e deixe o código na versão final desejada.

3.  **Adicione os arquivos resolvidos e faça o commit da mesclagem:**
    ```bash
    git add .
    git commit
    ```
    O Git abrirá um editor de texto com uma mensagem de commit padrão. Apenas salve e feche o editor (no Vim, use `Esc` e depois digite `:wq`).

4.  **Envie as alterações para o repositório remoto:**
    ```bash
    git push origin main
    ```

## Exemplo de Uso dos Serviços de API

A seguir, exemplos de como os serviços de API podem ser consumidos pelos componentes adaptadores para interagir com as fontes de dados.

### OneDrive (Microsoft Graph)

```javascript
import { listFiles, downloadFile } from '@/services/microsoftApi';

// Exemplo: Listar arquivos do OneDrive
const arquivos = await listFiles(msalInstance, account);

// Exemplo: Baixar arquivo do OneDrive
const blob = await downloadFile(msalInstance, account, fileId);
```

### Google Drive

```javascript
import { listFiles, getDocumentContent, downloadFile } from '@/services/googleApi';

// Exemplo: Listar arquivos do Google Drive
const { files } = await listFiles(accessToken);

// Exemplo: Buscar conteúdo de um Google Doc
const texto = await getDocumentContent(accessToken, documentId);

// Exemplo: Baixar arquivo do Google Drive
const blob = await downloadFile(accessToken, fileId);
```

### Trello

```javascript
import { getBoards, getLists, getCards, getCardDetails } from '@/services/trelloApi';

// Exemplo: Listar quadros do Trello
const boards = await getBoards();

// Exemplo: Listar listas de um quadro
const lists = await getLists(boardId);

// Exemplo: Listar cartões de uma lista
const cards = await getCards(listId);

// Exemplo: Buscar detalhes de um cartão
const cardDetails = await getCardDetails(cardId);
```

## Como Adicionar Novos Adaptadores de Fonte

A arquitetura do projeto foi pensada para ser extensível. Para adicionar uma nova fonte de dados:

1.  **Crie um novo serviço de API** em `src/services` seguindo o padrão dos arquivos existentes (`googleApi.js`, `microsoftApi.js`, etc.).
2.  **Implemente um componente "Adaptador"** em `src/components/importers` (ex: `NovaFonteImporter.jsx`). Este componente deve:
    -   Renderizar um botão para iniciar a importação.
    -   Consumir o serviço de API criado no passo 1.
    -   Utilizar o `ImporterModal.jsx` para apresentar a UI de seleção de arquivos/dados.
3.  **Adicione o novo componente adaptador** ao `AgenteAci.jsx` para que ele
## Arquitetura de Componentes (Frontend)

O frontend é construído com React e segue uma arquitetura de componentes reutilizáveis, organizados de acordo com as responsabilidades dos Agentes de IA.

### Componentes de UI Genéricos

Componentes puros de UI, sem lógica de negócio, que podem ser reutilizados em toda a aplicação.

-   **`Modal.jsx`**: Componente base para a criação de janelas de diálogo (modais).
-   **`ImporterModal.jsx`**: Um modal genérico e reutilizável para o fluxo de importação. Ele orquestra a busca e seleção de páginas de uma fonte externa, recebendo a lógica específica da fonte como props.

### Componentes do Agente de Processamento (APO)

Componentes responsáveis por exibir os resultados da análise feita pelo backend.
-   **`AgenteApo.jsx`**: Renderiza os dados processados pelo APO (título, resumo, tags) que são recebidos do backend. Ele consome o `ApoContext` para obter os dados.
 -   **`AgenteApo.jsx`**: Renderiza um formulário de validação com os dados processados pelo APO (título, resumo, tags). Ele recebe esses dados como props do `AgenteAci.jsx` e permite que o usuário os edite antes de salvar.

### Componentes do Agente de Recuperação (ARS)

Componentes responsáveis pela interface de busca e visualização de resultados.

-   **`SearchBar.jsx`**: A barra de busca onde o usuário insere a sua consulta.
-   **`SearchResults.jsx`**: O componente que renderiza a lista de resultados retornados pela busca semântica.

### Componentes do Agente de Captura (ACI)

Estes componentes formam o coração da funcionalidade de importação de dados. Eles seguem um padrão de **Adaptador** para máxima reutilização de código.

#### O Padrão de Importação

Para cada fonte de dados (Notion, OneNote, etc.), criamos um componente "Adaptador" (ex: `NotionImporter.jsx`). Este adaptador é responsável por:
1.  Gerenciar seu próprio estado de visibilidade (se está aberto ou não).
2.  Passar para o `ImporterModal.jsx` as funções e dados específicos daquela fonte (ex: a função para buscar páginas do Notion, o título do modal).

**Componentes Adaptadores de Fonte**:
-   `NotionImporter.jsx`
-   `OneNoteImporter.jsx`
-   `TrelloImporter.jsx`
-   `ObsidianImporter.jsx`
-   `OneDriveImporter.jsx`

Internamente, cada um desses componentes renderiza o `ImporterModal.jsx`, passando as props necessárias para que ele funcione com a fonte de dados correta.

**Componentes de Seleção (Pickers)**:
-   **`OneDrivePicker.jsx`**: Um componente mais complexo que encapsula a UI específica do seletor de arquivos do OneDrive, incluindo sua própria lógica de autenticação e interação com a API da Microsoft.

### Arquitetura de Hooks (Análise e Decisões)

Para manter a lógica de negócio desacoplada da UI e promover a reutilização, a criação de hooks customizados é uma prática recomendada.

#### Hooks Existentes e Planejados

#### `useAciProcessor.js`

-   **(Implementado e Otimizado)** Este hook é o coração do **Agente de Captura e Ingestão (ACI)**. Ele centraliza todo o fluxo do cliente:
    1.  Orquestra a captura de conteúdo de múltiplas fontes (texto, arquivos locais, OCR, serviços de nuvem).
    2.  Chama o backend para análise (`/api/analyze`) e armazena a resposta estruturada em seu estado (`apoResponse`).
    3.  Fornece uma função (`saveContent`) para enviar os dados validados pelo usuário para o endpoint de ingestão (`/api/ingest`).

#### `useOneDriveFiles.js`

-   **(Implementado)** Para melhorar a separação de responsabilidades, a lógica de autenticação e busca de arquivos do OneDrive foi extraída para este hook especializado. O componente `OneDrivePicker` consome este hook, simplificando seu código e focando apenas na apresentação dos dados.

#### Oportunidades de Melhoria

-   **Criar `useSearch.js`**: Extrair a lógica de busca semântica (que será implementada a seguir) para um hook `useSearch`, que se comunicará com o backend para consultar o Agente de Recuperação e Síntese (ARS).

---

### Erro: `fatal: refusing to merge unrelated histories`

Este erro ocorre quando o repositório local e o remoto (ex: no GitHub) são iniciados de forma independente e não compartilham um histórico de commits em comum. Isso geralmente acontece se você cria um repositório no GitHub com um arquivo `README.md` e, separadamente, inicia um repositório local com `git init`.

Para resolver, siga estes passos:

1.  **Tente unir os históricos permitindo a junção de históricos não relacionados:**
    ```bash
    git pull origin main --allow-unrelated-histories
    ```

2.  **Resolva os conflitos de mesclagem (merge conflicts):**
    O Git irá marcar os arquivos que possuem conflitos. Abra cada arquivo conflitado (ex: `index.html`, `AgenteAci.jsx`) no seu editor de código, remova as marcações de conflito (`<<<<<<< HEAD`, `=======`, `>>>>>>>`) e deixe o código na versão final desejada.

3.  **Adicione os arquivos resolvidos e faça o commit da mesclagem:**
    ```bash
    git add .
    git commit
    ```
    O Git abrirá um editor de texto com uma mensagem de commit padrão. Apenas salve e feche o editor (no Vim, use `Esc` e depois digite `:wq`).

4.  **Envie as alterações para o repositório remoto:**
    ```bash
    git push origin main
    ```
