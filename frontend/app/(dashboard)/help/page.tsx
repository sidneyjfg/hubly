import { CalendarClock, CheckCircle2, FileText, HelpCircle, Images, MessageSquare, Store, Ticket, UserRoundCog } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HUBLY_SUPPORT_URL } from "@/lib/support";

const helpSections = [
  {
    id: "booking",
    icon: CalendarClock,
    title: "Por que meu cliente nao consegue agendar?",
    description: "O agendamento publico depende de vitrine publicada, automacoes de agendamento, profissional ativo, servico ativo com preco e horario disponivel para o profissional escolhido.",
    items: [
      "Abra Vitrine e confira se o checklist esta completo.",
      "Confirme se Publicado esta ativo e se a vitrine foi salva.",
      "Em Automacoes, ative notificacoes de criacao, confirmacao, reagendamento e cancelamento.",
      "Em Profissionais, confira se o profissional esta ativo.",
      "Clique em Horarios e confirme se existe ao menos um dia ativo com expediente valido.",
      "Veja se o servico esta ativo, tem preco maior que zero e pertence ao profissional certo.",
      "Teste em /clientes escolhendo empresa, profissional, servico, data e horario."
    ]
  },
  {
    id: "storefront",
    icon: Store,
    title: "Minha empresa nao aparece na galeria publica",
    description: "A galeria /clientes lista apenas vitrines publicadas e prontas para receber agendamentos.",
    items: [
      "Preencha nome publico, descricao, telefone ou e-mail.",
      "Informe rua, cidade e UF.",
      "Adicione uma foto de capa.",
      "Ative as automacoes de agendamento em Automacoes.",
      "Ative Publicado e clique em Salvar vitrine.",
      "Regularize servicos ativos se o plano estiver acima do limite."
    ]
  },
  {
    id: "providers",
    icon: UserRoundCog,
    title: "Profissional, servico ou horario nao aparece",
    description: "Somente profissionais prontos entram no fluxo do cliente final.",
    items: [
      "Cadastre o profissional com nome completo e especialidade.",
      "Mantenha o profissional como Ativo.",
      "Crie um servico para esse profissional com duracao e preco maior que zero.",
      "Mantenha o servico como Ativo.",
      "Configure Horarios com dias ativos e expediente em HH:MM.",
      "Se usar almoco, preencha inicio e fim; se nao usar, deixe ambos vazios."
    ]
  },
  {
    id: "confirm",
    icon: CheckCircle2,
    title: "O cliente preencheu tudo e nao confirma",
    description: "O botao Confirmar agendamento so libera quando todos os dados obrigatorios estao validos.",
    items: [
      "Escolha profissional, servico, data e horario disponivel.",
      "Informe nome completo.",
      "Informe e-mail valido.",
      "Informe WhatsApp brasileiro valido.",
      "Se o cliente nao estiver conectado, a senha precisa ter pelo menos 8 caracteres."
    ]
  }
];

const setupSteps = [
  "Complete a Vitrine com perfil, contato, endereco e foto de capa.",
  "Crie um profissional ativo em Profissionais.",
  "Abra Horarios do profissional e salve dias ativos com expediente valido.",
  "Crie um servico ativo para esse profissional, com duracao e preco.",
  "Ative as automacoes de agendamento para criacao, confirmacao, reagendamento e cancelamento.",
  "Volte em Vitrine, ative Publicado e clique em Salvar vitrine.",
  "Acesse /clientes, encontre a empresa e faca um agendamento de teste."
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Ajuda</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Agendamentos e vitrine publica</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Use este guia quando a empresa nao aparece em /clientes, quando o cliente nao encontra horarios ou quando o primeiro agendamento nao confirma.
          </p>
        </div>
        <ButtonLink href={HUBLY_SUPPORT_URL} variant="secondary">
          <Ticket className="mr-2 h-4 w-4" />
          Abrir chamado
        </ButtonLink>
      </div>

      <Card className="border-sky-300/20 bg-sky-400/10">
        <div className="flex gap-3">
          <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-sky-200" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-100">Diagnostico rapido</p>
            <h2 className="mt-2 text-xl font-semibold text-white">O cliente so agenda quando estes pontos existem juntos</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-5">
              {["Vitrine publicada", "Automacoes ativas", "Profissional ativo", "Servico ativo com preco", "Horario disponivel"].map((item) => (
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm font-medium text-white" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {helpSections.map((section) => {
          const Icon = section.icon;

          return (
            <Card className="scroll-mt-24" id={section.id} key={section.id}>
              <div className="mb-4 flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{section.description}</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm leading-6 text-slate-300">
                {section.items.map((item) => (
                  <li className="flex gap-2" key={item}>
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <Card id="first-booking" className="scroll-mt-24">
        <div className="mb-4 flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Caminho correto para testar do zero</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Siga esta ordem para evitar configuracao pela metade.</p>
          </div>
        </div>
        <ol className="grid gap-3 md:grid-cols-2">
          {setupSteps.map((step, index) => (
            <li className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300" key={step}>
              <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-sky-400/15 text-sm font-semibold text-sky-100">{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <Images className="mt-1 h-5 w-5 shrink-0 text-sky-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Ainda ficou com duvida?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">Abra um chamado informando organizacao, link da vitrine, profissional, servico, data testada e print do erro.</p>
            </div>
          </div>
          <ButtonLink href={HUBLY_SUPPORT_URL} variant="secondary">
            <FileText className="mr-2 h-4 w-4" />
            Ir para suporte
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
