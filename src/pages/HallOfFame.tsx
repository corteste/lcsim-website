import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  Crown,
  Award,
  Plus,
  Pencil,
  Trash2,
  Archive,
  Sparkles,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPlayerImage,
  getRoleColor,
  getNationalityFlag,
} from "@/utils/functions";
import {
  fetchAllPlayersCareerSummary,
  fetchHallOfFameEntries,
  upsertHallOfFameMember,
  deleteHallOfFameMember,
  getHistoricalTeamMeta,
  PlayerCareerSummary,
  HallOfFameEntry,
} from "@/services/archiveService";

const HallOfFame = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();

  // Admin modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string>("");
  const [activeSeasonsInput, setActiveSeasonsInput] = useState("S1-S8");
  const [inductionClassInput, setInductionClassInput] = useState("S8");
  const [inductionOrderInput, setInductionOrderInput] = useState("1");
  const [bioNoteInput, setBioNoteInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: allPlayers = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ["archive_players_career_summary"],
    queryFn: fetchAllPlayersCareerSummary,
    staleTime: 60 * 1000,
  });

  const { data: hofEntries = [], isLoading: loadingHof } = useQuery({
    queryKey: ["hall_of_fame_entries"],
    queryFn: fetchHallOfFameEntries,
    staleTime: 60 * 1000,
  });

  const playerMap = useMemo(() => {
    const map = new Map<number, PlayerCareerSummary>();
    for (const p of allPlayers) {
      map.set(p.player_id, p);
    }
    return map;
  }, [allPlayers]);

  const hofMembers = useMemo(() => {
    return hofEntries.map((entry) => ({
      ...entry,
      career: playerMap.get(entry.player_id),
    }));
  }, [hofEntries, playerMap]);

  // Adaptive sizing based on total members so all fit in a single glance
  const isCompactMode = hofMembers.length >= 6;
  const isUltraCompactMode = hofMembers.length >= 10;

  const handleOpenAddModal = () => {
    setEditingPlayerId("");
    setActiveSeasonsInput("S1-S10");
    setInductionClassInput("S10");
    setInductionOrderInput(String(hofMembers.length + 1));
    setBioNoteInput("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry: HallOfFameEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPlayerId(String(entry.player_id));
    setActiveSeasonsInput(entry.active_seasons);
    setInductionClassInput(entry.induction_class);
    setInductionOrderInput(String(entry.induction_order));
    setBioNoteInput(entry.bio_note || "");
    setIsModalOpen(true);
  };

  const handleSaveHofMember = async () => {
    const pid = Number(editingPlayerId);
    if (!pid) {
      toast.error("Seleziona un calciatore valido.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await upsertHallOfFameMember({
        playerId: pid,
        activeSeasons: activeSeasonsInput,
        inductionClass: inductionClassInput,
        inductionOrder: Number(inductionOrderInput) || 1,
        bioNote: bioNoteInput,
        actingUsername: user?.username,
      });
      if (!res.success) {
        toast.error(res.error || "Errore durante il salvataggio.");
        return;
      }
      toast.success("Hall of Fame aggiornata con successo!");
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["hall_of_fame_entries"] });
      queryClient.invalidateQueries({ queryKey: ["archive_players_career_summary"] });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHofMember = async (playerId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Rimuovere questo giocatore dalla Hall of Fame?")) return;
    const res = await deleteHallOfFameMember(playerId, user?.username);
    if (!res.success) {
      toast.error(res.error || "Errore durante la rimozione.");
      return;
    }
    toast.success("Giocatore rimosso dalla Hall of Fame.");
    queryClient.invalidateQueries({ queryKey: ["hall_of_fame_entries"] });
    queryClient.invalidateQueries({ queryKey: ["archive_players_career_summary"] });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-5 flex-1 flex flex-col justify-between gap-5">
        {/* Compact Monumental Header */}
        <div className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent px-5 py-4 shadow-lg">
          <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-yellow-500/15 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 text-yellow-950 shadow-lg shadow-yellow-500/20">
                <Crown className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-600 dark:text-yellow-400">
                    Pantheon Ufficiale LCSIM
                  </span>
                  <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/40 text-[10px] font-black px-2 py-0">
                    {hofMembers.length} {hofMembers.length === 1 ? "Leggenda" : "Leggende"}
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Hall of Fame
                </h1>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={handleOpenAddModal}
                  className="h-8 text-xs bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-yellow-950 font-black gap-1.5 shadow-md"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Induci Leggenda
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Single-Glance Pantheon Showcase */}
        <div className="flex-1 flex items-center justify-center py-2">
          {loadingHof || loadingPlayers ? (
            <div className="py-16 text-center text-muted-foreground">
              Caricamento Pantheon Hall of Fame...
            </div>
          ) : hofMembers.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              Nessun membro ancora introdotto nella Hall of Fame.
            </div>
          ) : (
            <div className="w-full flex flex-wrap items-stretch justify-center gap-4 sm:gap-5">
              {hofMembers.map((member, index) => {
                const c = member.career;
                const distinctTeams = c ? Array.from(new Set(c.season_teams)) : [];

                const cardWidthClass = isUltraCompactMode
                  ? "w-full sm:w-[220px] md:w-[235px]"
                  : isCompactMode
                  ? "w-full sm:w-[245px] md:w-[260px]"
                  : "w-full sm:w-[270px] md:w-[290px]";

                return (
                  <div
                    key={member.player_id}
                    onClick={() => navigate(`/archivio/giocatori?player=${member.player_id}`)}
                    className={`${cardWidthClass} group relative rounded-3xl p-[1.5px] bg-gradient-to-b from-yellow-300/80 via-amber-500/50 to-yellow-700/30 hover:from-yellow-300 hover:via-amber-400 hover:to-yellow-500 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-yellow-500/20 cursor-pointer flex flex-col`}
                  >
                    {/* Inner EA FC Icon / Luxury Card Body */}
                    <div className="relative flex-1 rounded-[22.5px] bg-gradient-to-b from-amber-950/35 via-card/95 to-card dark:from-amber-950/50 dark:via-zinc-900/95 dark:to-zinc-950 overflow-hidden flex flex-col justify-between p-3.5 sm:p-4">
                      {/* Ambient Gold Glow */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-28 bg-yellow-500/20 blur-2xl rounded-full pointer-events-none group-hover:bg-yellow-400/30 transition-all" />

                      {/* Admin Quick Actions */}
                      {isAdmin && (
                        <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7 rounded-lg shadow-md"
                            onClick={(e) => handleOpenEditModal(member, e)}
                            title="Modifica membro Hall of Fame"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7 rounded-lg shadow-md"
                            onClick={(e) => handleDeleteHofMember(member.player_id, e)}
                            title="Rimuovi dalla Hall of Fame"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}

                      {/* Top Header Bar: OVR / Pos / Flag on Left, Class & Era on Right */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          {/* Left: OVR + Role + Flag Pill */}
                          <div className="flex items-center gap-1.5 bg-yellow-500/15 border border-yellow-500/35 rounded-lg px-2 py-0.5 shadow-2xs">
                            <span className="text-base sm:text-lg font-black leading-none text-yellow-600 dark:text-yellow-300 font-mono">
                              {c?.ovr ?? "—"}
                            </span>
                            <span className="text-[10px] font-black uppercase text-foreground leading-none">
                              {c?.posiz ?? "HOF"}
                            </span>
                            {c?.nazionalita && (
                              <img
                                src={getNationalityFlag(c.nazionalita)}
                                alt={c.nazionalita}
                                className="h-2.5 w-4 object-cover rounded-[1px] shadow-2xs"
                              />
                            )}
                          </div>

                          {/* Right: Induction Class & Active Seasons */}
                          <div className="flex items-center gap-1">
                            <Badge className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-700 dark:text-yellow-300 border border-yellow-500/40 text-[9px] font-black px-1.5 py-0.5">
                              CLASSE {member.induction_class}
                            </Badge>
                            <span className="text-[9px] font-bold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/50">
                              {member.active_seasons}
                            </span>
                          </div>
                        </div>

                        {/* Big Centered Hero Portrait */}
                        <div className="flex justify-center my-2 sm:my-3">
                          <div className="relative rounded-2xl p-1 bg-gradient-to-b from-yellow-300 via-amber-500 to-yellow-600 shadow-xl group-hover:scale-105 transition-transform duration-300">
                            <img
                              src={getPlayerImage(member.player_id)}
                              alt={c ? `${c.nome} ${c.cognome}` : `#${member.player_id}`}
                              className="h-28 w-28 sm:h-32 sm:w-32 rounded-[12px] object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                          </div>
                        </div>

                        {/* Player Name (Nome 1st line, Cognome 2nd line) & Golden Divider */}
                        <div className="text-center mt-1">
                          {c ? (
                            <div className="leading-tight">
                              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground/90 block">
                                {c.nome}
                              </span>
                              <span className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground group-hover:text-yellow-500 transition-colors block">
                                {c.cognome}
                              </span>
                            </div>
                          ) : (
                            <h2 className="text-base font-black tracking-tight text-foreground group-hover:text-yellow-500 transition-colors uppercase">
                              Giocatore #{member.player_id}
                            </h2>
                          )}
                          <div className="h-[1px] w-3/4 mx-auto bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent my-2" />
                        </div>

                        {member.bio_note && !isUltraCompactMode && (
                          <p className="text-[11px] text-center text-muted-foreground line-clamp-1">
                            {member.bio_note}
                          </p>
                        )}
                      </div>

                      {/* Bottom Telemetry Bar (4 Key Pillars: Pres, Gol, Assist, MV) */}
                      {c && (
                        <div className="mt-3 pt-2.5 border-t border-yellow-500/20">
                          <div className="grid grid-cols-4 gap-1.5 text-center">
                            <div className="bg-muted/40 dark:bg-white/5 rounded-xl py-1.5 px-1 border border-border/50">
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">
                                Pres
                              </span>
                              <span className="text-xs sm:text-sm font-black text-foreground">
                                {c.presenze}
                              </span>
                            </div>
                            <div className="bg-muted/40 dark:bg-white/5 rounded-xl py-1.5 px-1 border border-border/50">
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">
                                Gol
                              </span>
                              <span className="text-xs sm:text-sm font-black text-emerald-500">
                                {c.gol}
                              </span>
                            </div>
                            <div className="bg-muted/40 dark:bg-white/5 rounded-xl py-1.5 px-1 border border-border/50">
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">
                                Assist
                              </span>
                              <span className="text-xs sm:text-sm font-black text-blue-500">
                                {c.assist}
                              </span>
                            </div>
                            <div className="bg-yellow-500/15 rounded-xl py-1.5 px-1 border border-yellow-500/30">
                              <span className="text-[9px] uppercase tracking-wider text-yellow-700 dark:text-yellow-300 font-bold block">
                                MV
                              </span>
                              <span className="text-xs sm:text-sm font-black text-yellow-600 dark:text-yellow-400">
                                {c.media_voto ? c.media_voto.toFixed(2) : "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subtle Footer Hint */}
        <div className="text-center text-xs text-muted-foreground pb-1">
          Clicca sulla card di una leggenda per aprire la sua scheda completa nell'Archivio Calciatori
        </div>
      </main>

      {/* Admin Add / Edit Hall of Fame Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Gestione Membro Hall of Fame
            </DialogTitle>
            <DialogDescription>
              Aggiungi o aggiorna un calciatore leggendario nella Hall of Fame ufficiale LCSIM.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Calciatore</Label>
              <Select value={editingPlayerId} onValueChange={setEditingPlayerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un calciatore..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {allPlayers.map((p) => (
                    <SelectItem key={p.player_id} value={String(p.player_id)}>
                      {p.cognome}, {p.nome} (#{p.player_id} • {p.posiz} • {p.presenze} pres)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Stagioni in Attività</Label>
                <Input
                  placeholder="es. S1-S8"
                  value={activeSeasonsInput}
                  onChange={(e) => setActiveSeasonsInput(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Classe di Ingresso</Label>
                <Input
                  placeholder="es. S8"
                  value={inductionClassInput}
                  onChange={(e) => setInductionClassInput(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Ordine di Visualizzazione</Label>
              <Input
                type="number"
                value={inductionOrderInput}
                onChange={(e) => setInductionOrderInput(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Nota Storica / Sintesi Carriera (opzionale)</Label>
              <Input
                placeholder="es. #1 Draft S1 • APD → PFC → ASK"
                value={bioNoteInput}
                onChange={(e) => setBioNoteInput(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSaveHofMember}
              disabled={isSubmitting}
              className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold"
            >
              {isSubmitting ? "Salvataggio..." : "Salva nella Hall of Fame"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HallOfFame;
