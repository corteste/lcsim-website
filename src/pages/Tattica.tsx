import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Users, NotebookTabs } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/supabaseClient";
import { PLAYER_TABLE } from "../constants/App";
import { Player } from "../types/player";
import { getRoleColor, getValueColor } from "@/utils/functions";

type FormationType = '4-4-2' | '4-3-3' | '3-5-2' | '4-2-3-1' | '3-4-3';

const Tattica = () => {
  const [selected, setSelected] = useState<{ player: Player } | null>(null);
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [dragOverPlayer, setDragOverPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [formation, setFormation] = useState<FormationType>('4-4-2');
  
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
  
  // Crea array di 11 slot mappando ogni slot al giocatore che ha esattamente quel RuoloInCampo
  const formationSlots: (Player | null)[] = Array.from({ length: 11 }, (_, i) => {
    return players.find(p => p.RuoloInCampo === `SLOT${i}`) || null;
  });

  // Configurazioni posizioni per diverse formazioni
  const formationPositions: Record<FormationType, Array<{ x: string; y: string; label: string }>> = {
    '4-4-2': [
      { x: '50%', y: '92%', label: 'POR' },
      { x: '20%', y: '75%', label: 'TD' },
      { x: '40%', y: '75%', label: 'DC' },
      { x: '60%', y: '75%', label: 'DC' },
      { x: '80%', y: '75%', label: 'TS' },
      { x: '20%', y: '50%', label: 'ES' },
      { x: '40%', y: '50%', label: 'CC' },
      { x: '60%', y: '50%', label: 'CC' },
      { x: '80%', y: '50%', label: 'ED' },
      { x: '35%', y: '20%', label: 'ATT' },
      { x: '65%', y: '20%', label: 'ATT' },
    ],
    '4-3-3': [
      { x: '50%', y: '92%', label: 'POR' },
      { x: '20%', y: '75%', label: 'TD' },
      { x: '40%', y: '75%', label: 'DC' },
      { x: '60%', y: '75%', label: 'DC' },
      { x: '80%', y: '75%', label: 'TS' },
      { x: '35%', y: '55%', label: 'CC' },
      { x: '50%', y: '55%', label: 'CDC' },
      { x: '65%', y: '55%', label: 'CC' },
      { x: '20%', y: '20%', label: 'AS' },
      { x: '50%', y: '20%', label: 'AT' },
      { x: '80%', y: '20%', label: 'AD' },
    ],
    '3-5-2': [
      { x: '50%', y: '92%', label: 'POR' },
      { x: '30%', y: '75%', label: 'DC' },
      { x: '50%', y: '75%', label: 'DC' },
      { x: '70%', y: '75%', label: 'DC' },
      { x: '15%', y: '55%', label: 'ES' },
      { x: '35%', y: '55%', label: 'CC' },
      { x: '50%', y: '55%', label: 'CDC' },
      { x: '65%', y: '55%', label: 'CC' },
      { x: '85%', y: '55%', label: 'ED' },
      { x: '40%', y: '20%', label: 'ATT' },
      { x: '60%', y: '20%', label: 'ATT' },
    ],
    '4-2-3-1': [
      { x: '50%', y: '92%', label: 'POR' },
      { x: '20%', y: '75%', label: 'TD' },
      { x: '40%', y: '75%', label: 'DC' },
      { x: '60%', y: '75%', label: 'DC' },
      { x: '80%', y: '75%', label: 'TS' },
      { x: '40%', y: '60%', label: 'CDC' },
      { x: '60%', y: '60%', label: 'CDC' },
      { x: '25%', y: '38%', label: 'ES' },
      { x: '50%', y: '38%', label: 'COC' },
      { x: '75%', y: '38%', label: 'ED' },
      { x: '50%', y: '15%', label: 'AT' },
    ],
    '3-4-3': [
      { x: '50%', y: '92%', label: 'POR' },
      { x: '30%', y: '75%', label: 'DC' },
      { x: '50%', y: '75%', label: 'DC' },
      { x: '70%', y: '75%', label: 'DC' },
      { x: '20%', y: '55%', label: 'ES' },
      { x: '40%', y: '55%', label: 'CC' },
      { x: '60%', y: '55%', label: 'CC' },
      { x: '80%', y: '55%', label: 'ED' },
      { x: '25%', y: '20%', label: 'AS' },
      { x: '50%', y: '20%', label: 'AT' },
      { x: '75%', y: '20%', label: 'AD' },
    ],
  };

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
                {formationSlots.map((player, slotIndex) => {
                  const suggestedRole = formationPositions[formation][slotIndex]?.label || '-';
                  
                  return (
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
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-muted/50 border-muted-foreground/30">
                                {suggestedRole}
                              </Badge>
                              <Badge variant="outline" className={getRoleColor(player.Posiz)}>
                                {player.Posiz}
                              </Badge>
                            </div>
                            <span className="font-medium">{player.Nome} {player.Cognome}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Voto:</span>
                            <span className="font-bold text-primary">7.3</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full px-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-muted/50 border-muted-foreground/30">
                              {suggestedRole}
                            </Badge>
                            <span className="text-muted-foreground text-sm">Slot {slotIndex + 1} - Vuoto</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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

        {/* Campo da Calcio Visuale */}
        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <NotebookTabs className="h-5 w-5" />
                  Visualizzazione Campo
                </CardTitle>
                <CardDescription>Rappresentazione grafica della formazione</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Formazione:</span>
                <Select value={formation} onValueChange={(value) => setFormation(value as FormationType)}>
                  <SelectTrigger className="w-32 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="4-4-2">4-4-2</SelectItem>
                    <SelectItem value="4-3-3">4-3-3</SelectItem>
                    <SelectItem value="3-5-2">3-5-2</SelectItem>
                    <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                    <SelectItem value="3-4-3">3-4-3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative w-full bg-gradient-to-b from-green-600 to-green-700 rounded-lg p-8 min-h-[600px]">
              {/* Linee del campo */}
              <div className="absolute inset-8 border-2 border-white/40 rounded-sm">
                {/* Linea centrale */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40" />
                {/* Cerchio centrale */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/40 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/60 rounded-full" />
                
                {/* Area di rigore superiore (attacco) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-2 border-white/40 border-t-0" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-10 border-2 border-white/40 border-t-0" />
                
                {/* Area di rigore inferiore (difesa) */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-2 border-white/40 border-b-0" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-10 border-2 border-white/40 border-b-0" />
              </div>

              {/* Giocatori posizionati sul campo */}
              <div className="relative h-[600px]">
                {formationSlots.map((player, index) => {
                  if (!player) return null;
                  
                  const pos = formationPositions[formation][index];

                  return (
                    <div
                      key={player.ID}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      style={{ left: pos.x, top: pos.y }}
                      onClick={() => setSelected({ player })}
                    >
                      {/* Cerchio giocatore */}
                      <div className="relative flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-primary border-2 border-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-110">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        {/* Nome giocatore e ruolo suggerito */}
                        <div className="mt-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
                          {player.Cognome}
                        </div>
                        {/* Badge posizione effettiva e suggerita */}
                        <div className="flex gap-1 mt-0.5">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getRoleColor(player.Posiz)} border-white`}
                          >
                            {player.Posiz}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className="text-xs bg-muted/80 border-white"
                          >
                            {pos.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
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
