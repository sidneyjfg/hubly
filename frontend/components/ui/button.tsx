import Link from "next/link";
import type { Route } from "next";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

const baseStyles =
  "inline-flex items-center justify-center rounded-lg font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "bg-primary text-primary-foreground shadow-glow hover:bg-primary/90",
  secondary: "border border-white/12 bg-white/6 text-white hover:bg-white/10",
  ghost: "text-slate-300 hover:bg-white/6 hover:text-white"
};

const sizes = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base"
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return <button className={cn(baseStyles, variants[variant], sizes[size], className)} {...props} />;
}

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function ButtonLink({
  href,
  children,
  className,
  variant = "primary",
  size = "md"
}: ButtonLinkProps) {
  if (href.startsWith("#")) {
    return (
      <a className={cn(baseStyles, variants[variant], sizes[size], className)} href={href}>
        {children}
      </a>
    );
  }

  return (
    <Link className={cn(baseStyles, variants[variant], sizes[size], className)} href={href as Route}>
      {children}
    </Link>
  );
}
