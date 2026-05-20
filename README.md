# Hubly

Hubly e uma plataforma SaaS de agendamento, gestao e presenca digital para negocios locais. O projeto foi pensado para organizar agendas, melhorar a descoberta local, publicar perfis comerciais e facilitar confirmacao, cancelamento e reagendamento.

O foco inicial e atender barbearias, clinicas, saloes, estetica, studios, psicologia, terapias e profissionais de servicos que dependem de agenda recorrente, atendimento com hora marcada e comunicacao constante com clientes.

## Intuito do projeto

O objetivo do Hubly e resolver problemas comuns da rotina de um negocio local:

- agendas descentralizadas em planilhas, papel ou mensagens;
- dificuldade para confirmar agendamentos;
- excesso de faltas sem aviso;
- conflito de horarios entre profissionais, espacos e unidades;
- falta de visibilidade para a equipe;
- pouca clareza sobre indicadores basicos de no-show;
- processos manuais para lembretes, reagendamentos e registros de comparecimento.
- presenca digital limitada ou dependente apenas de redes sociais;
- dificuldade para clientes encontrarem servicos na regiao e agendarem direto.

O produto busca entregar uma base simples, segura e evolutiva para gestao de agendamentos e crescimento local, mantendo a operacao diaria do negocio como prioridade.

## Funcionalidades do MVP

O MVP cobre os fluxos essenciais para um negocio local operar a agenda e sua presenca publica:

- autenticacao de usuarios;
- perfis de administrador, recepcao e profissional;
- cadastro de organizacoes, unidades, profissionais e clientes;
- visualizacao de agenda diaria e semanal;
- criacao, cancelamento e reagendamento;
- controle de status do agendamento;
- confirmacao de agendamento;
- lembretes por WhatsApp e e-mail;
- registro de comparecimento e falta;
- indicadores basicos de no-show;
- integracao basica com Google Calendar;
- perfil publico da empresa com fotos, servicos, avaliacoes e botao de agendamento;
- descoberta/localizacao para clientes encontrarem servicos da regiao;
- gestao basica de clientes, historico, servicos, horarios e metricas simples;
- auditoria de acoes sensiveis.

## Publico-alvo

O Hubly e voltado para negocios locais que precisam de controle operacional de agenda e presenca digital:

- barbearias;
- saloes;
- estetica;
- studios;
- clinicas de pequeno e medio porte;
- consultorios com multiplos profissionais;
- negocios com atendimento centralizado;
- profissionais que atendem em mais de uma unidade;
- operacoes que sofrem com faltas, atrasos e reagendamentos manuais;
- profissionais de servicos que querem ser encontrados e agendados online.

## Diferenciais

Os principais diferenciais planejados para o produto sao:

- foco em reducao de no-show desde o inicio;
- agenda pensada para equipe, profissional e administrador;
- perfil publico da empresa para fortalecer presenca digital;
- descoberta/localizacao para clientes encontrarem servicos da regiao;
- tenant isolation para separar dados de cada organizacao;
- RBAC para controlar o que cada perfil pode acessar;
- arquitetura modular por dominio;
- base preparada para auditoria e rastreabilidade;
- integracoes objetivas com WhatsApp, e-mail e Google Calendar;
- modelo tecnico em TypeScript ponta a ponta;
- preocupacao com concorrencia para evitar dupla marcacao de horarios;
- indicadores simples para apoiar decisoes operacionais.

## Modelo de monetizacao

O modelo comercial do Hubly e assinatura SaaS recorrente, sem comissao por agendamento.

O Hubly nao deve operar como marketplace com cobranca percentual. Remover do posicionamento e da regra de negocio:

- comissao por agendamento;
- split de pagamento;
- retencao percentual sobre vendas;
- taxa por atendimento.

Modelo principal:

- **Plano Principal**: R$69,90/mes;
- assinatura mensal fixa;
- teste gratis, primeiro mes gratuito ou primeiro mes com desconto;
- onboarding simples para configurar perfil publico, servicos e agenda.

