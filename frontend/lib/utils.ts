import type { UserRole } from "@/lib/types";

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function getDefaultRouteForRole(role: UserRole): string {
  if (role === "administrator") {
    return "/admin";
  }

  if (role === "provider") {
    return "/bookings";
  }

  return "/dashboard";
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    administrator: "Administrador",
    reception: "Recepção",
    provider: "Profissional"
  };

  return labels[role];
}

export function getRoleAccessDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    administrator: "Acesso total ao admin, operação e configurações da clínica.",
    reception: "Acesso operacional para agenda, pacientes e atendimento.",
    provider: "Acesso focado na própria rotina de agenda e atendimentos."
  };

  return descriptions[role];
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
}

export function formatTimeLabel(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatDateTimeLocalInput(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatDateInput(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function startOfDayIso(value: Date): string {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export function endOfDayIso(value: Date): string {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

export function addDays(value: Date, amount: number): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

export function getDisplayNameFromEmail(email: string): string {
  const [localPart] = email.split("@");
  const normalized = localPart.replace(/[._-]+/g, " ").trim();
  if (!normalized) {
    return email;
  }

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}
