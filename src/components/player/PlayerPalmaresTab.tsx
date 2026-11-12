import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Shield,
  Award,
  Crown,
  Target,
  Sparkles,
  Star,
  Flame,
  Medal,
  Calendar,
  Layers,
} from "lucide-react";
import { PlayerPalmares } from "@/services/playerPalmaresService";
import { getTeamLogo, LCSIM_LOGO_SMALL } from "@/utils/functions";

interface PlayerPalmaresTabProps {
  palmares: PlayerPalmares | null | undefined;
  isLoading?: boolean;
}

export const PlayerPalmaresTab: React.FC<PlayerPalmaresTabProps> = ({
  palmares,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <Trophy className="h-10 w-10 text-primary animate-pulse" />
        <p className="text-sm text-muted-foreground font-medium">Caricamento bacheca trofei...</p>
      </div>
    );
  }

  if (!palmares) {
    return null;
  }

  const {
    teamTrophies,
    individualAwards,
    hallOfFame,
    totwCount,
    scudettiCount,
    supercoppeCount,
    individualAwardsCount,
    totalTrophiesCount,
  } = palmares;

  const hasAnyHonors = totalTrophiesCount > 0 || totwCount > 0;

  if (!hasAnyHonors) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
        <div className="h-16 w-16 rounded-3xl bg-muted/40 border border-border/60 flex items-center justify-center mb-4 text-muted-foreground/50 shadow-inner">
          <Trophy className="h-8 w-8" />
        </div>
        <h4 className="text-base font-bold text-foreground mb-1">Bacheca Trofei Vuota</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Questo calciatore non ha ancora conquistato titoli di squadra ufficiali né riconoscimenti individuali di lega in LCSIM.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 sm:p-2">
      {/* Top Showcase Counter Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Scudetti */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex items-center gap-3 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <Trophy className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Scudetti</div>
            <div className="text-2xl font-black text-foreground font-mono">{scudettiCount}</div>
          </div>
        </div>

        {/* Supercoppe */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/30 flex items-center gap-3 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
            <Shield className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Supercoppe</div>
            <div className="text-2xl font-black text-foreground font-mono">{supercoppeCount}</div>
          </div>
        </div>

        {/* Premi Individuali */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center gap-3 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <Award className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Premi Ind.</div>
            <div className="text-2xl font-black text-foreground font-mono">{individualAwardsCount}</div>
          </div>
        </div>

        {/* Top 11 (TOTW) */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/30 flex items-center gap-3 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-inner">
            <Star className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Presenze TOTW</div>
            <div className="text-2xl font-black text-foreground font-mono">{totwCount}</div>
          </div>
        </div>
      </div>

      {/* Hall of Fame Spotlight Card (if applicable) */}
      {hallOfFame && (
        <Card className="border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/5 shadow-lg overflow-hidden">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
              <Crown className="h-8 w-8 fill-slate-950" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <Badge className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5 shadow-sm">
                  👑 Membro Ufficiale Hall of Fame
                </Badge>
                <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-xs font-bold">
                  Classe di Induzione: {hallOfFame.inductionClass}
                </Badge>
                <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-xs font-semibold">
                  Attività: {hallOfFame.activeSeasons}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-foreground mt-1">
                Leggenda consacrata nell'Albo d'Oro della Lega Calcio Simulato.
              </p>
              {hallOfFame.bioNote && (
                <p className="text-xs text-muted-foreground mt-1.5 italic">
                  "{hallOfFame.bioNote}"
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 1: 🏆 Trofei di Squadra */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <Trophy className="h-5 w-5 text-emerald-500" />
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            Titoli e Trofei di Squadra ({teamTrophies.length})
          </h3>
        </div>

        {teamTrophies.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            Nessun titolo di squadra conquistato nelle stagioni disputate.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teamTrophies.map((tr) => {
              const isScudetto = tr.trophyType === "scudetto";
              return (
                <Card
                  key={tr.id}
                  className={`border transition-all hover:shadow-md ${
                    isScudetto
                      ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent"
                      : "border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent"
                  }`}
                >
                  <CardContent className="p-3.5 flex items-start gap-3">
                    {/* Trophy Icon */}
                    <div
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        isScudetto
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {isScudetto ? (
                        <Trophy className="h-6 w-6" />
                      ) : (
                        <Shield className="h-6 w-6" />
                      )}
                    </div>

                    {/* Trophy Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold px-1.5 py-0 ${
                            isScudetto
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                              : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40"
                          }`}
                        >
                          {tr.seasonLabel}
                        </Badge>
                      </div>

                      <div className="font-bold text-sm text-foreground leading-tight truncate">
                        {tr.title}
                      </div>

                      {/* Team Association */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <img
                          src={getTeamLogo(tr.teamId)}
                          alt={tr.teamName}
                          className="h-5 w-5 object-contain shrink-0"
                          onError={(e) => (e.currentTarget.src = LCSIM_LOGO_SMALL)}
                        />
                        <span className="text-xs font-semibold text-muted-foreground truncate">
                          {tr.teamName}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: 🎖️ Riconoscimenti & Premi Individuali */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <Award className="h-5 w-5 text-amber-500" />
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            Riconoscimenti & Premi Individuali ({individualAwards.length + (totwCount > 0 ? 1 : 0)})
          </h3>
        </div>

        {individualAwards.length === 0 && totwCount === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            Nessun riconoscimento individuale o selezione TOTW registrata finora.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* TOTW Card (if applicable) */}
            {totwCount > 0 && (
              <Card className="border border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent transition-all hover:shadow-md">
                <CardContent className="p-3.5 flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-sm">
                    <Star className="h-6 w-6 fill-purple-500/40 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold px-1.5 py-0 bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/40"
                      >
                        Carriera
                      </Badge>
                      <span className="text-xs font-black text-purple-500 font-mono">
                        {totwCount} turni
                      </span>
                    </div>
                    <div className="font-bold text-sm text-foreground leading-tight">
                      Squadra della Settimana (TOTW)
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Selezionato per {totwCount} {totwCount === 1 ? "volta" : "volte"} nella Top 11 di campionato.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Individual Awards */}
            {individualAwards.map((aw) => {
              const isCapocannoniere = aw.awardType === "capocannoniere";
              const isAssistman = aw.awardType === "assistman";
              const isGk = aw.awardType === "golden_glove";
              const isMvp = aw.awardType === "mvp";

              let icon = <Award className="h-6 w-6" />;
              let themeClass = "border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent";
              let badgeClass = "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40";
              let iconBoxClass = "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30";

              if (isCapocannoniere) {
                icon = <Target className="h-6 w-6" />;
                themeClass = "border-red-500/40 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent";
                badgeClass = "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40";
                iconBoxClass = "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30";
              } else if (isAssistman) {
                icon = <Sparkles className="h-6 w-6" />;
                themeClass = "border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent";
                badgeClass = "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/40";
                iconBoxClass = "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30";
              } else if (isGk) {
                icon = <Shield className="h-6 w-6" />;
                themeClass = "border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent";
                badgeClass = "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/40";
                iconBoxClass = "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30";
              } else if (isMvp) {
                icon = <Medal className="h-6 w-6" />;
                themeClass = "border-indigo-500/40 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent";
                badgeClass = "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/40";
                iconBoxClass = "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30";
              }

              return (
                <Card key={aw.id} className={`border transition-all hover:shadow-md ${themeClass}`}>
                  <CardContent className="p-3.5 flex items-start gap-3">
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${iconBoxClass}`}>
                      {icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 ${badgeClass}`}>
                          {aw.seasonLabel}
                        </Badge>
                        {aw.statValue && (
                          <span className="text-xs font-black text-foreground font-mono">
                            {aw.statValue}
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-sm text-foreground leading-tight truncate">
                        {aw.title}
                      </div>

                      <div className="flex items-center gap-1.5 mt-2">
                        <img
                          src={getTeamLogo(aw.teamId)}
                          alt={aw.teamName}
                          className="h-5 w-5 object-contain shrink-0"
                          onError={(e) => (e.currentTarget.src = LCSIM_LOGO_SMALL)}
                        />
                        <span className="text-xs font-semibold text-muted-foreground truncate">
                          {aw.teamName}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
