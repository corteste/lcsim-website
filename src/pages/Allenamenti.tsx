import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { Player } from "@/types/player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Minus, TrendingUp, Award } from "lucide-react";
import TraitSystem from "@/components/training/TraitSystem";
import RolePlusSystem from "@/components/training/RolePlusSystem";
import RoleChangeSystem from "@/components/training/RoleChangeSystem";
import { getPlayers } from "@/hooks/use-players";

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
  const { players } = getPlayers("APD");
  const [selectedId, setSelectedId] = useState<number | null>(null);
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

  const computeOverall = (stats: Record<StatKey, number>) => {
    const values = Object.values(stats);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  const preOverall = computeOverall(preStats);
  const postOverall = computeOverall(postStats);

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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* center: griglia principale (ora per gruppi con sotto-attributi) */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="shadow-lg border-primary/10">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle>Dettaglio Attributi</CardTitle>
                </div>
                <CardDescription>Gestisci gli allenamenti per gruppo di attributi</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {groupRows.map((g) => {
                    const inc = increases[g.key] ?? 0;
                    const cost = inc * g.subs.length * COST_PER_POINT;
                    const hasChange = inc > 0;

                    return (
                      <Card key={g.key} className={`transition-all duration-300 hover:shadow-md ${hasChange ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-lg">{g.label}</CardTitle>
                              {hasChange && (
                                <Badge variant="secondary" className="animate-fade-in">
                                  +{inc}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIncrease(g.key, (increases[g.key] ?? 0) - 1)}
                                disabled={inc === 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <div className="w-16 text-center">
                                <input
                                  // type="number"
                                  min={0}
                                  max={25}
                                  value={inc}
                                  onChange={(e) => setIncrease(g.key, Number(e.target.value || 0))}
                                  className="w-full px-2 py-1 text-center border rounded-md bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIncrease(g.key, (increases[g.key] ?? 0) + 1)}
                                disabled={inc >= 25}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Colonna PRE */}
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Pre-Allenamento
                              </div>
                              {g.subs.map((s) => (
                                <div key={s} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                  <span className="text-sm text-foreground">{statMeta[s].label}</span>
                                  <Badge variant="outline" className="font-mono">
                                    {preStats[s]}
                                  </Badge>
                                </div>
                              ))}
                            </div>

                            {/* Colonna POST */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Post-Allenamento
                                </div>
                                {cost > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    Costo: {cost} XP
                                  </Badge>
                                )}
                              </div>
                              {g.subs.map((s) => (
                                <div key={s} className={`flex items-center justify-between py-1.5 px-3 rounded-lg transition-all duration-300 ${hasChange ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'} hover:bg-accent/50`}>
                                  <span className="text-sm text-foreground">{statMeta[s].label}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={hasChange ? "default" : "outline"} className="font-mono">
                                      {postStats[s]}
                                    </Badge>
                                    {hasChange && (
                                      <span className="text-xs text-primary font-semibold animate-fade-in">
                                        +{inc}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
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
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Pre-Allenamento
                    </div>
                    <div className="text-4xl font-bold text-foreground">{preOverall}</div>
                  </div>

                  <div className="text-center py-6 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 shadow-lg transition-all hover:shadow-xl">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Post-Allenamento
                    </div>
                    <div className="text-4xl font-bold text-primary">{postOverall}</div>
                    {postOverall > preOverall && (
                      <Badge variant="secondary" className="mt-2 animate-fade-in">
                        +{postOverall - preOverall}
                      </Badge>
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
