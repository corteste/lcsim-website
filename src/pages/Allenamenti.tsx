import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useMemo, useState } from "react";
import { Player } from "@/types/player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Minus, TrendingUp, Award, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TraitSystem from "@/components/training/TraitSystem";
import RoleSystem from "@/components/training/RoleSystem";
import { getPlayers } from "@/hooks/use-players";
import { useAuth } from "@/context/AuthContext";

/* NOMI DELLE SINGOLE STATISTICHE */
type StatKey =
  | "PREP"  | "POSP"  | "RINP"  | "RIFP"  | "TUFP"  | "CONT"  | "SCIV"  | "MARC"  | "AGGR"  | "INTR"  | "PASC"  | "PASL"  | "CRSS"  | "CTRP"
  | "VISI"  | "EFFT"  | "PTIR"  | "TIRD"  | "TIRV"  | "DRBL"  | "PIAZ"  | "FINA"  | "ACCL"  | "VELO"  | "AGIL"  | "RESI"  | "EQLB"  | "FRZA"
  | "TSTA"  | "RIFL"  | "ELEV"  | "PNIZ"  | "CRIG";

/* ... statMeta and groupRows unchanged ... */
const statMeta: Record<StatKey, { label: string; short?: string }> = {
  PREP: { label: "POR Presa", short: "PREP" },
  POSP: { label: "POR Posizionamento", short: "RIFP" },
  RINP: { label: "POR Rinvio", short: "RINP" },
  RIFP: { label: "POR Riflessi", short: "RIFP" },
  TUFP: { label: "POR Tuffo", short: "TUFP" },
  CONT: { label: "Contrasto", short: "CONT" },
  SCIV: { label: "Scivolata", short: "SCIV" },
  MARC: { label: "Marcatura", short: "MARC" },
  AGGR: { label: "Aggressività", short: "AGGR" },
  INTR: { label: "Intercettazione", short: "INTR" },
  PASC: { label: "Passaggio Corto", short: "PASC" },
  PASL: { label: "Passaggio Lungo", short: "PASL" },
  CRSS: { label: "Cross", short: "CRSS" },
  CTRP: { label: "Controllo Palla", short: "CTRP" },
  VISI: { label: "Visione di Gioco", short: "VISI" },
  EFFT: { label: "Effetto", short: "EFFT" },
  PTIR: { label: "Potenza Tiro", short: "PTIR" },
  TIRD: { label: "Tiri dala Distanza", short: "TIRD" },
  TIRV: { label: "Tiri al Volo", short: "TIRV" },
  DRBL: { label: "Dribbling", short: "DRBL" },
  PIAZ: { label: "Piazzamento", short: "PIAZ" },
  FINA: { label: "Finalizzazione", short: "FINA" },
  ACCL: { label: "Accelerazione", short: "ACCL" },
  VELO: { label: "Velocità", short: "VELO" },
  AGIL: { label: "Agilità", short: "AGIL" },
  RESI: { label: "Resistenza", short: "RESI" },
  EQLB: { label: "Equilibrio", short: "EQLB" },
  FRZA: { label: "Forza", short: "FRZA" },
  TSTA: { label: "Colpi di Testa", short: "TSTA" },
  RIFL: { label: "Riflessi", short: "RIFL" },
  ELEV: { label: "Elevazione", short: "ELEV" },
  PNIZ: { label: "Punizioni", short: "PNIZ" },
  CRIG: { label: "Rigori", short: "CRIG" },
};

const groupRows: { key: string; label: string; subs: StatKey[] }[] = [
  { key: "PORT", label: "POR Tecnico", subs: ["PREP", "POSP", "RINP"] },
  { key: "PORF", label: "POR Fisico", subs: ["RIFP", "TUFP"] },
  { key: "DIFF", label: "DIF Fisico", subs: ["CONT", "SCIV"] },
  { key: "DIFM", label: "DIF Mentale", subs: ["MARC", "AGGR","INTR"] },
  { key: "CENP", label: "CEN Passaggi", subs: ["PASC", "PASL", "CRSS"] },
  { key: "CENG", label: "CEN Gestione", subs: ["CTRP", "VISI", "EFFT"] },
  { key: "ATTT", label: "ATT Tiri", subs: ["PTIR", "TIRD","TIRV"] },
  { key: "ATTC", label: "ATT Controllo", subs: ["DRBL", "PIAZ","FINA"] },
  { key: "FISV", label: "FIS Velocità", subs: ["ACCL", "VELO", "AGIL"] },
  { key: "FISP", label: "FIS Potenza", subs: ["RESI", "EQLB", "FRZA"] },
  { key: "FISR", label: "FIS Prontezza", subs: ["TSTA", "RIFL", "ELEV"] },
  { key: "CALC", label: "Calci piazzati", subs: ["PNIZ","CRIG"] },
];

