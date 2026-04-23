"use client";

import { CheckCircle2, XCircle } from "lucide-react";

import { useFeedbackStore } from "@/store/feedback-store";
import { cn } from "@/lib/utils";

export function FeedbackToasts() {
  const messages = useFeedbackStore((state) => state.messages);
  const dismiss = useFeedbackStore((state) => state.dismiss);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-[80] flex w-[calc(100vw-2rem)] max-w-md flex-col gap-3">
      {messages.map((message) => {
        const Icon = message.type === "success" ? CheckCircle2 : XCircle;

        return (
          <button
            className={cn(
              "rounded-xl border p-4 text-left shadow-2xl backdrop-blur transition hover:scale-[1.01]",
              message.type === "success"
                ? "border-emerald-300/25 bg-emerald-950/90 text-emerald-50"
                : "border-rose-300/25 bg-rose-950/90 text-rose-50"
            )}
            key={message.id}
            onClick={() => dismiss(message.id)}
            type="button"
          >
            <div className="flex gap-3">
              <Icon className="mt-0.5 h-5 w-5 flex-none" />
              <div>
                <p className="font-semibold">{message.title}</p>
                {message.description ? <p className="mt-1 text-sm opacity-85">{message.description}</p> : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
