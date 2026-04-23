"use client";

import { cn } from "@/lib/utils";

type ToggleProps = {
  checked: boolean;
  onChange: () => void;
};

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      aria-pressed={checked}
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full transition",
        checked ? "bg-primary" : "bg-white/10"
      )}
      onClick={onChange}
      type="button"
    >
      <span
        className={cn(
          "ml-1 h-5 w-5 rounded-full bg-white transition",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}
