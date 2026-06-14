import {
  BellRing,
  Bot,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  HelpCircle,
  Images,
  MessageSquare,
  Settings,
  Store,
  Ticket,
  UserRoundCog,
  UsersRound,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HUBLY_SUPPORT_URL } from "@/lib/support";

type HelpArticle = {
  title: string;
  description: string;
  steps: string[];
  href: string;
};

type HelpModule = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  articles: HelpArticle[];
};

const modules: HelpModule[] = [
  {
    id: "storefront",
    title: "Vitrine",
    description: "Perfil publico, fotos, endereco, publicacao e descoberta em /clientes.",
    icon: Store,
    href: "/storefront",
    articles: [
      {
        title: "Como publicar a vitrine",
        description: "Siga a ordem para liberar o estabelecimento para clientes finais.",
        href: "/storefront",
        steps: [
          "Preencha nome publico, link, descricao e contato.",
          "Informe rua, cidade e UF.",
          "Envie foto de capa e, se possivel, logo e galeria.",
          "Crie profissional ativo, servico com preco e horario disponivel.",
          "Ative automacoes de agendamento.",
          "Volte em Vitrine, ative Publicado e salve."
        ]
      },
      {
        title: "Por que a empresa nao aparece em /clientes",
        description: "A galeria publica mostra apenas vitrines prontas para receber agenda.",
        href: "/storefront",
        steps: [
          "Confira se o checklist da Vitrine esta completo.",
          "Verifique se a foto de capa existe.",
          "Confirme se as automacoes de agendamento estao ativas.",
          "Regularize servicos ativos caso o plano esteja acima do limite.",
          "Salve a vitrine novamente apos corrigir os pontos pendentes."
        ]
      },
      {
        title: "Como trocar ou excluir fotos",
        description: "As imagens da vitrine ficam salvas internamente no Hubly.",
        href: "/storefront",
        steps: [
          "Abra Fotos da vitrine.",
          "Envie nova capa, logo ou imagem da galeria.",
          "Remova imagens que nao devem mais aparecer.",
          "Clique em Salvar vitrine para confirmar a alteracao."
        ]
      }
    ]
  },
  {
    id: "providers",
    title: "Profissionais e servicos",
    description: "Equipe, servicos, precos, status e horarios de atendimento.",
    icon: UserRoundCog,
    href: "/providers",
    articles: [
      {
        title: "Como liberar um profissional para agenda publica",
        description: "O profissional precisa estar completo antes de aparecer para o cliente.",
        href: "/providers#providers-list",
        steps: [
          "Cadastre nome completo e especialidade.",
          "Mantenha o profissional como Ativo.",
          "Clique em Horarios.",
          "Ative ao menos um dia da semana.",
          "Preencha inicio e fim do expediente em HH:MM.",
          "Salve os horarios."
        ]
      },
      {
        title: "Como cadastrar servico com preco",
        description: "Servicos ativos com preco aparecem na vitrine e no fluxo de agendamento.",
        href: "/providers#services-list",
        steps: [
          "Clique em Novo servico.",
          "Escolha o profissional responsavel.",
          "Informe nome do servico.",
          "Preencha duracao em minutos.",
          "Informe preco maior que zero.",
          "Salve e mantenha o servico como Ativo."
        ]
      },
      {
        title: "Por que horario nao aparece",
        description: "Horarios somem quando falta disponibilidade, servico ou existe conflito.",
        href: "/providers#providers-list",
        steps: [
          "Confirme se o profissional esta ativo.",
          "Confira se existe servico ativo com preco para esse profissional.",
          "Abra Horarios e veja se ha dias ativos.",
          "Verifique se o horario testado esta dentro do expediente.",
          "Confira na Agenda se ja existe agendamento bloqueando o horario."
        ]
      }
    ]
  },
  {
    id: "bookings",
    title: "Agenda",
    description: "Criacao, cancelamento, reagendamento, confirmacao e presenca.",
    icon: CalendarClock,
    href: "/bookings",
    articles: [
      {
        title: "Como criar agendamento interno",
        description: "Use a agenda quando a equipe precisa marcar pelo cliente.",
        href: "/bookings",
        steps: [
          "Abra Agenda.",
          "Clique em Novo agendamento.",
          "Selecione cliente, profissional e servico.",
          "Escolha inicio e fim dentro da disponibilidade.",
          "Salve o agendamento.",
          "Confira o status na lista diaria ou semanal."
        ]
      },
      {
        title: "Como cancelar ou reagendar",
        description: "A agenda mantem historico e dispara eventos quando automacoes estao ativas.",
        href: "/bookings",
        steps: [
          "Localize o agendamento.",
          "Use Cancelar para encerrar o horario.",
          "Use Reagendar para escolher nova data e horario.",
          "Informe observacao quando necessario.",
          "Confira se o status mudou corretamente."
        ]
      },
      {
        title: "Como registrar comparecimento ou falta",
        description: "Esses registros alimentam indicadores basicos de no-show.",
        href: "/bookings",
        steps: [
          "Abra o agendamento finalizado ou do dia.",
          "Marque Compareceu quando o cliente foi atendido.",
          "Marque Falta quando o cliente nao apareceu.",
          "Acompanhe o resultado em Relatorios."
        ]
      }
    ]
  },
  {
    id: "automations",
    title: "Automacoes",
    description: "Eventos de agendamento, lembretes, relacionamento e conexao WhatsApp.",
    icon: Bot,
    href: "/automations",
    articles: [
      {
        title: "Como cumprir o requisito da vitrine",
        description: "Eventos basicos estao disponiveis para liberar a vitrine.",
        href: "/automations",
        steps: [
          "Abra Automacoes.",
          "Entre na aba Agendamentos.",
          "Ative notificacoes de agendamento.",
          "Mantenha ativos criado, confirmado, reagendado e cancelado.",
          "Volte para Vitrine e salve a publicacao."
        ]
      },
      {
        title: "Como conectar WhatsApp",
        description: "A conexao permite envio real quando o recurso estiver disponivel no plano.",
        href: "/automations",
        steps: [
          "Abra Automacoes.",
          "Informe o WhatsApp da organizacao.",
          "Gere o QR Code ou codigo de pareamento.",
          "Leia o QR Code no WhatsApp.",
          "Confira se o status ficou Conectado."
        ]
      },
      {
        title: "Como configurar lembretes",
        description: "Lembretes avisam o cliente antes do horario marcado quando o plano permite.",
        href: "/automations",
        steps: [
          "Abra a aba Lembretes.",
          "Ative lembretes WhatsApp.",
          "Adicione regras como 24h e 2h antes.",
          "Salve as configuracoes.",
          "Teste criando um agendamento futuro."
        ]
      }
    ]
  },
  {
    id: "customers",
    title: "Clientes",
    description: "Cadastro, historico, portal do cliente e criacao de conta final.",
    icon: UsersRound,
    href: "/customers",
    articles: [
      {
        title: "Como cadastrar cliente no painel",
        description: "Use Clientes para organizar contatos atendidos pela equipe.",
        href: "/customers",
        steps: [
          "Abra Clientes.",
          "Clique em Novo cliente.",
          "Preencha nome, telefone e e-mail quando existir.",
          "Salve o cadastro.",
          "Use o cliente em novos agendamentos."
        ]
      },
      {
        title: "Como cliente final cria conta",
        description: "A conta do cliente final nao precisa estar presa a um estabelecimento.",
        href: "/cliente/criar-conta",
        steps: [
          "Abra a tela Criar conta de cliente.",
          "Informe nome, WhatsApp, e-mail opcional e senha.",
          "Conclua o cadastro.",
          "O cliente pode entrar no portal e acompanhar seus agendamentos."
        ]
      }
    ]
  },
  {
    id: "account",
    title: "Conta e assinatura",
    description: "Dados de acesso, plano, limites e suporte para chamados.",
    icon: Settings,
    href: "/account",
    articles: [
      {
        title: "Como alterar dados de acesso",
        description: "Mantenha nome, e-mail e WhatsApp atualizados.",
        href: "/account",
        steps: [
          "Abra Conta.",
          "Atualize nome, e-mail ou WhatsApp.",
          "Salve os dados.",
          "Use a troca de senha quando precisar renovar o acesso."
        ]
      },
      {
        title: "Como entender limites do plano",
        description: "Planos controlam limites de profissionais, servicos, fotos e automacoes pagas.",
        href: "/payments",
        steps: [
          "Abra Assinatura.",
          "Confira o plano atual.",
          "Veja recursos e limites disponiveis.",
          "Ajuste servicos ou profissionais quando ultrapassar limite.",
          "Abra suporte se houver divergencia."
        ]
      },
      {
        title: "Quando abrir chamado",
        description: "Use suporte quando o passo a passo nao resolver ou houver erro operacional.",
        href: HUBLY_SUPPORT_URL,
        steps: [
          "Informe organizacao e usuario afetado.",
          "Envie link da vitrine ou tela usada.",
          "Descreva profissional, servico, data e horario testados.",
          "Anexe print do erro quando possivel."
        ]
      }
    ]
  }
];

