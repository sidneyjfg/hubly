# Backend

Estrutura inicial do backend em TypeScript para o projeto Clinity.

## Diretrizes aplicadas

- organização clássica com `controllers`, `services`, `repositories`, `routes`, `utils` e `middlewares`;
- persistência real com TypeORM;
- MySQL como banco principal e `sql.js` em memória para testes de integração;
- rotas separadas por nome em `src/routes`;
- registro central das rotas em `src/routes/index.ts`;
- tipagem compartilhada em `src/types`;
- testes separados em `tests/unit` e `tests/integration`;
- base pronta para autenticação, tenant isolation, RBAC, auditoria e integrações do MVP.

## Árvore principal

```text
backend/
  src/
    controllers/
    database/
    middlewares/
    repositories/
    routes/
    services/
    types/
    utils/
  tests/
    e2e/
    unit/
    integration/
```

## Scripts

- `npm run db:migrate`: executa as migrations do banco principal configurado.
- `npm run db:seed`: popula o banco configurado com dados iniciais do MVP.
- `npm run docs:export`: gera os artefatos versionados de `openapi` e Postman.
- `npm run test:e2e`: executa os testes end-to-end em TypeScript.
- `npm run test:unit`: executa testes unitários.
- `npm run test:integration`: executa testes de integração com `sql.js` em memória.
- `npm run test`: executa toda a suíte usando banco em memória nos testes que precisam de persistência.

## Versionamento e build automatizado

O repositório agora usa workflows em `.github/workflows` para:

- validar backend, frontend e build Docker do backend em cada `push` e `pull_request`;
- gerar nova versão semântica por execução manual do workflow de release;
- criar tag e release no GitHub;
- publicar a imagem do backend no GHCR;
- disponibilizar um compose de stack para subir `redis + evolution + backend`.

Arquivos principais:

- [VERSION](/home/sidney/automacoes/saas/clinity/VERSION)
- [.github/workflows/ci.yml](/home/sidney/automacoes/saas/clinity/.github/workflows/ci.yml)
- [.github/workflows/release.yml](/home/sidney/automacoes/saas/clinity/.github/workflows/release.yml)
- [deploy/docker-compose.stack.yml](/home/sidney/automacoes/saas/clinity/deploy/docker-compose.stack.yml)

## Documentação Swagger e Postman

Com a API rodando localmente:

- Swagger UI: `http://localhost:3333/docs`
- OpenAPI JSON: `http://localhost:3333/docs/json`
- Collection Postman: `http://localhost:3333/docs/postman/collection.json`
- Environment Postman: `http://localhost:3333/docs/postman/environment.json`

Arquivos exportados no repositório:

- [openapi/openapi.json](/home/sidney/automacoes/saas/clinity/backend/openapi/openapi.json)
- [postman/clinity-local.collection.json](/home/sidney/automacoes/saas/clinity/backend/postman/clinity-local.collection.json)
- [postman/clinity-local.environment.json](/home/sidney/automacoes/saas/clinity/backend/postman/clinity-local.environment.json)

A collection já inclui script de teste nas rotas `Sign In` e `Refresh` para atualizar automaticamente `accessToken`, `refreshToken` e `clinicId` nas variáveis usadas pelas demais rotas.

## Integrações no escopo atual

Recorte atual do backend:

- WhatsApp: integração básica validada via Evolution API.
- E-mail: ainda não iniciado.
- Google Calendar: ainda não iniciado.

Observação prática sobre autenticação da Evolution:

- o backend agora suporta header de autenticação opcional e configurável;
- se sua Evolution não exigir header, deixe `WHATSAPP_EVOLUTION_AUTH_HEADER_VALUE` vazio;
- se exigir, configure `WHATSAPP_EVOLUTION_AUTH_HEADER_NAME` e `WHATSAPP_EVOLUTION_AUTH_HEADER_VALUE`.

Endpoints já expostos para a integração de WhatsApp:

- `GET /v1/integrations`
- `GET /v1/integrations/whatsapp/status`
- `GET /v1/integrations/whatsapp/connect`
- `POST /v1/integrations/whatsapp/session`
- `POST /v1/integrations/whatsapp/session/regenerate-code`
- `POST /v1/integrations/whatsapp/messages/send`

Comportamento atual da integração:

- a instância WhatsApp é resolvida por clínica autenticada, não por uma instância global fixa;
- se a clínica ainda não tiver integração persistida, o backend cria automaticamente a instância `clinic-{clinicId}` na Evolution API;
- a criação automática da instância gera auditoria com a ação `integration.whatsapp.instance_created`;
- o frontend pode iniciar o onboarding informando apenas o número do celular via `POST /v1/integrations/whatsapp/session`;
- se o código de conexão precisar ser renovado, o backend já expõe `POST /v1/integrations/whatsapp/session/regenerate-code`;
- o status atual da conexão continua disponível em `GET /v1/integrations/whatsapp/status`;
- o envio manual de mensagem por `POST /v1/integrations/whatsapp/messages/send` já foi validado ponta a ponta com a Evolution.

