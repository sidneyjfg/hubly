"use client";

import { create } from "zustand";

export type FeedbackType = "success" | "error";

export type FeedbackMessage = {
  id: string;
  title: string;
  description?: string;
  type: FeedbackType;
};

type FeedbackState = {
  messages: FeedbackMessage[];
  dismiss: (id: string) => void;
  showFeedback: (message: Omit<FeedbackMessage, "id">) => void;
};

const createFeedbackId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useFeedbackStore = create<FeedbackState>()((set) => ({
  messages: [],
  dismiss: (id) =>
    set((state) => ({
      messages: state.messages.filter((message) => message.id !== id)
    })),
  showFeedback: (message) => {
    const id = createFeedbackId();

    set((state) => ({
      messages: [...state.messages, { ...message, id }].slice(-4)
    }));

    window.setTimeout(() => {
      set((state) => ({
        messages: state.messages.filter((item) => item.id !== id)
      }));
    }, 6_000);
  }
}));
