import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Shield,
  Trophy,
  Activity,
  Target,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Flame,
  Clock,
} from "lucide-react";

export default function StatisticheSquadre() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-8 max-w-6xl">
        {/* Header Broadcast */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border/70">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold px-2.5 py-0.5 text-[11px] uppercase tracking-wider flex items-center gap-1.5"
              >
                <Shield className="h-3.5 w-3.5" />
                Serie A LCSIM • Statistiche di Squadra
              </Badge>
              <Badge
                variant="outline"
                className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold px-2 py-0.5 text-[10px] uppercase tracking-wider flex items-center gap-1"
              >
                <Clock className="h-3 w-3" />
                In Fase di Implementazione
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-emerald-500" />
              Statistiche Squadre
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Hub dedicato all'analisi prestazionale, telemetrie di gioco EA FC 25, trend e rendimento collettivo dei 12 club ufficiali della Lega.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button asChild variant="outline" className="text-xs font-bold gap-2">
              <Link to="/classifica">
                <Trophy className="h-4 w-4 text-amber-500" />
                Vai alla Classifica
              </Link>
            </Button>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2">
              <Link to="/squadre">
                <Shield className="h-4 w-4" />
                Vedi i 12 Club
              </Link>
            </Button>
          </div>
        </div>

        {/* Anteprima metriche e sezioni in arrivo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border/80 bg-card/60 relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-1">
                <Badge className="bg-blue-500/20 text-blue-500 border border-blue-500/30 text-[10px] font-bold">
                  Attacco &amp; Finalizzazione
                </Badge>
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <CardTitle className="text-lg font-bold">Efficienza Realizzativa</CardTitle>
              <CardDescription className="text-xs">
                Gol fatti per gara, tiri totali e nello specchio, conversione tiri/gol ed expected goals (xG) di squadra.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 text-xs text-muted-foreground">
              Analisi approfondita per valutare il peso offensivo e la precisione sotto porta di ciascun club.
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-1">
                <Badge className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-[10px] font-bold">
                  Fase Difensiva
                </Badge>
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <CardTitle className="text-lg font-bold">Solidità &amp; Clean Sheet</CardTitle>
              <CardDescription className="text-xs">
                Gol subiti, partite a porta inviolata (clean sheet), parate del portiere, contrasti vinti e intercettazioni.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 text-xs text-muted-foreground">
              Monitoraggio dei reparti arretrati per confrontare i moduli più ermetici del campionato.
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-1">
                <Badge className="bg-purple-500/20 text-purple-500 border border-purple-500/30 text-[10px] font-bold">
                  Controllo &amp; Possesso
                </Badge>
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <CardTitle className="text-lg font-bold">Dominio del Gioco</CardTitle>
              <CardDescription className="text-xs">
                Percentuale di possesso palla media, precisione passaggi, palle recuperate e ritmo di manovra.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 text-xs text-muted-foreground">
              Dati estratti direttamente dai tabellini e dalle 6 schede statistiche post-partita di EA Sports FC 25.
            </CardContent>
          </Card>
        </div>

        {/* Banner Informativo */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-card p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Sparkles className="h-4 w-4" />
              Sezione in arrivo nel prossimo rilascio
            </div>
            <h2 className="text-xl font-black text-foreground">
              I dati statistici dei 12 club verranno aggregati dai referti gara ufficiali
            </h2>
            <p className="text-xs text-muted-foreground max-w-xl">
              Con l'aggiornamento delle giornate di campionato e la lettura OCR delle telemetrie partita, questa pagina mostrerà la classifica comparativa completa di tutte le metriche di squadra.
            </p>
          </div>

          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shrink-0">
            <Link to="/statistiche">
              <span>Consulta Statistiche Calciatori</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
