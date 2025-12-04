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
import ConfrontoGiocatori from "./pages/ConfrontoGiocatori";
import { ScheduleProvider } from "./context/ScheduleContext";

const queryClient = new QueryClient();

const App = () => (
  <ScheduleProvider>   {/* <-- WRAP QUI TUTTA L’APP */}
    <QueryClientProvider client={queryClient}>
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
              <Route path="/mia-squadra/roster" element={<Roster />} />
              <Route path="/mia-squadra/tattica" element={<Tattica />} />
              <Route path="/mia-squadra/allenamenti" element={<Allenamenti />} />
              <Route path="/mia-squadra/confronto-giocatori" element={<ConfrontoGiocatori />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ScheduleProvider>
);

export default App;
