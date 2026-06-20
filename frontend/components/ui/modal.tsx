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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 max-h-[92dvh] w-full overscroll-contain overflow-y-auto rounded-t-3xl border border-white/10 bg-panel p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-soft sm:max-w-xl sm:rounded-2xl sm:p-6",
          className
        )}
      >
        <div className="sticky -top-4 z-20 -mx-4 mb-5 flex items-center justify-between border-b border-white/10 bg-panel/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-6 sm:border-0 sm:bg-transparent sm:p-0">
          <h3 className="pr-3 text-lg font-semibold text-white sm:text-xl">{title}</h3>
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
