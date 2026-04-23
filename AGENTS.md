# SaaS de Agendamento para Clínicas

## Contexto do projeto

Este projeto é um SaaS de agendamento para clínicas em geral, incluindo:

- clínicas médicas;
- consultórios odontológicos;
- clínicas de estética;
- psicologia e terapias;
- outros serviços com agenda.

O objetivo principal é:

- organizar agendas;
- reduzir no-show;
- facilitar confirmação, cancelamento e reagendamento;
- melhorar a operação da recepção;
- permitir evolução futura com módulos adicionais.

## Stack obrigatória

- Backend: Node.js + TypeScript.
- Frontend: React + Next.js + TypeScript.
- ORM: TypeORM.
- Banco de dados: MySQL.
- Testes: unitários, integração e end-to-end, todos em TypeScript.

## Regra inegociável

Todo o projeto deve ser feito em **TypeScript**.

Não usar:

- `.js`;
- `.jsx`;
- código sem tipagem quando houver alternativa em TypeScript.

## Integrações permitidas nesta fase

Somente estas integrações estão no escopo:

- WhatsApp;
- E-mail;
- Google Calendar.

Não propor outras integrações nesta fase.

## Objetivo do MVP

O MVP deve conter:

- autenticação;
- cadastro de clínicas, profissionais e pacientes;
- agenda diária e semanal;
- criação, cancelamento e reagendamento;
- status de consulta;
- confirmação e lembretes;
- registro de comparecimento e falta;
- indicadores básicos de no-show;
- integração básica com Google Calendar;
- notificações por WhatsApp e e-mail.

## Segurança obrigatória

A segurança deve ser considerada desde o início.

### Autenticação e autorização

- access token e refresh token separados;
- tokens diferentes por tipo de usuário;
- perfis: administrador, recepção e profissional;
- RBAC;
- validação de tenant em todas as operações.

### Proteção contra abuso

- rate limit em login;
- rate limit em recuperação de senha;
- rate limit em rotas críticas;
- proteção contra brute force.

### Proteção contra SQL Injection

- usar TypeORM como acesso principal ao banco;
- nunca concatenar SQL manualmente;
- validar entrada antes da persistência;
- não expor detalhes internos de banco em erros.

### Proteção contra race condition

- usar transações em ações críticas;
- impedir dupla marcação de horários;
- tratar concorrência em reagendamento e cancelamento;
- garantir consistência da agenda.

### Auditoria

- registrar ações sensíveis;
- logar criação, edição e cancelamento de agendamentos;
- registrar falhas de login e autorização.

## Requisitos de arquitetura

- Seguir arquitetura modular por domínio.
- Separar regras de negócio, camada HTTP, acesso a dados e integrações.
- Não acoplar lógica de negócio diretamente ao TypeORM.
- Não colocar regra importante dentro de componente React.
- Criar código simples, legível e testável.
- Manter tipos próximos ao domínio.
- Preferir clareza a overengineering.

## Domínios principais

- autenticação e autorização;
- clínicas e unidades;
- profissionais e especialidades;
- pacientes;
- agenda e agendamentos;
- notificações;
- integrações;
- relatórios;
- auditoria.

## O que a IA deve fazer

- gerar código em TypeScript;
- manter tipagem forte;
- criar funções pequenas e testáveis;
- validar entradas;
- tratar erros de forma consistente;
- escrever testes para regras críticas;
- respeitar o escopo do projeto;
- manter a segurança como prioridade.

## O que a IA não deve fazer

- não gerar JavaScript puro;
- não usar `any` sem necessidade real;
- não propor integrações fora do escopo;
- não ignorar RBAC;
- não ignorar tenant isolation;
- não ignorar concorrência de agenda;
- não criar arquitetura desnecessariamente complexa;
- não misturar regra de negócio com controller ou componente;
- não assumir funcionalidades clínicas avançadas no MVP;
- não adicionar SMS, pagamentos, ERP, CRM ou prontuário externo neste momento.

## Regras de banco

- usar MySQL como banco principal;
- modelar pensando em TypeORM + MySQL;
- criar índices nas consultas críticas;
- evitar recursos específicos de PostgreSQL.

## Qualidade esperada

- testes unitários para regras de negócio;
- testes de integração para fluxos principais;
- testes de segurança para login, autorização, rate limit e concorrência;
- lint e formatter;
- documentação mínima e clara.

## Evoluções futuras permitidas

- portal do paciente;
- check-in digital;
- lista de espera automática;
- dashboards avançados;
- previsões com IA;
- melhorias em WhatsApp, e-mail e Google Calendar.

## Evoluções fora do escopo atual

- SMS;
- gateways de pagamento;
- ERPs;
- CRMs;
- prontuários externos;
- automações fora de WhatsApp, e-mail e Google Calendar.
