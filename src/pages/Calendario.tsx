import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Calendar as CalendarIcon, Plus, X } from "lucide-react";
import {
  upsertLeagueEvent,
  deleteLeagueEvent,
} from "@/services/scheduleService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeagueCalendarEvent } from "@/types/schedule";
import { useSchedule } from "@/context/ScheduleContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { SeasonCalendarBoard } from "@/components/schedule/SeasonCalendarBoard";

const EVENT_PRESETS = [
  "Apertura Calciomercato",
  "Taglio Giocatori",
  "Draft",
  "Supercoppa",
  "Blocco Rose",
  "Chiusura Calciomercato",
  "Play In",
  "Quarti",
  "Semifinali",
  "Finali",
];

const Calendario = () => {
  const { schedule, seasonEvents, loaded, season, setSeason, reloadSchedule } =
    useSchedule();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (season !== 11) {
      setSeason(11);
    }
  }, [season, setSeason]);

  const [selectedOffseasonId, setSelectedOffseasonId] = useState<number | null>(
    null
  );

  // Admin modal state for adding/editing Offseason & Season Events
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("Offseason");
  const [eventDate, setEventDate] = useState("");
  const [eventNote, setEventNote] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);

  const openCreateEventModal = () => {
    setEditingEventId(null);
    setEventName("Taglio Giocatori");
    setEventType("Offseason");
    setEventDate(new Date().toISOString().slice(0, 10));
    setEventNote("");
    setEventModalOpen(true);
  };

  const openEditEventModal = (ev: LeagueCalendarEvent) => {
    setEditingEventId(ev.id);
    setEventName(ev.evento);
    setEventType(ev.tipo || "Offseason");
    setEventDate(ev.event_date ? ev.event_date.slice(0, 10) : "");
    setEventNote(ev.note || "");
    setEventModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventName.trim()) {
      toast.error("Inserisci il nome dell'evento.");
      return;
    }
    setSavingEvent(true);
    try {
      const res = await upsertLeagueEvent({
        id: editingEventId,
        stagione: season,
        evento: eventName.trim(),
        tipo: eventType,
        event_date: eventDate || null,
        note: eventNote.trim() || null,
      });
      if (!res.success) {
        toast.error(res.error || "Errore durante il salvataggio.");
        return;
      }
      toast.success(
        editingEventId
          ? "Data Offseason aggiornata con successo!"
          : "Nuova data Offseason aggiunta al calendario!"
      );
      setEventModalOpen(false);
      await reloadSchedule();
      if (res.id) {
        setSelectedOffseasonId(res.id);
      }
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (ev: LeagueCalendarEvent) => {
    if (
      !window.confirm(
        `Sei sicuro di voler eliminare "${ev.evento}" dal calendario della Stagione ${season}?`
      )
    ) {
      return;
    }
    const res = await deleteLeagueEvent(ev.id);
    if (!res.success) {
      toast.error(res.error || "Impossibile eliminare l'evento.");
      return;
    }
    toast.success("Evento rimosso dal calendario.");
    if (selectedOffseasonId === ev.id) {
      setSelectedOffseasonId(null);
    }
    await reloadSchedule();
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* BROADCAST HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                LCSIM Ufficiale • Serie A
              </span>
              <span className="text-xs text-muted-foreground">
                Stagione {season} • Calendario &amp; Offseason
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              Calendario &amp; Risultati
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Date offseason (tagli, mercato, draft, blocco rose), turni di campionato, risultati e formazioni tattiche in campo.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={openCreateEventModal}
                className="h-8 px-3 text-xs font-bold gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Aggiungi Data Offseason</span>
              </Button>
            )}

            <div className="px-3.5 py-1.5 rounded-xl border border-border/80 bg-card text-xs flex items-center gap-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted-foreground">Stagione Attiva:</span>
              <span className="font-semibold text-foreground font-mono">
                Stagione {season}
              </span>
            </div>
          </div>
        </div>

        <SeasonCalendarBoard
          season={season}
          schedule={schedule}
          seasonEvents={seasonEvents}
          loading={loaded}
          showOffseason={true}
          allowAdminEdit={true}
          selectedOffseasonId={selectedOffseasonId}
          onSelectedOffseasonIdChange={setSelectedOffseasonId}
          onEditEvent={openEditEventModal}
          onDeleteEvent={handleDeleteEvent}
        />
      </main>

      {/* ADMIN MODAL FOR ADDING / EDITING OFFSEASON & SEASON EVENTS */}
      {eventModalOpen && isAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setEventModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-foreground">
                  {editingEventId
                    ? "Modifica Data / Evento"
                    : "Nuova Data Offseason / Evento"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Stagione {season} • Visibile nel carosello e nella tabella
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEventModalOpen(false)}
                className="h-7 w-7 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-muted-foreground block mb-1">
                  Scelta Rapida Evento:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {EVENT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setEventName(preset);
                        if (preset === "Draft") setEventType("Draft");
                        else if (
                          ["Play In", "Quarti", "Semifinali", "Finali"].includes(
                            preset
                          )
                        )
                          setEventType("Playoff");
                        else setEventType("Offseason");
                      }}
                      className={`px-2 py-1 rounded-md border text-[10px] font-bold transition-colors cursor-pointer ${
                        eventName === preset
                          ? "bg-amber-500 text-black border-amber-500"
                          : "bg-muted/40 border-border/80 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">
                  Nome Evento *
                </label>
                <Input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Es. Taglio Giocatori, Apertura Mercato, Draft..."
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">
                    Categoria
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-md border border-input bg-background text-xs font-semibold"
                  >
                    <option value="Offseason">Offseason</option>
                    <option value="Draft">Draft</option>
                    <option value="Playoff">Playoff</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-muted-foreground block mb-1">
                    Data Ufficiale
                  </label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">
                  Note / Orario / Dettagli (opzionale)
                </label>
                <Input
                  value={eventNote}
                  onChange={(e) => setEventNote(e.target.value)}
                  placeholder="Es. Scadenza ore 23:59 • Diretta Live ore 21:30..."
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEventModalOpen(false)}
                className="h-8 text-xs"
              >
                Annulla
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEvent}
                disabled={savingEvent}
                className="h-8 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black"
              >
                {savingEvent ? "Salvataggio..." : "Salva nel Calendario"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendario;
