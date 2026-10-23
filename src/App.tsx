import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Home from "./pages/Home";
import Classifica from "./pages/Classifica";
import Rose from "./pages/Rose";
import Statistiche from "./pages/Statistiche";
import Calendario from "./pages/Calendario";
import NotFound from "./pages/NotFound";
import ListaGiocatori from "./pages/ListaGiocatori";
import Roster from "./pages/Roster";
import Tattica from "./pages/Tattica";
import Allenamenti from "./pages/Allenamenti";
import Scouting from "./pages/Scouting";
import ConfrontoGiocatori from "./pages/ConfrontoGiocatori";
import ArchivioGiocatori from "./pages/ArchivioGiocatori";
import HallOfFame from "./pages/HallOfFame";
import Draft from "./pages/Draft";
import Trattative from "./pages/Trattative";
import UfficialitaScambi from "./pages/UfficialitaScambi";
import { ScheduleProvider } from "./context/ScheduleContext";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minuti di cache fresca
      gcTime: 10 * 60 * 1000,    // 10 minuti di conservazione in memoria
      refetchOnWindowFocus: false, // Disabilita chiamate inutili al cambio tab
      retry: 1,
    },
  },
});

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <ScheduleProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/classifica" element={<Classifica />} />
                <Route path="/rose" element={<Rose />} />
                <Route path="/statistiche" element={<Statistiche />} />
                <Route path="/giocatori/lista-giocatori" element={<ListaGiocatori />} />
                <Route path="/giocatori/confronto-giocatori" element={<ConfrontoGiocatori />} />
                <Route path="/calendario" element={<Calendario />} />
                <Route path="/draft" element={<Draft />} />
                <Route path="/mercato/scambi" element={<UfficialitaScambi />} />
                <Route path="/mia-squadra/roster" element={<Roster />} />
                <Route path="/mia-squadra/tattica" element={<Tattica />} />
                <Route path="/mia-squadra/allenamenti" element={<Allenamenti />} />
                <Route path="/mia-squadra/scouting" element={<Scouting />} />
                <Route path="/mia-squadra/confronto-giocatori" element={<ConfrontoGiocatori />} />
                <Route path="/mia-squadra/trattative" element={<Trattative />} />
                <Route path="/archivio/giocatori" element={<ArchivioGiocatori />} />
                <Route path="/archivio/hall-of-fame" element={<HallOfFame />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </ScheduleProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
