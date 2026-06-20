"use client";

import { Fragment, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, ChevronDown, History, LockKeyhole, Pencil, Plus, Power } from "lucide-react";

import { CreateCustomerModal } from "@/components/customers/create-customer-modal";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableRoot, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { buildCustomerRows } from "@/lib/dashboard-data";
import type { CustomerRow } from "@/lib/types";
import { usePlanAccess } from "@/components/billing/plan-access-provider";

const CUSTOMER_LIMITS = { free: 50, pro: 1000, premium: null } as const;

export default function CustomersPage() {
  const { currentPlan, requestUpgrade } = usePlanAccess();
  const [open, setOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["customers-table", page, limit],
    queryFn: async () => {
      const [customers, bookings] = await Promise.all([
        api.getCustomers({ page, limit }),
        api.getBookings({ limit: 100, page: 1 })
      ]);

      return {
        ...customers,
        items: buildCustomerRows(customers.items, bookings.items)
      };
    }
  });
  const customers = data?.items ?? [];
  const customerLimit = CUSTOMER_LIMITS[currentPlan];
  const isCustomerCreationBlocked = customerLimit !== null && (data?.total ?? 0) >= customerLimit;
  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.setCustomerStatus(id, isActive),
    meta: {
      errorMessage: "Status do paciente não atualizado",
      successMessage: "Status do paciente atualizado com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers-table"] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Pacientes</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Base ativa do negócio</h1>
        </div>
        <Button onClick={() => {
          if (isCustomerCreationBlocked) {
            requestUpgrade({ feature: `Mais de ${customerLimit} clientes ativos`, requiredPlan: currentPlan === "free" ? "pro" : "premium" });
            return;
          }
          setEditingCustomer(null); setOpen(true);
        }} variant={isCustomerCreationBlocked ? "secondary" : "primary"}>
          {isCustomerCreationBlocked ? <LockKeyhole className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          Novo paciente
        </Button>
      </div>

      <Card className="p-0">
        <Table>
          <TableRoot>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Última visita</TableCell>
                <TableCell>Retorno</TableCell>
                <TableCell>Histórico</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <Fragment key={customer.id}>
                <TableRow>
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{customer.fullName}</p>
                      <p className="mt-1 text-xs text-slate-400">{customer.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>
                    <StatusBadge status={customer.isActive ? customer.status : "cancelled"} />
                  </TableCell>
                  <TableCell>{customer.lastVisit}</TableCell>
                  <TableCell>{customer.nextBookingLabel}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm text-white">{customer.totalBookings} agendamentos</p>
                      <p className="text-xs text-slate-400">{customer.rescheduleCount} reagendamentos</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() =>
                          setExpandedCustomerId((current) => current === customer.id ? null : customer.id)
                        }
                        size="sm"
                        variant="secondary"
                      >
                        <ChevronDown className={`mr-2 h-4 w-4 transition ${expandedCustomerId === customer.id ? "rotate-180" : ""}`} />
                        Histórico
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingCustomer(customer);
                          setOpen(true);
                        }}
                        size="sm"
                        variant="secondary"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: customer.id, isActive: !customer.isActive })}
                        size="sm"
                        variant="ghost"
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {customer.isActive ? "Inativar" : "Ativar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedCustomerId === customer.id ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <CustomerHistoryPanel customer={customer} />
                    </TableCell>
                  </TableRow>
                ) : null}
                </Fragment>
              ))}
            </TableBody>
          </TableRoot>
        </Table>
      </Card>

      <div className="flex flex-col gap-3 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
        <p>
          Página {data?.page ?? page} de {data?.totalPages ?? 1} - {data?.total ?? 0} pacientes
        </p>
        <div className="flex gap-2">
          <Button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} variant="secondary">
            Anterior
          </Button>
          <Button
            disabled={!data || page >= data.totalPages}
            onClick={() => setPage((current) => current + 1)}
            variant="secondary"
          >
            Próxima
          </Button>
        </div>
      </div>

      <CreateCustomerModal
        onClose={() => {
          setOpen(false);
          setEditingCustomer(null);
        }}
        open={open}
        customer={editingCustomer}
      />
    </div>
  );
}

function CustomerHistoryPanel({ customer }: { customer: CustomerRow }) {
  return (
    <div className="grid gap-4 rounded-lg border border-white/10 bg-slate-950/50 p-4 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <CalendarClock className="h-4 w-4 text-sky-300" />
          Último agendamento
        </div>
        <p className="text-sm text-slate-300">{customer.lastBookingLabel}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <HistoryTile label="Total" value={customer.totalBookings.toString()} />
          <HistoryTile label="Reagendamentos" value={customer.rescheduleCount.toString()} />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
          <History className="h-4 w-4 text-sky-300" />
          Linha do tempo
        </div>
        <div className="space-y-2">
          {customer.history.map((item) => (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3" key={item.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{item.date} às {item.time}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.providerName} - {item.serviceName}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              {item.notes ? <p className="mt-2 text-xs text-slate-400">{item.notes}</p> : null}
            </div>
          ))}
          {customer.history.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-slate-400">
              Cliente ainda sem histórico de agendamentos.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HistoryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
