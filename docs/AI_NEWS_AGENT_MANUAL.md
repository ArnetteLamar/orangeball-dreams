# Orangeball Dreams — AI News Agent Manual

Este manual explica como usar o fluxo de notícias com AI Agent na plataforma Orangeball Dreams.

## Objetivo

O AI News Agent serve para pesquisar notícias, sinais de mercado, scouting, entrevistas e atualizações relevantes sobre atletas, treinadores e contexto do basquetebol.

O agente nunca deve publicar diretamente.

O fluxo correto é:

AI Agent pesquisa
↓
AI Agent devolve JSON
↓
Sistema cria proposta pendente
↓
Arnette aprova ou rejeita
↓
Se aprovada, a notícia aparece na Homepage e na News Page

---

## Pastas principais

### Instruções do agente

ai-engine/data/agents/news-agent-instructions.md

Este ficheiro contém as regras que deves copiar/usar quando pedires ao AI Agent para pesquisar notícias.

---

### Outputs do agente

ai-engine/data/agents/outputs

Aqui podes guardar os JSONs que o AI Agent devolve.

Exemplo:

ai-engine/data/agents/outputs/pablo-news-output.json

---

### Notícias pendentes

ai-engine/data/news/pending

Aqui ficam as propostas criadas pelo agente, mas ainda não aprovadas.

---

### Notícias aprovadas

ai-engine/data/news/approved

Aqui ficam arquivadas as propostas que já foram aprovadas.

---

### Notícias rejeitadas

ai-engine/data/news/rejected

Aqui ficam arquivadas as propostas rejeitadas.

---

### Notícias públicas da homepage

ai-engine/data/news/home

Aqui ficam as notícias que entram no site.

Estas notícias alimentam:

- Homepage
- News Page

---

### JSON público gerado

public/generated/news/home.json

Este ficheiro é gerado automaticamente e é o que o frontend lê.

Não editar este ficheiro manualmente.

---

## Comandos principais

### Gerar notícias públicas

Usa quando adicionares ou aprovares notícias.

npm run obd:news:generate

---

### Criar proposta a partir de output do agente

Exemplo:

npm run obd:news:create-proposal -- ai-engine\data\agents\outputs\nome-do-output.json

Isto cria uma proposta pendente em:

ai-engine/data/news/pending

---

### Listar propostas pendentes

npm run obd:news:list

---

### Aprovar proposta pendente

Exemplo:

npm run obd:news:approve -- 2026-09-02-nome-da-noticia.json

Quando aprovas:

- a notícia entra em ai-engine/data/news/home
- a proposta vai para ai-engine/data/news/approved
- o ficheiro public/generated/news/home.json é atualizado
- a notícia aparece na Homepage e na News Page

---

### Rejeitar proposta pendente

Exemplo:

npm run obd:news:reject -- 2026-09-02-nome-da-noticia.json

Quando rejeitas:

- a proposta sai de pending
- entra em rejected
- nada aparece online

---

## Processo completo para uma notícia real

### 1. Pedir ao AI Agent

Usar as instruções deste ficheiro:

ai-engine/data/agents/news-agent-instructions.md

Pedir ao agente para devolver apenas JSON válido.

---

### 2. Guardar o JSON do agente

Guardar o output em:

ai-engine/data/agents/outputs

Exemplo:

ai-engine/data/agents/outputs/pablo-mera-news.json

---

### 3. Criar proposta pendente

npm run obd:news:create-proposal -- ai-engine\data\agents\outputs\pablo-mera-news.json

---

### 4. Ver propostas pendentes

npm run obd:news:list

---

### 5. Aprovar ou rejeitar

Se estiver boa:

npm run obd:news:approve -- ficheiro-pendente.json

Se não estiver boa:

npm run obd:news:reject -- ficheiro-pendente.json

---

### 6. Testar localmente

npm run build
npm run dev

Abrir:

http://localhost:3000/en
http://localhost:3000/es
http://localhost:3000/en/news
http://localhost:3000/es/news

---

### 7. Subir para GitHub e Vercel

git add -A
git commit -m "Add new generated news"
git push

Depois esperar a Vercel ficar Ready.

---

## Regras importantes

Nunca publicar notícia sem fonte.

Nunca aceitar JSON sem link original.

Nunca aceitar rumores como factos.

Nunca copiar texto completo de artigos.

Nunca editar public/generated/news/home.json manualmente.

A fonte real deve estar sempre em:

data.href

E também em:

evidence.source_url

---

## Estrutura ideal do JSON do agente

{
  "proposal_type": "news_update",
  "target": "homepage",
  "confidence": 0.9,
  "data": {
    "id": "unique-news-id",
    "date": "YYYY-MM-DD",
    "homepage": true,
    "category": {
      "es": "Category in Spanish",
      "en": "Category in English"
    },
    "title": {
      "es": "Spanish title",
      "en": "English title"
    },
    "summary": {
      "es": "Spanish summary",
      "en": "English summary"
    },
    "image": "",
    "player_slug": "",
    "href": "https://source-url.com",
    "source": "Source name"
  },
  "evidence": {
    "source_url": "https://source-url.com",
    "source_name": "Source name",
    "source_date": "YYYY-MM-DD",
    "why_relevant": "Short explanation of why this matters."
  }
}

---

## Estado atual do sistema

Homepage lê notícias de JSON.

News Page lê notícias de JSON.

AI Agent tem instruções.

O sistema consegue criar propostas pendentes.

O sistema consegue listar propostas pendentes.

O sistema consegue aprovar propostas.

O sistema consegue rejeitar propostas.

A publicação ainda é controlada manualmente por Arnette.

---

## Próximo passo futuro

Ligar este fluxo ao Admin visual.

Objetivo futuro:

Admin
↓
Ver propostas pendentes
↓
Aprovar / rejeitar com botão
↓
Site atualiza

