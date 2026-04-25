# Hubly Frontend

Frontend em Next.js para o SaaS Hubly, conectado ao backend real em `/backend`.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zustand
- React Query

## Estrutura

- `app/`: landing page, login fake e área logada
- `components/`: componentes reutilizáveis e blocos de UI
- `lib/mock-data.ts`: dados visuais da landing page
- `lib/api-client.ts`: client HTTP com refresh de token e tenant header
- `lib/api.ts`: camada de acesso ao backend real
- `lib/backend-contract.ts`: contratos e rotas alinhados ao backend em `/backend`
- `store/app-store.ts`: sessão autenticada persistida localmente

## Scripts

- `npm install`
- `npm run dev`
- `npm run typecheck`
- `npm run build`

## Observação

O frontend foi preparado para trocar os mocks por chamadas reais ao backend sem alterar a UI principal. Os endpoints futuros já estão mapeados em `lib/backend-contract.ts`.

## Layer exibido na interface

A interface mostra o `layer` atual do build no cabeçalho e no rodapé.

Variáveis usadas no build:

- `NEXT_PUBLIC_APP_LAYER_LABEL`
- `NEXT_PUBLIC_APP_COMMIT_SHA`

Se essas variáveis não forem informadas, o frontend usa fallback local para desenvolvimento.

## Docker

O frontend possui `Dockerfile` próprio com build standalone do Next.js.

## Backend local

Configure `NEXT_PUBLIC_API_URL`, se necessário. Padrão:

- `http://localhost:3333`

Credenciais seed padrão do backend:

- `admin@clinic.test`
- `password123`