Observação importante sobre versão da Evolution:

- durante os testes locais, o fluxo de pareamento por código apresentou diferença de comportamento entre versões;
- se `GET /instance/connect/{instance}` retornar apenas `{"count":0}`, revise a versão da Evolution em uso antes de assumir erro no backend;
- a validação manual bem-sucedida neste ambiente ocorreu após ajuste de versão da Evolution, com criação da instância, conexão e envio de mensagem funcionando.

Referência oficial usada para iniciar a integração:

- `GET /instance/connectionState/{instance}` em `doc.evolution-api.com`
- `GET /instance/connect/{instance}` em `doc.evolution-api.com`
- `POST /message/sendText/{instance}` em `doc.evolution-api.com`

## Variáveis de ambiente

O backend agora lê automaticamente o arquivo `.env`.

Arquivo de exemplo:

- [backend/.env.example](/home/sidney/automacoes/saas/clinity/backend/.env.example)

Variáveis necessárias:

- `HTTP_HOST`: host onde a API sobe localmente.
- `HTTP_PORT`: porta da API e base para Swagger/Postman.
- `DB_TYPE`: `mysql` para desenvolvimento local. `sqljs` deve ficar restrito a testes.
- `DB_HOST`: host do MySQL.
- `DB_PORT`: porta do MySQL.
- `DB_NAME`: nome do banco da aplicação.
- `DB_USERNAME`: usuário do banco.
- `DB_PASSWORD`: senha do banco.
- `DB_LOGGING`: `true` ou `false` para logs SQL do TypeORM.
- `JWT_ACCESS_SECRET`: segredo do access token.
- `JWT_REFRESH_SECRET`: segredo do refresh token.
- `JWT_ACCESS_EXPIRES_IN`: duração do access token, por exemplo `15m`.
- `JWT_REFRESH_EXPIRES_IN`: duração do refresh token, por exemplo `7d`.
- `LOGIN_RATE_LIMIT_WINDOW_MS`: janela do rate limit de login em milissegundos.
- `LOGIN_RATE_LIMIT_MAX_ATTEMPTS`: máximo de tentativas de login por janela.
- `LOGIN_BRUTE_FORCE_THRESHOLD`: quantidade de falhas antes de bloquear login por brute force.
- `LOGIN_BRUTE_FORCE_BLOCK_MS`: tempo de bloqueio por brute force em milissegundos.
- `PASSWORD_RECOVERY_RATE_LIMIT_WINDOW_MS`: janela do rate limit de recuperação de senha.
- `PASSWORD_RECOVERY_RATE_LIMIT_MAX_ATTEMPTS`: máximo de tentativas de recuperação por janela.
- `CRITICAL_ROUTE_RATE_LIMIT_WINDOW_MS`: janela do rate limit de rotas críticas.
- `CRITICAL_ROUTE_RATE_LIMIT_MAX_ATTEMPTS`: máximo de chamadas em rotas críticas por janela.
- `REDIS_ENABLED`: habilita Redis compartilhado para proteção e futuros fluxos assíncronos.
- `REDIS_URL`: URL de conexão com Redis.
- `REDIS_KEY_PREFIX`: prefixo das chaves Redis da aplicação.
- `REDIS_CONNECT_TIMEOUT_MS`: timeout de conexão com Redis.
- `WHATSAPP_EVOLUTION_ENABLED`: habilita a integração com Evolution API.
- `WHATSAPP_EVOLUTION_BASE_URL`: URL base da Evolution API.
- `WHATSAPP_EVOLUTION_AUTH_HEADER_NAME`: nome do header de autenticação da Evolution API.
- `WHATSAPP_EVOLUTION_AUTH_HEADER_VALUE`: valor do header de autenticação da Evolution API. Pode ficar vazio se a instância não exigir autenticação.
- `WHATSAPP_EVOLUTION_TIMEOUT_MS`: timeout HTTP da integração com Evolution API.

## Passo a passo local

1. Entre em [backend](/home/sidney/automacoes/saas/clinity/backend).
2. Crie o arquivo `.env` a partir de [backend/.env.example](/home/sidney/automacoes/saas/clinity/backend/.env.example).
3. Ajuste no `.env` os dados do seu MySQL local e troque os segredos JWT.
4. Instale as dependências com `npm install`, se ainda não tiver feito isso.
5. Execute `npm run db:migrate` para criar a estrutura do banco.
6. Execute `npm run db:seed` para carregar os dados iniciais de teste.
7. Suba a API com `npm run dev`.
8. Abra `http://localhost:3333/docs` para usar o Swagger UI.
9. Se quiser usar Postman, importe:
   `http://localhost:3333/docs/postman/collection.json`
   `http://localhost:3333/docs/postman/environment.json`
