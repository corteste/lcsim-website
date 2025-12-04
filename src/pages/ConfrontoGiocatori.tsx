import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { getPlayers } from "@/hooks/use-players";
import { Player } from "@/types/player";

const generalStats: { key: keyof Player; label: string }[] = [
  { key: "OVR", label: "Overall" },
  { key: "POR", label: "Porta" },
  { key: "DIF", label: "Difesa" },
  { key: "CEN", label: "Centrocampo" },
  { key: "MEN", label: "Mentale" },
  { key: "ATT", label: "Attacco" },
  { key: "FIS", label: "Fisico" },
  { key: "CPZ", label: "Calci Piazzati" },
];

const statRows: { key: keyof Player; label: string }[] = [
  { key: "RIFP", label: "Riflessi Portiere" },
  { key: "PREP", label: "Presa Portiere" },
  { key: "TUFP", label: "Tuffo Portiere" },
  { key: "POSP", label: "Posizionamento Portiere" },
  { key: "RINP", label: "Rinvio Portiere" },
  { key: "MARC", label: "Marcatura" },
  { key: "CONT", label: "Contrasto" },
  { key: "AGGR", label: "Aggressività" },
  { key: "SCIV", label: "Scivolata" },
  { key: "INTR", label: "Intercettazioni" },
  { key: "PASC", label: "Passaggi Corti" },
  { key: "PASL", label: "Passaggi Lunghi" },
  { key: "CRSS", label: "Cross" },
  { key: "CTRP", label: "Controllo Palla" },
  { key: "VISI", label: "Visione" },
  { key: "EFFT", label: "Effetto" },
  { key: "PIAZ", label: "Piazzamento" },
  { key: "PTIR", label: "Potenza Tiro" },
  { key: "TIRD", label: "Tiro dalla Distanza" },
  { key: "DRBL", label: "Dribbling" },
  { key: "TIRV", label: "Tiri al Volo" },
  { key: "TSTA", label: "Colpi di Testa" },
  { key: "FINA", label: "Finalizzazione" },
  { key: "ACCL", label: "Accelerazione" },
  { key: "VELO", label: "Velocità" },
  { key: "RESI", label: "Resistenza" },
  { key: "FRZA", label: "Forza" },
  { key: "AGIL", label: "Agilità" },
  { key: "ELEV", label: "Elevazione" },
  { key: "RIFL", label: "Riflessi" },
  { key: "EQLB", label: "Equilibrio" },
  { key: "PNIZ", label: "Calci di Punizione" },
  { key: "CRIG", label: "Rigori" },
  { key: "MABI", label: "Mosse Abilità" },
];

const ConfrontoGiocatori = () => {
  const { players } = getPlayers();
  const [leftId, setLeftId] = useState<number>(0);
  const [rightId, setRightId] = useState<number>(0);

  const left = useMemo(() => players.find((p) => p.ID === leftId) || null, [leftId]);
  const right = useMemo(() => players.find((p) => p.ID === rightId) || null, [rightId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            Confronto Giocatori
          </h1>
          <p className="text-muted-foreground">Confronta le statistiche dei giocatori.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left panel */}
          <Card className="shadow">
            <CardHeader>
              <CardTitle>{left ? left.Nome + " " + left.Cognome : "N/D"}</CardTitle>
              <CardDescription>{left ? left.Squadra + " " + left.OVR : "N/D"}</CardDescription>
            </CardHeader>
            <CardContent>
              <select
                value={leftId}
                onChange={(e) => setLeftId(Number(e.target.value))}
                className="w-full mb-4 p-2 border rounded bg-card"
              >
                {players.map((p) => (
                  <option key={p.ID} value={p.ID}>
                    {p.Cognome} {p.Nome}  — {p.Squadra}
                  </option>
                ))}
              </select>

              {left ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-medium">{left.Nome} {left.Cognome}</div>
                      <div className="text-sm text-muted-foreground">{left.Squadra} • {left.Posiz}</div>
                    </div>
                    <Badge variant="outline">{left.Posiz ?? "—"}</Badge>
                  </div>

                  <div className="space-y-2">
                    {generalStats.map((row) => (
                      <div key={String(row.key)} className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">{row.label}</div>
                        <div className="font-semibold">
                          {String(left[row.key] ?? "—")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Seleziona un giocatore</div>
              )}
            </CardContent>
          </Card>

          {/* Right panel */}
          <Card className="shadow">
            <CardHeader>
              <CardTitle>Giocatore B</CardTitle>
              <CardDescription>Seleziona il secondo giocatore</CardDescription>
            </CardHeader>
            <CardContent>
              <select
                value={rightId}
                onChange={(e) => setRightId(Number(e.target.value))}
                className="w-full mb-4 p-2 border rounded bg-card"
              >
                {players.map((p) => (
                  <option key={p.ID} value={p.ID}>
                    {p.Cognome} {p.Nome} — {p.Squadra}
                  </option>
                ))}
              </select>

              {right ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-medium">{right.Nome} {right.Cognome}</div>
                      <div className="text-sm text-muted-foreground">{right.Squadra} • {right.Posiz}</div>
                    </div>
                    <Badge variant="outline">{right.Posiz ?? "—"}</Badge>
                  </div>

                  <div className="space-y-2">
                    {generalStats.map((row) => (
                      <div key={String(row.key)} className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">{row.label}</div>
                        <div className="font-semibold">
                          {String(right[row.key] ?? "—")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Seleziona un giocatore</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Comparison summary */}
        <div className="mt-6">
          <Card className="shadow">
            <CardHeader>
              <CardTitle>Confronto rapido</CardTitle>
              <CardDescription>Valori a confronto tra Giocatore A e Giocatore B</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statRows.map((row) => {
                  const a = left ? Number(left[row.key] ?? NaN) : NaN;
                  const b = right ? Number(right[row.key] ?? NaN) : NaN;
                  return (
                    <div key={String(row.key)} className="p-3 border rounded">
                      <div className="text-sm text-muted-foreground mb-2">{row.label}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">{left ? left.Nome : "—"}</div>
                        <div className="font-bold">{isNaN(a) ? "—" : a}</div>
                        <div className="text-sm">{right ? right.Nome : "—"}</div>
                        <div className="font-bold">{isNaN(b) ? "—" : b}</div>
                      </div>

                      {/* simple visual bar */}
                      <div className="mt-3 h-3 w-full bg-muted/20 rounded overflow-hidden flex">
                        {(!isNaN(a) && !isNaN(b)) ? (
                          <>
                            <div
                              className="h-full bg-[rgb(73,140,244)]/80"
                              style={{
                                width: `${Math.round((a / (a + b || 1)) * 100)}%`,
                              }}
                            />
                            <div
                              className="h-full bg-[rgb(80,200,120)]/80"
                              style={{
                                width: `${100 - Math.round((a / (a + b || 1)) * 100)}%`,
                              }}
                            />
                          </>
                        ) : (
                          <div className="h-full bg-muted rounded w-full" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ConfrontoGiocatori;
