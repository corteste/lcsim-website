import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Eye, Sparkles } from "lucide-react";

export default function AdminTeamSelector() {
  const { isAdmin, adminSelectedTeam, setAdminSelectedTeam, availableTeams, effectiveTeamFullName } = useAuth();

  if (!isAdmin) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent p-4 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                Pannello Amministratore LCSIM
              </span>
              <Badge variant="outline" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold px-2 py-0">
                ACCESSO GLOBALE
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Stai controllando la sezione con i permessi di amministrazione: puoi visualizzare e gestire i dati di ogni squadra.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Squadra Attiva
            </div>
            <div className="text-xs font-bold text-foreground truncate max-w-[150px]">
              {effectiveTeamFullName}
            </div>
          </div>

          <Select value={adminSelectedTeam} onValueChange={setAdminSelectedTeam}>
            <SelectTrigger className="w-[210px] h-10 bg-card border-border/80 font-medium shadow-sm">
              <SelectValue placeholder="Seleziona squadra" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {availableTeams.map((team) => (
                <SelectItem key={team.team_id} value={team.team_id}>
                  <div className="flex items-center gap-2">
                    <img
                      src={`/images/teams/${team.team_id}_Logo.png`}
                      alt={team.name_abbr}
                      className="h-4 w-4 object-contain shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                      }}
                    />
                    <span className="font-medium truncate">{team.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground ml-auto">({team.team_id})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
