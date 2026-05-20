"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { CheckCircle2, Clock, CreditCard, XCircle } from "lucide-react";

import { BrandLogo } from "@/components/app/brand-logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    bookingId?: string;
    payment_intent_client_secret?: string;
    redirect_status?: string;
  }>;
};

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null);

function PaymentForm({ bookingId, slug }: { bookingId: string; slug: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitPayment() {
    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/clientes/${slug}/pagamento?bookingId=${bookingId}`
      }
    });

    if (result.error) {
      setErrorMessage(formatPaymentErrorMessage(result.error.message));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 text-left">
      <PaymentElement />
      <Button className="w-full" disabled={!stripe || !elements || isSubmitting} onClick={submitPayment}>
        <CreditCard className="mr-2 h-4 w-4" />
        {isSubmitting ? "Confirmando..." : "Pagar com segurança"}
      </Button>
      {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}
    </div>
  );
}

function formatPaymentErrorMessage(message?: string): string {
  if (!message) {
    return "Não foi possível confirmar o pagamento. Revise os dados e tente novamente.";
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("card was declined") || normalized.includes("declined")) {
    return "O cartão foi recusado. Use outro cartão ou fale com o banco emissor.";
  }

  if (normalized.includes("expired")) {
    return "O cartão está vencido. Confira a validade ou use outro cartão.";
  }

  if (normalized.includes("security code") || normalized.includes("cvc")) {
    return "O código de segurança do cartão está incorreto.";
  }

  if (normalized.includes("processing error")) {
    return "Houve uma falha no processamento. Tente novamente em alguns instantes.";
  }

  if (normalized.includes("incomplete") || normalized.includes("required")) {
    return "Preencha todos os dados obrigatórios do pagamento.";
  }

  return "Não foi possível confirmar o pagamento. Revise os dados e tente novamente.";
}

function PaymentReturnStatus({ clientSecret, stripe }: { clientSecret: string; stripe: Stripe | null }) {
  const [status, setStatus] = useState<"processing" | "succeeded" | "failed">("processing");

  useEffect(() => {
    if (!stripe) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (paymentIntent?.status === "succeeded") {
        setStatus("succeeded");
        return;
      }

      if (paymentIntent?.status === "requires_payment_method" || paymentIntent?.status === "canceled") {
        setStatus("failed");
      }
    });
  }, [clientSecret, stripe]);

  const content = {
    failed: {
      icon: XCircle,
      title: "Pagamento não concluído",
      description: "O pagamento não foi aprovado. O agendamento continua pendente até uma nova tentativa ou contato com o negócio.",
      tone: "text-rose-300"
    },
    processing: {
      icon: Clock,
      title: "Pagamento em processamento",
      description: "A confirmação final acontece por uma validação segura. O agendamento só será marcado como pago após essa confirmação.",
      tone: "text-amber-300"
    },
    succeeded: {
      icon: CheckCircle2,
      title: "Pagamento recebido",
      description: "O pagamento foi confirmado. A confirmação do agendamento será registrada automaticamente.",
      tone: "text-emerald-300"
    }
  }[status];
  const Icon = content.icon;

  return (
    <div className="text-center">
      <Icon className={`mx-auto h-14 w-14 ${content.tone}`} />
      <p className="mt-5 text-sm font-medium uppercase tracking-[0.2em] text-sky-300">Pagamento online</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">{content.title}</h1>
      <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">{content.description}</p>
    </div>
  );
}

export default function StripePaymentPage({ params, searchParams }: PageProps) {
  const { slug } = use(params);
  const query = use(searchParams);
  const [clientSecret, setClientSecret] = useState(query.payment_intent_client_secret ?? "");
  const [stripe, setStripe] = useState<Stripe | null>(null);

  useEffect(() => {
    stripePromise.then(setStripe);
  }, []);

  useEffect(() => {
    if (query.payment_intent_client_secret || !query.bookingId) {
      return;
    }

    const storedClientSecret = window.sessionStorage.getItem(`stripe_client_secret:${query.bookingId}`);
    if (storedClientSecret) {
      setClientSecret(storedClientSecret);
    }
  }, [query.bookingId, query.payment_intent_client_secret]);

  const elementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: "night" as const
      }
    }),
    [clientSecret]
  );

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto max-w-4xl px-6 py-6 md:px-10">
          <BrandLogo showSlogan size="sm" />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12 md:px-10">
        <Card>
          {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? (
            <div className="text-center">
              <XCircle className="mx-auto h-14 w-14 text-rose-300" />
              <h1 className="mt-3 text-3xl font-semibold text-white">Pagamento indisponível</h1>
              <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">A configuração pública de pagamentos online não está disponível.</p>
            </div>
          ) : clientSecret && query.payment_intent_client_secret ? (
            <PaymentReturnStatus clientSecret={clientSecret} stripe={stripe} />
          ) : clientSecret ? (
            <Elements options={elementsOptions} stripe={stripePromise}>
              <PaymentForm bookingId={query.bookingId ?? ""} slug={slug} />
            </Elements>
          ) : (
            <div className="text-center">
              <XCircle className="mx-auto h-14 w-14 text-rose-300" />
              <h1 className="mt-3 text-3xl font-semibold text-white">Pagamento não encontrado</h1>
              <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">Crie um novo agendamento para iniciar um pagamento seguro.</p>
            </div>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={`/clientes/${slug}`} variant="secondary">
              Voltar para a página do negócio
            </ButtonLink>
            <Link className="inline-flex items-center justify-center text-sm font-medium text-sky-300 hover:text-sky-200" href="/clientes">
              Ver outros estabelecimentos
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
