"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LockKeyhole, Sparkles } from "lucide-react";

import { api } from "@/lib/api";
import type { BillingPlan } from "@/lib/types";
import { ButtonLink } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useAppStore } from "@/store/app-store";

type PlanCode = BillingPlan["code"];
type UpgradeRequest = {
  feature: string;
  requiredPlan: Exclude<PlanCode, "free">;
};

type PlanAccessContextValue = {
  currentPlan: PlanCode;
  hasPlan: (requiredPlan: PlanCode) => boolean;
  requestUpgrade: (request: UpgradeRequest) => void;
};

const planLevel: Record<PlanCode, number> = { free: 0, pro: 1, premium: 2 };
const PlanAccessContext = createContext<PlanAccessContextValue | null>(null);

export function PlanAccessProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const currentUser = useAppStore((state) => state.currentUser);
  const [upgradeRequest, setUpgradeRequest] = useState<UpgradeRequest | null>(null);
  const subscriptionQuery = useQuery({
    enabled: isAuthenticated,
    queryKey: ["organization-subscription"],
    queryFn: api.getOrganizationSubscription,
    staleTime: 60_000
  });
  const currentPlan = subscriptionQuery.data?.current.plan.code ?? "free";
  const requestedPlanIsCurrent = upgradeRequest ? planLevel[currentPlan] >= planLevel[upgradeRequest.requiredPlan] : false;
  const value = useMemo<PlanAccessContextValue>(() => ({
    currentPlan,
    hasPlan: (requiredPlan) => planLevel[currentPlan] >= planLevel[requiredPlan],
    requestUpgrade: setUpgradeRequest
  }), [currentPlan]);

  return (
    <PlanAccessContext.Provider value={value}>
      {children}
      <Modal className="sm:max-w-md" onClose={() => setUpgradeRequest(null)} open={Boolean(upgradeRequest)} title="Recurso bloqueado pelo plano">
        {upgradeRequest ? (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-400/15 text-violet-200">
              <LockKeyhole className="h-7 w-7" />
            </div>
            <p className="mt-5 text-lg font-semibold text-white">{upgradeRequest.feature}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{requestedPlanIsCurrent
              ? "O limite contratado foi atingido. Revise os itens ativos ou consulte os planos disponíveis. Nada foi alterado na sua conta."
              : `Este recurso está disponível no plano ${upgradeRequest.requiredPlan === "premium" ? "Premium" : "Pro"}. Nada foi alterado na sua conta.`}
            </p>
            {currentUser?.role === "administrator" ? (
              <ButtonLink className="mt-6 w-full" href="/payments">
                Ver planos <Sparkles className="ml-2 h-4 w-4" />
              </ButtonLink>
            ) : (
              <p className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                Solicite ao administrador do estabelecimento a alteração do plano.
              </p>
            )}
          </div>
        ) : null}
      </Modal>
    </PlanAccessContext.Provider>
  );
}

export function usePlanAccess(): PlanAccessContextValue {
  const context = useContext(PlanAccessContext);
  if (!context) throw new Error("usePlanAccess must be used within PlanAccessProvider");
  return context;
}