const COST_PER_POINT = 1; // regola il costo XP per ogni punto aumentato

// helper: crea oggetto vuoto con tutte le StatKey a 0
const emptyStats = (): Record<StatKey, number> =>
  (Object.keys(statMeta) as StatKey[]).reduce((acc, k) => { acc[k] = 0; return acc; }, {} as Record<StatKey, number>);

// mappa un Player (DB) nel formato Record<StatKey, number> in modo robusto
const mapPlayerToStats = (p: Player | undefined | null): Record<StatKey, number> => {
  const out = emptyStats();
  if (!p) return out;

  // possibili sorgenti: campi flat p[KEY], p.stats oggetto, p.Attributi JSON/string
  const sources: any[] = [];
  if ((p as any).stats && typeof (p as any).stats === "object") sources.push((p as any).stats);
  if ((p as any).Attributi) {
    try {
      const parsed = typeof (p as any).Attributi === "string" ? JSON.parse((p as any).Attributi) : (p as any).Attributi;
      if (parsed && typeof parsed === "object") sources.push(parsed);
    } catch { /* ignore */ }
  }
  // row fields
  sources.push(p);

  for (const k of Object.keys(statMeta) as StatKey[]) {
    let v: any = undefined;
    for (const src of sources) {
      if (!src) continue;
      if (src[k] !== undefined && src[k] !== null) { v = src[k]; break; }
      // some DB use lowercase keys
      if (src[k.toLowerCase()] !== undefined && src[k.toLowerCase()] !== null) { v = src[k.toLowerCase()]; break; }
    }
    out[k] = Number.isFinite(Number(v)) ? Number(v) : 0;
  }

  return out;
};

