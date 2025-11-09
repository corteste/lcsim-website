import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { Player } from "@/types/player";
import { supabase } from "@/supabaseClient";
import { PLAYER_TABLE } from "@/constants/App";

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
  const [playerList, setPlayers] = useState<Player[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      const { data, error } = await supabase.from(PLAYER_TABLE).select("*").eq('Squadra', 'APD'); // non deve essere statica la squadra ma dinamica in base all'utente
      if (error) {
        console.error(error);
        return;
      }
      setPlayers(data || []);
      if (data && data.length > 0 && selectedId === null) {
        setSelectedId((data[0] as any).ID ?? (data[0] as any).id ?? null);
      }
    }
    fetchPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const player = useMemo(() => {
    if (!selectedId) return null;
    return playerList.find((p) => (p as any).ID === selectedId || (p as any).id === selectedId) ?? null;
  }, [playerList, selectedId]);

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
  const xpRemaining = xpAvailable - totalCost;

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
                    {playerList.map((p) => (
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
                    Aumento massimo per gruppo: 25<br />
                    COST_PER_POINT modifica il costo per punto.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* center: griglia principale (ora per gruppi con sotto-attributi) */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="shadow">
              <CardHeader>
                <CardTitle>Dettaglio Attributi</CardTitle>
                <CardDescription>Pre / Aumento (per gruppo) / Post / Costo</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="p-2">Gruppo</th>
                        <th className="p-2">Pre (sotto)</th>
                        <th className="p-2">Aumento (gruppo)</th>
                        <th className="p-2">Post (sotto)</th>
                        <th className="p-2">Costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupRows.map((g) => {
                        const preVals = g.subs.map((s) => preStats[s]);
                        const inc = increases[g.key] ?? 0;
                        const postVals = g.subs.map((s) => postStats[s]);
                        const cost = inc * g.subs.length * COST_PER_POINT;

                        return (
                          <tr key={g.key} className="border-t align-top">
                            <td className="p-2 align-top">
                              <div className="font-medium">{g.label}</div>
                            </td>

                            {/* Pre: mostra sotto-attributi */}
                            <td className="p-2 align-top">
                              <div className="space-y-1">
                                {g.subs.map((s) => (
                                  <div key={s} className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground">{statMeta[s].label}</div>
                                    <div className="font-medium">{preStats[s]}</div>
                                  </div>
                                ))}
                              </div>
                            </td>

                            {/* Aumento per gruppo */}
                            <td className="p-2 align-top">
                              <div className="flex items-center gap-2">
                                <button
                                  className="px-2 py-1 border rounded"
                                  onClick={() => setIncrease(g.key, (increases[g.key] ?? 0) - 1)}
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  max={25}
                                  value={inc}
                                  onChange={(e) => setIncrease(g.key, Number(e.target.value || 0))}
                                  className="w-16 p-1 text-center border rounded bg-card"
                                />
                                <button
                                  className="px-2 py-1 border rounded"
                                  onClick={() => setIncrease(g.key, (increases[g.key] ?? 0) + 1)}
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* Post: mostra sotto-attributi aggiornati */}
                            <td className="p-2 align-top">
                              <div className="space-y-1">
                                {g.subs.map((s) => (
                                  <div key={s} className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground">{statMeta[s].label}</div>
                                    <div className="font-medium">{postVals[g.subs.indexOf(s)]}</div>
                                  </div>
                                ))}
                              </div>
                            </td>

                            <td className="p-2 align-top">{cost}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* right column: OVR e riepilogo */}
          <div className="col-span-12 lg:col-span-2">
            <Card className="shadow">
              <CardHeader>
                <CardTitle>Riepilogo</CardTitle>
                <CardDescription>Overall pre / post allenamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-4 border rounded">
                    <div className="text-sm text-muted-foreground">OVR Pre-Allenamento</div>
                    <div className="text-3xl font-bold">{preOverall}</div>
                  </div>

                  <div className="text-center py-4 border rounded bg-green-50">
                    <div className="text-sm text-muted-foreground">OVR Post-Allenamento</div>
                    <div className="text-3xl font-bold">{postOverall}</div>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    Cambiamenti mostrati in tempo reale. Premi "Applica" per consumare XP (non implementato).
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
