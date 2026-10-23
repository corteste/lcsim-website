import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Calendar } from "lucide-react";
import { getRoleColor, getPlayerImage, getNationalityFlag, getTeamBackground } from "@/utils/functions";
import { getPlayers } from "@/hooks/use-players";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getValueColor } from "@/utils/functions";
import { Player } from "@/types/player";
import PlayerDetails from "@/components/player/playerDetails";
import AdminTeamSelector from "@/components/AdminTeamSelector";
import RequireAuthPrompt from "@/components/RequireAuthPrompt";
import { useState } from "react";

const Roster = () => {
  const { user, effectiveTeam, effectiveTeamFullName } = useAuth();
  const currentTeam = effectiveTeam;
  const currentTeamFullName = effectiveTeamFullName || currentTeam;
  const { players } = getPlayers(currentTeam);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Group players by position category
  const goalkeepers = players.filter(p => p.Posiz === "POR");
  const defenders = players.filter(p => ["DC", "TD", "TS"].includes(p.Posiz));
  const midfielders = players.filter(p => ["CDC", "CC", "ED", "ES", "COC"].includes(p.Posiz));
  const attackers = players.filter(p => ["AD", "AS", "AT", "ATT"].includes(p.Posiz));

  const sections = [
    { label: "Portieri", icon: Shield, players: goalkeepers },
    { label: "Difensori", icon: Shield, players: defenders },
    { label: "Centrocampisti", icon: Zap, players: midfielders },
    { label: "Attaccanti", icon: Zap, players: attackers },
  ].filter(s => s.players.length > 0);

  const avgOvr = players.length > 0
    ? Math.round(players.reduce((sum, p) => sum + (p.OVR ?? 0), 0) / players.length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-6">
        {!user ? (
          <RequireAuthPrompt
            title="Roster di Squadra"
            description="Per consultare la rosa della tua squadra devi effettuare il login oppure scegliere una delle squadre di Serie A attualmente libere!"
          />
        ) : (
          <>
            {/* Admin global team switcher */}
            <AdminTeamSelector />

            {/* Hero header */}
            <Card className={`mb-6 overflow-hidden border-0 shadow-lg ${getTeamBackground(currentTeam ?? "")}`}>
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  {currentTeam && (
                    <img
                      src={`/images/teams/${currentTeam}_Logo.png`}
                      alt={`${currentTeam} Logo`}
                      className="h-16 w-16 object-contain drop-shadow-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                      }}
                    />
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      {currentTeamFullName}
                    </h1>
                    <p className="text-muted-foreground mt-1">{players.length} giocatori in rosa</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">OVR Medio</div>
                  <div className="text-4xl font-black text-primary">{avgOvr}</div>
                </div>
              </div>
            </Card>

            {/* Player sections */}
            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.label}>
                  <div className="flex items-center gap-2 mb-3">
                    <section.icon className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.label}
                    </h2>
                    <Badge variant="secondary" className="text-xs ml-1">{section.players.length}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {section.players.map((player) => (
                      <Card
                        key={player.ID}
                        onClick={() => setSelectedPlayer(player)}
                        className="group border border-border/50 hover:border-primary/40 hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer"
                      >
                        <CardContent className="p-0">
                          <div className="flex items-center gap-3 p-4">
                            {/* Avatar */}
                            <Avatar className="h-12 w-12 border-2 border-border group-hover:border-primary/40 transition-colors">
                              <AvatarImage src={getPlayerImage(player.ID)} alt={`${player.Nome} ${player.Cognome}`} />
                              <AvatarFallback className="text-xs font-bold bg-muted">
                                {player.Nome?.[0]}{player.Cognome?.[0]}
                              </AvatarFallback>
                            </Avatar>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                  {player.Nome} {player.Cognome}
                                </span>
                                <img
                                  src={getNationalityFlag(player.Nazionalità)}
                                  alt={player.Nazionalità}
                                  className="h-4 w-4 object-contain shrink-0"
                                />
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getRoleColor(player.Posiz)}`}>
                                  {player.Posiz}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {player.Età} anni
                                </span>
                              </div>
                            </div>

                            {/* OVR */}
                            <div className="text-center shrink-0">
                              <Badge
                                variant="outline"
                                className={`${getValueColor(player.OVR ?? 0)} text-xl font-bold px-3 py-1 border`}
                              >
                                {player.OVR}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Modal Dettaglio Giocatore */}
      {selectedPlayer && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4" 
          onClick={() => setSelectedPlayer(null)}
        >
          <PlayerDetails currentPlayer={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
        </div>
      )}
    </div>
  );
};

export default Roster;
