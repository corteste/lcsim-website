import Navbar from "@/components/Navbar";
import PlayerDetails from "@/components/player/playerDetails";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Users, NotebookTabs, Shield, ClipboardList, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/supabaseClient";
import { PLAYER_TABLE } from "../constants/App";
import { Player } from "../types/player";
import { getRoleColor, getValueColor } from "@/utils/functions";
import { useAuth } from "@/context/AuthContext";

type FormationType = '4-4-2' | '4-3-3' | '3-5-2' | '4-2-3-1' | '3-4-3';

const Tattica = () => {
  const [selected, setSelected] = useState<{ player: Player } | null>(null);
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [dragOverPlayer, setDragOverPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [formation, setFormation] = useState<FormationType>('4-4-2');
  //const { players } = getPlayers("APD");
  const { user } = useAuth();
  const userTeam = user?.team;
  
    useEffect(() => {
      async function fetchPlayers() {
        const { data, error } = await supabase.from(PLAYER_TABLE).select("*").eq('Squadra', userTeam); // filtrare per squadra dell'utente
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
        {/* Hero Header */}
        <Card className="mb-8 overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/15 via-card to-accent/10">
          <div className="relative p-6 sm:p-8">
            <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/15 border border-primary/20">
                  <NotebookTabs className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Tattica</h1>
                  <p className="text-muted-foreground mt-1">Gestisci la tua formazione e schiera la squadra</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/70 backdrop-blur-sm border">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Modulo:</span>
                  <span className="font-bold text-primary">{formation}</span>
                </div>
                <Button onClick={handleSaveFormation} className="gap-2 shadow-md">
                  <Save className="h-4 w-4" />
                  Salva
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formazione Titolare */}
          <Card
            className="shadow-lg border-primary/10 overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={handleDropToTitolari}
          >
            <CardHeader className="bg-gradient-to-br from-primary/10 to-accent/10 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/15">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    Formazione Titolare
                  </CardTitle>
                  <CardDescription className="mt-1">Trascina i giocatori negli slot</CardDescription>
                </div>
                <Badge variant="outline" className="bg-background/70 backdrop-blur-sm font-semibold">
                  {titolari.length}/11
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {formationSlots.map((player, slotIndex) => {
                  const suggestedRole = formationPositions[formation][slotIndex]?.label || '-';

                  return (
                    <div
                      key={slotIndex}
                      onDragOver={(e) => handleDragOverSlot(e, slotIndex)}
                      onDrop={(e) => handleDropOnSlot(e, slotIndex)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        player
                          ? 'bg-card hover:bg-muted/40 hover:border-primary/30 hover:shadow-sm cursor-pointer'
                          : 'bg-muted/20 border-dashed hover:border-primary/40 hover:bg-primary/5'
                      } ${
                        dragOverSlot === slotIndex && (!player || draggedPlayer?.ID !== player?.ID) ? 'ring-2 ring-primary scale-[1.01]' : ''
                      }`}
                    >
                      {player ? (
                        <>
                          <div
                            draggable
                            onDragStart={() => handleDragStart(player)}
                            onClick={() => setSelected({ player })}
                            className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
                              {slotIndex + 1}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge variant="outline" className="bg-muted/50 border-muted-foreground/30 text-[10px]">
                                {suggestedRole}
                              </Badge>
                              <Badge variant="outline" className={`${getRoleColor(player.Posiz)} text-[10px]`}>
                                {player.Posiz}
                              </Badge>
                            </div>
                            <span className="font-medium truncate">{player.Nome} {player.Cognome}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs text-muted-foreground">Voto</span>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-bold">
                              7.3
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 text-muted-foreground font-bold text-sm">
                              {slotIndex + 1}
                            </div>
                            <Badge variant="outline" className="bg-muted/50 border-muted-foreground/30">
                              {suggestedRole}
                            </Badge>
                            <span className="text-muted-foreground text-sm italic">Slot vuoto</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Panchina */}
          <Card
            className="shadow-lg border-primary/10 overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={handleDropToPanchina}
          >
            <CardHeader className="bg-gradient-to-br from-accent/10 to-primary/10 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/15">
                      <ClipboardList className="h-4 w-4 text-primary" />
                    </div>
                    Panchina
                  </CardTitle>
                  <CardDescription className="mt-1">Trascina qui per rimuovere dalla titolare</CardDescription>
                </div>
                <Badge variant="outline" className="bg-background/70 backdrop-blur-sm font-semibold">
                  {panchina.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 min-h-[200px]">
                {panchina.map((player) => (
                  <div
                    key={player.ID}
                    draggable
                    onDragStart={() => handleDragStart(player)}
                    onDragOver={(e) => handleDragOverPlayer(e, player)}
                    onDrop={(e) => handleDropOnPlayer(e, player)}
                    onClick={() => setSelected({ player: player })}
                    className={`flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/40 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer ${
                      dragOverPlayer?.ID === player.ID && draggedPlayer?.ID !== player.ID ? 'ring-2 ring-primary scale-[1.01]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="outline" className={`${getRoleColor(player.Posiz)} shrink-0`}>
                        {player.Posiz}
                      </Badge>
                      <span className="font-medium truncate">{player.Nome} {player.Cognome}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">Voto</span>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-bold">
                        7.6
                      </Badge>
                    </div>
                  </div>
                ))}
                {panchina.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-2 border-2 border-dashed border-muted rounded-xl">
                    <ClipboardList className="h-8 w-8 opacity-40" />
                    <span className="text-sm">Nessun giocatore in panchina</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelected(null)}>
                <PlayerDetails currentPlayer={selected.player} />
              </div>
            )}
    </div>
  );
};

export default Tattica;
