# IDentify Web

Frontend do sistema IDentify.

## Desenvolvimento
```bash
npm install --no-workspaces
cp .env.example .env
npm run dev
```

## Build estático (Cloudflare Pages)
```bash
$env:NEXT_PUBLIC_API_URL="https://api.identify.qzz.io"
npm run build
```

O build fica em `apps/web/out`.

## Variáveis de ambiente
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_TERMINAL_KEY` (opcional)

## Rotas
- `/` home
- `/admin/login` painel admin
- `/terminal` verificação facial
- `/roadmap` visão de evolução
