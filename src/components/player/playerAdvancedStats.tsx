import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerStatsSum } from "@/types/playerStats";
import { Team } from "@/types/team";

interface PlayerStatsProps {
    currentPlayer: PlayerStatsSum;
    teams: Team[];
};

/**
 * Componente che mostra le statistiche in dettaglio di un giocatore specifico.
 * @param currentPlayer 
 * @returns 
 */
const PlayerAdvancedStats = ({ currentPlayer, teams }: PlayerStatsProps) => {
    return (
        <div className="space-y-6 mt-4">
            {/* General Info */}
            {/* <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informazioni Generali</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{currentPlayer.Nome} {currentPlayer.Cognome}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Squadra</p>
                    <p className="font-medium">{teams.find(t => t.TEAM_ID === currentPlayer.Squadra)?.NAME ?? "-" }</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Ruolo</p>
                    <p className="font-medium">{currentPlayer.Posiz}</p>
                </div>
                
                </CardContent>
              </Card> */}

            {/* Performance Stats PORTIERE */}
            {currentPlayer.Posiz == "POR" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Statistiche Totali</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {currentPlayer.sum_para !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Parate</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_para}</p>
                            </div>
                        )}
                        {currentPlayer.sum_gsub !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Goal Subiti</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_gsub}</p>
                            </div>
                        )}
                        {currentPlayer.matches_played !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Voto Medio</p>
                                <p className="font-bold text-2xl text-primary">{Math.round((currentPlayer.sum_voto / currentPlayer.matches_played) * 100) / 100}</p>
                            </div>
                        )}
                        {currentPlayer.sum_minuti !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Minuti Giocati</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_minuti}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
            {/* Performance Stats GIOCATORI DI MOVIMENTO */}
            {currentPlayer.Posiz != "POR" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Statistiche Totali</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {currentPlayer.sum_gol !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Gol</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_gol}</p>
                            </div>
                        )}
                        {currentPlayer.sum_asst !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Assist</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_asst}</p>
                            </div>
                        )}
                        {currentPlayer.matches_played !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Voto Medio</p>
                                <p className="font-bold text-2xl text-primary">{isNaN(currentPlayer.sum_voto / currentPlayer.matches_played) ? "N/D": Math.round((currentPlayer.sum_voto / currentPlayer.matches_played) * 100) / 100}</p>
                            </div>
                        )}
                        {currentPlayer.sum_minuti !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Minuti Giocati</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_minuti}</p>
                            </div>
                        )}
                    </CardContent>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {currentPlayer.sum_fgioco !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Fuorigioco</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_fgioco}</p>
                            </div>
                        )}
                        {currentPlayer.sum_falli !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Falli</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_falli}</p>
                            </div>
                        )}
                        {currentPlayer.sum_gialli !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Cartellini Gialli</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_gialli}</p>
                            </div>
                        )}
                        {currentPlayer.sum_rossi !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Cartellini Rossi</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_rossi}</p>
                            </div>
                        )}
                    </CardContent>
                    {/** Sezione Tiri */}
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {currentPlayer.sum_tiri_in !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Tiri a Segno</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_tiri_in}</p>
                            </div>
                        )}
                        {currentPlayer.sum_tiri_tot !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Tiri Totali</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_tiri_tot}</p>
                            </div>
                        )}
                        {currentPlayer.sum_tiri_tot !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Tiri %</p>
                                <p className="font-bold text-2xl text-primary">{Math.round((currentPlayer.sum_tiri_in / currentPlayer.sum_tiri_tot) * 100)}%</p>
                            </div>
                        )}
                    </CardContent>
                    {/** Sezione Passaggi */}
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {currentPlayer.sum_pass_si !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Passaggi Riusciti</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_pass_si}</p>
                            </div>
                        )}
                        {currentPlayer.sum_pass_tot !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Passaggi Tentati</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_pass_tot}</p>
                            </div>
                        )}
                        {currentPlayer.sum_pass_tot !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Passaggi %</p>
                                <p className="font-bold text-2xl text-primary">{Math.round((currentPlayer.sum_pass_si / currentPlayer.sum_pass_tot) * 100)}%</p>
                            </div>
                        )}
                    </CardContent>
                    {/** Sezione Dribbling */}
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {currentPlayer.sum_drib_si !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Dribbling Riusciti</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_drib_si}</p>
                            </div>
                        )}
                        {currentPlayer.sum_drib_tot !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Dribbling Tentati</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_drib_tot}</p>
                            </div>
                        )}
                        {currentPlayer.sum_drib_tot !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Dribbling %</p>
                                <p className="font-bold text-2xl text-primary">{Math.round((currentPlayer.sum_drib_si / currentPlayer.sum_drib_tot) * 100)}%</p>
                            </div>
                        )}
                    </CardContent>
                    {/** Sezione Cross */}
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {currentPlayer.sum_cros_si !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Cross Riusciti</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_cros_si}</p>
                            </div>
                        )}
                        {currentPlayer.sum_cros_tot !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Cross Tentati</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_cros_tot}</p>
                            </div>
                        )}
                        {currentPlayer.sum_cros_tot !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Cross %</p>
                                <p className="font-bold text-2xl text-primary">{isNaN(currentPlayer.sum_cros_si / currentPlayer.sum_cros_tot) ? "0": Math.round((currentPlayer.sum_cros_si / currentPlayer.sum_cros_tot) * 100)}%</p>
                            </div>
                        )}
                    </CardContent>
                    {/** Sezione Contrasti */}
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {currentPlayer.sum_ctrs_si !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Contrasti Riusciti</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_ctrs_si}</p>
                            </div>
                        )}
                        {currentPlayer.sum_ctrs_tot !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Contrasti Tentati</p>
                                <p className="font-bold text-2xl text-primary">{currentPlayer.sum_ctrs_tot}</p>
                            </div>
                        )}
                        {currentPlayer.sum_ctrs_tot !== undefined && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Contrasti %</p>
                                <p className="font-bold text-2xl text-primary">{Math.round((currentPlayer.sum_ctrs_si / currentPlayer.sum_ctrs_tot) * 100)}%</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
            {/* Note about full stats */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <p className="text-sm text-muted-foreground">
                    💡 Per visualizzare tutte le statistiche negli anni usare la pagina Storico.
                </p>
            </div>
        </div>
    );
};


export default PlayerAdvancedStats;