const Allenamenti = () => {
  const { user } = useAuth();
  const userTeam = user?.team;
  const { players } = getPlayers(userTeam);
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [xpSpentExtra, setXpSpentExtra] = useState(0);

  const player = useMemo(() => {
    if (!selectedId) return null;
    return players.find((p) => (p as any).ID === selectedId || (p as any).id === selectedId) ?? null;
  }, [players, selectedId]);

  // aumenti per gruppo
  const [increases, setIncreases] = useState<Record<string, number>>(() =>
    groupRows.reduce((acc, r) => {
      acc[r.key] = 0;
      return acc;
    }, {} as Record<string, number>)
  );

  // reset increases when player changes
  const handlePlayerChange = (id: number) => {
    setSelectedId(id);
    setXpSpentExtra(0);
    setIncreases((prev) => {
      const fresh = { ...prev };
      for (const k of Object.keys(fresh)) fresh[k] = 0;
      return fresh;
    });
  };

  const setIncrease = (groupKey: string, value: number) => {
    const newVal = Math.max(0, Math.min(25, Math.round(value)));
    setIncreases({ ...increases, [groupKey]: newVal });
  };

  const preStats = useMemo(() => mapPlayerToStats(player), [player]);
  // applica gli aumenti di gruppo a ciascun sotto-attributo (post)
  const postStats = useMemo(() => {
    const out = { ...preStats };
    for (const g of groupRows) {
      const inc = increases[g.key] || 0;
      for (const sub of g.subs) out[sub] = (preStats[sub] ?? 0) + inc;
    }
    return out;
  }, [preStats, increases]);

  const totalCost = groupRows.reduce((s, g) => s + (increases[g.key] || 0) * g.subs.length * COST_PER_POINT, 0);
  const xpAvailable = player ? Number((player as any).XP ?? (player as any).xp ?? 0) : 0;
  const xpRemaining = xpAvailable - totalCost - xpSpentExtra;

  const handleExtraXpSpent = (cost: number) => setXpSpentExtra((prev) => prev + cost);

  const handleSave = async () => {
    if (!player) return;
    setIsSaving(true);
    try {
      // TODO: implementare salvataggio reale a DB
      // Dati da salvare: postStats, increases, totalCost, xpRemaining, player ID
      console.log("Mock save:", {
        playerId: (player as any).ID ?? (player as any).id,
        postStats,
        increases,
        totalCost,
        xpRemaining,
      });
      await new Promise((resolve) => setTimeout(resolve, 800)); // simula latenza
      toast({
        title: "Allenamento salvato",
        description: `Dati salvati per ${(player as any).Nome ?? ""} ${(player as any).Cognome ?? ""}. (Mock)`,
      });
    } catch {
      toast({ title: "Errore", description: "Salvataggio fallito.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Pesi per la media ponderata basata sul ruolo
  const roleWeights: Record<string, Record<StatKey, number>> = {
    'POR': {
      PREP: 21, POSP: 21, RINP: 5, RIFP: 21, TUFP: 21,
      CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
      PASC: 0, PASL: 0, CRSS: 0, CTRP: 0, VISI: 0, EFFT: 0,
      PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
      ACCL: 0, VELO: 0, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 0,
      TSTA: 0, RIFL: 11, ELEV: 0, PNIZ: 0, CRIG: 0,
    },
    'DC': {
      PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
      CONT: 17, SCIV: 10, MARC: 14, AGGR: 7, INTR: 13,
      PASC: 5, PASL: 0, CRSS: 0, CTRP: 4, VISI: 0, EFFT: 0,
      PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
      ACCL: 0, VELO: 2, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 10,
      TSTA: 10, RIFL: 5, ELEV: 3, PNIZ: 0, CRIG: 0,
    },
    'TS': {
      PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
      CONT: 11, SCIV: 14, MARC: 8, AGGR: 0, INTR: 12,
      PASC: 7, PASL: 0, CRSS: 9, CTRP: 7, VISI: 0, EFFT: 0,
      PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
      ACCL: 5, VELO: 7, AGIL: 0, RESI: 8, EQLB: 0, FRZA: 0,
      TSTA: 4, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0,
    },
    'TD': {
      PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
      CONT: 11, SCIV: 14, MARC: 8, AGGR: 0, INTR: 12,
      PASC: 7, PASL: 0, CRSS: 9, CTRP: 7, VISI: 0, EFFT: 0,
      PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
      ACCL: 5, VELO: 7, AGIL: 0, RESI: 8, EQLB: 0, FRZA: 0,
      TSTA: 4, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0,
    },
    'CDC': {
      PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
      CONT: 12, SCIV: 5, MARC: 9, AGGR: 5, INTR: 14,
      PASC: 14, PASL: 10, CRSS: 0, CTRP: 10, VISI: 4, EFFT: 0,
      PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
      ACCL: 0, VELO: 0, AGIL: 0, RESI: 6, EQLB: 0, FRZA: 4,
      TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0,
    },
    'CC': {
      PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
      CONT: 5, SCIV: 0, MARC: 0, AGGR: 0, INTR: 5,
      PASC: 17, PASL: 13, CRSS: 0, CTRP: 14, VISI: 13, EFFT: 0,
      PTIR: 0, TIRD: 4, TIRV: 0, DRBL: 7, PIAZ: 6, FINA: 2,
      ACCL: 0, VELO: 0, AGIL: 0, RESI: 6, EQLB: 0, FRZA: 0,
      TSTA: 0, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0,
    },
    'ED': {
      PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
      CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
      PASC: 11, PASL: 5, CRSS: 10, CTRP: 13, VISI: 7, EFFT: 0,
      PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 15, PIAZ: 8, FINA: 6,
      ACCL: 7, VELO: 6, AGIL: 0, RESI: 5, EQLB: 0, FRZA: 0,
      TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0,
    },
    'ES': {
      PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
      CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
      PASC: 11, PASL: 5, CRSS: 10, CTRP: 13, VISI: 7, EFFT: 0,
      PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 15, PIAZ: 8, FINA: 6,
      ACCL: 7, VELO: 6, AGIL: 0, RESI: 5, EQLB: 0, FRZA: 0,
      TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0,
    },
    'COC': {
      PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
      CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
      PASC: 16, PASL: 4, CRSS: 0, CTRP: 15, VISI: 14, EFFT: 0,
      PTIR: 0, TIRD: 5, TIRV: 0, DRBL: 13, PIAZ: 9, FINA: 7,
      ACCL: 4, VELO: 3, AGIL: 3, RESI: 0, EQLB: 0, FRZA: 0,
      TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0,
    },
    'AD': {
      PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
      CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
      PASC: 9, PASL: 0, CRSS: 9, CTRP: 14, VISI: 6, EFFT: 0,
      PTIR: 0, TIRD: 4, TIRV: 0, DRBL: 16, PIAZ: 9, FINA: 10,
      ACCL: 7, VELO: 6, AGIL: 3, RESI: 0, EQLB: 0, FRZA: 0,
      TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0,
    },
    'AS': {
      PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
      CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
      PASC: 9, PASL: 0, CRSS: 9, CTRP: 14, VISI: 6, EFFT: 0,
      PTIR: 0, TIRD: 4, TIRV: 0, DRBL: 16, PIAZ: 9, FINA: 10,
      ACCL: 7, VELO: 6, AGIL: 3, RESI: 0, EQLB: 0, FRZA: 0,
      TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0,
    },
    'AT': {
      PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
      CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
      PASC: 5, PASL: 0, CRSS: 0, CTRP: 10, VISI: 0, EFFT: 0,
      PTIR: 10, TIRD: 3, TIRV: 2, DRBL: 7, PIAZ: 13, FINA: 18,
      ACCL: 4, VELO: 5, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 5,
      TSTA: 10, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0,
    },
    'ATT': {
      PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
      CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
      PASC: 5, PASL: 0, CRSS: 0, CTRP: 10, VISI: 0, EFFT: 0,
      PTIR: 10, TIRD: 3, TIRV: 2, DRBL: 7, PIAZ: 13, FINA: 18,
      ACCL: 4, VELO: 5, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 5,
      TSTA: 10, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0,
    },
  };

  const computeOverall = (stats: Record<StatKey, number>, role: string) => {
    const weights = roleWeights[role] || {};
    let totalWeighted = 0;
    let totalWeight = 0;
    for (const key in stats) {
      const weight = weights[key as StatKey] || 0;
      totalWeighted += stats[key as StatKey] * weight;
      totalWeight += weight;
    }
    if (totalWeight === 0) return 0;
    return Math.round(totalWeighted / totalWeight);
  };

  const preOverall = computeOverall(preStats, (player as any)?.Posiz ?? '');
  const postOverall = computeOverall(postStats, (player as any)?.Posiz ?? '');

  // UI: se player non selezionato mostra lista vuota / caricamento
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Allenamenti</h1>
          <p className="text-muted-foreground">Pianifica gli allenamenti per singoli giocatori</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* left column: selezione e riepilogo XP */}
          <div className="col-span-12 lg:col-span-2">
            <Card className="shadow">
              <CardHeader>
                <CardTitle>Giocatore</CardTitle>
                <CardDescription>Seleziona e visualizza XP</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <select
                    value={selectedId ?? ""}
                    onChange={(e) => handlePlayerChange(Number(e.target.value))}
                    className="w-full p-2 border rounded bg-card"
                  >
                    <option value="">Seleziona...</option>
                    {players.map((p) => (
                      <option key={(p as any).ID ?? (p as any).id} value={(p as any).ID ?? (p as any).id}>
                        {(p as any).Nome ?? (p as any).name} {(p as any).Cognome ?? (p as any).surname} ({(p as any).Posiz ?? (p as any).pos})
                      </option>
                    ))}
                  </select>

                  <div className="text-center py-6 border rounded">
                    <div className="text-sm text-muted-foreground">Punti XP Totale</div>
                    <div className="text-4xl font-bold">{xpAvailable}</div>
                  </div>

                  <div className="text-center py-4 border rounded">
                    <div className="text-sm text-muted-foreground">Costo XP Totale</div>
                    <div className="text-2xl font-bold">{totalCost}</div>
                    <div className={`mt-2 ${xpRemaining < 0 ? "text-red-500" : "text-foreground"}`}>
                      Punti XP Rimasti: {xpRemaining}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Aumento massimo per gruppo: 25
                  </div>

                  <Button
                    className="w-full mt-2"
                    disabled={!player || totalCost === 0 || xpRemaining < 0 || isSaving}
                    onClick={handleSave}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Salvataggio..." : "Applica Allenamento"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* center: tab section */}
          <div className="col-span-12 lg:col-span-8">
            <Tabs defaultValue="attributi" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="attributi">Dettaglio Attributi</TabsTrigger>
                <TabsTrigger value="ruolo">Ruolo & Ruolo+</TabsTrigger>
                <TabsTrigger value="tratti">Tratti</TabsTrigger>
              </TabsList>

              <TabsContent value="attributi">
                <Card className="shadow-lg border-primary/10">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <CardTitle>Dettaglio Attributi</CardTitle>
                    </div>
                    <CardDescription>Gestisci gli allenamenti per gruppo di attributi</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groupRows.map((g) => {
                        const inc = increases[g.key] ?? 0;
                        const cost = inc * g.subs.length * COST_PER_POINT;
                        const hasChange = inc > 0;

                        return (
                          <Card key={g.key} className={`transition-all duration-300 hover:shadow-md ${hasChange ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
                            <CardHeader className="pb-2 pt-4 px-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-sm font-semibold">{g.label}</CardTitle>
                                  {hasChange && (
                                    <Badge variant="secondary" className="text-xs animate-fade-in">
                                      +{inc}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-6 w-6"
                                    onClick={() => setIncrease(g.key, (increases[g.key] ?? 0) - 1)}
                                    disabled={inc === 0}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <input
                                    min={0}
                                    max={25}
                                    value={inc}
                                    onChange={(e) => setIncrease(g.key, Number(e.target.value || 0))}
                                    className="w-10 px-1 py-0.5 text-center text-sm border rounded bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                                  />
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-6 w-6"
                                    onClick={() => setIncrease(g.key, (increases[g.key] ?? 0) + 1)}
                                    disabled={inc >= 25}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-1 pb-3 px-4">
                              <div className="space-y-0.5">
                                <div className="flex items-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-0.5">
                                  <span className="flex-1">Attr</span>
                                  <span className="w-10 text-center">Pre</span>
                                  <span className="w-10 text-center">Post</span>
                                </div>
                                {g.subs.map((s) => (
                                  <div key={s} className={`flex items-center py-0.5 px-2 rounded transition-colors ${hasChange ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                                    <span className="flex-1 text-xs text-foreground">{statMeta[s].label}</span>
                                    <span className="w-10 text-center font-mono text-xs text-muted-foreground">{preStats[s]}</span>
                                    <span className={`w-10 text-center font-mono text-xs font-semibold ${hasChange ? 'text-primary' : 'text-foreground'}`}>
                                      {postStats[s]}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ruolo">
                {player ? (
                  <RoleSystem player={player} xpAvailable={xpRemaining} onXpChange={handleExtraXpSpent} />
                ) : (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">Seleziona un giocatore</CardContent></Card>
                )}
              </TabsContent>

              <TabsContent value="tratti">
                {player ? (
                  <TraitSystem player={player} xpAvailable={xpRemaining} onXpChange={handleExtraXpSpent} />
                ) : (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">Seleziona un giocatore</CardContent></Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* right column: OVR e riepilogo */}
          <div className="col-span-12 lg:col-span-2">
            <Card className="shadow-lg border-primary/10">
              <CardHeader className="bg-gradient-to-br from-accent/10 to-primary/10">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <CardTitle>Riepilogo</CardTitle>
                </div>
                <CardDescription>Overall del giocatore</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-center py-6 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-border transition-all hover:shadow-md">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pre-Allenamento</div>
                    <div className="text-4xl font-bold text-foreground">{preOverall}</div>
                  </div>
                  <div className="text-center py-6 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 shadow-lg transition-all hover:shadow-xl">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Post-Allenamento</div>
                    <div className="text-4xl font-bold text-primary">{postOverall}</div>
                    {postOverall > preOverall && (
                      <Badge variant="secondary" className="mt-2 animate-fade-in">+{postOverall - preOverall}</Badge>
                    )}
                  </div>
                  <div className="mt-4 p-3 text-xs text-muted-foreground bg-muted/30 rounded-lg border border-border">
                    Cambiamenti in tempo reale. Premi "Applica" per consumare XP.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Allenamenti;
