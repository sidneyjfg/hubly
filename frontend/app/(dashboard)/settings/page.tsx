"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: api.getMe
  });

  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    if (!data) {
      return;
    }

    setLegalName(data.clinic.legalName);
    setTradeName(data.clinic.tradeName);
    setTimezone(data.clinic.timezone);
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      api.updateClinic(data!.clinic.id, {
        legalName,
        tradeName,
        timezone
      }),
    meta: {
      errorMessage: "Configurações não salvas",
      successMessage: "Configurações salvas com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    }
  });

  const isAdministrator = data?.user.role === "administrator";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Configurações</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Dados da clínica</h1>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            disabled={!isAdministrator}
            onChange={(event) => setTradeName(event.target.value)}
            placeholder="Nome da clínica"
            value={tradeName}
          />
          <Input
            disabled={!isAdministrator}
            onChange={(event) => setLegalName(event.target.value)}
            placeholder="Razão social"
            value={legalName}
          />
          <Input
            className="md:col-span-2"
            disabled={!isAdministrator}
            onChange={(event) => setTimezone(event.target.value)}
            placeholder="Timezone"
            value={timezone}
          />
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button disabled={!isAdministrator || mutation.isPending} onClick={() => mutation.mutate()}>
            Salvar configurações
          </Button>
          {!isAdministrator ? <p className="text-sm text-amber-300">Somente administradores podem editar.</p> : null}
          {mutation.error ? <p className="text-sm text-rose-300">{mutation.error.message}</p> : null}
        </div>
      </Card>
    </div>
  );
}