10. No Postman, selecione o environment `Clinity Local`, rode `Sign In` e depois teste as demais rotas.

## Fluxo validado da Evolution API

Fluxo manual validado neste ambiente:

1. Criar a instância na Evolution:

```bash
curl -X POST "http://localhost:8080/instance/create" \
  -H 'Content-Type: application/json' \
  -H 'apikey: mude-me' \
  -d '{
    "instanceName": "clinic-cln_main_001",
    "integration": "WHATSAPP-BAILEYS",
    "qrcode": false,
    "rejectCall": false,
    "groupsIgnore": false,
    "alwaysOnline": false,
    "readMessages": false,
    "readStatus": false,
    "syncFullHistory": false
  }'
```

2. Conectar a instância na Evolution e confirmar que o estado ficou utilizável.
3. Validar o estado direto na Evolution:

```bash
curl "http://localhost:8080/instance/connectionState/clinic-cln_main_001" \
  -H 'apikey: mude-me'
```

4. Enviar mensagem direto pela Evolution:

```bash
curl -X POST "http://localhost:8080/message/sendText/clinic-cln_main_001" \
  -H 'Content-Type: application/json' \
  -H 'apikey: mude-me' \
  -d '{
    "number": "5531995734976",
    "text": "Teste de envio pela Evolution"
  }'
```

5. Validar o mesmo envio pelo backend do Clinity:

```bash
curl -X POST "http://localhost:3333/v1/integrations/whatsapp/messages/send" \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'x-clinic-id: cln_main_001' \
  -H 'Content-Type: application/json' \
  -d '{
    "number": "5531995734976",
    "text": "Teste de envio pelo Clinity"
  }'
```

Resultado validado:

- envio direto pela Evolution retornando `fromMe: true` e `status: PENDING`;
- envio pelo backend do Clinity retornando o mesmo padrão com sucesso;
- integração ponta a ponta validada para criação/conexão de instância, consulta de status e envio manual de texto.

Fluxo recomendado para o frontend:

1. autenticar no backend;
2. chamar `POST /v1/integrations/whatsapp/session` com o número do celular da clínica;
3. exibir para o usuário o `pairingCode` ou `code` retornado;
4. consultar `GET /v1/integrations/whatsapp/status` até a instância ficar conectada;
5. se o código não funcionar ou expirar, chamar `POST /v1/integrations/whatsapp/session/regenerate-code`;
6. com a instância conectada, usar `POST /v1/integrations/whatsapp/messages/send`.

## Fluxo de teste no Postman

Credenciais seed locais:

- `admin@clinic.test`
- `password123`

Após executar `Sign In`, a collection preenche automaticamente:

- `accessToken`
- `refreshToken`
- `clinicId`

Com isso, as rotas protegidas passam a enviar:

- `Authorization: Bearer {{accessToken}}`
- `x-clinic-id: {{clinicId}}`

## Como testar

Todos os testes estão isolados do MySQL principal.

- Testes unitários: usam mocks ou stubs, sem tocar em banco real.
- Testes de integração: usam `sql.js` em memória via TypeORM.
- Testes end-to-end: executam o fluxo completo da API em TypeScript, também com `sql.js` em memória e integrações externas simuladas.
- Ambiente de teste: é forçado em [tests/setup/test-env.ts](/home/sidney/automacoes/clinity/backend/tests/setup/test-env.ts), então o `Vitest` não usa o banco configurado para desenvolvimento.

Fluxo recomendado:

```bash
cd backend
npm run check
npm run test
npm run test:e2e
```

Para rodar por categoria:

```bash
cd backend
npm run test:unit
npm run test:integration
```

Para preparar o banco principal local quando quiser subir a aplicação fora dos testes:

```bash
cd backend
npm run db:migrate
npm run db:seed
npm run dev
```

## Status Atual

### Concluído até agora

