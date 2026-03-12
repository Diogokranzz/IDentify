# IDentify

Sistema de reconhecimento facial para controle de acesso com painel administrativo, auditoria e integração com catracas.

## Visão geral
O IDentify é composto por:
- **Frontend** (Next.js) com interface transparente e fluxos de admin.
- **API** (Fastify) com autenticação, 2FA, auditoria e reconhecimento facial.
- **Banco** (PostgreSQL + pgvector) para armazenar embeddings faciais.

## Stack
- Frontend: Next.js App Router, GSAP, Tailwind v4.
- Backend: Fastify, Prisma, Zod.
- Banco: PostgreSQL + pgvector.
- Deploy sugerido: Cloudflare Pages (front) + Render (API) + Supabase (DB).

## Estrutura do repositório
- `apps/web` — frontend.
- `apps/api` — API + Prisma.
- `docs` — documentação de deploy e operação.

## Requisitos
- Node.js 20+.
- Docker (para banco local).
- Git (para deploy via Render).

## Configuração local rápida

1) Subir o Postgres local (pgvector):
```bash
docker compose up -d
```

2) API:
```bash
cd apps/api
npm install --no-workspaces
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

3) Front:
```bash
cd apps/web
npm install --no-workspaces
npm run dev
```

## Variáveis de ambiente (API)
Arquivo: `apps/api/.env`
- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`
- `FACE_MATCH_THRESHOLD`
- `TERMINAL_KEY` (opcional)
- `CORS_ORIGIN` (ex: `http://localhost:3000,https://identify.qzz.io`)

## Variáveis de ambiente (Front)
Arquivo: `apps/web/.env`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_TERMINAL_KEY` (opcional)

## Funcionalidades principais
- Login admin com 2FA.
- Cadastro e gestão de pessoas (blocos/áreas/status).
- Cadastro facial com webcam.
- Verificação facial no terminal.
- Auditoria detalhada de ações.

## Deploy
Consulte:
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Operação e segurança
Consulte:
- [docs/OPERATIONS.md](docs/OPERATIONS.md)
- [docs/SECURITY.md](docs/SECURITY.md)
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## Rotas principais
- Front: `https://identify.qzz.io`
- Terminal: `/terminal`
- Admin: `/admin/login`
- Roadmap: `/roadmap`

## Licença
Uso interno/projeto privado.
