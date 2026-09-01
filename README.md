# AthleteDB (estrutura organizada)

Este projeto é um **Next.js (App Router) + Bootstrap** com páginas base:
- `/` Home
- `/athletes` lista com filtros (mock data)
- `/athletes/[slug]` perfil do atleta
- `/games` e `/games/[id]` placeholders
- `/news` e `/news/[slug]` com mock data
- `/about`, `/contact`, `/admin`

## Como correr
1. Instala dependências:
   ```bash
   npm install
   ```
2. Arranca o servidor:
   ```bash
   npm run dev
   ```
3. Abre:
   http://localhost:3000

## Próximo passo
- Ligar a BD (PostgreSQL + Prisma)
- Criar Admin CRUD (atletas, jogos, stats, notícias)

## Orangeball Dreams — Automation Layer

### Development workflow

```bash
npm run obd:normalize
npm run obd:generate
npm run obd:health
npm run obd:media
npm run dev

npm run obd:normalize
npm run obd:generate
npm run obd:health
npm run obd:media
npm run build

npm run obd:create-player
npm run obd:update-player
npm run obd:generate
npm run obd:health
npm run obd:media

AI Engine Python
  ↓
ai-engine/data/players
  ↓
public/generated
  ↓
Next.js frontend