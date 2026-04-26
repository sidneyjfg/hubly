import type { Booking, DashboardInsight, Customer, CustomerRow, Provider, RevenuePoint } from "@/lib/types";
import { addDays, endOfDayIso, formatDateInput, startOfDayIso } from "@/lib/utils";

const activeBookingStatuses = ["scheduled", "confirmed", "rescheduled"] as string[];

export function buildEmptyRevenueSeries(days = 5): RevenuePoint[] {
  const today = new Date();
  const points: RevenuePoint[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = addDays(today, -index);
    const label = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "");

    points.push({
      label,
      revenue: 0,
      noShowRate: 0
    });
  }

  return points;
}

export function buildRevenueSeries(bookings: Booking[], days = 5): RevenuePoint[] {
  const today = new Date();
  const points: RevenuePoint[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = addDays(today, -index);
    const label = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "");
    const dayKey = formatDateInput(date);
    const dayBookings = bookings.filter((booking) => booking.startsAt.slice(0, 10) === dayKey);
    const attended = dayBookings.filter((booking) => booking.status === "attended").length;
    const expected = dayBookings.filter((booking) => activeBookingStatuses.includes(booking.status)).length;
    const missed = dayBookings.filter((booking) => booking.status === "missed").length;
    const total = dayBookings.length;

    points.push({
      label,
      revenue: (attended * 220) + (expected * 160),
      noShowRate: total === 0 ? 0 : Number(((missed / total) * 100).toFixed(1))
    });
  }

  return points;
}

export function buildDashboardInsights(
  todaysBookings: Booking[],
  recentBookings: Booking[],
  providers: Provider[]
): DashboardInsight[] {
  const activeToday = todaysBookings.filter((booking) =>
    activeBookingStatuses.includes(booking.status)
  );
  const confirmedToday = todaysBookings.filter((booking) => booking.status === "confirmed").length;
  const completedRecent = recentBookings.filter((booking) =>
    ["attended", "missed"].includes(booking.status)
  );
  const missedRecent = completedRecent.filter((booking) => booking.status === "missed").length;
  const rescheduledRecent = recentBookings.filter((booking) => booking.status === "rescheduled").length;
  const activeProviders = providers.filter((provider) => provider.isActive).length;

  return [
    {
      label: "Consultas confirmadas hoje",
      value: activeToday.length === 0 ? 0 : Math.round((confirmedToday / activeToday.length) * 100)
    },
    {
      label: "No-show nos últimos dias",
      value: completedRecent.length === 0 ? 0 : Math.round((missedRecent / completedRecent.length) * 100)
    },
    {
      label: "Reagendamentos no período",
      value: recentBookings.length === 0 ? 0 : Math.round((rescheduledRecent / recentBookings.length) * 100)
    },
    {
      label: "Profissionais ativos",
      value: providers.length === 0 ? 0 : Math.round((activeProviders / providers.length) * 100)
    }
  ];
}

export function buildCustomerRows(customers: Customer[], bookings: Booking[]): CustomerRow[] {
  const now = Date.now();

  return customers.map((customer) => {
    const relatedBookings = bookings
      .filter((booking) => booking.customerId === customer.id)
      .sort((left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime());

    const hasUpcoming = relatedBookings.some(
      (booking) => new Date(booking.startsAt).getTime() >= now && booking.status !== "cancelled"
    );
    const latestFinished = relatedBookings.find((booking) =>
      ["attended", "missed"].includes(booking.status)
    );

    return {
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      isActive: customer.isActive,
      status: hasUpcoming ? "active" : latestFinished ? "returning" : "pending",
      lastVisit: latestFinished ? latestFinished.startsAt.slice(0, 10) : "Sem histórico"
    };
  });
}

export function getPeriodRange(days: number): { from: string; to: string } {
  const end = new Date();
  const start = addDays(end, -(days - 1));

  return {
    from: startOfDayIso(start),
    to: endOfDayIso(end)
  };
}
