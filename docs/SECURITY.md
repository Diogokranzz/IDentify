# Segurança

## CORS
Configure `CORS_ORIGIN` na API com os domínios permitidos:
```
http://localhost:3000,https://identify.qzz.io
```

## JWT
`JWT_SECRET` deve ser forte e exclusivo por ambiente.

## 2FA
O painel obriga TOTP quando habilitado.

## Terminal
Use `TERMINAL_KEY` para proteger `/faces/verify`.

## Produção
- Desabilitar `/docs` (já automático via `NODE_ENV=production`).
- Usar HTTPS sempre.
- Rodar migrations via CI ou manual controlado.
