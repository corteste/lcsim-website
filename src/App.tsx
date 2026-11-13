import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import ArchivioStagioni from "./pages/ArchivioStagioni";
import ArchivioStatisticheSquadre from "./pages/ArchivioStatisticheSquadre";
import HallOfFame from "./pages/HallOfFame";
import RecordAllTime from "./pages/RecordAllTime";
import ArchivioWiki from "./pages/ArchivioWiki";
import Draft from "./pages/Draft";
import Trattative from "./pages/Trattative";
import UfficialitaScambi from "./pages/UfficialitaScambi";
import Comunicati from "./pages/Comunicati";
import OpponentScout from "./pages/OpponentScout";
import FoglioCommento from "./pages/FoglioCommento";
import AdminAutomazioni from "./pages/admin/AdminAutomazioni";
import SalaStampa from "./pages/SalaStampa";
import StatisticheSquadre from "./pages/StatisticheSquadre";
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
                <Route path="/squadre" element={<Rose />} />
                <Route path="/rose" element={<Rose />} />
                <Route path="/statistiche-squadre" element={<StatisticheSquadre />} />
                <Route path="/squadre/statistiche" element={<StatisticheSquadre />} />
                <Route path="/statistiche" element={<Statistiche />} />
                <Route path="/comunicati" element={<Comunicati />} />
                <Route path="/inbox" element={<SalaStampa />} />
                <Route path="/sala-stampa" element={<Navigate to="/inbox" replace />} />
                <Route path="/campionato/sala-stampa" element={<Navigate to="/inbox" replace />} />
                <Route path="/giocatori/lista-giocatori" element={<ListaGiocatori />} />
                <Route path="/giocatori/confronto-giocatori" element={<ConfrontoGiocatori />} />
                <Route path="/calendario" element={<Calendario />} />
                <Route path="/probabili-formazioni" element={<FoglioCommento />} />
                <Route path="/media/probabili-formazioni" element={<FoglioCommento />} />
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
                <Route path="/mia-squadra/graduatoria" element={<Navigate to="/mia-squadra/scouting?tab=autopick" replace />} />
                <Route path="/mia-squadra/graduatoria-draft" element={<Navigate to="/mia-squadra/scouting?tab=autopick" replace />} />
                <Route path="/mia-squadra/confronto-giocatori" element={<ConfrontoGiocatori />} />
                <Route path="/mia-squadra/trattative" element={<Trattative />} />
                <Route path="/admin/automazioni" element={<AdminAutomazioni />} />
                <Route path="/amministrazione/automazioni" element={<AdminAutomazioni />} />
                <Route path="/archivio/stagioni" element={<ArchivioStagioni />} />
                <Route path="/archivio/statistiche-squadre" element={<ArchivioStatisticheSquadre />} />
                <Route path="/archivio/giocatori" element={<ArchivioGiocatori />} />
                <Route path="/archivio/hall-of-fame" element={<HallOfFame />} />
                <Route path="/archivio/record" element={<RecordAllTime />} />
                <Route path="/archivio/wiki" element={<ArchivioWiki />} />
                <Route path="/archivio/wiki/:slug" element={<ArchivioWiki />} />
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
