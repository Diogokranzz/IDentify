# IDentify API

API do IDentify com autenticação, 2FA, auditoria e reconhecimento facial.

## Desenvolvimento
```bash
npm install --no-workspaces
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

## Variáveis de ambiente
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN` (ex: `http://localhost:3000,https://identify.qzz.io`)
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`
- `FACE_MATCH_THRESHOLD` (ex: `0.82`)
- `TERMINAL_KEY` (opcional)
- `SSO_JWKS_URL` (opcional)
- `SSO_ISSUER` (opcional)
- `SSO_AUDIENCE` (opcional)

## Endpoints principais
- `POST /auth/login`
- `POST /auth/2fa/setup`
- `POST /auth/2fa/verify`
- `GET /admin/me`
- `GET /admin/audit`
- `GET /persons`
- `POST /persons`
- `PATCH /persons/:id`
- `DELETE /persons/:id`
- `POST /faces/enroll`
- `POST /faces/verify`
- `GET /health`

## Observação
- Swagger (`/docs`) só disponível fora de produção.
