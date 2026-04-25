import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  ChevronRight,
  Clock3,
  MessageSquareMore,
  ShieldCheck
} from "lucide-react";

import { DashboardMockup } from "@/components/app/dashboard-mockup";
import { BrandLogo } from "@/components/app/brand-logo";
import { SectionHeading } from "@/components/app/section-heading";
import { AppVersion } from "@/components/app/app-version";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clientLogos, pricingPlans, testimonials } from "@/lib/mock-data";

const problemPoints = [
  "Pacientes esquecem a consulta e a equipe corre atrás em cima da hora.",
  "Buracos na agenda reduzem faturamento e geram ociosidade da operação.",
  "Recepção perde tempo confirmando, reagendando e atualizando status manualmente.",
  "A clínica não enxerga com clareza onde o no-show nasce."
];

const solutionItems = [
  {
    title: "Confirmações automáticas",
    description: "Dispare confirmações e respostas rápidas por WhatsApp e e-mail sem depender da recepção."
  },
  {
    title: "Follow-up orientado por contexto",
    description: "Acione lembretes, reagendamento e recuperação de agenda com regras simples e visíveis."
  },
  {
    title: "Visão única da operação",
    description: "Centralize agenda, pacientes, métricas e automações num painel que sua equipe consegue usar."
  }
];

const benefits = [
  {
    title: "Menos faltas",
    description: "Sequências automáticas reduzem esquecimentos e melhoram a taxa de confirmação.",
    icon: CalendarCheck2
  },
  {
    title: "Mais previsibilidade",
    description: "Saiba com antecedência onde a agenda vai furar e aja antes de perder receita.",
    icon: Activity
  },
  {
    title: "Operação enxuta",
    description: "Recepção focada no atendimento, não em tarefas repetitivas.",
    icon: Clock3
  },
  {
    title: "Segurança para crescer",
    description: "Estrutura pronta para perfis, clínica multiusuário e integração progressiva com backend real.",
    icon: ShieldCheck
  }
];

const comparisons = [
  { feature: "Confirmação automatizada", hubly: true, common: false },
  { feature: "Lembretes em múltiplos momentos", hubly: true, common: false },
  { feature: "Status operacional por consulta", hubly: true, common: false },
  { feature: "Indicadores de no-show", hubly: true, common: false },
  { feature: "Integração com Google Calendar", hubly: true, common: false },
  { feature: "Agenda isolada sem contexto", hubly: false, common: true }
];

const steps = [
  "Cadastre sua clínica, profissionais e pacientes.",
  "Configure regras de confirmação, lembretes e follow-up.",
  "Acompanhe agenda, faltas e receita em um dashboard claro."
];

const faqs = [
  {
    question: "A Hubly serve para qualquer tipo de clinica?",
    answer: "Sim. A interface foi pensada para operações médicas, odontológicas, estética, psicologia e serviços com agenda."
  },
  {
    question: "Preciso instalar algo na clínica?",
    answer: "Não. O frontend funciona como aplicação web e já está organizado para consumir um backend real quando você quiser plugar."
  },
  {
    question: "Já existe integração real com WhatsApp ou Google Calendar?",
    answer: "Nesta entrega, não. Tudo está simulado com dados mockados para validar UX, navegação e arquitetura."
  }
];

