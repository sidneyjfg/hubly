import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  Clock3,
  MessageSquareMore,
  Percent,
  ShieldCheck
} from "lucide-react";
import Image from "next/image";

import { DashboardMockup } from "@/components/app/dashboard-mockup";
import { BrandLogo } from "@/components/app/brand-logo";
import { SectionHeading } from "@/components/app/section-heading";
import { AppVersion } from "@/components/app/app-version";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clientLogos, marketplaceComparison, monetizationHighlights, testimonials } from "@/lib/mock-data";

const problemPoints = [
  "Profissionais dependem de indicação, redes sociais e retorno manual para manter a agenda cheia.",
  "Horários vazios reduzem faturamento mesmo quando há demanda procurando serviço perto.",
  "O cliente quer encontrar, comparar e agendar sem precisar esperar atendimento.",
  "Sem um canal de aquisição claro, o crescimento fica imprevisível."
];

const solutionItems = [
  {
    title: "Marketplace para serviços locais",
    description: "Barbearias, clínicas, salões e outros profissionais aparecem para clientes prontos para agendar."
  },
  {
    title: "Geração de clientes com agendamento",
    description: "A Hubly conecta demanda ao profissional e organiza o caminho até o horário confirmado."
  },
  {
    title: "Operação simples para crescer",
    description: "Agenda, confirmação e acompanhamento continuam claros, mas o foco é trazer novos clientes."
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
    description: "Acompanhe demanda, horários ocupados e receita gerada pela plataforma.",
    icon: Activity
  },
  {
    title: "Sem cobrança inicial",
    description: "Cresça seu faturamento antes de pagar qualquer coisa.",
    icon: Clock3
  },
  {
    title: "Controle do parceiro",
    description: "Clientes próprios continuam seus, sem comissão do Hubly.",
    icon: ShieldCheck
  }
];

const comparisons = [
  { feature: "Geração de novos clientes", hubly: true, common: false },
  { feature: "Agendamento direto pelo cliente", hubly: true, common: false },
  { feature: "Confirmação e lembretes", hubly: true, common: false },
  { feature: "Indicadores de clientes gerados", hubly: true, common: false },
  { feature: "Nenhuma comissão sobre clientes próprios", hubly: true, common: false },
  { feature: "Apenas organização interna de horários", hubly: false, common: true }
];

const steps = [
  "Entre como parceiro e publique seus serviços.",
  "Receba agendamentos de clientes gerados pelo Hubly.",
  "Pague comissão apenas quando a plataforma trouxer clientes."
];

const faqs = [
  {
    question: "A Hubly serve para quais profissionais?",
    answer: "Para barbearias, clínicas, salões, estética, terapias e outros serviços que querem receber mais clientes com agendamento."
  },
  {
    question: "Pago por clientes que eu mesmo trouxe?",
    answer: "Não. A comissão vale apenas para clientes gerados pelo Hubly. Clientes próprios do profissional não entram nessa cobrança."
  },
  {
    question: "Existe mensalidade obrigatória para começar?",
    answer: "Não. O começo é gratuito, e a cobrança acontece depois apenas quando a plataforma gera clientes para você."
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
              <ButtonLink href="/clientes" variant="secondary">Aba clientes</ButtonLink>
              <ButtonLink href="/signup">Aba parceiro</ButtonLink>
            </div>
          </header>

          <div className="grid items-center gap-16 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm text-sky-200">
                <BadgeCheck className="h-4 w-4" />
                Marketplace para profissionais que querem crescer
              </div>
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
                Novos clientes para sua agenda.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
                A Hubly conecta pessoas procurando serviços a profissionais preparados para atender. Você cresce primeiro e paga apenas quando a plataforma gera clientes.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <ButtonLink href="/clientes" size="lg">
                  Encontrar estabelecimento
                  <ArrowRight className="ml-2 h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="/signup" size="lg" variant="secondary">
                  Sou parceiro
                </ButtonLink>
              </div>
              <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <MessageSquareMore className="h-4 w-4 text-sky-300" />
                  WhatsApp e e-mail para confirmação
                </div>
                <div className="flex items-center gap-2">
                  <CalendarCheck2 className="h-4 w-4 text-sky-300" />
                  Agendamentos com Google Calendar
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
          description="O profissional não precisa de mais uma promessa operacional. Precisa de clientes chegando com intenção de agendar."
          eyebrow="Problema"
          title="O gargalo não é só organizar horários. É preencher a agenda."
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
            description="A plataforma combina descoberta, agendamento e acompanhamento para transformar procura em atendimento."
            eyebrow="Solução"
            title="A Hubly conecta clientes a profissionais locais."
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
          description="Você só paga quando o Hubly traz clientes. Sem risco, sem mensalidade inicial."
          eyebrow="Benefícios"
          title="Cresça seu faturamento antes de pagar qualquer coisa."
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
            description="A diferença é simples: agenda comum organiza horários; Hubly ajuda a trazer demanda."
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
          title="Três passos para começar como parceiro"
          description="Entre na plataforma, receba agendamentos e acompanhe os clientes gerados pelo Hubly."
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
          title="Você só paga quando ganha clientes"
          description="Comece grátis por um período inicial, como 30 dias ou os primeiros agendamentos. Depois, o Hubly cobra apenas 10% sobre clientes gerados pela plataforma."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-sky-400/25 bg-sky-400/10">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-sky-300 text-slate-950">
              <Percent className="h-6 w-6" />
            </div>
            <p className="mt-8 text-5xl font-semibold text-white">10%</p>
            <p className="mt-4 text-xl font-semibold text-white">sobre clientes gerados pela plataforma</p>
            <p className="mt-4 leading-7 text-slate-200">
              Você só paga quando recebe novos clientes. Nenhuma cobrança sobre clientes próprios do profissional.
            </p>
            <p className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
              Os pagamentos são processados por plataformas seguras de pagamento. Taxas de processamento seguem o padrão do mercado e são aplicadas automaticamente.
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
              <p className="text-xl font-semibold text-white">Taxa baixa para crescimento sustentável</p>
              <p className="mt-4 leading-7 text-slate-300">
                Plataformas como Uber e iFood cobram entre 15% e 30% por pedido, dependendo do modelo e serviços oferecidos. O Hubly cobra apenas 10% sobre clientes gerados pela plataforma, para o profissional crescer antes de pagar.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {marketplaceComparison.map((item) => (
                  <div
                    className={`rounded-lg border p-5 ${
                      item.highlighted
                        ? "border-sky-400/30 bg-sky-400/10"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                    key={item.name}
                  >
                    <p className="text-sm font-medium text-slate-300">{item.name}</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{item.rate}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{item.description}</p>
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
                Sem mensalidade inicial. Você só paga quando a plataforma gera clientes para o seu negócio.
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
            <p className="mt-2">Marketplace que conecta clientes a profissionais locais com agendamento simples.</p>
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
