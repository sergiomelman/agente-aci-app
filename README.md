
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

## Como Funciona: O Fluxo do Agente ACI

O projeto segue um fluxo de trabalho claro para transformar conteúdo bruto (texto, imagens, PDFs) em dados estruturados e prontos para serem usados por um "Segundo Cérebro".

1.  **Captura de Entrada:** O usuário fornece informações de duas maneiras:
    -   **Texto Direto:** Colando o conteúdo em uma área de texto.
    -   **Upload de Arquivo:** Enviando uma imagem (`.jpg`, `.png`) ou um documento PDF.

2.  **Extração com OCR (se aplicável):**
    -   Se um arquivo é enviado, a função `performOCR` no hook `useAciProcessor` é acionada.
    -   Ela utiliza a biblioteca **Tesseract.js** para realizar o Reconhecimento Óptico de Caracteres (OCR) e extrair o texto bruto.
    -   Para arquivos PDF, a **pdf.js** é usada para renderizar cada página em uma imagem antes de passar pelo OCR, garantindo a extração completa do documento.

3.  **Normalização e Limpeza do Texto:**
    -   O texto bruto (seja do OCR ou da entrada direta) passa pela função `normalizeData`.
    -   **Melhoria Principal:** Esta função foi aprimorada para limpar "ruídos" e artefatos do OCR, remover linhas vazias e, o mais importante, **reconstruir de forma inteligente parágrafos e frases**. Ela analisa se uma linha termina com pontuação forte (como `.`, `!`, `?`) e se a linha seguinte é um item de lista. Caso contrário, une as linhas para garantir que o texto final seja coeso e legível.

4.  **Detecção de Relevância e Metadados:**
    -   O texto já normalizado é analisado pela função `detectRelevantContent`.
    -   **Melhoria Principal:** Esta função agora é mais robusta para:
        -   **Sugerir um Título:** A heurística para encontrar um título foi refinada. Ela agora avalia o comprimento da linha (entre 10 e 150 caracteres) e a proporção de caracteres alfabéticos para filtrar ruídos, parando no primeiro candidato válido.
        -   **Identificar Tipos de Conteúdo:** A classificação foi aprimorada com um sistema de palavras-chave e uma regra de precedência (por exemplo, "Material de Estudo" tem preferência sobre "Artigo" se ambos forem detectados).
        -   **Extrair Itens de Lista:** Detecta e extrai corretamente itens de listas, mesmo que as frases tenham sido quebradas em várias linhas no texto original.
        -   **Extrair Links, E-mails e Datas.**

5.  **Apresentação dos Resultados:**
    -   O resultado final é um objeto estruturado (`normalizedDataForAPO`) que contém o conteúdo original, o texto normalizado e todos os metadados detectados.
    -   Esses dados são exibidos de forma clara na interface (`ResultsDisplay`) para que o usuário possa revisá-los antes de enviá-los para o próximo estágio do sistema (o APO).

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
