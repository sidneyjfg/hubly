import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  Clock3,
  CreditCard,
  MessageSquareMore,
  ShieldCheck
} from "lucide-react";
import Image from "next/image";

import { DashboardMockup } from "@/components/app/dashboard-mockup";
import { BrandLogo } from "@/components/app/brand-logo";
import { SectionHeading } from "@/components/app/section-heading";
import { AppVersion } from "@/components/app/app-version";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clientLogos, monetizationHighlights, testimonials } from "@/lib/mock-data";
import { HUBLY_SUPPORT_URL } from "@/lib/support";

const problemPoints = [
  "Negócios locais dependem de mensagens soltas, redes sociais e indicação para manter a agenda previsível.",
  "Horários vazios reduzem faturamento mesmo quando há clientes procurando serviço perto.",
  "O cliente quer encontrar, comparar e agendar sem esperar atendimento manual.",
  "Sem uma presença digital clara, descoberta local e retenção ficam frágeis."
];

const solutionItems = [
  {
    title: "Perfil público para negócios locais",
    description: "Barbearias, clínicas, salões, estética e studios ganham página com fotos, serviços e botão de agendamento."
  },
  {
    title: "Descoberta com agendamento",
    description: "Clientes encontram empresas da região, pesquisam serviços e saem com horário marcado em poucos cliques."
  },
  {
    title: "Gestão simples para crescer",
    description: "Agenda, clientes, serviços, horários, lembretes por WhatsApp e métricas ficam em um só painel para operar melhor."
  }
];

const benefits = [
  {
    title: "Novos clientes",
    description: "Apareça para pessoas procurando serviços e transforme intenção em agendamento.",
    icon: CalendarCheck2
  },
  {
    title: "Mais previsibilidade",
    description: "Acompanhe demanda, horários ocupados, confirmações e métricas simples do negócio.",
    icon: Activity
  },
  {
    title: "Teste grátis",
    description: "Entre com baixa barreira usando teste gratuito, primeiro mês grátis ou desconto inicial.",
    icon: Clock3
  },
  {
    title: "Assinatura fixa",
    description: "Clientes e vendas continuam do negócio. O Hubly cobra mensalidade previsível.",
    icon: ShieldCheck
  }
];

const comparisons = [
  { feature: "Perfil público com serviços e fotos", hubly: true, common: false },
  { feature: "Descoberta local", hubly: true, common: false },
  { feature: "Agendamento direto pelo cliente", hubly: true, common: false },
  { feature: "Lembretes por WhatsApp", hubly: true, common: false },
  { feature: "Histórico do cliente e último agendamento", hubly: true, common: false },
  { feature: "Indicadores simples de operação", hubly: true, common: false },
  { feature: "Assinatura mensal fixa", hubly: true, common: false },
  { feature: "Apenas organização interna de horários", hubly: false, common: true }
];

const steps = [
  "Crie sua conta, publique perfil, fotos e serviços.",
  "Receba agendamentos pelo perfil público e pela busca local.",
  "Use o teste grátis e depois mantenha o plano mensal fixo."
];

const faqs = [
  {
    question: "A Hubly serve para quais profissionais?",
    answer: "Para barbearias, clínicas, salões, estética, studios, terapias e profissionais de serviços que precisam de agenda, gestão e presença digital."
  },
  {
    question: "Como funciona a cobrança?",
    answer: "O modelo é assinatura mensal fixa, com plano principal de R$69,90/mês após a entrada gratuita ou promocional."
  },
  {
    question: "Existe teste grátis?",
    answer: "Sim. A entrada pode ser feita com teste grátis, primeiro mês gratuito ou desconto inicial para reduzir a barreira de adoção."
  }
];

