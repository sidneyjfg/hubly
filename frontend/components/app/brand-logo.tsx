import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  compact?: boolean;
  showSlogan?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: {
    markImage: "h-10 w-10",
    title: "text-lg",
    titleGap: "gap-2",
  },
  md: {
    markImage: "h-12 w-12",
    title: "text-xl",
    titleGap: "gap-3",
  },
  lg: {
    markImage: "h-16 w-16",
    title: "text-2xl",
    titleGap: "gap-3",
  }
} as const;

export function BrandLogo({ compact = false, showSlogan = false, size = "md", className }: BrandLogoProps) {
  const config = sizeClasses[size];

  if (compact) {
    return (
      <div className={cn("flex items-center", className)}>
        <Image
          alt="Hubly"
          className={cn("w-auto object-contain", config.markImage)}
          height={128}
          priority
          src="/brand/logo-icon.svg"
          width={164}
        />
      </div>
    );
  }

  if (showSlogan) {
    return (
      <div className={cn("flex items-center", className)}>
        <Image
          alt="Hubly - Conecta voce aos melhores servicos"
          className="h-auto w-auto max-w-full object-contain"
          height={210}
          priority
          src="/brand/logo-horizontal-light.svg"
          width={760}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", config.titleGap, className)}>
      <Image
        alt="Hubly"
        className={cn("w-auto object-contain", config.markImage)}
        height={128}
        priority
        src="/brand/logo-icon.svg"
        width={164}
      />
      <div className="min-w-0">
        <p className={cn("font-semibold tracking-[-0.04em] text-white", config.title)}>Hubly</p>
      </div>
    </div>
  );
}
