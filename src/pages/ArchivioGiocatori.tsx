import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, Trophy, Star, Award, Target, Users } from "lucide-react";
import { useState } from "react";
import { getPlayers } from "@/hooks/use-players";
import { getTeams } from "@/hooks/use-teams";
import { getRoleColor } from "@/utils/functions";

// Mock data per statistiche carriera - in futuro da DB
const getCareerStats = (playerId: number) => ({
  minuti: 8415,
  gol: 31,
  autogol: 1,
  assist: 27,
  tiriTot: 112,
  tiriIn: 70,
  tiriPerc: "62.50%",
  passaggiTot: 1661,
  passaggiSi: 1478,
  passaggiPerc: "88.98%",
  dribblingTot: 1282,
  dribblingSi: 1185,
  dribblingPerc: "92.43%",
  crossTot: 71,
  crossSi: 26,
  crossPerc: "36.62%",
  contrastiTot: 49,
  contrastiSi: 26,
  contrastiPerc: "53.06%",
  falli: 9,
  parate: 0,
  golSubiti: 0,
  gialli: 4,
  rossi: 0,
  fuorigioco: 15,
  wins: 34,
  draws: 26,
  losses: 35,
  mediaVoto: 6.89,
});

const getSeasonStats = (playerId: number) => [
  { stagione: "S1", team: "APD", minuti: 575, mv: 6.89, gol: 2, autogol: 0, assist: 1, tiri: { si: 3, tot: 4 }, passaggi: { si: 96, tot: 105 }, dribbling: { si: 78, tot: 83 }, cross: { si: 4, tot: 6 }, contrasti: { si: 0, tot: 1 }, falli: 2, parate: 0, golSub: 0, gialli: 1, rossi: 0, fgioco: 1, premi: "Miglior Centrocampista S1, MVP Week 2 S1, MVP Week 7 S1, All Star" },
  { stagione: "S2", team: "APD", minuti: 1196, mv: 6.78, gol: 2, autogol: 0, assist: 2, tiri: { si: 10, tot: 15 }, passaggi: { si: 295, tot: 334 }, dribbling: { si: 220, tot: 237 }, cross: { si: 5, tot: 12 }, contrasti: { si: 9, tot: 15 }, falli: 0, parate: 0, golSub: 0, gialli: 0, rossi: 0, fgioco: 2, premi: "Miglior Centrocampista S2, All Star" },
  { stagione: "S3", team: "APD", minuti: 1200, mv: 6.28, gol: 0, autogol: 2, assist: 6, tiri: { si: 12, tot: 12 }, passaggi: { si: 189, tot: 218 }, dribbling: { si: 134, tot: 140 }, cross: { si: 3, tot: 6 }, contrasti: { si: 2, tot: 5 }, falli: 1, parate: 0, golSub: 0, gialli: 1, rossi: 0, fgioco: 0, premi: "All Star" },
  { stagione: "S4", team: "PFC", minuti: 1199, mv: 6.99, gol: 6, autogol: 0, assist: 9, tiri: { si: 15, tot: 24 }, passaggi: { si: 236, tot: 261 }, dribbling: { si: 193, tot: 209 }, cross: { si: 5, tot: 12 }, contrasti: { si: 2, tot: 6 }, falli: 1, parate: 0, golSub: 0, gialli: 1, rossi: 0, fgioco: 1, premi: "MVP S4, Classifica Assist S4, Miglior Centrocampista S4, MVP Week 4 S4, Campione LCSIM S4, All Star" },
  { stagione: "S5", team: "PFC", minuti: 990, mv: 6.73, gol: 3, autogol: 0, assist: 5, tiri: { si: 9, tot: 18 }, passaggi: { si: 195, tot: 214 }, dribbling: { si: 150, tot: 164 }, cross: { si: 1, tot: 9 }, contrasti: { si: 5, tot: 9 }, falli: 0, parate: 0, golSub: 0, gialli: 0, rossi: 0, fgioco: 4, premi: "All Star" },
  { stagione: "S6", team: "ASK", minuti: 1230, mv: 7.15, gol: 4, autogol: 3, assist: 9, tiri: { si: 9, tot: 14 }, passaggi: { si: 204, tot: 223 }, dribbling: { si: 163, tot: 184 }, cross: { si: 2, tot: 11 }, contrasti: { si: 2, tot: 2 }, falli: 3, parate: 0, golSub: 0, gialli: 0, rossi: 0, fgioco: 0, premi: "MVP Week 10 S6" },
  { stagione: "S7", team: "ASK", minuti: 1031, mv: 6.85, gol: 3, autogol: 0, assist: 2, tiri: { si: 6, tot: 9 }, passaggi: { si: 154, tot: 175 }, dribbling: { si: 135, tot: 147 }, cross: { si: 2, tot: 7 }, contrasti: { si: 3, tot: 5 }, falli: 1, parate: 0, golSub: 0, gialli: 0, rossi: 0, fgioco: 2, premi: "All Star" },
  { stagione: "S8", team: "ASK", minuti: 994, mv: 7.48, gol: 10, autogol: 1, assist: 3, tiri: { si: 12, tot: 16 }, passaggi: { si: 109, tot: 131 }, dribbling: { si: 112, tot: 118 }, cross: { si: 4, tot: 8 }, contrasti: { si: 3, tot: 6 }, falli: 1, parate: 0, golSub: 0, gialli: 1, rossi: 0, fgioco: 5, premi: "Classifica Marcatori S8, Miglior Attaccante S8, All Star" },
];

