import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Classifica from "./pages/Classifica";
import Rose from "./pages/Rose";
import Statistiche from "./pages/Statistiche";
import Calendario from "./pages/Calendario";
import MiaSquadra from "./pages/MiaSquadra";
import NotFound from "./pages/NotFound";
import ListaGiocatori from "./pages/ListaGiocatori";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/classifica" element={<Classifica />} />
          <Route path="/rose" element={<Rose />} />
          <Route path="/statistiche" element={<Statistiche />} />
          <Route path="/lista-giocatori" element={<ListaGiocatori />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/mia-squadra" element={<MiaSquadra />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