const quickChecks = [
  { label: "Vitrine publicada", href: "/storefront", icon: Store },
  { label: "Automacoes ativas", href: "/automations", icon: BellRing },
  { label: "Profissional ativo", href: "/providers#providers-list", icon: UserRoundCog },
  { label: "Servico com preco", href: "/providers#services-list", icon: CreditCard },
  { label: "Horario disponivel", href: "/providers#providers-list", icon: CalendarClock }
];

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Central de ajuda</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Guias por modulo</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Consulte processos comuns por area do Hubly e abra a tela certa para concluir a configuracao.
          </p>
        </div>
        <ButtonLink href={HUBLY_SUPPORT_URL} variant="secondary">
          <Ticket className="mr-2 h-4 w-4" />
          Abrir chamado
        </ButtonLink>
      </div>

      <section className="rounded-lg border border-sky-300/20 bg-sky-400/10 p-5">
        <div className="flex gap-3">
          <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-sky-200" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-100">Diagnostico rapido</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Para o cliente conseguir agendar, estes pontos precisam estar completos</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {quickChecks.map((item) => {
                const Icon = item.icon;

                return (
                  <ButtonLink className="h-auto justify-start px-3 py-3" href={item.href} key={item.label} variant="secondary">
                    <Icon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </ButtonLink>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <nav className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <a
              className="rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
              href={`#${module.id}`}
              key={module.id}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{module.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">{module.description}</span>
                </span>
              </div>
            </a>
          );
        })}
      </nav>

      <div className="space-y-8">
        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <section className="scroll-mt-24 space-y-4" id={module.id} key={module.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{module.title}</h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">{module.description}</p>
                  </div>
                </div>
                <ButtonLink href={module.href} variant="secondary">
                  Abrir modulo
                </ButtonLink>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {module.articles.map((article) => (
                  <Card className="flex flex-col" key={article.title}>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-white">{article.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{article.description}</p>
                    </div>
                    <ol className="space-y-2 text-sm leading-6 text-slate-300">
                      {article.steps.map((step, index) => (
                        <li className="flex gap-2" key={step}>
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/5 text-xs font-semibold text-sky-100">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-5 pt-2">
                      <ButtonLink href={article.href} size="sm" variant="secondary">
                        <FileText className="mr-2 h-4 w-4" />
                        Ir para o processo
                      </ButtonLink>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <Images className="mt-1 h-5 w-5 shrink-0 text-sky-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Ainda ficou com duvida?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Abra um chamado com organizacao, tela usada, profissional, servico, data testada e print do erro.
              </p>
            </div>
          </div>
          <ButtonLink href={HUBLY_SUPPORT_URL} variant="secondary">
            <MessageSquare className="mr-2 h-4 w-4" />
            Ir para suporte
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
