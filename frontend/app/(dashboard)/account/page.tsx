"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";

export default function AccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAppStore((state) => state.logout);
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: api.getMe
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!data) {
      return;
    }

    setFullName(data.user.fullName);
    setEmail(data.user.email);
    setPhone(data.user.phone);
  }, [data]);

  const accountMutation = useMutation({
    mutationFn: () =>
      api.updateAccount({
        fullName,
        email,
        phone
      }),
    meta: {
      errorMessage: "Conta não salva",
      successMessage: "Conta salva com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    }
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      api.updatePassword({
        currentPassword,
        newPassword
      }),
    meta: {
      errorMessage: "Senha não alterada",
      successMessage: "Senha alterada com sucesso"
    },
    onSuccess: async () => {
      logout();
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.push("/login");
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Conta</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Dados de acesso e perfil</h1>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Input onChange={(event) => setFullName(event.target.value)} placeholder="Nome completo" value={fullName} />
          <Input onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" type="email" value={email} />
          <Input onChange={(event) => setPhone(event.target.value)} placeholder="Telefone" value={phone} />
          <Input disabled placeholder="Perfil" value={data?.user.role ?? ""} />
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button disabled={accountMutation.isPending} onClick={() => accountMutation.mutate()}>
            Salvar conta
          </Button>
          {accountMutation.error ? <p className="text-sm text-rose-300">{accountMutation.error.message}</p> : null}
        </div>
      </Card>

      <Card>
        <p className="text-xl font-semibold text-white">Alterar senha</p>
        <p className="mt-2 text-slate-300">
          Ao alterar a senha, a sessão atual é encerrada e o login precisará ser feito novamente.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Input
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Senha atual"
            type="password"
            value={currentPassword}
          />
          <Input
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Nova senha"
            type="password"
            value={newPassword}
          />
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button
            disabled={!currentPassword || !newPassword || passwordMutation.isPending}
            onClick={() => passwordMutation.mutate()}
            variant="secondary"
          >
            Atualizar senha
          </Button>
          {passwordMutation.error ? <p className="text-sm text-rose-300">{passwordMutation.error.message}</p> : null}
        </div>
      </Card>
    </div>
  );
}
