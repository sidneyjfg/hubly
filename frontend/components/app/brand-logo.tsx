import { cn } from "@/lib/utils";

type BrandLogoProps = {
  compact?: boolean;
  showSlogan?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: {
    mark: "h-10 w-10",
    title: "text-lg",
    slogan: "text-[11px]"
  },
  md: {
    mark: "h-12 w-12",
    title: "text-xl",
    slogan: "text-xs"
  },
  lg: {
    mark: "h-16 w-16",
    title: "text-2xl",
    slogan: "text-sm"
  }
} as const;

export function BrandLogo({ compact = false, showSlogan = false, size = "md", className }: BrandLogoProps) {
  const config = sizeClasses[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-[1.4rem] bg-[linear-gradient(145deg,#6F3FF5_12%,#4A58FF_56%,#3A8CFF_100%)] shadow-[0_18px_44px_rgba(58,140,255,0.22)]",
          config.mark
        )}
      >
        <svg aria-hidden="true" className="h-[76%] w-[76%]" viewBox="0 0 64 64">
          <defs>
            <linearGradient id="hubly-mark-shine" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#f8f8ff" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          <rect fill="url(#hubly-mark-shine)" height="52" rx="7" width="10" x="6" y="6" />
          <rect fill="url(#hubly-mark-shine)" height="52" rx="7" width="10" x="48" y="6" />
          <path
            d="M16 20c7 0 11 3 16 8 5-5 9-8 16-8v8c-6 0-9 3-16 9-7-6-10-9-16-9z"
            fill="url(#hubly-mark-shine)"
          />
          <path
            d="M16 44c7 0 11-3 16-8 5 5 9 8 16 8v-8c-6 0-9-3-16-9-7 6-10 9-16 9z"
            fill="url(#hubly-mark-shine)"
          />
          <circle cx="32" cy="32" fill="#6F3FF5" r="7.5" />
          <circle cx="32" cy="32" fill="white" r="3.2" />
        </svg>
      </div>

      {compact ? null : (
        <div className="min-w-0">
          <p className={cn("font-semibold tracking-[-0.04em] text-white", config.title)}>Hubly</p>
          {showSlogan ? (
            <p className={cn("text-[#C9CCF8]", config.slogan)}>Conecta voce aos melhores servicos</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
