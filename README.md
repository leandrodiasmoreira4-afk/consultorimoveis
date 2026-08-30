# Consultor Imóveis

Base técnica do projeto do site de consultor de imóveis.

## Estado atual

- Supabase provisionado em São Paulo (`sa-east-1`)
- Projeto Supabase: `consultor-imoveis`
- RLS habilitado nas tabelas públicas
- Storage `property-media` criado e privado
- Seed controlado: `terreno-200m2-petrolina` em `draft`
- Conteúdos reais ainda pendentes permanecem nulos/ausentes
- Cliente público do Supabase preparado em `src/lib/supabase/client.ts`
- Tipos de domínio da fundação em `src/lib/supabase/types.ts`
- Camada de dados em `src/data/properties.ts`
- Fallback de desenvolvimento seguro e vazio em `src/data/mock-properties.ts`

## Regras deste projeto

A UI pública existente não deve ser redesenhada nesta etapa. A integração deve preservar os contratos da camada de dados (como `getProperties()`, `getPropertyBySlug()` e `filterProperties()` ou equivalentes) e esconder detalhes do Supabase da UI.

Não inventar fotografias, descrição oficial, endereço/coordenadas, WhatsApp, telefone, e-mail, CRECI ou imóveis relacionados.

Ainda não implementar Viva Real, ZAP, OLX nem painel administrativo completo.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e use apenas a publishable key no frontend. Nunca versionar `service_role` ou secret keys.

A aplicação deverá ter `@supabase/supabase-js` instalada quando o código atual do frontend for importado para este repositório.

## Camada de dados

`getProperties()` consulta somente imóveis publicados. `getPropertyBySlug()` também restringe a leitura a `published`. `filterProperties()` mantém os filtros fora dos componentes de UI.

Em desenvolvimento, se as variáveis de ambiente não existirem ou a consulta falhar, o fallback retorna uma lista vazia. Nenhum dado de imóvel é inventado.

## Próximo passo

Trazer o código atual do frontend para este repositório e adaptar os imports existentes para esta camada sem alterar HOME, `/imoveis` ou `/imoveis/[slug]`.
