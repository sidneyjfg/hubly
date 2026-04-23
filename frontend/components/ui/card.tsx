import { cn } from "@/lib/utils";

export function Card({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-panel/90 p-6 shadow-soft backdrop-blur",
        className
      )}
    >
      {children}
    </div>
  );
}
