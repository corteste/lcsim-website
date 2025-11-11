import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Users, NotebookTabs } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/supabaseClient";
import { PLAYER_TABLE } from "../constants/App";
import { Player } from "../types/player";
import { getRoleColor, getValueColor } from "@/utils/functions";

const Tattica = () => {
  const [selected, setSelected] = useState<{ player: Player } | null>(null);
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [dragOverPlayer, setDragOverPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  
    useEffect(() => {
      async function fetchPlayers() {
        const { data, error } = await supabase.from(PLAYER_TABLE).select("*").eq('Squadra', 'APD'); // filtrare per squadra dell'utente
        console.log(data);
        if (error) console.error(error);
        else setPlayers(data || []);
      }
      fetchPlayers();
    }, []);

  const handleSaveFormation = () => {
    toast.success("Formazione salvata con successo!");
  };

  const handleDragStart = (player: Player) => {
    setDraggedPlayer(player);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragOverPlayer = (e: React.DragEvent, player: Player) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPlayer(player);
  };

  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const handleDropOnPlayer = (e: React.DragEvent, targetPlayer: Player) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedPlayer || draggedPlayer.ID === targetPlayer.ID) {
      setDraggedPlayer(null);
      setDragOverPlayer(null);
      return;
    }

    const draggedIsTitolare = draggedPlayer.RuoloInCampo !== null;
    const targetIsTitolare = targetPlayer.RuoloInCampo !== null;

    if (draggedIsTitolare === targetIsTitolare) {
      // Riordina nella stessa lista
      const newPlayers = [...players];
      const draggedIndex = newPlayers.findIndex(p => p.ID === draggedPlayer.ID);
      const targetIndex = newPlayers.findIndex(p => p.ID === targetPlayer.ID);
      
      // Scambia le posizioni nell'array
      [newPlayers[draggedIndex], newPlayers[targetIndex]] = [newPlayers[targetIndex], newPlayers[draggedIndex]];
      
      setPlayers(newPlayers);
      setDraggedPlayer(null);
      setDragOverPlayer(null);
    } else {
      // Scambia tra le due liste
      setPlayers(players.map(p => {
        if (p.ID === draggedPlayer.ID) {
          // Il giocatore trascinato prende la posizione del target
          return { ...p, RuoloInCampo: targetPlayer.RuoloInCampo };
        } else if (p.ID === targetPlayer.ID) {
          // Il giocatore target prende la posizione del trascinato
          return { ...p, RuoloInCampo: draggedPlayer.RuoloInCampo };
        }
        return p;
      }));
      
      setDraggedPlayer(null);
      setDragOverPlayer(null);
      toast.success(`${draggedPlayer.Nome} ${draggedPlayer.Cognome} e ${targetPlayer.Nome} ${targetPlayer.Cognome} hanno scambiato posizione`);
    }
  };

  const handleDropOnSlot = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedPlayer) {
      setDragOverSlot(null);
      return;
    }

    // Trova il giocatore che occupa questo slot
    const playerInSlot = titolari[slotIndex];
    
    if (playerInSlot) {
      // Slot occupato - scambia
      handleDropOnPlayer(e, playerInSlot);
    } else {
      // Slot vuoto - sposta il giocatore
      if (draggedPlayer.RuoloInCampo === null) {
        // Da panchina a slot vuoto
        setPlayers(players.map(p => 
          p.ID === draggedPlayer.ID 
            ? { ...p, RuoloInCampo: `SLOT${slotIndex}` }
            : p
        ));
        toast.success(`${draggedPlayer.Nome} ${draggedPlayer.Cognome} aggiunto alla formazione titolare`);
      } else {
        // Da slot a slot vuoto
        setPlayers(players.map(p => 
          p.ID === draggedPlayer.ID 
            ? { ...p, RuoloInCampo: `SLOT${slotIndex}` }
            : p
        ));
      }
      setDraggedPlayer(null);
    }
    setDragOverSlot(null);
  };

  const handleDragOverSlot = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(slotIndex);
  };

  const handleDropToTitolari = (e: React.DragEvent) => {
    // Gestito dai singoli slot
    e.preventDefault();
  };

  const handleDropToPanchina = () => {
    if (!draggedPlayer) return;
    
    // Se il giocatore è già in panchina, non fare nulla
    if (draggedPlayer.RuoloInCampo === null) {
      setDraggedPlayer(null);
      setDragOverPlayer(null);
      return;
    }
    
    // Sposta il giocatore in panchina
    setPlayers(players.map(p => 
      p.ID === draggedPlayer.ID 
        ? { ...p, RuoloInCampo: null }
        : p
    ));
    
    setDraggedPlayer(null);
    setDragOverPlayer(null);
    toast.success(`${draggedPlayer.Nome} ${draggedPlayer.Cognome} spostato in panchina`);
  };

  const titolari = players.filter(p => p.RuoloInCampo !== null);
  const panchina = players.filter(p => p.RuoloInCampo === null);
  
  // Crea array di 11 slot con giocatori o null
  const formationSlots: (Player | null)[] = Array.from({ length: 11 }, (_, i) => {
    return titolari[i] || null;
  });

  /* MAIN RENDER */

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <NotebookTabs className="h-8 w-8 text-primary" />
            Tattica
          </h1>
          <p className="text-muted-foreground">Gestisci la tua formazione</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card 
            className="shadow-lg"
            onDragOver={handleDragOver}
            onDrop={handleDropToTitolari}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Formazione Titolare
              </CardTitle>
              <CardDescription>11 giocatori in campo - Trascina i giocatori negli slot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formationSlots.map((player, slotIndex) => (
                  <div
                    key={slotIndex}
                    onDragOver={(e) => handleDragOverSlot(e, slotIndex)}
                    onDrop={(e) => handleDropOnSlot(e, slotIndex)}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      player 
                        ? 'bg-card hover:bg-muted/50 cursor-pointer' 
                        : 'bg-muted/20 border-dashed'
                    } ${
                      dragOverSlot === slotIndex && (!player || draggedPlayer?.ID !== player?.ID) ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    {player ? (
                      <>
                        <div
                          draggable
                          onDragStart={() => handleDragStart(player)}
                          onClick={() => setSelected({ player })}
                          className="flex items-center gap-4 flex-1 cursor-pointer"
                        >
                          <Badge variant="outline" className={getRoleColor(player.Posiz)}>
                            {player.Posiz}
                          </Badge>
                          <span className="font-medium">{player.Nome} {player.Cognome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Voto:</span>
                          <span className="font-bold text-primary">7.3</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center w-full text-muted-foreground text-sm">
                        Slot {slotIndex + 1} - Vuoto
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card 
            className="shadow-lg"
            onDragOver={handleDragOver}
            onDrop={handleDropToPanchina}
          >
            <CardHeader>
              <CardTitle>Panchina</CardTitle>
              <CardDescription>Giocatori di riserva - Trascina qui per rimuovere</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 min-h-[200px]">
                {panchina.map((player) => (
                  <div
                    key={player.ID}
                    draggable
                    onDragStart={() => handleDragStart(player)}
                    onDragOver={(e) => handleDragOverPlayer(e, player)}
                    onDrop={(e) => handleDropOnPlayer(e, player)}
                    onClick={() => setSelected({ player: player })}
                    className={`flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer ${
                      dragOverPlayer?.ID === player.ID && draggedPlayer?.ID !== player.ID ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={getRoleColor(player.Posiz)}>
                        {player.Posiz}
                      </Badge>
                      <span className="font-medium">{player.Nome} {player.Cognome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Voto:</span>
                      <span className="font-bold text-primary">7.6</span>
                    </div>
                  </div>
                ))}
                {panchina.length === 0 && (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    Nessun giocatore in panchina
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex justify-center">
          <Button size="lg" onClick={handleSaveFormation} className="gap-2">
            <Save className="h-5 w-5" />
            Salva Formazione
          </Button>
        </div>
      </main>

      {/* Modal Dettaglio Giocatore */}
      {selected && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                onClick={() => setSelected(null)}
              >
                <div className="w-full max-w-3xl p-4" onClick={(e) => e.stopPropagation()}>
                  <Card className="shadow-xl">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <img src="/src/images/players/MConti.png" alt="Custom Trophy" className="h-16 w-16 object-contain border rounded-full" />
                            {selected.player.Nome} {selected.player.Cognome}
                             <Badge variant="outline" className={getRoleColor(selected.player.Posiz)}>
                                {selected.player.Posiz}
                              </Badge>
                          </CardTitle>
                          <CardDescription>
                            # 4
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary">
                            {selected.player.OVR} 
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
                                  <Badge variant="outline" className={getValueColor(selected.player.PREP)}>{selected.player.PREP}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Posizionamento</span>
                                  <Badge variant="outline" className={getValueColor(selected.player.POSP)}>{selected.player.POSP}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Rinvio</span>
                                  <Badge variant="outline" className={getValueColor(selected.player.RINP)}>{selected.player.RINP}</Badge>
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
                                  <Badge variant="outline" className={getValueColor(selected.player.RIFP)}>{selected.player.RIFP}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Tuffo</span>
                                  <Badge variant="outline" className={getValueColor(selected.player.TUFP)}>{selected.player.TUFP}</Badge>
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
                                  <Badge variant="outline" className={getValueColor(selected.player.CONT)}>{selected.player.CONT}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Scivolata</span>
                                  <Badge variant="outline" className={getValueColor(selected.player.SCIV)}>{selected.player.SCIV}</Badge>
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
                                  <Badge variant="outline" className={getValueColor(selected.player.MARC)}>{selected.player.MARC}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Aggressività</span>
                                  <Badge variant="outline" className={getValueColor(selected.player.AGGR)}>{selected.player.AGGR}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Intercettazioni</span>
                                  <Badge variant="outline" className={getValueColor(selected.player.INTR)}>{selected.player.INTR}</Badge>
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
                                  <Badge variant="outline" className={getValueColor(selected.player.PASC)}>{selected.player.PASC}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Passaggi Lunghi</span>
                                  <Badge variant="outline" className={getValueColor(selected.player.PASL)}>{selected.player.PASL}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Cross</span>
                                  <Badge variant="outline" className={getValueColor(selected.player.CRSS)}>{selected.player.CRSS}</Badge>
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
                                  <Badge variant="outline" className={getValueColor(selected.player.CTRP)}>{selected.player.CTRP}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Visione</span>
                                  <Badge variant="outline" className={getValueColor(selected.player.VISI)}>{selected.player.VISI}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Effetto</span>
                                  <Badge variant="outline" className={getValueColor(selected.player.EFFT)}>{selected.player.EFFT}</Badge>
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
                                  <Badge variant="outline" className={getValueColor(selected.player.PTIR)}>{selected.player.PTIR}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Tiri dalla distanza</span>
                                  <Badge variant="outline" className={getValueColor(selected.player.TIRD)}>{selected.player.TIRD}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Tiri al volo</span>
                                  <Badge variant="outline" className={getValueColor(selected.player.TIRV)}>{selected.player.TIRV}</Badge>
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
                                  <Badge variant="outline" className={getValueColor(selected.player.DRBL)}>{selected.player.DRBL}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Piazzamento</span>
                                  <Badge variant="outline" className={getValueColor(selected.player.PIAZ)}>{selected.player.PIAZ}</Badge>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700 dark:text-white">Finalizzazione</span>
                                  <Badge variant="outline" className={getValueColor(selected.player.FINA)}>{selected.player.FINA}</Badge>
                                </div>
                              </div>
                            </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
    </div>
  );
};

export default Tattica;
