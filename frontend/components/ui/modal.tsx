"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-panel p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-soft sm:rounded-2xl sm:p-6",
          className
        )}
      >
        <div className="mb-5 flex items-center justify-between sm:mb-6">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button
            aria-label="Fechar modal"
            className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
