# Fluxo manual de pagamentos online

Este roteiro cobre apenas o recebimento online opcional dentro do produto. O modelo comercial do Hubly continua sendo assinatura mensal fixa para negócios locais.

## 1. Configurar ambiente

1. Configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_RETURN_URL` e `STRIPE_CONNECT_REFRESH_URL`.
2. Suba backend e frontend locais.
3. Entre no painel como administrador da organização.

## 2. Validar conta da organização

1. Acesse `Configurações`.
2. Inicie a verificação de identidade.
3. Ao retornar para o Hubly, clique em `Atualizar status`.
4. Confirme que a conta aparece como verificada.

## 3. Preparar perfil público

1. Cadastre profissional ativo.
2. Cadastre serviço com preço.
3. Cadastre disponibilidade.
4. Publique o perfil público da empresa.

## 4. Criar agendamento público

1. Acesse `/clientes`.
2. Abra o perfil da organização.
3. Escolha profissional, serviço e horário.
4. Selecione pagamento online.
5. Confirme o agendamento.

Resultado esperado:

- agendamento criado como `payment_pending`;
- tela de pagamento aberta;
- valor do serviço exibido sem retenção percentual do Hubly.

## 5. Confirmar pagamento

1. Use um cartão de teste da Stripe.
2. Confirme o pagamento.
3. Aguarde o webhook atualizar o backend.

Resultado esperado:

- pagamento aprovado;
- agendamento confirmado;
- histórico financeiro mostrando valor do serviço e valor do negócio.

## Checklist

- [ ] Conta da organização verificada.
- [ ] Perfil público publicado.
- [ ] Agendamento online criado.
- [ ] Pagamento aprovado.
- [ ] Agendamento confirmado por webhook.
- [ ] Histórico financeiro sem cobrança percentual do Hubly por agendamento.
