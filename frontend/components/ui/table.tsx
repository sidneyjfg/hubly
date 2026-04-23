import { cn } from "@/lib/utils";

export function Table({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-xl border border-white/10">{children}</div>;
}

export function TableRoot({ children }: { children: React.ReactNode }) {
  return <table className="min-w-full divide-y divide-white/10">{children}</table>;
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.18em] text-slate-400">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-white/8 bg-panelAlt/70">{children}</tbody>;
}

export function TableRow({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <tr className={cn("transition hover:bg-white/[0.03]", className)}>{children}</tr>;
}

export function TableCell({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <td className={cn("px-5 py-4 text-sm text-slate-200", className)}>{children}</td>;
}
