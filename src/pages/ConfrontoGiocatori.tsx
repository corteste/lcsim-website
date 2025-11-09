import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";

type Player = {
  id: number;
  name: string;
  team?: string;
  role?: string;
  overall: number;
  rating: number;
  number?: number | null;
  position?: string | null;
};

const samplePlayers: Player[] = [
  { id: 1, name: "Alessandro Grigi", team: "FC Dragonslayers", role: "ATT", overall: 84, rating: 8.5, number: 9 },
  { id: 2, name: "Gabriele Gialli", team: "Thunder United", role: "ATT", overall: 83, rating: 8.3, number: 11 },
  { id: 3, name: "Giuseppe Gialli", team: "FC Dragonslayers", role: "CEN", overall: 81, rating: 8.2, number: 8 },
  { id: 4, name: "Federico Bianchi", team: "Thunder United", role: "CEN", overall: 80, rating: 8.1, number: 6 },
  { id: 5, name: "Matteo Arancio", team: "FC Dragonslayers", role: "ATT", overall: 79, rating: 8.0, number: 7 },
];

const statRows: { key: keyof Player; label: string }[] = [
  { key: "overall", label: "Overall" },
  { key: "rating", label: "Voto medio" },
  { key: "number", label: "Numero" },
];

const ConfrontoGiocatori = () => {
  const [leftId, setLeftId] = useState<number>(samplePlayers[0].id);
  const [rightId, setRightId] = useState<number>(samplePlayers[1].id);

  const left = useMemo(() => samplePlayers.find((p) => p.id === leftId) || null, [leftId]);
  const right = useMemo(() => samplePlayers.find((p) => p.id === rightId) || null, [rightId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            Confronto Giocatori
          </h1>
          <p className="text-muted-foreground">Confronta le statistiche dei tuoi giocatori.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left panel */}
          <Card className="shadow">
            <CardHeader>
              <CardTitle>Giocatore A</CardTitle>
              <CardDescription>Seleziona il primo giocatore</CardDescription>
            </CardHeader>
            <CardContent>
              <select
                value={leftId}
                onChange={(e) => setLeftId(Number(e.target.value))}
                className="w-full mb-4 p-2 border rounded bg-card"
              >
                {samplePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.team}
                  </option>
                ))}
              </select>

              {left ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-medium">{left.name}</div>
                      <div className="text-sm text-muted-foreground">{left.team} • {left.role}</div>
                    </div>
                    <Badge variant="outline">{left.position ?? "—"}</Badge>
                  </div>

                  <div className="space-y-2">
                    {statRows.map((row) => (
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
                {samplePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.team}
                  </option>
                ))}
              </select>

              {right ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-medium">{right.name}</div>
                      <div className="text-sm text-muted-foreground">{right.team} • {right.role}</div>
                    </div>
                    <Badge variant="outline">{right.position ?? "—"}</Badge>
                  </div>

                  <div className="space-y-2">
                    {statRows.map((row) => (
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
                        <div className="text-sm">{left ? left.name : "—"}</div>
                        <div className="font-bold">{isNaN(a) ? "—" : a}</div>
                        <div className="text-sm">{right ? right.name : "—"}</div>
                        <div className="font-bold">{isNaN(b) ? "—" : b}</div>
                      </div>

                      {/* simple visual bar */}
                      <div className="mt-3 h-3 w-full bg-muted/20 rounded overflow-hidden flex">
                        {(!isNaN(a) && !isNaN(b)) ? (
                          <>
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${Math.round((a / (a + b || 1)) * 100)}%`,
                              }}
                            />
                            <div
                              className="h-full bg-accent"
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