- [x] Backend em TypeScript iniciado com `Fastify` + `TypeORM` + `MySQL`.
- [x] Estrutura modular básica com `controllers`, `services`, `repositories`, `routes`, `middlewares`, `utils` e `types`.
- [x] Registro central de rotas em [src/routes/index.ts](/home/sidney/automacoes/saas/clinity/backend/src/routes/index.ts).
- [x] `DataSource` configurável para MySQL no ambiente principal.
- [x] Banco de testes com `sql.js` em memória para integração.
- [x] Entidades iniciais para clínicas, usuários, profissionais, pacientes, agendamentos, auditoria e sessões de autenticação.
- [x] Migration inicial com tabelas, relacionamentos e índices principais.
- [x] Seed inicial com múltiplas clínicas, usuários, pacientes, profissionais, agendamentos e eventos de auditoria.
- [x] Correção do seed para funcionar em MySQL sem erro de `TRUNCATE` com foreign keys.
- [x] Autenticação com `accessToken` e `refreshToken` separados.
- [x] Validação básica de login e refresh com `zod`.
- [x] Hash de senha e hash do refresh token persistido em sessão.
- [x] Controle de sessão com rotação de refresh token.
- [x] RBAC básico com perfis `administrator`, `reception` e `professional`.
- [x] Middleware global de autenticação para rotas protegidas.
- [x] Middleware básico de tenant isolation via `clinicId` e header `x-clinic-id`.
- [x] Tratamento centralizado de erros com resposta padronizada.
- [x] Rotas `GET` iniciais para health, clinics, professionals, patients, appointments, notifications, integrations, reports e audit.
- [x] Swagger UI local em `/docs`.
- [x] OpenAPI JSON em `/docs/json`.
- [x] Collection Postman para teste local gerada automaticamente.
- [x] Environment Postman pronto para uso local.
- [x] Script na collection para preencher `accessToken`, `refreshToken` e `clinicId` após `Sign In` e `Refresh`.
- [x] Export versionado dos artefatos OpenAPI e Postman.
- [x] Leitura automática de `.env`.
- [x] Arquivo [backend/.env.example](/home/sidney/automacoes/saas/clinity/backend/.env.example) com todas as variáveis atuais.
- [x] Testes unitários e de integração cobrindo partes principais do fluxo atual.
- [x] Cadastro de clínicas com listagem por tenant, criação e edição via API.
- [x] Cadastro de profissionais com listagem por tenant, criação, edição e inativação via API.
- [x] Cadastro de pacientes com listagem por tenant, criação e edição via API.
- [x] Criação, cancelamento e reagendamento de agendamentos via API.
- [x] Marcação dedicada de comparecimento e falta via API.
- [x] Agenda diária e semanal por endpoint dedicado.
- [x] Indicadores básicos de no-show calculados a partir dos status dos agendamentos.
- [x] Regras básicas de concorrência para impedir conflito de horários do profissional.
- [x] Uso explícito de transações `SERIALIZABLE` nas ações críticas de agenda.
- [x] Filtro por tenant aplicado nas queries dos principais domínios de leitura e escrita.
- [x] Auditoria automática das operações principais de agendamento.
- [x] Rate limit em login.
- [x] Rate limit em recuperação de senha.
- [x] Rate limit em rotas críticas.
- [x] Proteção explícita contra brute force.
- [x] Integração básica de WhatsApp via Evolution API validada ponta a ponta.
- [x] Redis integrado ao backend para substituir controle local de proteção quando habilitado.

### Pendente no MVP

- [x] Cadastro completo de clínicas com criação/edição via API.
- [x] Cadastro completo de profissionais com criação/edição/inativação.
- [x] Cadastro completo de pacientes com criação/edição.
- [x] Criação de agendamentos.
- [x] Cancelamento de agendamentos.
- [x] Reagendamento de agendamentos.
- [x] Regras de concorrência para impedir dupla marcação de horários.
- [x] Uso explícito de transações nas ações críticas de agenda.
- [x] Status de consulta atualizados por fluxo de negócio real.
- [x] Registro de comparecimento e falta por operação dedicada.
- [x] Indicadores básicos de no-show calculados por regra de negócio real.
- [x] Agenda diária.
- [x] Agenda semanal.
- [x] Autorização por tenant aplicada também nas queries de leitura e escrita do domínio, não só no middleware.
- [x] Auditoria automática de ações sensíveis de autenticação e agendamento.
- [x] Rate limit em login.
- [x] Rate limit em recuperação de senha.
- [x] Rate limit em rotas críticas.
- [x] Proteção explícita contra brute force.
- [x] Endpoints de escrita documentados no Swagger.
- [x] Testes de segurança para login, autorização, rate limit e brute force.
- [x] Cobertura de integração para fluxos principais de agenda.
- [x] Testes adicionais de concorrência em nível de integração para cenários simultâneos.
- [x] Testes end-to-end em TypeScript.
- [X] Recuperação de senha.
- [x] Envio manual real de mensagens por WhatsApp.
- [ ] Fluxo automático de envio de notificações por WhatsApp integrado aos eventos do domínio.
- [ ] Notificações reais por e-mail.
- [ ] Integração básica real com Google Calendar.
- [ ] Frontend em React + Next.js + TypeScript.
- [ ] Lint e formatter configurados no projeto.
- [ ] Documentação de setup do frontend e da stack completa.

### Fora do escopo atual, mas já considerado no contexto do projeto

- [ ] Portal do paciente.
- [ ] Check-in digital.
- [ ] Lista de espera automática.
- [ ] Dashboards avançados.
- [ ] Previsões com IA.
