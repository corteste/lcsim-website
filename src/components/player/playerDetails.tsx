import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoleColor, getValueColor } from "@/utils/functions";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/player";

interface PlayerDetailsProps  {
  currentPlayer: Player;
};

/**
 * Componente che mostra gli attributi in dettaglio di un giocatore specifico.
 * @param currentPlayer 
 * @returns 
 */
const PlayerDetails = ({ currentPlayer }: PlayerDetailsProps) => {
  return (
    <div className="w-full max-w-3xl p-4" onClick={(e) => e.stopPropagation()}>
                  <Card className="shadow-xl">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <img src="/src/images/players/MConti.png" alt="Custom Trophy" className="h-16 w-16 object-contain border rounded-full" />
                            {currentPlayer.Nome} {currentPlayer.Cognome}
                             <Badge variant="outline" className={getRoleColor(currentPlayer.Posiz)}>
                                {currentPlayer.Posiz}
                              </Badge>
                          </CardTitle>
                          <CardDescription>
                            # 4
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary">
                            {currentPlayer.OVR} 
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="section space-y-4">
                        <div className="flex justify-between mb-1 border-b pb-4">
                          <div className="flex gap-10 p-6">
                            {/* --- Colonna 1: PORTIERE TECNICO --- */}
                              <div className="bg-orange-500/10 dark:text-white rounded-md p-3 w-24 text-center">
                                <p className="font-bold text-sm">POR</p>
                                <p className="text-xs">TECNICO</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Presa</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.PREP)}>{currentPlayer.PREP}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Posizionamento</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.POSP)}>{currentPlayer.POSP}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Rinvio</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.RINP)}>{currentPlayer.RINP}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-10 p-6">
                            {/* --- Colonna 2: PORTIERE FISICO --- */}
                              <div className="bg-orange-500/10 dark:text-white rounded-md p-3 w-24 text-center">
                                <p className="font-bold text-sm">POR</p>
                                <p className="text-xs">FISICO</p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Riflessi</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.RIFP)}>{currentPlayer.RIFP}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Tuffo</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.TUFP)}>{currentPlayer.TUFP}</Badge>
                                </div>
                              </div>
                            </div>

                        </div>
                        <div className="flex justify-between mb-1 border-b pb-4">
                           <div className="flex gap-10 p-6">
                            {/* --- Colonna 1: DIFESA FISICO --- */}
                              <div className="bg-blue-500/10 dark:text-white rounded-md p-3 w-24 text-center">
                                <p className="font-bold text-sm">DIF</p>
                                <p className="text-xs">FISICO</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Contrasto</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.CONT)}>{currentPlayer.CONT}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Scivolata</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.SCIV)}>{currentPlayer.SCIV}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-10 p-6">
                            {/* --- Colonna 2: DIFESA MENTALE --- */}
                              <div className="bg-blue-500/10 dark:text-white rounded-md p-3 w-24 text-center">
                                <p className="font-bold text-sm">DIF</p>
                                <p className="text-xs">MENTALE</p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Marcatura</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.MARC)}>{currentPlayer.MARC}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Aggressività</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.AGGR)}>{currentPlayer.AGGR}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Intercettazioni</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.INTR)}>{currentPlayer.INTR}</Badge>
                                </div>
                              </div>
                            </div>
                        </div>
                        <div className="flex justify-between mb-1 border-b pb-4">
                           <div className="flex gap-10 p-6">
                            {/* --- Colonna 1: CENTROCAMPO PASSAGGI --- */}
                              <div className="bg-green-500/10 dark:text-white rounded-md p-3 w-24 text-center">
                                <p className="font-bold text-sm">CEN</p>
                                <p className="text-xs">PASSAGGI</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Passaggi Corti</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.PASC)}>{currentPlayer.PASC}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Passaggi Lunghi</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.PASL)}>{currentPlayer.PASL}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Cross</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.CRSS)}>{currentPlayer.CRSS}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-10 p-6">
                            {/* --- Colonna 2: CENTROCAMPO GESTIONE --- */}
                              <div className="bg-green-500/10 dark:text-white rounded-md p-3 w-24 text-center">
                                <p className="font-bold text-sm">CEN</p>
                                <p className="text-xs">GESTIONE</p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Controllo Palla</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.CTRP)}>{currentPlayer.CTRP}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Visione</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.VISI)}>{currentPlayer.VISI}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Effetto</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.EFFT)}>{currentPlayer.EFFT}</Badge>
                                </div>
                              </div>
                            </div>
                        </div>
                        <div className="flex justify-between mb-1">
                           <div className="flex gap-10 p-6">
                            {/* --- Colonna 1: ATTACCO TIRI --- */}
                              <div className="bg-red-500/10 dark:text-white rounded-md p-3 w-24 text-center">
                                <p className="font-bold text-sm">ATT</p>
                                <p className="text-xs">TIRI</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Potenza Tiro</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.PTIR)}>{currentPlayer.PTIR}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Tiri dalla distanza</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.TIRD)}>{currentPlayer.TIRD}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Tiri al volo</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.TIRV)}>{currentPlayer.TIRV}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-10 p-6">
                            {/* --- Colonna 2: ATTACCO CONTROLLO --- */}
                              <div className="bg-red-500/10 dark:text-white rounded-md p-3 w-24 text-center">
                                <p className="font-bold text-sm">ATT</p>
                                <p className="text-xs">CONTROLLO</p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Dribbling</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.DRBL)}>{currentPlayer.DRBL}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Piazzamento</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.PIAZ)}>{currentPlayer.PIAZ}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Finalizzazione</span>
                                  <Badge variant="outline" className={getValueColor(currentPlayer.FINA)}>{currentPlayer.FINA}</Badge>
                                </div>
                              </div>
                            </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
  );
};

export default PlayerDetails;