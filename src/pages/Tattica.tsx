import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Save, Users, NotebookTabs } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Player {
  id: number;
  name: string;
  role: string;
  rating: number;
  position: string | null;
  number: number;
}

const Tattica = () => {
  const [selected, setSelected] = useState<{ player: Player } | null>(null);
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [dragOverPlayer, setDragOverPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: "Marco Rossi", role: "POR", rating: 7.5, position: "POR", number: 1 },
    { id: 2, name: "Luca Bianchi", role: "DIF", rating: 7.2, position: "DIF1", number: 2 },
    { id: 3, name: "Andrea Verdi", role: "DIF", rating: 7.8, position: "DIF2", number: 3 },
    { id: 4, name: "Paolo Neri", role: "DIF", rating: 7.0, position: "DIF3", number: 4 },
    { id: 5, name: "Giuseppe Gialli", role: "CEN", rating: 8.2, position: "CEN1", number: 5 },
    { id: 6, name: "Francesco Blu", role: "CEN", rating: 7.9, position: "CEN2", number: 6 },
    { id: 7, name: "Antonio Viola", role: "CEN", rating: 7.4, position: "CEN3", number: 7 },
    { id: 8, name: "Alessandro Grigi", role: "ATT", rating: 8.5, position: "ATT1", number: 8 },
    { id: 9, name: "Matteo Arancio", role: "ATT", rating: 8.0, position: "ATT2", number: 9 },
    { id: 10, name: "Roberto Marroni", role: "POR", rating: 7.3, position: null, number: 10 },
    { id: 11, name: "Stefano Rosa", role: "DIF", rating: 7.6, position: null, number: 11 },
    { id: 12, name: "Davide Azzurri", role: "CEN", rating: 7.1, position: null, number: 12 },
    { id: 13, name: "Davide Violi", role: "ATT", rating: 7.1, position: null, number: 13 },
    { id: 14, name: "Luca Azzurri", role: "CEN", rating: 7.1, position: null, number: 14 },
    { id: 15, name: "Marco Azzurri", role: "DIF", rating: 7.1, position: null, number: 15 },
    { id: 16, name: "Davide Wolf", role: "DIF", rating: 7.1, position: null, number: 16 },
    { id: 17, name: "Finn Azzurri", role: "ATT", rating: 7.1, position: null, number: 17 },
    { id: 18, name: "Davide Luca Azzurri", role: "CEN", rating: 7.1, position: null, number: 18 },
  ]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "POR": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "DIF": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "CEN": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "ATT": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      default: return "bg-muted";
    }
  };

  const getOverallColor = (overall:number) => {

  if(overall < 70) return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
  if(overall >= 70 && overall < 80) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
  if(overall >= 80) return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
};

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

  const handleDropOnPlayer = (e: React.DragEvent, targetPlayer: Player) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedPlayer || draggedPlayer.id === targetPlayer.id) {
      setDraggedPlayer(null);
      setDragOverPlayer(null);
      return;
    }

    const draggedIsTitolare = draggedPlayer.position !== null;
    const targetIsTitolare = targetPlayer.position !== null;

    if (draggedIsTitolare === targetIsTitolare) {
      // Riordina nella stessa lista
      const newPlayers = [...players];
      const draggedIndex = newPlayers.findIndex(p => p.id === draggedPlayer.id);
      const targetIndex = newPlayers.findIndex(p => p.id === targetPlayer.id);
      
      // Scambia le posizioni nell'array
      [newPlayers[draggedIndex], newPlayers[targetIndex]] = [newPlayers[targetIndex], newPlayers[draggedIndex]];
      
      setPlayers(newPlayers);
      setDraggedPlayer(null);
      setDragOverPlayer(null);
    } else {
      // Scambia tra le due liste
      setPlayers(players.map(p => {
        if (p.id === draggedPlayer.id) {
          // Il giocatore trascinato prende la posizione del target
          return { ...p, position: targetPlayer.position };
        } else if (p.id === targetPlayer.id) {
          // Il giocatore target prende la posizione del trascinato
          return { ...p, position: draggedPlayer.position };
        }
        return p;
      }));
      
      setDraggedPlayer(null);
      setDragOverPlayer(null);
      toast.success(`${draggedPlayer.name} e ${targetPlayer.name} hanno scambiato posizione`);
    }
  };

  const handleDropToTitolari = () => {
    if (!draggedPlayer) return;
    
    const currentTitolari = players.filter(p => p.position !== null);
    
    // Se il giocatore è già titolare, non fare nulla
    if (draggedPlayer.position !== null) {
      setDraggedPlayer(null);
      setDragOverPlayer(null);
      return;
    }
    
    // Verifica limite di 11 giocatori
    if (currentTitolari.length >= 11) {
      toast.error("La formazione titolare può avere massimo 11 giocatori!");
      setDraggedPlayer(null);
      setDragOverPlayer(null);
      return;
    }
    
    // Sposta il giocatore in formazione titolare
    setPlayers(players.map(p => 
      p.id === draggedPlayer.id 
        ? { ...p, position: `${p.role}${currentTitolari.filter(t => t.role === p.role).length + 1}` }
        : p
    ));
    
    setDraggedPlayer(null);
    setDragOverPlayer(null);
    toast.success(`${draggedPlayer.name} aggiunto alla formazione titolare`);
  };

  const handleDropToPanchina = () => {
    if (!draggedPlayer) return;
    
    // Se il giocatore è già in panchina, non fare nulla
    if (draggedPlayer.position === null) {
      setDraggedPlayer(null);
      setDragOverPlayer(null);
      return;
    }
    
    // Sposta il giocatore in panchina
    setPlayers(players.map(p => 
      p.id === draggedPlayer.id 
        ? { ...p, position: null }
        : p
    ));
    
    setDraggedPlayer(null);
    setDragOverPlayer(null);
    toast.success(`${draggedPlayer.name} spostato in panchina`);
  };

  const titolari = players.filter(p => p.position !== null);
  const panchina = players.filter(p => p.position === null);

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
              <CardDescription>Giocatori in campo - Trascina qui per aggiungere</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 min-h-[200px]">
                {titolari.map((player) => (
                  <div
                    key={player.id}
                    draggable
                    onDragStart={() => handleDragStart(player)}
                    onDragOver={(e) => handleDragOverPlayer(e, player)}
                    onDrop={(e) => handleDropOnPlayer(e, player)}
                    onClick={() => setSelected({ player: player })}
                    className={`flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-move ${
                      dragOverPlayer?.id === player.id && draggedPlayer?.id !== player.id ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={getRoleColor(player.role)}>
                        {player.role}
                      </Badge>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Voto:</span>
                      <span className="font-bold text-primary">{player.rating}</span>
                    </div>
                  </div>
                ))}
                {titolari.length === 0 && (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    Trascina qui i giocatori dalla panchina
                  </div>
                )}
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
                    key={player.id}
                    draggable
                    onDragStart={() => handleDragStart(player)}
                    onDragOver={(e) => handleDragOverPlayer(e, player)}
                    onDrop={(e) => handleDropOnPlayer(e, player)}
                    onClick={() => setSelected({ player: player })}
                    className={`flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-move ${
                      dragOverPlayer?.id === player.id && draggedPlayer?.id !== player.id ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={getRoleColor(player.role)}>
                        {player.role}
                      </Badge>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Voto:</span>
                      <span className="font-bold text-primary">{player.rating}</span>
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
                            {selected.player.name}
                             <Badge variant="outline" className={getRoleColor(selected.player.role)}>
                                {selected.player.role}
                              </Badge>
                          </CardTitle>
                          <CardDescription>
                            ID {selected.player.id}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary">
                            #{selected.player.number}
                          </div>
                          <button
                            onClick={() => setSelected(null)}
                            className="mt-3 px-3 py-1 rounded bg-muted/60 hover:bg-muted text-sm"
                          >
                            Chiudi
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="section space-y-4">
                        {/* Tiri */}
                        <div className="flex justify-between mb-1">
                          <div className="flex gap-10 p-6">
                            {/* --- Colonna 1: PORTIERE TECNICO --- */}
                              <div className="bg-orange-50 rounded-md p-3 w-24 text-center">
                                <p className="font-bold text-sm">POR</p>
                                <p className="text-xs">TECNICO</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Presa</span>
                                  <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full text-xs">83</span>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Posizionamento</span>
                                  <span className="bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full text-xs">74</span>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Rinvio</span>
                                  <span className="bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full text-xs">74</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-10 p-6">
                            {/* --- Colonna 2: PORTIERE FISICO --- */}
                              <div className="bg-orange-50 rounded-md p-3 w-24 text-center">
                                <p className="font-bold text-sm">POR</p>
                                <p className="text-xs">FISICO</p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Riflessi</span>
                                  <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full text-xs">90</span>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Tuffo</span>
                                  <span className="bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full text-xs">74</span>
                                </div>
                              </div>
                            </div>

                        </div>
                        <div className="flex justify-between mb-1">
                           <div className="flex gap-10 p-6">
                            {/* --- Colonna 1: DIFESA FISICO --- */}
                              <div className="bg-blue-50 rounded-md p-3 w-24 text-center">
                                <p className="font-bold text-sm">DIF</p>
                                <p className="text-xs">FISICO</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Contrasto</span>
                                  <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full text-xs">90</span>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Scivolata</span>
                                  <span className="bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full text-xs">74</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-10 p-6">
                            {/* --- Colonna 2: DIFESA MENTALE --- */}
                              <div className="bg-blue-50 rounded-md p-3 w-24 text-center">
                                <p className="font-bold text-sm">DIF</p>
                                <p className="text-xs">MENTALE</p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Marcatura</span>
                                  <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full text-xs">90</span>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Aggressività</span>
                                  <span className="bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full text-xs">74</span>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Intercettazioni</span>
                                  <span className="bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full text-xs">65</span>
                                </div>
                              </div>
                            </div>
                        </div>
                        <div className="flex justify-between mb-1">
                           <div className="flex gap-10 p-6">
                            {/* --- Colonna 1: CENTROCAMPO PASSAGGI --- */}
                              <div className="bg-green-50 rounded-md p-3 w-24 text-center">
                                <p className="font-bold text-sm">CEN</p>
                                <p className="text-xs">PASSAGGI</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Passaggi Corti</span>
                                  <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full text-xs">90</span>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Passaggi Lunghi</span>
                                  <span className="bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full text-xs">74</span>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Cross</span>
                                  <span className="bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full text-xs">74</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-10 p-6">
                            {/* --- Colonna 2: CENTROCAMPO GESTIONE --- */}
                              <div className="bg-green-50 rounded-md p-3 w-24 text-center">
                                <p className="font-bold text-sm">CEN</p>
                                <p className="text-xs">GESTIONE</p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Controllo Palla</span>
                                  <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full text-xs">90</span>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Visione</span>
                                  <span className="bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full text-xs">74</span>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Effetto</span>
                                  <span className="bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full text-xs">65</span>
                                </div>
                              </div>
                            </div>
                        </div>
                        <div className="flex justify-between mb-1">
                           <div className="flex gap-10 p-6">
                            {/* --- Colonna 1: ATTACCO TIRI --- */}
                              <div className="bg-red-50 rounded-md p-3 w-24 text-center">
                                <p className="font-bold text-sm">ATT</p>
                                <p className="text-xs">TIRI</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Potenza Tiro</span>
                                  <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full text-xs">90</span>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Tiri dalla distanza</span>
                                  <span className="bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full text-xs">74</span>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Tiri al volo</span>
                                  <span className="bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full text-xs">74</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-10 p-6">
                            {/* --- Colonna 2: ATTACCO CONTROLLO --- */}
                              <div className="bg-red-50 rounded-md p-3 w-24 text-center">
                                <p className="font-bold text-sm">ATT</p>
                                <p className="text-xs">CONTROLLO</p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Dribbling</span>
                                  <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full text-xs">90</span>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Piazzamento</span>
                                  <span className="bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full text-xs">74</span>
                                </div>
                                <div className="flex items-center justify-between w-32">
                                  <span className="text-sm text-gray-700">Finalizzazione</span>
                                  <span className="bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full text-xs">65</span>
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
