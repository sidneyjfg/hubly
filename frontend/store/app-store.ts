"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AuthSession, FakeUser } from "@/lib/types";
import { getDisplayNameFromEmail } from "@/lib/utils";

type AppState = {
  hasHydrated: boolean;
  session: AuthSession | null;
  currentUser: FakeUser | null;
  isAuthenticated: boolean;
  setHydrated: (value: boolean) => void;
  login: (session: AuthSession, email: string) => void;
  updateSession: (session: AuthSession) => void;
  setCurrentUser: (user: FakeUser) => void;
  logout: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      session: null,
      currentUser: null,
      isAuthenticated: false,
      setHydrated: (value) =>
        set({
          hasHydrated: value
        }),
      login: (session, email) =>
        set({
          session,
          isAuthenticated: true,
          currentUser: {
            id: session.actorId,
            actorId: session.actorId,
            clinicId: session.clinicId,
            email,
            fullName: getDisplayNameFromEmail(email),
            displayName: getDisplayNameFromEmail(email),
            role: session.role
          }
        }),
      updateSession: (session) =>
        set((state) => ({
          session,
          isAuthenticated: true,
          currentUser: state.currentUser
            ? {
                ...state.currentUser,
                clinicId: session.clinicId,
                actorId: session.actorId,
                role: session.role
              }
            : null
        })),
      setCurrentUser: (currentUser) =>
        set({
          currentUser
        }),
      logout: () =>
        set({
          session: null,
          isAuthenticated: false,
          currentUser: null
        })
    }),
    {
      name: "clinity-frontend-store",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined
          };
        }

        return window.localStorage;
      }),
      partialize: (state) => ({
        session: state.session,
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);
