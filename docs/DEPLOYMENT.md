# Deploy (Cloudflare Pages + Render + Supabase)

## 1) Banco (Supabase)
1. Crie um projeto no Supabase.
2. Project Settings → Database → copie a `Connection string` (Direct).
3. Habilite a extensão `vector` em Database → Extensions.

Exemplo de `DATABASE_URL`:
```
postgresql://postgres:SENHA@db.SEUPROJETO.supabase.co:5432/postgres?sslmode=require
```

## 2) API (Render)
1. Render → New → Web Service.
2. Repo: `Diogokranzz/IDentify`.
3. Root Directory: `apps/api`.
4. Build Command:
```
npm install --no-workspaces && npm run prisma:generate && npm run build
```
5. Start Command:
```
npm start
```
6. Environment Variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `FACE_MATCH_THRESHOLD`
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`
- `TERMINAL_KEY` (opcional)

## 3) Migrar banco
```bash
cd apps/api
$env:DATABASE_URL="postgresql://postgres:SENHA@db.SEUPROJETO.supabase.co:5432/postgres?sslmode=require"
npx prisma migrate deploy
npm run seed
```

## 4) DNS da API (Cloudflare)
Crie o registro:
- Type: `CNAME`
- Name: `api`
- Target: `identify-api-XXXX.onrender.com`
- Proxy: **DNS only**

Teste:
```
https://api.identify.qzz.io/health
```

## 5) Front (Cloudflare Pages)
Build local:
```bash
$env:NEXT_PUBLIC_API_URL="https://api.identify.qzz.io"
npm run build -w apps/web
```

Upload da pasta:
```
apps/web/out
```

## 6) Domínio do front (Cloudflare)
Pages → Custom domains → `identify.qzz.io`.
