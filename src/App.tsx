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
import Comunicati from "./pages/Comunicati";
import OpponentScout from "./pages/OpponentScout";
import FoglioCommento from "./pages/FoglioCommento";
import AdminAutomazioni from "./pages/admin/AdminAutomazioni";
import SalaStampa from "./pages/SalaStampa";
import { ScheduleProvider } from "./context/ScheduleContext";
import { AuthProvider } from "./context/AuthContext";
import { queryClient } from "@/queryClient";

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
                <Route path="/comunicati" element={<Comunicati />} />
                <Route path="/sala-stampa" element={<SalaStampa />} />
                <Route path="/campionato/sala-stampa" element={<SalaStampa />} />
                <Route path="/giocatori/lista-giocatori" element={<ListaGiocatori />} />
                <Route path="/giocatori/confronto-giocatori" element={<ConfrontoGiocatori />} />
                <Route path="/calendario" element={<Calendario />} />
                <Route path="/campionato/foglio-commento" element={<FoglioCommento />} />
                <Route path="/foglio-commento" element={<FoglioCommento />} />
                <Route path="/prossimo-avversario" element={<OpponentScout />} />
                <Route path="/avversario/:teamId?" element={<OpponentScout />} />
                <Route path="/draft" element={<Draft />} />
                <Route path="/mercato/scambi" element={<UfficialitaScambi />} />
                <Route path="/mia-squadra/roster" element={<Roster />} />
                <Route path="/mia-squadra/tattica" element={<Tattica />} />
                <Route path="/mia-squadra/allenamenti" element={<Allenamenti />} />
                <Route path="/mia-squadra/scouting" element={<Scouting />} />
                <Route path="/mia-squadra/confronto-giocatori" element={<ConfrontoGiocatori />} />
                <Route path="/mia-squadra/trattative" element={<Trattative />} />
                <Route path="/admin/automazioni" element={<AdminAutomazioni />} />
                <Route path="/amministrazione/automazioni" element={<AdminAutomazioni />} />
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
