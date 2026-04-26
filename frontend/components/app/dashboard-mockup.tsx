import { CalendarRange, CircleAlert, MessageCircleMore, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

const mockBookings = [
  { time: "08:30", customer: "Ana Ribeiro", status: "confirmed" as const },
  { time: "10:00", customer: "Carlos Dias", status: "pending" as const },
  { time: "11:30", customer: "Mariana Valente", status: "missed" as const }
];

export function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="absolute -left-10 top-8 hidden rounded-xl border border-sky-400/20 bg-sky-400/10 p-4 shadow-soft lg:block">
        <div className="flex items-center gap-3">
          <MessageCircleMore className="h-5 w-5 text-sky-300" />
          <div>
            <p className="text-sm text-white">Confirmação enviada</p>
            <p className="text-xs text-slate-300">WhatsApp em 2,1s</p>
          </div>
        </div>
      </div>
      <Card className="overflow-hidden border-white/12 bg-slate-950/80 p-0">
        <div className="grid gap-0 md:grid-cols-[1.3fr_0.9fr]">
          <div className="border-b border-white/10 p-6 md:border-b-0 md:border-r">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Agenda inteligente</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Quarta, 22 abr</h3>
              </div>
              <div className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300">
                87% ocupação
              </div>
            </div>
            <div className="space-y-4">
              {mockBookings.map((booking) => (
                <div
                  className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-4"
                  key={booking.customer}
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-white/8 px-3 py-2 text-sm font-semibold text-white">
                      {booking.time}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{booking.customer}</p>
                      <p className="text-xs text-slate-400">Consulta confirmada com lembrete automático</p>
                    </div>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4 p-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-sky-300" />
                <div>
                  <p className="text-sm text-slate-300">No-show em queda</p>
                  <p className="text-xl font-semibold text-white">-32% no mês</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <CalendarRange className="h-5 w-5 text-cyan-300" />
                <div>
                  <p className="text-sm text-slate-300">Agenda recuperada</p>
                  <p className="text-xl font-semibold text-white">12 encaixes automáticos</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <CircleAlert className="h-5 w-5 text-amber-300" />
                <div>
                  <p className="text-sm text-slate-300">Atenção operacional</p>
                  <p className="text-xl font-semibold text-white">2 pacientes pendentes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
