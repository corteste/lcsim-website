import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  Calendar,
  Crown,
  MapPin,
  Medal,
  Shield,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { WikiScorerEntry, WikiSeasonFrontmatter } from "@/services/wikiService";
import { getTeamLogo, LCSIM_LOGO_SMALL } from "@/utils/functions";

interface WikiInfoboxProps {
  frontmatter: WikiSeasonFrontmatter | null;
}

const DATE_LABELS: Record<string, string> = {
  provino: "Provino",
  ritiri: "Ritiri",
  tagli: "Tagli",
  superdraft: "SuperDraft",
  draft: "Draft",
  supercoppa: "Supercoppa",
  blocco_rose: "Blocco rose",
  inizio: "Inizio stagione",
  fine_regular_season: "Fine regular season",
  play_in: "Play-in",
  quarti: "Quarti",
  semifinali: "Semifinali",
  finale: "Finale",
};

function formatDateIt(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function asArray<T>(val: T | T[] | null | undefined): T[] {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
}

function formatScorerEntry(entry: WikiScorerEntry, unitLabel: string): string {
  const player = entry.giocatore ?? "—";
  const team = entry.squadra ? ` (${entry.squadra})` : "";
  const count =
    entry.reti != null
      ? ` — ${entry.reti} ${unitLabel}`
      : entry.assist != null
      ? ` — ${entry.assist} ${unitLabel}`
      : entry.gol != null
      ? ` — ${entry.gol} ${unitLabel}`
      : "";
  return `${player}${team}${count}`;
}

function formatListOrText(val: unknown): string {
  if (Array.isArray(val)) return val.join(", ");
  if (val == null) return "—";
  return String(val);
}

const TeamInfobox: React.FC<{ fm: Record<string, any> }> = ({ fm }) => {
  const sigla = typeof fm.sigla === "string" ? fm.sigla : null;
  const palmares = fm.palmares ?? {};
  const camp = palmares.campionato ?? {};
  const sup = palmares.supercoppa ?? {};
  const rec = fm.record_giocatori ?? {};
  const part = fm.partecipazioni ?? {};

  return (
    <Card className="border-border/80 bg-card/95 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/50 border-b border-border/60 pb-3 pt-4 px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {sigla && (
              <img
                src={getTeamLogo(sigla)}
                alt={fm.titolo ?? sigla}
                className="h-9 w-9 object-contain shrink-0"
                onError={(e) => {
                  e.currentTarget.src = LCSIM_LOGO_SMALL;
                }}
              />
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Scheda Squadra
              </p>
              <CardTitle className="text-base font-bold leading-snug truncate">
                {fm.titolo ?? fm.nome_completo ?? "Squadra"}
              </CardTitle>
            </div>
          </div>
          {sigla && (
            <Badge variant="secondary" className="shrink-0 font-mono">
              {sigla}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-border/60 text-xs">
        <div className="p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Dati Societari
          </div>
          {fm.nome_storico && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Nome storico</span>
              <span className="font-medium text-right">{fm.nome_storico}</span>
            </div>
          )}
          {fm.fondazione && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Fondazione</span>
              <span className="font-medium text-right">{fm.fondazione}</span>
            </div>
          )}
          {fm.citta && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Città</span>
              <span className="font-medium text-right">{fm.citta}</span>
            </div>
          )}
          {fm.colori && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Colori</span>
              <span className="font-medium text-right capitalize">
                {formatListOrText(fm.colori)}
              </span>
            </div>
          )}
          {fm.stadio && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Stadio
              </span>
              <span className="font-medium text-right">{fm.stadio}</span>
            </div>
          )}
          {fm.presidente && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Presidente</span>
              <span className="font-medium text-right">{fm.presidente}</span>
            </div>
          )}
          {fm.allenatore && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Allenatore</span>
              <span className="font-medium text-right">{fm.allenatore}</span>
            </div>
          )}
          {fm.capitano && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Capitano</span>
              <span className="font-medium text-right">{fm.capitano}</span>
            </div>
          )}
          {fm.sponsor_principale && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Sponsor</span>
              <span className="font-medium text-right">{fm.sponsor_principale}</span>
            </div>
          )}
        </div>

        {(part.stagioni_disputate != null || part.prima_stagione != null) && (
          <div className="grid grid-cols-2 divide-x divide-border/60 text-center py-2.5 bg-background/50">
            <div className="px-2">
              <div className="text-[11px] text-muted-foreground">Stagioni</div>
              <div className="font-bold text-base">{part.stagioni_disputate ?? "—"}</div>
            </div>
            <div className="px-2">
              <div className="text-[11px] text-muted-foreground">Esordio</div>
              <div className="font-bold text-base">
                {part.prima_stagione != null ? `S${part.prima_stagione}` : "—"}
              </div>
            </div>
          </div>
        )}

        <div className="p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            Palmarès
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Campionati</span>
            <span className="font-bold text-right">
              {camp.vittorie ?? 0}
              {Array.isArray(camp.stagioni) && camp.stagioni.length > 0
                ? ` (S${camp.stagioni.join(", S")})`
                : ""}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">Supercoppe</span>
            <span className="font-semibold text-right">
              {sup.vittorie ?? 0}
              {Array.isArray(sup.stagioni) && sup.stagioni.length > 0
                ? ` (S${sup.stagioni.join(", S")})`
                : ""}
            </span>
          </div>
          {Array.isArray(camp.finali_perse) && camp.finali_perse.length > 0 && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Finali perse</span>
              <span className="font-medium text-right">
                S{camp.finali_perse.join(", S")}
              </span>
            </div>
          )}
          {Array.isArray(palmares.primo_in_regular_season) &&
            palmares.primo_in_regular_season.length > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">1º Regular Season</span>
                <span className="font-medium text-right">
                  S{palmares.primo_in_regular_season.join(", S")}
                </span>
              </div>
            )}
        </div>

        {(rec.miglior_marcatore || rec.miglior_assistman) && (
          <div className="p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              <Award className="h-3.5 w-3.5 text-purple-500" />
              Record Club
            </div>
            {rec.miglior_marcatore && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Top Marcatore</span>
                <span className="font-medium text-right">
                  {rec.miglior_marcatore}
                  {rec.reti_totali != null ? ` (${rec.reti_totali} reti)` : ""}
                </span>
              </div>
            )}
            {rec.miglior_assistman && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Top Assistman</span>
                <span className="font-medium text-right">
                  {formatListOrText(rec.miglior_assistman)}
                  {rec.assist_totali != null ? ` (${rec.assist_totali})` : ""}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const PlayerInfobox: React.FC<{ fm: Record<string, any> }> = ({ fm }) => {
  const stats = fm.statistiche_carriera ?? {};
  const club = fm.palmares_club ?? {};
  const premi = fm.premi_individuali ?? {};
  const career = Array.isArray(fm.carriera_club) ? fm.carriera_club : [];

  return (
    <Card className="border-border/80 bg-card/95 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/50 border-b border-border/60 pb-3 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Scheda Calciatore
            </p>
            <CardTitle className="text-base font-bold leading-snug mt-0.5 flex items-center gap-1.5">
              <User className="h-4 w-4 text-primary shrink-0" />
              {fm.titolo ?? fm.nome_completo ?? "Calciatore"}
            </CardTitle>
          </div>
          {fm.nazionalita && (
            <Badge variant="secondary" className="shrink-0">
              {fm.nazionalita}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-border/60 text-xs">
        <div className="p-3.5 space-y-1.5">
          {fm.ruolo && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Ruolo</span>
              <span className="font-semibold text-right">{fm.ruolo}</span>
            </div>
          )}
          {(fm.altezza_cm || fm.peso_kg) && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Fisico</span>
              <span className="font-medium text-right">
                {fm.altezza_cm ? `${fm.altezza_cm} cm` : ""}
                {fm.altezza_cm && fm.peso_kg ? " • " : ""}
                {fm.peso_kg ? `${fm.peso_kg} kg` : ""}
              </span>
            </div>
          )}
          {fm.piede && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Piede</span>
              <span className="font-medium text-right capitalize">{fm.piede}</span>
            </div>
          )}
          {fm.esordio && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Esordio</span>
              <span className="font-medium text-right">{fm.esordio}</span>
            </div>
          )}
          {fm.ritiro && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Ritiro</span>
              <span className="font-medium text-right">
                {fm.ritiro}
                {fm.eta_al_ritiro ? ` (${fm.eta_al_ritiro} anni)` : ""}
              </span>
            </div>
          )}
        </div>

        {(stats.minuti != null || stats.reti != null || stats.assist != null) && (
          <div className="grid grid-cols-3 divide-x divide-border/60 text-center py-2.5 bg-background/50">
            <div className="px-2">
              <div className="text-[11px] text-muted-foreground">Minuti</div>
              <div className="font-bold text-base">{stats.minuti ?? "—"}</div>
            </div>
            <div className="px-2">
              <div className="text-[11px] text-muted-foreground">Reti</div>
              <div className="font-bold text-base">{stats.reti ?? "—"}</div>
            </div>
            <div className="px-2">
              <div className="text-[11px] text-muted-foreground">Assist</div>
              <div className="font-bold text-base">{stats.assist ?? "—"}</div>
            </div>
          </div>
        )}

        {career.length > 0 && (
          <div className="p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              <Users className="h-3.5 w-3.5 text-primary" />
              Carriera Club
            </div>
            {career.map((c: any, idx: number) => (
              <div key={idx} className="flex justify-between gap-2">
                <span className="font-medium">{c.squadra ?? "—"}</span>
                <span className="text-muted-foreground text-right">
                  {c.periodo ?? ""}
                </span>
              </div>
            ))}
          </div>
        )}

        {(Array.isArray(club.campionato) || Array.isArray(premi.mvp_stagione)) && (
          <div className="p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              Palmarès &amp; Premi
            </div>
            {Array.isArray(club.campionato) && club.campionato.length > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Campionati</span>
                <span className="font-bold text-right">
                  {club.campionato.length} (S{club.campionato.join(", S")})
                </span>
              </div>
            )}
            {Array.isArray(club.supercoppa) && club.supercoppa.length > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Supercoppe</span>
                <span className="font-semibold text-right">
                  {club.supercoppa.length} (S{club.supercoppa.join(", S")})
                </span>
              </div>
            )}
            {Array.isArray(premi.mvp_stagione) && premi.mvp_stagione.length > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">MVP Stagione</span>
                <span className="font-semibold text-right">
                  S{premi.mvp_stagione.join(", S")}
                </span>
              </div>
            )}
            {Array.isArray(premi.capocannoniere) && premi.capocannoniere.length > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Capocannoniere</span>
                <span className="font-semibold text-right">
                  S{premi.capocannoniere.join(", S")}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const WikiInfobox: React.FC<WikiInfoboxProps> = ({ frontmatter }) => {
  if (!frontmatter) return null;

  if (frontmatter.tipo === "squadra") {
    return <TeamInfobox fm={frontmatter as Record<string, any>} />;
  }

  if (frontmatter.tipo === "giocatore") {
    return <PlayerInfobox fm={frontmatter as Record<string, any>} />;
  }

  const teamCodeMap = new Map<string, string>();
  for (const team of frontmatter.squadre ?? []) {
    if (team?.nome && team?.codice) {
      teamCodeMap.set(team.nome.toLowerCase(), team.codice);
    }
  }

  const getLogoForTeamName = (teamName?: string | null) => {
    if (!teamName) return null;
    const code = teamCodeMap.get(teamName.toLowerCase());
    return code ? getTeamLogo(code) : null;
  };

  const capocannonieri = asArray(frontmatter.premi?.capocannoniere);
  const assistmen = asArray(frontmatter.premi?.miglior_assistman);
  const dateEntries = Object.entries(frontmatter.date ?? {}).filter(
    ([, val]) => Boolean(val)
  );

  const championLogo = getLogoForTeamName(frontmatter.campione);

  return (
    <Card className="border-border/80 bg-card/95 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/50 border-b border-border/60 pb-3 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Scheda Stagione
            </p>
            <CardTitle className="text-base font-bold leading-snug mt-0.5">
              {frontmatter.titolo ??
                (frontmatter.stagione != null
                  ? `Stagione ${frontmatter.stagione}`
                  : "Dettagli")}
            </CardTitle>
          </div>
          {frontmatter.anno != null && (
            <Badge variant="secondary" className="shrink-0 font-mono">
              {frontmatter.anno}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-border/60 text-sm">
        {/* Numeri principali */}
        {(frontmatter.squadre_partecipanti != null ||
          frontmatter.partite_disputate != null ||
          frontmatter.reti_totali != null) && (
          <div className="grid grid-cols-3 divide-x divide-border/60 text-center py-2.5 bg-background/50">
            <div className="px-2">
              <div className="text-[11px] text-muted-foreground">Squadre</div>
              <div className="font-bold text-base">
                {frontmatter.squadre_partecipanti ?? "—"}
              </div>
            </div>
            <div className="px-2">
              <div className="text-[11px] text-muted-foreground">Partite</div>
              <div className="font-bold text-base">
                {frontmatter.partite_disputate ?? "—"}
              </div>
            </div>
            <div className="px-2">
              <div className="text-[11px] text-muted-foreground">Reti</div>
              <div className="font-bold text-base">
                {frontmatter.reti_totali ?? "—"}
              </div>
            </div>
          </div>
        )}

        {/* Podio */}
        {(frontmatter.campione ||
          frontmatter.finalista ||
          frontmatter.terzo ||
          frontmatter.quarto) && (
          <div className="p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              Podio
            </div>
            <dl className="space-y-1.5 text-xs">
              {frontmatter.campione && (
                <div className="flex items-center justify-between gap-2 bg-amber-500/10 border border-amber-500/20 rounded-md px-2.5 py-1.5">
                  <dt className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                    <Crown className="h-3.5 w-3.5 shrink-0" />
                    Campione
                  </dt>
                  <dd className="flex items-center gap-1.5 font-bold text-right">
                    {championLogo && (
                      <img
                        src={championLogo}
                        alt={frontmatter.campione}
                        className="h-4 w-4 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = LCSIM_LOGO_SMALL;
                        }}
                      />
                    )}
                    <span>{frontmatter.campione}</span>
                  </dd>
                </div>
              )}
              {frontmatter.finalista && (
                <div className="flex items-center justify-between gap-2 px-1">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Medal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    Finalista
                  </dt>
                  <dd className="font-medium text-right">
                    {frontmatter.finalista}
                  </dd>
                </div>
              )}
              {frontmatter.terzo && (
                <div className="flex items-center justify-between gap-2 px-1">
                  <dt className="text-muted-foreground">3º posto</dt>
                  <dd className="font-medium text-right">{frontmatter.terzo}</dd>
                </div>
              )}
              {frontmatter.quarto && (
                <div className="flex items-center justify-between gap-2 px-1">
                  <dt className="text-muted-foreground">4º posto</dt>
                  <dd className="font-medium text-right">{frontmatter.quarto}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Finale */}
        {frontmatter.finale && (
          <div className="p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Finale
            </div>
            <dl className="space-y-1 text-xs">
              {frontmatter.finale.risultato && (
                <div className="font-semibold text-foreground">
                  {frontmatter.finale.risultato}
                </div>
              )}
              {frontmatter.finale.data && (
                <div className="flex justify-between gap-2 text-muted-foreground">
                  <span>Data</span>
                  <span className="text-foreground">
                    {formatDateIt(frontmatter.finale.data)}
                  </span>
                </div>
              )}
              {frontmatter.finale.mvp && (
                <div className="flex justify-between gap-2 text-muted-foreground">
                  <span>MVP Finale</span>
                  <span className="text-foreground font-medium">
                    {frontmatter.finale.mvp}
                  </span>
                </div>
              )}
              {frontmatter.finale.arbitro && (
                <div className="flex justify-between gap-2 text-muted-foreground">
                  <span>Arbitro</span>
                  <span className="text-foreground">
                    {frontmatter.finale.arbitro}
                  </span>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Supercoppa (se presente) */}
        {frontmatter.supercoppa && (
          <div className="p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-emerald-500" />
              Supercoppa
            </div>
            <div className="text-xs space-y-1">
              {frontmatter.supercoppa.risultato && (
                <div className="font-medium">
                  {frontmatter.supercoppa.risultato}
                  {frontmatter.supercoppa.rigori
                    ? ` (dcr ${frontmatter.supercoppa.rigori})`
                    : ""}
                </div>
              )}
              {frontmatter.supercoppa.vincitrice && (
                <div className="flex justify-between gap-2 text-muted-foreground">
                  <span>Vincitrice</span>
                  <span className="text-foreground font-semibold">
                    {frontmatter.supercoppa.vincitrice}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Premi individuali */}
        {frontmatter.premi && (
          <div className="p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Award className="h-3.5 w-3.5 text-purple-500" />
              Premi Individuali
            </div>
            <dl className="space-y-1.5 text-xs">
              {frontmatter.premi.mvp_stagione && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">MVP Stagione</dt>
                  <dd className="font-semibold text-right">
                    {frontmatter.premi.mvp_stagione}
                  </dd>
                </div>
              )}
              {capocannonieri.length > 0 && (
                <div>
                  <dt className="text-muted-foreground">Capocannoniere</dt>
                  <dd className="font-medium mt-0.5 space-y-0.5">
                    {capocannonieri.map((c, idx) => (
                      <div key={idx}>{formatScorerEntry(c, "reti")}</div>
                    ))}
                  </dd>
                </div>
              )}
              {assistmen.length > 0 && (
                <div>
                  <dt className="text-muted-foreground">Miglior Assistman</dt>
                  <dd className="font-medium mt-0.5 space-y-0.5">
                    {assistmen.map((a, idx) => (
                      <div key={idx}>{formatScorerEntry(a, "assist")}</div>
                    ))}
                  </dd>
                </div>
              )}
              {frontmatter.premi.miglior_portiere && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Miglior Portiere</dt>
                  <dd className="font-medium text-right">
                    {frontmatter.premi.miglior_portiere}
                  </dd>
                </div>
              )}
              {frontmatter.premi.miglior_difensore && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Miglior Difensore</dt>
                  <dd className="font-medium text-right">
                    {frontmatter.premi.miglior_difensore}
                  </dd>
                </div>
              )}
              {frontmatter.premi.miglior_centrocampista && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">
                    Miglior Centrocampista
                  </dt>
                  <dd className="font-medium text-right">
                    {frontmatter.premi.miglior_centrocampista}
                  </dd>
                </div>
              )}
              {frontmatter.premi.miglior_attaccante && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Miglior Attaccante</dt>
                  <dd className="font-medium text-right">
                    {frontmatter.premi.miglior_attaccante}
                  </dd>
                </div>
              )}
              {frontmatter.premi.rookie_dell_anno && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Rookie dell'anno</dt>
                  <dd className="font-medium text-right">
                    {frontmatter.premi.rookie_dell_anno}
                  </dd>
                </div>
              )}
              {frontmatter.premi.most_improved_player && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Most Improved</dt>
                  <dd className="font-medium text-right">
                    {frontmatter.premi.most_improved_player}
                  </dd>
                </div>
              )}
              {frontmatter.premi.all_star_game_mvp && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">All-Star MVP</dt>
                  <dd className="font-medium text-right">
                    {frontmatter.premi.all_star_game_mvp}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Date chiave */}
        {dateEntries.length > 0 && (
          <div className="p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-blue-500" />
              Date Chiave
            </div>
            <dl className="space-y-1 text-xs">
              {dateEntries.map(([key, val]) => (
                <div key={key} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">
                    {DATE_LABELS[key] ?? key.replace(/_/g, " ")}
                  </dt>
                  <dd className="font-medium text-right">
                    {formatDateIt(val)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
