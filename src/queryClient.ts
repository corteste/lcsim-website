import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 secondi di cache fresca invece di 5-10 minuti
      gcTime: 10 * 60 * 1000, // 10 minuti di conservazione in memoria
      refetchOnWindowFocus: false, // Disabilita chiamate inutili al cambio tab
      retry: 1,
    },
  },
});

/**
 * Invalida le cache relative alle rose delle squadre, ai giocatori e alle trattative
 * per forzare un ricaricamento istantaneo in tutte le schermate.
 */
export function invalidateRostersAndTrades() {
  queryClient.invalidateQueries({ queryKey: ["teams"] });
  queryClient.invalidateQueries({ queryKey: ["team"] });
  queryClient.invalidateQueries({ queryKey: ["players"] });
  queryClient.invalidateQueries({ queryKey: ["completed-trades"] });
  queryClient.invalidateQueries({ queryKey: ["trades"] });
}