const planCards = [
  {
    name: "Gratuito",
    price: "R$0",
    description: "Para testar o Hubly com limites operacionais.",
    features: [
      "1 profissional ativo",
      "3 serviços ativos",
      "50 clientes ativos",
      "30 agendamentos por mês",
      "Perfil público básico",
      "1 foto na vitrine",
      "Relatórios básicos"
    ]
  },
  {
    name: "Pro",
    price: "R$69,90",
    description: "Plano principal para operação diária do negócio.",
    highlighted: true,
    features: [
      "Até 5 profissionais ativos",
      "Até 30 serviços ativos",
      "Até 1.000 clientes ativos",
      "Agendamentos sem limite mensal",
      "Perfil público completo com galeria",
      "Lembretes por WhatsApp",
      "Histórico completo do cliente"
    ]
  },
  {
    name: "Premium",
    price: "R$129,90",
    description: "Para negócios que querem mais equipe e relacionamento.",
    features: [
      "Até 15 profissionais ativos",
      "Até 100 serviços ativos",
      "Clientes sem limite prático",
      "Agendamentos sem limite mensal",
      "Tudo do Pro",
      "Configuração de promoções",
      "Programa de fidelidade por WhatsApp"
    ]
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
                Entrar como negócio
              </ButtonLink>
              <ButtonLink href="/cliente/login" variant="ghost">Entrar como cliente final</ButtonLink>
              <ButtonLink href={HUBLY_SUPPORT_URL} variant="ghost">Suporte</ButtonLink>
              <ButtonLink href="/clientes" variant="secondary">Encontrar serviços</ButtonLink>
              <ButtonLink href="/signup">Tenho uma clínica ou barbearia</ButtonLink>
            </div>
          </header>

          <div className="grid items-center gap-16 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm text-sky-200">
                <BadgeCheck className="h-4 w-4" />
                SaaS para negócios locais que querem crescer
              </div>
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
                Agendamento, gestão e presença digital para negócios locais.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
                A Hubly ajuda barbearias, clínicas, salões, estética, studios e profissionais de serviços a serem encontrados, receberem agendamentos e gerirem a rotina com simplicidade.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <ButtonLink href="/clientes" size="lg">
                  Encontrar serviços
                  <ArrowRight className="ml-2 h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="/cliente/criar-conta" size="lg" variant="secondary">
                  Criar conta de cliente
                </ButtonLink>
                <ButtonLink href="/signup" size="lg" variant="secondary">
                  Tenho uma clínica ou barbearia
                </ButtonLink>
              </div>
              <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <MessageSquareMore className="h-4 w-4 text-sky-300" />
                  Lembretes por WhatsApp
                </div>
                <div className="flex items-center gap-2">
                  <CalendarCheck2 className="h-4 w-4 text-sky-300" />
                  Agenda, clientes e vitrine pública
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

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10" id="problema">
        <SectionHeading
          description="O negócio local precisa aparecer, receber agendamentos e manter a operação organizada sem depender de ferramentas soltas."
          eyebrow="Problema"
          title="O gargalo não é só organizar horários. É ser encontrado e manter a agenda saudável."
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
            description="A plataforma combina descoberta, perfil público, agendamento e gestão para transformar procura local em atendimento."
            eyebrow="Solução"
            title="A Hubly organiza a presença digital e a agenda do negócio."
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
          description="Assinatura previsível, teste grátis e operação simples para começar com baixa barreira de entrada."
          eyebrow="Benefícios"
          title="Cresça com presença digital, agenda moderna e gestão básica."
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
            description="A diferença é simples: agenda comum organiza horários; Hubly também melhora descoberta, presença digital e relacionamento."
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
                <span>{item.hubly ? "Sim" : "Não"}</span>
                <span>{item.common ? "Sim" : "Não"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10" id="como-funciona">
        <SectionHeading
          eyebrow="Como Funciona"
          title="Três passos para começar"
          description="Publique seu negócio, aceite agendamentos e acompanhe a operação em um painel simples."
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
            title="Quem precisa crescer percebe a diferença rápido."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name}>
                <p className="text-lg leading-8 text-slate-200">“{testimonial.quote}”</p>
                <div className="mt-8">
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-sm text-slate-400">
                    {testimonial.role} · {testimonial.organization}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10" id="pricing">
        <SectionHeading
          eyebrow="Monetização"
          title="Assinatura mensal fixa"
          description="Comece com teste grátis, primeiro mês gratuito ou desconto inicial. Depois, o plano principal custa R$69,90/mês."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-sky-400/25 bg-sky-400/10">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-sky-300 text-slate-950">
              <CreditCard className="h-6 w-6" />
            </div>
            <p className="mt-8 text-5xl font-semibold text-white">R$69,90</p>
            <p className="mt-4 text-xl font-semibold text-white">por mês no plano principal</p>
            <p className="mt-4 leading-7 text-slate-200">
              Assinatura recorrente e previsível para agendamento online, perfil público, clientes, serviços, WhatsApp e métricas simples.
            </p>
            <p className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
              O valor mensal não varia por cliente, agendamento ou venda realizada pelo negócio.
            </p>
            <ButtonLink className="mt-8 w-full" href="/login">
              Entrar como parceiro
            </ButtonLink>
          </Card>

          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-3">
              {monetizationHighlights.map((item) => (
                <Card className="bg-panelAlt/80" key={item.title}>
                  <p className="text-lg font-semibold text-white">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
                </Card>
              ))}
            </div>

            <Card>
              <p className="text-xl font-semibold text-white">Planos de acordo com o uso real do Hubly</p>
              <p className="mt-4 leading-7 text-slate-300">
                Os bloqueios seguem os recursos já disponíveis: profissionais, clientes, agendamentos, vitrine, WhatsApp e automações de relacionamento.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {planCards.map((item) => (
                  <div
                    className={`rounded-lg border p-5 ${
                      item.highlighted
                        ? "border-sky-400/30 bg-sky-400/10"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                    key={item.name}
                  >
                    <p className="text-sm font-medium text-slate-300">{item.name}</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{item.price}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{item.description}</p>
                    <ul className="mt-5 space-y-2 text-sm text-slate-300">
                      {item.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          </div>
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
                Receba seus primeiros clientes pelo Hubly.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
                Comece com baixa barreira de entrada e evolua para uma assinatura mensal fixa conforme o Hubly entra na rotina do seu negócio.
              </p>
            </div>
            <ButtonLink href="/login" size="lg">
              Começar grátis
            </ButtonLink>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b1b] shadow-soft">
          <Image
            alt="Banner principal da marca Hubly"
            className="h-auto w-full object-cover"
            height={450}
            priority
            src="/brand/banner-hubly.svg"
            width={1536}
          />
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 text-sm text-slate-400 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <p className="font-medium text-white">Hubly</p>
            <p className="mt-2">Plataforma moderna de agendamento, gestão e presença digital para negócios locais.</p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <div className="flex flex-wrap gap-6">
              <a href="#como-funciona">Como funciona</a>
              <a href="#pricing">Monetização</a>
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
