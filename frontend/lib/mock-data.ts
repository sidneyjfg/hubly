import type { MonetizationHighlight, PricingComparison, Testimonial } from "@/lib/types";

export const clientLogos = ["Vitta Prime", "Barbearia Oriz", "Studio Pulse", "Harmonie", "Clarear"];

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
    organization: "Barbearia Oriz",
    quote: "Publicamos serviços, fotos e horários em poucos minutos. O perfil virou nosso principal link de agendamento."
  },
  {
    name: "Carolina Nery",
    role: "Head de atendimento",
    organization: "Studio Pulse",
    quote: "A equipe deixou de correr atrás manualmente de clientes e passou a operar a agenda com muito mais controle."
  }
];

export const monetizationHighlights: MonetizationHighlight[] = [
  {
    title: "Comece sem risco",
    description: "Periodo inicial gratuito ou primeiro mes com desconto para validar a plataforma antes da assinatura."
  },
  {
    title: "R$69,90 por mes",
    description: "Plano principal com assinatura mensal fixa para manter agenda, perfil publico e gestao basica."
  },
  {
    title: "Sem taxa por venda",
    description: "O negocio paga assinatura previsivel e mantem o controle integral dos agendamentos e vendas."
  }
];

export const pricingComparison: PricingComparison[] = [
  {
    name: "Teste grátis",
    rate: "0",
    description: "Entrada simples para configurar perfil, agenda e primeiros agendamentos."
  },
  {
    name: "Plano principal",
    rate: "R$69,90",
    description: "Assinatura mensal fixa para negócios locais em operação."
  },
  {
    name: "Hubly",
    rate: "Fixo",
    description: "O valor mensal nao varia por cliente, agendamento ou venda.",
    highlighted: true
  }
];
