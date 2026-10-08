"use client";

import { useEffect, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { iniciarAssinatura, type PeriodoCobranca } from "@/lib/pro/planos";

const CHAVE_PUBLICA = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Um carregamento só por página: o Stripe.js reclama (e baixa de novo) se
// `loadStripe` for chamado a cada montagem.
let stripePromessa: Promise<Stripe | null> | null = null;
const stripe = () => (stripePromessa ??= loadStripe(CHAVE_PUBLICA!));

type Estado = { tipo: "carregando" } | { tipo: "pronto"; segredo: string } | { tipo: "erro"; mensagem: string };

/**
 * O formulário de pagamento do Stripe, dentro da tela do PRO.
 *
 * O cartão é digitado num iframe do próprio Stripe: o ZulCode nunca vê o
 * número. Quando o pagamento termina, o Stripe manda a pessoa de volta para
 * `/pro?sessao=…`, e é a tela de boas-vindas que confere com o backend se deu
 * certo — o que acontece aqui dentro não liga o PRO de ninguém.
 */
export function PagamentoEmbutido({ periodo }: { periodo: PeriodoCobranca }) {
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!CHAVE_PUBLICA) return;
    let vivo = true;
    iniciarAssinatura(periodo)
      .then(({ clientSecret }) => vivo && setEstado({ tipo: "pronto", segredo: clientSecret }))
      .catch((e: unknown) => vivo && setEstado({ tipo: "erro", mensagem: e instanceof Error ? e.message : "Não foi possível abrir o pagamento." }));
    return () => {
      vivo = false;
    };
  }, [periodo, tentativa]);

  if (!CHAVE_PUBLICA) {
    return (
      <Aviso mensagem="O pagamento ainda não está configurado neste ambiente. Falta NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY." />
    );
  }

  if (estado.tipo === "erro") {
    return (
      <Aviso
        mensagem={estado.mensagem}
        acao={() => {
          setEstado({ tipo: "carregando" });
          setTentativa((t) => t + 1);
        }}
      />
    );
  }

  return (
    <div className="zc-pro-sobe relative min-h-[420px] w-full overflow-hidden rounded-2xl bg-white">
      {estado.tipo === "carregando" ? (
        <div className="flex h-[420px] items-center justify-center text-violet-700">
          <Loader2 className="size-7 animate-spin" />
        </div>
      ) : (
        <EmbeddedCheckoutProvider key={estado.segredo} stripe={stripe()} options={{ clientSecret: estado.segredo }}>
          <EmbeddedCheckout className="w-full" />
        </EmbeddedCheckoutProvider>
      )}
    </div>
  );
}

function Aviso({ mensagem, acao }: { mensagem: string; acao?: () => void }) {
  return (
    <div role="alert" className="zc-pro-sobe w-full rounded-2xl border border-amber-300/30 bg-amber-400/10 p-5 text-center">
      <p className="text-[0.92rem] font-bold leading-snug text-amber-100">{mensagem}</p>
      {acao && (
        <button
          type="button"
          onClick={acao}
          className="zc-press mt-4 rounded-xl bg-white px-5 py-2.5 text-[0.75rem] font-black uppercase tracking-[0.06em] text-violet-700"
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}