const getAchievements = (playerId: number) => ({
  mvp: 1,
  finalsMvp: 0,
  campione: 1,
  ruolo: 4,
  capocannoniere: 1,
  assistman: 1,
  allStar: 7,
  mvpGiornata: 4,
  storia: "#1 - APD ---> PFC ---> ASK ---> 🌟 HALL OF FAME 🌟",
  hallOfFame: true,
});

const OvrBadge = ({ value, label }: { value: number; label: string }) => {
  const getColor = (val: number) => {
    if (val >= 9) return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950";
    if (val >= 8) return "bg-gradient-to-br from-green-400 to-green-600 text-green-950";
    if (val >= 7) return "bg-gradient-to-br from-blue-400 to-blue-600 text-blue-950";
    if (val >= 6) return "bg-gradient-to-br from-purple-400 to-purple-600 text-purple-950";
    return "bg-gradient-to-br from-gray-400 to-gray-600 text-gray-950";
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg ${getColor(value)}`}>
        {value}
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
};

const StatBox = ({ label, value, subValue }: { label: string; value: string | number; subValue?: string }) => (
  <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
    <span className="text-xs text-muted-foreground mb-1">{label}</span>
    <span className="text-lg font-bold text-foreground">{value}</span>
    {subValue && <span className="text-xs text-muted-foreground">{subValue}</span>}
  </div>
);

const AchievementBadge = ({ icon: Icon, count, label }: { icon: React.ElementType; count: number; label: string }) => (
  <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
    <Icon className="h-4 w-4 text-primary" />
    <span className="font-bold text-primary">{count}x</span>
    <span className="text-sm text-foreground">{label}</span>
  </div>
);

const ArchivioGiocatori = () => {
  const { players } = getPlayers();
  const { teams } = getTeams();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

  const selectedPlayer = players.find(p => p.ID.toString() === selectedPlayerId);
  const careerStats = selectedPlayer ? getCareerStats(selectedPlayer.ID) : null;
  const seasonStats = selectedPlayer ? getSeasonStats(selectedPlayer.ID) : [];
  const achievements = selectedPlayer ? getAchievements(selectedPlayer.ID) : null;

  const getTeamBadgeColor = (teamId: string) => {
    const colors: Record<string, string> = {
      APD: "bg-blue-500",
      PFC: "bg-red-500",
      ASK: "bg-yellow-500",
      ACD: "bg-green-500",
      ACF: "bg-purple-500",
      ALV: "bg-orange-500",
      MAR: "bg-pink-500",
      OLD: "bg-cyan-500",
      RMB: "bg-indigo-500",
      VFC: "bg-teal-500",
    };
    return colors[teamId] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <Archive className="h-8 w-8 text-primary" />
            Archivio Giocatori
          </h1>
          <p className="text-muted-foreground">Esplora le statistiche complete della carriera dei giocatori</p>
        </div>

        {/* Player Selector */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Seleziona Giocatore
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Scegli un giocatore..." />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {players.map((player) => (
                  <SelectItem key={player.ID} value={player.ID.toString()}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{player.Cognome}, {player.Nome}</span>
                      <Badge variant="outline" className={getRoleColor(player.Posiz)}>
                        {player.Posiz}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Player Details */}
        {selectedPlayer && careerStats && achievements && (
          <div className="space-y-6 animate-fade-in">
            {/* Player Header Card */}
            <Card className="shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6">
                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                  {/* Player Image & Basic Info */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={`/images/players/p${selectedPlayer.ID}.png`}
                        alt={`${selectedPlayer.Nome} ${selectedPlayer.Cognome}`}
                        className="h-28 w-28 rounded-xl object-cover border-4 border-primary/30 shadow-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                      {achievements.hallOfFame && (
                        <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1.5 shadow-lg">
                          <Star className="h-4 w-4 text-yellow-950 fill-yellow-950" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-foreground">
                        {selectedPlayer.Cognome.toUpperCase()}, {selectedPlayer.Nome}
                      </h2>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <Badge variant="outline" className={getRoleColor(selectedPlayer.Posiz)}>
                          {selectedPlayer.Posiz}
                        </Badge>
                        <span className="text-muted-foreground">ID: {selectedPlayer.ID}</span>
                        <span className="text-muted-foreground">
                          Record: <span className="text-green-500 font-bold">{careerStats.wins}</span>-
                          <span className="text-yellow-500 font-bold">{careerStats.draws}</span>-
                          <span className="text-red-500 font-bold">{careerStats.losses}</span>
                        </span>
                      </div>
                      {achievements.hallOfFame && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mt-2">
                          🌟 HALL OF FAME 🌟
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">{achievements.storia}</p>
                    </div>
                  </div>

                  {/* Player Physical Info */}
                  <div className="flex gap-6 lg:ml-auto">
                    <div className="text-center">
                      <span className="text-sm text-muted-foreground">Età</span>
                      <p className="text-xl font-bold">{selectedPlayer.Età}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-sm text-muted-foreground">Altezza</span>
                      <p className="text-xl font-bold">{selectedPlayer.Altezza}cm</p>
                    </div>
                    <div className="text-center">
                      <span className="text-sm text-muted-foreground">Peso</span>
                      <p className="text-xl font-bold">{selectedPlayer.Peso}kg</p>
                    </div>
                    <div className="text-center">
                      <span className="text-sm text-muted-foreground">Media Voto</span>
                      <p className="text-2xl font-bold text-primary">{careerStats.mediaVoto.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* OVR Badges */}
                <div className="flex gap-4 mt-6 flex-wrap">
                  <OvrBadge value={selectedPlayer.OVR ?? 0} label="OVR" />
                  <OvrBadge value={selectedPlayer.POR ?? 0} label="POR" />
                  <OvrBadge value={selectedPlayer.DIF ?? 0} label="DIF" />
                  <OvrBadge value={selectedPlayer.CEN ?? 0} label="CEN" />
                  <OvrBadge value={selectedPlayer.ATT ?? 0} label="ATT" />
                  <OvrBadge value={selectedPlayer.FIS ?? 0} label="FIS" />
                  <OvrBadge value={selectedPlayer.CPZ ?? 0} label="CPZ" />
                </div>

                {/* Achievements */}
                <div className="flex gap-3 mt-6 flex-wrap">
                  {achievements.mvp > 0 && <AchievementBadge icon={Trophy} count={achievements.mvp} label="MVP" />}
                  {achievements.campione > 0 && <AchievementBadge icon={Trophy} count={achievements.campione} label="Campione" />}
                  {achievements.ruolo > 0 && <AchievementBadge icon={Award} count={achievements.ruolo} label="Miglior Ruolo" />}
                  {achievements.capocannoniere > 0 && <AchievementBadge icon={Target} count={achievements.capocannoniere} label="Capocannoniere" />}
                  {achievements.assistman > 0 && <AchievementBadge icon={Target} count={achievements.assistman} label="Assist-man" />}
                  {achievements.allStar > 0 && <AchievementBadge icon={Star} count={achievements.allStar} label="All Star" />}
                  {achievements.mvpGiornata > 0 && <AchievementBadge icon={Award} count={achievements.mvpGiornata} label="MVP Giornata" />}
                </div>
              </div>
            </Card>

            {/* Statistics Tabs */}
            <Card className="shadow-lg">
              <Tabs defaultValue="carriera" className="w-full">
                <CardHeader>
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="carriera">Statistiche Carriera</TabsTrigger>
                    <TabsTrigger value="stagioni">Per Stagione</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
                  <TabsContent value="carriera" className="mt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      <StatBox label="Minuti" value={careerStats.minuti.toLocaleString()} />
                      <StatBox label="Gol" value={careerStats.gol} />
                      <StatBox label="Autogol" value={careerStats.autogol} />
                      <StatBox label="Assist" value={careerStats.assist} />
                      <StatBox label="Tiri" value={`${careerStats.tiriIn}/${careerStats.tiriTot}`} subValue={careerStats.tiriPerc} />
                      <StatBox label="Passaggi" value={`${careerStats.passaggiSi}/${careerStats.passaggiTot}`} subValue={careerStats.passaggiPerc} />
                      <StatBox label="Dribbling" value={`${careerStats.dribblingSi}/${careerStats.dribblingTot}`} subValue={careerStats.dribblingPerc} />
                      <StatBox label="Cross" value={`${careerStats.crossSi}/${careerStats.crossTot}`} subValue={careerStats.crossPerc} />
                      <StatBox label="Contrasti" value={`${careerStats.contrastiSi}/${careerStats.contrastiTot}`} subValue={careerStats.contrastiPerc} />
                      <StatBox label="Falli" value={careerStats.falli} />
                      <StatBox label="Parate" value={careerStats.parate} />
                      <StatBox label="Gol Subiti" value={careerStats.golSubiti} />
                      <StatBox label="Gialli" value={careerStats.gialli} />
                      <StatBox label="Rossi" value={careerStats.rossi} />
                      <StatBox label="Fuorigioco" value={careerStats.fuorigioco} />
                    </div>
                  </TabsContent>

                  <TabsContent value="stagioni" className="mt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3 font-semibold">Stag</th>
                            <th className="text-left p-3 font-semibold">Team</th>
                            <th className="text-center p-3 font-semibold">Min</th>
                            <th className="text-center p-3 font-semibold">MV</th>
                            <th className="text-center p-3 font-semibold">Gol</th>
                            <th className="text-center p-3 font-semibold">Assist</th>
                            <th className="text-center p-3 font-semibold">Tiri</th>
                            <th className="text-center p-3 font-semibold">Pass</th>
                            <th className="text-center p-3 font-semibold">Drib</th>
                            <th className="text-center p-3 font-semibold">🟨</th>
                            <th className="text-center p-3 font-semibold">🟥</th>
                            <th className="text-left p-3 font-semibold">Premi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seasonStats.map((season, idx) => (
                            <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="p-3 font-medium">{season.stagione}</td>
                              <td className="p-3">
                                <Badge className={`${getTeamBadgeColor(season.team)} text-white`}>
                                  {season.team}
                                </Badge>
                              </td>
                              <td className="text-center p-3">{season.minuti}</td>
                              <td className="text-center p-3 font-bold text-primary">{season.mv.toFixed(2)}</td>
                              <td className="text-center p-3">{season.gol}</td>
                              <td className="text-center p-3">{season.assist}</td>
                              <td className="text-center p-3">{season.tiri.si}/{season.tiri.tot}</td>
                              <td className="text-center p-3">{season.passaggi.si}/{season.passaggi.tot}</td>
                              <td className="text-center p-3">{season.dribbling.si}/{season.dribbling.tot}</td>
                              <td className="text-center p-3">{season.gialli}</td>
                              <td className="text-center p-3">{season.rossi}</td>
                              <td className="p-3 text-xs text-muted-foreground max-w-xs truncate" title={season.premi}>
                                {season.premi}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!selectedPlayer && (
          <Card className="shadow-lg">
            <CardContent className="py-16 text-center">
              <Archive className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">Nessun giocatore selezionato</h3>
              <p className="text-muted-foreground">Seleziona un giocatore dal menu sopra per visualizzare le sue statistiche complete.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ArchivioGiocatori;
