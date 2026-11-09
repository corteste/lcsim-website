import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Team, TeamTrophy } from "@/types/team";
import { fetchTeamTrophies } from "@/services/teamService";
import { supabase } from "@/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  ShieldCheck,
  Landmark,
  MapPin,
  Users,
  Calendar,
  Sparkles,
  Award,
  Crown,
  History,
  ArrowRight,
  Pencil,
  CheckCircle2,
  TrendingUp,
  UserCheck,
  UserX,
} from "lucide-react";
import { useClubHistory } from "@/components/team/ClubHistoryCard";
import { getHistoricalTeamMeta } from "@/services/archiveService";
import { getTeamLogo, LCSIM_LOGO_SMALL } from "@/utils/functions";
import { EditCoachModal } from "@/components/team/EditCoachModal";
import { useAuth } from "@/context/AuthContext";
import { SUPABASE_STORAGE_URL } from "@/constants/App";

const TROPHY_CMP_URL = `${SUPABASE_STORAGE_URL}/images/trophies/CMP.png`;
const TROPHY_SCP_URL = `${SUPABASE_STORAGE_URL}/images/trophies/SCP.png`;

interface ClubProfileTabProps {
  team: Team;
  presidentName?: string;
  onEditStaff?: () => void;
  canEdit?: boolean;
}

