# Troubleshooting

## API 403/Cloudflare Error 1000
- Use `api` como **DNS only** (sem proxy) se apontar para Render.
- Verifique se não há A/AAAA conflitantes para `api`.

## Prisma P1000 (senha inválida)
- Confirme a senha do Supabase.
- Se necessário, reset em Project Settings → Database.

## Render build falhando (Typescript)
- Rode `npm install --no-workspaces` localmente.
- Garanta que o commit subiu com todos os arquivos.

## Roadmap não abre
- Rebuild do front.
- Reupload do `apps/web/out` no Pages.
