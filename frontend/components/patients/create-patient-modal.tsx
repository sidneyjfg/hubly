"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { Patient, PatientRow } from "@/lib/types";

type CreatePatientModalProps = {
  open: boolean;
  onClose: () => void;
  patient?: Patient | PatientRow | null;
};

export function CreatePatientModal({ open, onClose, patient }: CreatePatientModalProps) {
  const [fullName, setFullName] = useState(patient?.fullName ?? "");
  const [phone, setPhone] = useState(patient?.phone ?? "");
  const [email, setEmail] = useState(patient?.email ?? "");
  const queryClient = useQueryClient();
  const isEditing = Boolean(patient);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFullName(patient?.fullName ?? "");
    setPhone(patient?.phone ?? "");
    setEmail(patient?.email ?? "");
  }, [open, patient]);

  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        fullName,
        phone,
        email: email || null
      };

      return patient ? api.updatePatient(patient.id, input) : api.createPatient(input);
    },
    meta: {
      errorMessage: isEditing ? "Paciente não atualizado" : "Paciente não criado",
      successMessage: isEditing ? "Paciente atualizado com sucesso" : "Paciente criado com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["patients-table"] });
      if (!patient) {
        setFullName("");
        setPhone("");
        setEmail("");
      }
      onClose();
    }
  });

  return (
    <Modal onClose={onClose} open={open} title={isEditing ? "Editar paciente" : "Novo paciente"}>
      <div className="space-y-4">
        <Input onChange={(event) => setFullName(event.target.value)} placeholder="Nome completo" value={fullName} />
        <Input onChange={(event) => setPhone(event.target.value)} placeholder="Telefone" value={phone} />
        <Input onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" type="email" value={email} />
        <div className="flex justify-end gap-3 pt-2">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancelar
          </Button>
          <Button
            disabled={!fullName || !phone || mutation.isPending}
            onClick={() => mutation.mutate()}
            type="button"
          >
            {isEditing ? "Salvar paciente" : "Criar paciente"}
          </Button>
        </div>
        {mutation.error ? <p className="text-sm text-rose-300">{mutation.error.message}</p> : null}
      </div>
    </Modal>
  );
}
