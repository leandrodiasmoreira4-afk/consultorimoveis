# Consultor Imóveis

Base técnica do projeto do site de consultor de imóveis.

## Estado atual

- Supabase provisionado em São Paulo (`sa-east-1`)
- Projeto Supabase: `consultor-imoveis`
- RLS habilitado nas tabelas públicas
- Storage `property-media` criado e privado
- Seed controlado: `terreno-200m2-petrolina` em `draft`
- Conteúdos reais ainda pendentes permanecem nulos/ausentes

## Regras deste projeto

A UI pública existente não deve ser redesenhada nesta etapa. A integração deve preservar os contratos da camada de dados (como `getProperties()`, `getPropertyBySlug()` e `filterProperties()` ou equivalentes) e esconder detalhes do Supabase da UI.

Não inventar fotografias, descrição oficial, endereço/coordenadas, WhatsApp, telefone, e-mail, CRECI ou imóveis relacionados.

Ainda não implementar Viva Real, ZAP, OLX nem painel administrativo completo.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e use apenas a publishable key no frontend. Nunca versionar `service_role` ou secret keys.

## Próximo passo

Adicionar o código atual do site neste repositório para refatorar a camada de mocks para Supabase com fallback seguro de desenvolvimento, sem alterar a UI aprovada.