export default function MarketingPage() {
  return (
    <main className="overflow-x-hidden">
      <section className="surface-grid border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-8 md:px-10">
          <header className="mb-20 flex items-center justify-between">
            <BrandLogo showSlogan size="md" />
            <div className="flex items-center gap-3">
              <ButtonLink href="/login" variant="ghost">
                Entrar
              </ButtonLink>
              <ButtonLink href="/dashboard">Abrir app</ButtonLink>
            </div>
          </header>

          <div className="grid items-center gap-16 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm text-sky-200">
                <BadgeCheck className="h-4 w-4" />
                Agendamento inteligente para clínicas em crescimento
              </div>
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
                Menos faltas. Mais resultados.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
                A Hubly conecta sua clinica aos melhores servicos para centralizar agenda, pacientes e automacoes sem perder clareza operacional.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <ButtonLink href="/login" size="lg">
                  Agendar demonstração
                  <ArrowRight className="ml-2 h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="#como-funciona" size="lg" variant="secondary">
                  Ver como funciona
                </ButtonLink>
              </div>
              <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <MessageSquareMore className="h-4 w-4 text-sky-300" />
                  WhatsApp e e-mail simulados
                </div>
                <div className="flex items-center gap-2">
                  <CalendarCheck2 className="h-4 w-4 text-sky-300" />
                  Google Calendar pronto para plugar
                </div>
              </div>
            </div>
            <DashboardMockup />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <div className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-6 md:grid-cols-5">
          {clientLogos.map((logo) => (
            <div
              className="rounded-lg border border-white/8 bg-white/5 px-5 py-4 text-center text-sm font-medium text-slate-300"
              key={logo}
            >
              {logo}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10" id="pricing">
        <SectionHeading
          description="Se a agenda depende de confirmação manual, cada lacuna custa receita e desgaste operacional."
          eyebrow="Problema"
          title="O gargalo não está só na agenda. Está na rotina que sustenta a agenda."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {problemPoints.map((item) => (
            <Card key={item}>
              <p className="text-lg leading-8 text-slate-200">{item}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10">
          <SectionHeading
            description="Automação, follow-up e status operacional ficam visíveis para a equipe sem criar complexidade."
            eyebrow="Solução"
            title="A Hubly transforma confirmacao e reagendamento em fluxo, nao improviso."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {solutionItems.map((item) => (
              <Card className="bg-panelAlt/80" key={item.title}>
                <p className="text-xl font-semibold text-white">{item.title}</p>
                <p className="mt-4 leading-7 text-slate-300">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10">
        <SectionHeading
          description="Resultado operacional claro, sem interface pesada e sem esconder o que importa."
          eyebrow="Benefícios"
          title="Uma experiência SaaS premium pensada para equipes de clínica."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title}>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-6 text-xl font-semibold text-white">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10">
          <SectionHeading
            eyebrow="Comparação"
            title="Hubly versus agenda comum"
            description="A diferença não é estética. É operacional."
          />
          <div className="mt-10 overflow-hidden rounded-xl border border-white/10">
            <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] bg-white/5 px-6 py-4 text-sm uppercase tracking-[0.18em] text-slate-400">
              <span>Capacidade</span>
              <span>Hubly</span>
              <span>Agenda comum</span>
            </div>
            {comparisons.map((item) => (
              <div
                className="grid grid-cols-[1.4fr_0.8fr_0.8fr] border-t border-white/10 px-6 py-5 text-sm text-slate-200"
                key={item.feature}
              >
                <span>{item.feature}</span>
                <span>{item.hubly ? "Sim" : "Nao"}</span>
                <span>{item.common ? "Sim" : "Nao"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10" id="como-funciona">
        <SectionHeading
          eyebrow="Como Funciona"
          title="Três passos para sair do operacional reativo"
          description="Fluxo simples para começar com rapidez e evoluir depois para integração real."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step}>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/8 text-lg font-semibold text-white">
                0{index + 1}
              </div>
              <p className="mt-6 text-lg leading-8 text-slate-200">{step}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10">
          <SectionHeading
            eyebrow="Depoimentos"
            title="Quem opera agenda todos os dias percebe a diferença rápido."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name}>
                <p className="text-lg leading-8 text-slate-200">“{testimonial.quote}”</p>
                <div className="mt-8">
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-sm text-slate-400">
                    {testimonial.role} · {testimonial.clinic}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10">
        <SectionHeading
          eyebrow="Pricing"
          title="Planos para começar agora e amadurecer depois"
          description="Precificação simples para o MVP, com evolução natural para operações maiores."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <Card
              className={plan.highlighted ? "border-sky-400/25 bg-sky-400/10" : undefined}
              key={plan.name}
            >
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{plan.name}</p>
              <p className="mt-5 text-4xl font-semibold text-white">{plan.price}</p>
              <p className="mt-4 leading-7 text-slate-300">{plan.description}</p>
              <div className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <div className="flex items-start gap-3 text-sm text-slate-200" key={feature}>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                    {feature}
                  </div>
                ))}
              </div>
              <ButtonLink className="mt-8 w-full" href="/login" variant={plan.highlighted ? "primary" : "secondary"}>
                {plan.cta}
              </ButtonLink>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-4xl px-6 py-20 md:px-10">
          <SectionHeading eyebrow="FAQ" title="Perguntas frequentes" />
          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.question}>
                <p className="text-lg font-semibold text-white">{faq.question}</p>
                <p className="mt-4 leading-7 text-slate-300">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 md:px-10">
        <Card className="surface-grid border-sky-400/15 p-10 md:p-14">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Pronto para produto real</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                Comece a reduzir faltas hoje.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
                Interface premium, identidade alinhada com a nova marca e arquitetura frontend preparada para conectar ao backend sem retrabalho.
              </p>
            </div>
            <ButtonLink href="/login" size="lg">
              Abrir demonstração
            </ButtonLink>
          </div>
        </Card>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 text-sm text-slate-400 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <p className="font-medium text-white">Hubly</p>
            <p className="mt-2">Conecta voce aos melhores servicos para uma agenda mais previsivel e com menos no-show.</p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <div className="flex flex-wrap gap-6">
              <a href="#como-funciona">Produto</a>
              <a href="#pricing">Planos</a>
              <a href="/login">Entrar</a>
              <a href="#">Privacidade</a>
              <a href="#">Suporte</a>
            </div>
            <AppVersion />
          </div>
        </div>
      </footer>
    </main>
  );
}
