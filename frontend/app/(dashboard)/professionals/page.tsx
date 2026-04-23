"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseMedical, Pencil, Plus, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableRoot, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import type { Professional, ProfessionalService } from "@/lib/types";

type ProfessionalFormState = {
  id?: string;
  fullName: string;
  specialty: string;
};

type ServiceFormState = {
  id?: string;
  professionalId: string;
  name: string;
  durationMinutes: string;
  price: string;
};

const emptyProfessionalForm: ProfessionalFormState = {
  fullName: "",
  specialty: ""
};

const emptyServiceForm: ServiceFormState = {
  professionalId: "",
  name: "",
  durationMinutes: "60",
  price: ""
};

function centsFromPrice(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) {
    return null;
  }

  return Math.round(Number(normalized) * 100);
}

function priceFromCents(value?: number | null): string {
  if (value === null || value === undefined) {
    return "";
  }

  return (value / 100).toFixed(2);
}

export default function ProfessionalsPage() {
  const [professionalPage, setProfessionalPage] = useState(1);
  const [servicePage, setServicePage] = useState(1);
  const [professionalForm, setProfessionalForm] = useState<ProfessionalFormState | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceFormState | null>(null);
  const queryClient = useQueryClient();
  const limit = 10;

  const professionalsQuery = useQuery({
    queryKey: ["professionals-table", professionalPage, limit],
    queryFn: () => api.getProfessionals({ page: professionalPage, limit })
  });

  const servicesQuery = useQuery({
    queryKey: ["professional-services-table", servicePage, limit],
    queryFn: () => api.getProfessionalServices({ page: servicePage, limit })
  });

  const professionals = professionalsQuery.data?.items ?? [];
  const services = servicesQuery.data?.items ?? [];

  const professionalMutation = useMutation({
    mutationFn: (input: ProfessionalFormState) => {
      const payload = {
        fullName: input.fullName,
        specialty: input.specialty
      };

      return input.id ? api.updateProfessional(input.id, payload) : api.createProfessional(payload);
    },
    meta: {
      errorMessage: "Profissional não salvo",
      successMessage: "Profissional salvo com sucesso"
    },
    onSuccess: async () => {
      setProfessionalForm(null);
      await queryClient.invalidateQueries({ queryKey: ["professionals-table"] });
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
    }
  });

  const professionalStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.setProfessionalStatus(id, isActive),
    meta: {
      errorMessage: "Status do profissional não atualizado",
      successMessage: "Status do profissional atualizado com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["professionals-table"] });
    }
  });

  const serviceMutation = useMutation({
    mutationFn: (input: ServiceFormState) => {
      const payload = {
        professionalId: input.professionalId,
        name: input.name,
        durationMinutes: Number(input.durationMinutes),
        priceCents: centsFromPrice(input.price)
      };

      return input.id ? api.updateProfessionalService(input.id, payload) : api.createProfessionalService(payload);
    },
    meta: {
      errorMessage: "Serviço não salvo",
      successMessage: "Serviço salvo com sucesso"
    },
    onSuccess: async () => {
      setServiceForm(null);
      await queryClient.invalidateQueries({ queryKey: ["professional-services-table"] });
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
    }
  });

  const serviceStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.setProfessionalServiceStatus(id, isActive),
    meta: {
      errorMessage: "Status do serviço não atualizado",
      successMessage: "Status do serviço atualizado com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["professional-services-table"] });
    }
  });

  const openProfessionalEdit = (professional: Professional) => {
    setProfessionalForm({
      id: professional.id,
      fullName: professional.fullName,
      specialty: professional.specialty
    });
  };

  const openServiceEdit = (service: ProfessionalService) => {
    setServiceForm({
      id: service.id,
      professionalId: service.professionalId,
      name: service.name,
      durationMinutes: service.durationMinutes.toString(),
      price: priceFromCents(service.priceCents)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Profissionais</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Equipe e serviços da agenda</h1>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setProfessionalForm(emptyProfessionalForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo profissional
          </Button>
          <Button onClick={() => setServiceForm({ ...emptyServiceForm, professionalId: professionals[0]?.id ?? "" })} variant="secondary">
            <BriefcaseMedical className="mr-2 h-4 w-4" />
            Novo serviço
          </Button>
        </div>
      </div>

      <Card className="p-0">
        <Table>
          <TableRoot>
            <TableHead>
              <TableRow>
                <TableCell>Profissional</TableCell>
                <TableCell>Especialidade</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {professionals.map((professional) => (
                <TableRow key={professional.id}>
                  <TableCell className="font-medium text-white">{professional.fullName}</TableCell>
                  <TableCell>{professional.specialty}</TableCell>
                  <TableCell>{professional.isActive ? "Ativo" : "Inativo"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => openProfessionalEdit(professional)} size="sm" variant="secondary">
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        disabled={professionalStatusMutation.isPending}
                        onClick={() => professionalStatusMutation.mutate({ id: professional.id, isActive: !professional.isActive })}
                        size="sm"
                        variant="ghost"
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {professional.isActive ? "Inativar" : "Ativar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        </Table>
      </Card>

      <div className="flex flex-col gap-3 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
        <p>
          Página {professionalsQuery.data?.page ?? professionalPage} de {professionalsQuery.data?.totalPages ?? 1} - {professionalsQuery.data?.total ?? 0} profissionais
        </p>
        <div className="flex gap-2">
          <Button disabled={professionalPage <= 1} onClick={() => setProfessionalPage((current) => Math.max(1, current - 1))} variant="secondary">
            Anterior
          </Button>
          <Button disabled={!professionalsQuery.data || professionalPage >= professionalsQuery.data.totalPages} onClick={() => setProfessionalPage((current) => current + 1)} variant="secondary">
            Próxima
          </Button>
        </div>
      </div>

      <Card className="p-0">
        <div className="border-b border-white/10 p-5">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Serviços oferecidos</p>
        </div>
        <Table>
          <TableRoot>
            <TableHead>
              <TableRow>
                <TableCell>Serviço</TableCell>
                <TableCell>Profissional</TableCell>
                <TableCell>Duração</TableCell>
                <TableCell>Preço</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium text-white">{service.name}</TableCell>
                  <TableCell>{service.professionalName ?? "Profissional"}</TableCell>
                  <TableCell>{service.durationMinutes} min</TableCell>
                  <TableCell>{service.priceCents ? `R$ ${priceFromCents(service.priceCents).replace(".", ",")}` : "Não informado"}</TableCell>
                  <TableCell>{service.isActive ? "Ativo" : "Inativo"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => openServiceEdit(service)} size="sm" variant="secondary">
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        disabled={serviceStatusMutation.isPending}
                        onClick={() => serviceStatusMutation.mutate({ id: service.id, isActive: !service.isActive })}
                        size="sm"
                        variant="ghost"
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {service.isActive ? "Inativar" : "Ativar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        </Table>
      </Card>

      <div className="flex flex-col gap-3 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
        <p>
          Página {servicesQuery.data?.page ?? servicePage} de {servicesQuery.data?.totalPages ?? 1} - {servicesQuery.data?.total ?? 0} serviços
        </p>
        <div className="flex gap-2">
          <Button disabled={servicePage <= 1} onClick={() => setServicePage((current) => Math.max(1, current - 1))} variant="secondary">
            Anterior
          </Button>
          <Button disabled={!servicesQuery.data || servicePage >= servicesQuery.data.totalPages} onClick={() => setServicePage((current) => current + 1)} variant="secondary">
            Próxima
          </Button>
        </div>
      </div>

      <Modal onClose={() => setProfessionalForm(null)} open={Boolean(professionalForm)} title={professionalForm?.id ? "Editar profissional" : "Novo profissional"}>
        {professionalForm ? (
          <div className="space-y-4">
            <Input onChange={(event) => setProfessionalForm({ ...professionalForm, fullName: event.target.value })} placeholder="Nome completo" value={professionalForm.fullName} />
            <Input onChange={(event) => setProfessionalForm({ ...professionalForm, specialty: event.target.value })} placeholder="Especialidade" value={professionalForm.specialty} />
            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={() => setProfessionalForm(null)} type="button" variant="ghost">Cancelar</Button>
              <Button disabled={!professionalForm.fullName || !professionalForm.specialty || professionalMutation.isPending} onClick={() => professionalMutation.mutate(professionalForm)} type="button">
                Salvar profissional
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal onClose={() => setServiceForm(null)} open={Boolean(serviceForm)} title={serviceForm?.id ? "Editar serviço" : "Novo serviço"}>
        {serviceForm ? (
          <div className="space-y-4">
            <label className="block text-sm text-slate-300">
              Profissional
              <select
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-sky-300"
                onChange={(event) => setServiceForm({ ...serviceForm, professionalId: event.target.value })}
                value={serviceForm.professionalId}
              >
                <option className="bg-slate-950" value="">Selecione</option>
                {professionals.filter((professional) => professional.isActive).map((professional) => (
                  <option className="bg-slate-950" key={professional.id} value={professional.id}>{professional.fullName}</option>
                ))}
              </select>
            </label>
            <Input onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} placeholder="Nome do serviço, ex: Consulta inicial" value={serviceForm.name} />
            <Input min={5} onChange={(event) => setServiceForm({ ...serviceForm, durationMinutes: event.target.value })} placeholder="Duração em minutos" type="number" value={serviceForm.durationMinutes} />
            <Input onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })} placeholder="Preço opcional, ex: 180,00" value={serviceForm.price} />
            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={() => setServiceForm(null)} type="button" variant="ghost">Cancelar</Button>
              <Button disabled={!serviceForm.professionalId || !serviceForm.name || !serviceForm.durationMinutes || serviceMutation.isPending} onClick={() => serviceMutation.mutate(serviceForm)} type="button">
                Salvar serviço
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
