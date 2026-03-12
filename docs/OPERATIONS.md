# Operação

## Fluxo recomendado
1. Criar admin seed.
2. Fazer login no painel.
3. Configurar 2FA.
4. Cadastrar pessoas.
5. Capturar e vincular rosto.
6. Testar liberação no terminal.

## Monitoramento
- Render: logs de deploy e runtime.
- Supabase: métricas do banco e auditoria de queries.

## Performance do reconhecimento
Parâmetros no front (ajustáveis):
- `DETECTOR_INPUT_SIZE` (menor = mais rápido).
- `DETECTOR_SCORE_THRESHOLD` (mais baixo = detecta mais rápido, porém mais falsos).

Recomendações:
- Webcam 480x360 para velocidade.
- Use iluminação estável para reduzir reprocessamento.
