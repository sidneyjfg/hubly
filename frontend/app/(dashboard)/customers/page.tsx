"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Power } from "lucide-react";

import { CreateCustomerModal } from "@/components/customers/create-customer-modal";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableRoot, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { buildCustomerRows } from "@/lib/dashboard-data";
import type { CustomerRow } from "@/lib/types";

export default function CustomersPage() {
  const [open, setOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
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
          <h1 className="mt-2 text-3xl font-semibold text-white">Base ativa da clínica</h1>
        </div>
        <Button onClick={() => {
          setEditingCustomer(null);
          setOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
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
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
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
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
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
