import { cn } from "@/lib/utils";
import type { BookingStatus, CustomerStatus } from "@/lib/types";

type BadgeVariant = BookingStatus | CustomerStatus;

const badgeStyles: Record<BadgeVariant, string> = {
  active: "bg-emerald-500/15 text-emerald-300",
  pending: "bg-amber-500/15 text-amber-300",
  returning: "bg-sky-500/15 text-sky-300",
  scheduled: "bg-slate-500/15 text-slate-300",
  confirmed: "bg-emerald-500/15 text-emerald-300",
  cancelled: "bg-rose-500/15 text-rose-300",
  rescheduled: "bg-violet-500/15 text-violet-300",
  attended: "bg-cyan-500/15 text-cyan-300",
  missed: "bg-rose-500/15 text-rose-300"
};

export function StatusBadge({ status }: { status: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize tracking-wide",
        badgeStyles[status]
      )}
    >
      {status}
    </span>
  );
}