Possiveis criterios para planos futuros ou personalizados:

- quantidade de profissionais ativos;
- quantidade de unidades;
- volume de lembretes enviados;
- recursos administrativos e de auditoria;
- nivel de suporte contratado.

O MVP deve validar valor por economia operacional, crescimento local e recorrencia: menos faltas, menos retrabalho da equipe, mais previsibilidade na agenda e melhor presenca digital. A implementacao de gateway de pagamento nao faz parte do escopo funcional inicial do produto.

## Stack tecnica

O projeto segue uma stack TypeScript ponta a ponta:

- Backend: Node.js + TypeScript;
- Frontend: React + Next.js + TypeScript;
- ORM: TypeORM;
- Banco principal: MySQL;
- Testes: TypeScript;
- Frontend UI: Tailwind CSS;
- Estado e dados no frontend: Zustand e React Query.

## Arquitetura

A arquitetura segue divisao modular por dominio, separando regras de negocio, camada HTTP, acesso a dados e integracoes.

Dominios principais:

- autenticacao e autorizacao;
- organizacoes, negocios locais e unidades;
- profissionais e especialidades;
- clientes;
- agenda e agendamentos;
- notificacoes;
- integracoes;
- relatorios;
- auditoria.

Principios aplicados:

- regra de negocio fora de controllers e componentes React;
- TypeORM usado como mecanismo de persistencia, sem acoplar o dominio ao banco;
- validacao de entrada antes da persistencia;
- transacoes em acoes criticas da agenda;
- indices em consultas criticas;
- erros tratados sem expor detalhes internos do banco.

## Seguranca

Seguranca e requisito de base do projeto.

O Hubly deve considerar:

- access token e refresh token separados;
- tokens diferentes por tipo de usuario quando necessario;
- RBAC por perfil;
- validacao de tenant em todas as operacoes;
- rate limit em login, recuperacao de senha e rotas criticas;
- protecao contra brute force;
- uso de TypeORM para evitar SQL manual inseguro;
- transacoes para criacao, cancelamento e reagendamento;
- protecao contra dupla marcacao de horario;
- auditoria de login, autorizacao e acoes sensiveis.

## Estrutura do repositorio

```text
.
├── backend/   # API Node.js + TypeScript + TypeORM
├── frontend/  # Aplicacao Next.js + React + TypeScript
├── deploy/    # Arquivos de deploy
├── infra/     # Infraestrutura de apoio
├── core/      # Artefatos compartilhados ou base do projeto
└── VERSION    # Versao atual do projeto
```

## Como rodar localmente

Consulte os READMEs especificos de cada aplicacao:

- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)

Fluxo geral:

1. Configure as variaveis de ambiente do backend e do frontend.
2. Suba o banco MySQL e servicos auxiliares necessarios.
3. Rode as migrations e seeds do backend.
4. Inicie a API.
5. Inicie o frontend.

## Qualidade esperada

O projeto deve manter:

- codigo em TypeScript;
- tipagem forte;
- funcoes pequenas e testaveis;
- testes unitarios para regras criticas;
- testes de integracao para fluxos principais;
- testes e2e para jornadas relevantes;
- lint e formatacao;
- documentacao minima clara;
- seguranca e isolamento de dados como criterios de aceite.

## Escopo atual

Integracoes permitidas nesta fase:

- WhatsApp;
- e-mail;
- Google Calendar.

Fora do escopo atual:

- SMS;
- gateways de pagamento como requisito do MVP;
- ERPs;
- CRMs;
- prontuarios externos;
- automacoes fora de WhatsApp, e-mail e Google Calendar.

## Visao de evolucao

Apos validacao do MVP, o produto pode evoluir com:

- portal do paciente;
- check-in digital;
- lista de espera automatica;
- dashboards avancados;
- previsoes com IA;
- melhorias nas integracoes de WhatsApp, e-mail e Google Calendar.
