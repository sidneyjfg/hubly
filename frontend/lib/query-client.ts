import { MutationCache, QueryClient } from "@tanstack/react-query";

import { useFeedbackStore } from "@/store/feedback-store";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      errorMessage?: string;
      successMessage?: string;
      suppressErrorFeedback?: boolean;
      suppressSuccessFeedback?: boolean;
    };
  }
}

function getErrorDescription(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Não foi possível concluir a ação. Tente novamente.";
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.suppressErrorFeedback) {
          return;
        }

        useFeedbackStore.getState().showFeedback({
          type: "error",
          title: mutation.meta?.errorMessage ?? "Ação não concluída",
          description: getErrorDescription(error)
        });
      },
      onSuccess: (_data, _variables, _context, mutation) => {
        if (mutation.meta?.suppressSuccessFeedback) {
          return;
        }

        useFeedbackStore.getState().showFeedback({
          type: "success",
          title: mutation.meta?.successMessage ?? "Ação concluída com sucesso"
        });
      }
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false
      }
    }
  });
}
