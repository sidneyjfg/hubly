import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-panel/90 p-6 shadow-soft backdrop-blur",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