export const ClubProfileTab: React.FC<ClubProfileTabProps> = ({
  team,
  presidentName,
  onEditStaff,
  canEdit = false,
}) => {
  const { user, isAdmin } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 1. Fetch Albo d'Oro / Trofei per la squadra (e per il suo eventuale rebrand storico es. SBM per MAR)
  const { data: trophies = [], isLoading: loadingTrophies } = useQuery({
    queryKey: ["team_trophies", team.TEAM_ID],
    queryFn: async () => {
      // Se il team è MAR, includi anche eventuali trofei associati a SBM
      const teamIds = [team.TEAM_ID.toUpperCase()];
      if (team.TEAM_ID.toUpperCase() === "MAR") teamIds.push("SBM");

      const { data, error } = await supabase
        .from("team_trophies")
        .select("*")
        .in("team_id", teamIds)
        .order("season_number", { ascending: true });

      if (error) {
        console.error("Errore fetch trofei:", error);
        return [];
      }
      return (data || []) as TeamTrophy[];
    },
    staleTime: 60 * 1000,
  });

  // 2. Fetch Piazzamenti Storici in Campionato da an_standings
  const { data: standingsHistory = [] } = useQuery({
    queryKey: ["team_standings_history", team.TEAM_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("an_standings")
        .select("*")
        .eq("team", team.TEAM_ID.toUpperCase())
        .order("stag", { ascending: false });

      if (error) {
        console.error("Errore fetch storico classifica:", error);
        return [];
      }
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // 3. Storia Societaria (Rebrands & Cronologia Allenatori)
  const { rebrands, coaches, currentMeta, franchiseEras } = useClubHistory(team.TEAM_ID);

  // Filtra trofei
  const scudetti = trophies.filter((t) => t.trophy_type === "scudetto");
  const supercoppe = trophies.filter((t) => t.trophy_type === "supercoppa");

  // Dati Stadio
  const stadiumName = team.stadium_name || "Stadio Ufficiale";
  const stadiumCity = team.stadium_city || "Città del Club";
  const stadiumCapacity = team.stadium_capacity || 40000;
  const stadiumSurface = team.stadium_surface || "Erba Naturale";
  const stadiumYear = team.stadium_year || 2018;

  // Calcola percentuale capienza relativa (max Serie A = 60.000)
  const capacityPercent = Math.min(Math.round((stadiumCapacity / 60000) * 100), 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ===================================================================== */}
      {/* 1. SEZIONE STADIO (STILE FOOTBALL MANAGER)                           */}
      {/* ===================================================================== */}
      <Card className="overflow-hidden border-border/80 shadow-xl bg-card">
        {/* Banner superiore senza gradiente */}
        <div className="p-5 sm:p-6 bg-card border-b border-border/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <Landmark className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Impianto Ufficiale di Gioco • Serie A LCSIM
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  {stadiumName}
                </h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-foreground/80">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {stadiumCity}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-foreground/80">
                    <Calendar className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    Inaugurato nel {stadiumYear}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    🌱 {stadiumSurface}
                  </span>
                </div>
              </div>
            </div>

            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => (onEditStaff ? onEditStaff() : setIsEditModalOpen(true))}
                className="text-xs font-bold gap-1.5 self-start md:self-center h-8"
              >
                <Pencil className="w-3.5 h-3.5 text-primary" />
                <span>Modifica Info Stadio</span>
              </Button>
            )}
          </div>
        </div>

        {/* Griglia KPI Stadio */}
        <CardContent className="p-5 sm:p-6 bg-card/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Capienza Spettatori */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  Capienza Spettatori
                </span>
                <span className="font-mono text-foreground font-black">
                  {stadiumCapacity.toLocaleString("it-IT")}
                </span>
              </div>
              <Progress value={capacityPercent} className="h-2 bg-muted" />
            </div>

            {/* Città e Sede */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Ubicazione Sede
                </span>
                <strong className="text-sm font-black text-foreground">
                  {stadiumCity}
                </strong>
              </div>
            </div>

            {/* Superficie Manto */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Terreno di Gioco
                </span>
                <strong className="text-sm font-black text-foreground">
                  {stadiumSurface}
                </strong>
              </div>
            </div>

            {/* Proprietà Impianto */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Proprietà Struttura
                </span>
                <strong className="text-sm font-black text-foreground truncate block">
                  {team.NAME}
                </strong>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===================================================================== */}
      {/* 2. BACHECA & PALMARÈS UFFICIALE (ALBO D'ORO PER STAGIONE)              */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Scudetti Serie A */}
        <Card className="border-border/80 shadow-lg overflow-hidden bg-card">
          <CardHeader className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-b border-border/60 py-4 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 shrink-0 shadow-sm flex items-center justify-center p-1">
                  <img
                    src={TROPHY_CMP_URL}
                    alt="Scudetto"
                    className="w-full h-full object-contain drop-shadow-sm"
                  />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                    <span>Scudetto</span>
                    <Badge className="bg-amber-500 text-black font-black text-xs px-2 py-0">
                      {scudetti.length} {scudetti.length === 1 ? "Titolo" : "Titoli"}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Campione LCSIM
                  </CardDescription>
                </div>
              </div>
              <Crown className="w-6 h-6 text-amber-500/40 shrink-0 hidden sm:block" />
            </div>
          </CardHeader>

          <CardContent className="p-5">
            {scudetti.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {scudetti.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/30 flex items-center gap-3 hover:border-amber-500/50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 shrink-0 shadow-2xs flex items-center justify-center p-1">
                        <img
                          src={TROPHY_CMP_URL}
                          alt="Scudetto"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <strong className="text-sm font-extrabold text-foreground block truncate">
                          {t.season_label}
                        </strong>
                        <span className="text-[11px] text-muted-foreground block truncate">
                          {t.won_as_team_name && t.won_as_team_name !== team.NAME
                            ? `Come ${t.won_as_team_name}`
                            : "Campione d'Italia"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground italic pt-1">
                  Vittorie totali degli scudetti.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-muted/20 border border-dashed border-border/80 text-center space-y-2">
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 mx-auto w-fit">
                  <img
                    src={TROPHY_CMP_URL}
                    alt="Nessuno Scudetto"
                    className="w-8 h-8 object-contain opacity-30 grayscale"
                  />
                </div>
                <div className="text-xs font-bold text-foreground">
                  Nessuno Scudetto conquistato finora
                </div>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                  Il club è attualmente a caccia del primo titolo di Serie A nella storia della Lega.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Supercoppa di Lega */}
        <Card className="border-border/80 shadow-lg overflow-hidden bg-card">
          <CardHeader className="bg-gradient-to-r from-blue-500/15 via-blue-500/5 to-transparent border-b border-border/60 py-4 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 shrink-0 shadow-sm flex items-center justify-center p-1">
                  <img
                    src={TROPHY_SCP_URL}
                    alt="Supercoppa di Lega"
                    className="w-full h-full object-contain drop-shadow-sm"
                  />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                    <span>Supercoppa di Lega</span>
                    <Badge className="bg-blue-600 text-white font-black text-xs px-2 py-0">
                      {supercoppe.length} {supercoppe.length === 1 ? "Trofeo" : "Trofei"}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Vincitore della Supercoppa di Lega
                  </CardDescription>
                </div>
              </div>
              <Award className="w-6 h-6 text-blue-500/40 shrink-0 hidden sm:block" />
            </div>
          </CardHeader>

          <CardContent className="p-5">
            {supercoppe.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {supercoppe.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30 flex items-center gap-3 hover:border-blue-500/50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 shrink-0 shadow-2xs flex items-center justify-center p-1">
                        <img
                          src={TROPHY_SCP_URL}
                          alt="Supercoppa"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <strong className="text-sm font-extrabold text-foreground block truncate">
                          {t.season_label}
                        </strong>
                        <span className="text-[11px] text-muted-foreground block truncate">
                          Supercoppa LCSIM
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground italic pt-1">
                  Vittorie totali della Supercoppa di Lega.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-muted/20 border border-dashed border-border/80 text-center space-y-2">
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 mx-auto w-fit">
                  <img
                    src={TROPHY_SCP_URL}
                    alt="Nessuna Supercoppa"
                    className="w-8 h-8 object-contain opacity-30 grayscale"
                  />
                </div>
                <div className="text-xs font-bold text-foreground">
                  Nessuna Supercoppa in bacheca
                </div>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                  Il club non ha ancora conquistato la Supercoppa di Lega.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===================================================================== */}
      {/* 3. STORIA SOCIETARIA & CRONOLOGIA ALLENATORI (PUNTO #45)               */}
      {/* ===================================================================== */}
      <Card className="border-border/80 shadow-lg overflow-hidden bg-card">
        <CardHeader className="bg-muted/30 border-b border-border/60 py-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-black tracking-tight text-foreground">
                Storia, Identità Societaria & Allenatori
              </CardTitle>
              <CardDescription className="text-xs">
                Denominazioni storiche, franchigia d'appartenenza e cronologia panchine
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-bold self-start sm:self-auto">
            {currentMeta.eraSeasons}
          </Badge>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonna Sinistra: Evoluzione Denominazione */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Evoluzione Denominazione Club
              </h4>

              {rebrands.length === 0 ? (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground leading-relaxed">
                  Il club <strong className="text-foreground">{team.NAME} ({team.TEAM_ID})</strong> ha mantenuto la propria denominazione sociale e sigla fin dall'ingresso in Lega ({currentMeta.eraSeasons}).
                </div>
              ) : (
                <div className="space-y-2">
                  {rebrands.map((rb) => {
                    const preMeta = getHistoricalTeamMeta(rb.pre_team_id);
                    const postMeta = getHistoricalTeamMeta(rb.post_team_id);
                    return (
                      <div
                        key={rb.id}
                        className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                          <span>📅 {rb.rebrand_date}</span>
                          {rb.season_before && rb.season_after && (
                            <span className="font-bold text-primary">
                              Fine S{rb.season_before} ➔ Inizio S{rb.season_after}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <Badge className={`${preMeta.badgeClass} text-xs font-bold`}>
                            {preMeta.code} • {preMeta.fullName}
                          </Badge>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <Badge className={`${postMeta.badgeClass} text-xs font-bold`}>
                            {postMeta.code} • {postMeta.fullName}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Colonna Destra: Cronologia Allenatori sulla Panchina */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Cronologia Allenatori ({coaches.length})
              </h4>

              {coaches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {coaches.map((c) => {
                    const isHired = c.effetto?.toLowerCase().includes("assunz");
                    const tMeta = getHistoricalTeamMeta(c.team_id);
                    return (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-muted/40 border border-border/60 flex flex-col justify-between gap-1.5 hover:border-border transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isHired ? (
                              <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-1.5 py-0">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Assunzione
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[10px] font-bold px-1.5 py-0">
                                <UserX className="h-3 w-3 mr-1" />
                                Esonero / Addio
                              </Badge>
                            )}
                            <Badge className={`${tMeta.badgeClass} text-[10px] px-1.5 py-0 font-bold`}>
                              {c.team_id}
                            </Badge>
                          </div>
                          <span className="text-[11px] font-bold text-muted-foreground font-mono">
                            S{c.stagione}
                            {c.giornata ? ` • G${c.giornata}` : ""}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between gap-2 mt-0.5">
                          <span className="text-xs sm:text-sm font-black text-foreground">
                            {c.nome}
                          </span>
                          {c.event_date && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {c.event_date}
                            </span>
                          )}
                        </div>

                        {c.note && (
                          <p className="text-[11px] text-muted-foreground italic border-t border-border/50 pt-1 mt-0.5">
                            "{c.note}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground">
                  Nessun passaggio di panchina pregresso registrato nel database cronistoria per questo club.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modale Modifica Staff e Stadio */}
      {isEditModalOpen && (
        <EditCoachModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          teamId={team.TEAM_ID}
          teamName={team.NAME}
          currentCoachName={team.MANAGER}
          currentPresidentName={presidentName}
        />
      )}
    </div>
  );
};

export default ClubProfileTab;
