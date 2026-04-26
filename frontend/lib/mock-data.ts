import type { PricingPlan, Testimonial } from "@/lib/types";

export const clientLogos = ["Vitta Prime", "Oriz", "Pulse Care", "Harmonie", "Clarear"];

export const testimonials: Testimonial[] = [
  {
    name: "Juliana Rocha",
    role: "Sócia-diretora",
    organization: "Clínica Harmonie",
    quote: "A recepção ganhou previsibilidade e o no-show caiu já no primeiro mês com confirmações automáticas."
  },
  {
    name: "Eduardo Martins",
    role: "Gestor de operações",
    organization: "Vitta Prime",
    quote: "Conseguimos reagendar rápido, preencher lacunas e ter uma visão clara do que está impactando o faturamento."
  },
  {
    name: "Carolina Nery",
    role: "Head de atendimento",
    organization: "Pulse Care",
    quote: "A equipe deixou de correr atrás manualmente de pacientes e passou a operar a agenda com muito mais controle."
  }
];

export const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    price: "R$ 149",
    description: "Para clínicas iniciando a automação da agenda.",
    features: [
      "Agenda diária e semanal",
      "Confirmação automática",
      "Cadastro de pacientes",
      "Relatórios essenciais"
    ],
    cta: "Começar agora"
  },
  {
    name: "Growth",
    price: "R$ 289",
    description: "Mais controle para reduzir faltas e escalar atendimento.",
    features: [
      "Tudo do Starter",
      "Lembretes 24h e 2h",
      "Playbooks de follow-up",
      "Dashboard operacional avançado",
      "Integração básica com Google Calendar"
    ],
    highlighted: true,
    cta: "Escolher Growth"
  },
  {
    name: "Custom",
    price: "Sob consulta",
    description: "Fluxos sob medida para operações multiunidade.",
    features: [
      "Tudo do Growth",
      "Setup assistido",
      "Mapeamento operacional",
      "Governança por perfis",
      "Suporte prioritário"
    ],
    cta: "Falar com especialista"
  }
];
