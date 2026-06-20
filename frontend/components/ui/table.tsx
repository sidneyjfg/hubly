import { cn } from "@/lib/utils";

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10">
      <p className="border-b border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-400 md:hidden">
        Deslize para o lado para ver todas as informações.
      </p>
      <div className="overflow-x-auto [scrollbar-color:rgba(148,163,184,0.35)_transparent]">
        {children}
      </div>
    </div>
  );
}

export function TableRoot({ children }: { children: React.ReactNode }) {
  return <table className="min-w-[44rem] divide-y divide-white/10 md:min-w-full">{children}</table>;
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
  children,
  colSpan
}: {
  className?: string;
  children: React.ReactNode;
  colSpan?: number;
}) {
  return <td className={cn("px-4 py-4 text-sm text-slate-200 md:px-5", className)} colSpan={colSpan}>{children}</td>;
}
