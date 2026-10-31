import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth, FreeTeam } from "@/context/AuthContext";
import { toast } from "sonner";
import { LogIn, Shield, Sparkles, Loader2, User, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";

interface LoginDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function LoginDialog({ open: propOpen, onOpenChange: propOnOpenChange }: LoginDialogProps) {
  const {
    isLoginOpen,
    closeLogin,
    loginTab,
    openLogin,
    login,
    claimTeam,
    fetchFreeTeams,
  } = useAuth();

  const isOpen = propOpen !== undefined ? propOpen : isLoginOpen;
  const handleOpenChange = (open: boolean) => {
    if (propOnOpenChange) propOnOpenChange(open);
    if (!open) closeLogin();
  };

  const [activeTab, setActiveTab] = useState<"login" | "claim">("login");

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Claim form state
  const [freeTeams, setFreeTeams] = useState<FreeTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [claimUsername, setClaimUsername] = useState("");
  const [claimPassword, setClaimPassword] = useState("");
  const [managerName, setManagerName] = useState("");
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Sync tab with context when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(loginTab);
      setLoginError(null);
      setClaimError(null);
      loadFreeTeams();
    }
  }, [isOpen, loginTab]);

  const loadFreeTeams = async () => {
    setLoadingTeams(true);
    const teams = await fetchFreeTeams();
    setFreeTeams(teams);
    setLoadingTeams(false);
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].team_id);
      if (teams[0].manager) {
        setManagerName(teams[0].manager);
      }
    }
  };

  // When selected team changes, auto-fill default manager name if empty or matches previous team manager
  const handleSelectTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
    const chosen = freeTeams.find((t) => t.team_id === teamId);
    if (chosen?.manager) {
      setManagerName(chosen.manager);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const res = await login(username, password);
    setLoginLoading(false);

    if (res.success) {
      toast.success("Accesso effettuato con successo!");
      handleOpenChange(false);
      setUsername("");
      setPassword("");
    } else {
      setLoginError(res.error || "Credenziali non valide");
      toast.error(res.error || "Credenziali non valide");
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError(null);

    if (!selectedTeamId) {
      setClaimError("Seleziona una squadra disponibile.");
      return;
    }

    if (claimUsername.trim().length < 3) {
      setClaimError("L'username deve contenere almeno 3 caratteri.");
      return;
    }

    if (claimPassword.length < 4) {
      setClaimError("La password deve contenere almeno 4 caratteri.");
      return;
    }

    setClaimLoading(true);
    const res = await claimTeam({
      teamId: selectedTeamId,
      username: claimUsername.trim(),
      password: claimPassword,
      name: managerName.trim(),
    });
    setClaimLoading(false);

    if (res.success) {
      const selectedTeam = freeTeams.find((t) => t.team_id === selectedTeamId);
      toast.success(
        `Complimenti Mister! Hai assunto la guida del ${selectedTeam?.name || selectedTeamId}!`
      );
      handleOpenChange(false);
      setClaimUsername("");
      setClaimPassword("");
      setManagerName("");
    } else {
      setClaimError(res.error || "Errore durante la registrazione");
      toast.error(res.error || "Errore durante la registrazione");
      // refresh free teams in case someone claimed it concurrently
      loadFreeTeams();
    }
  };

  const selectedTeamDetails = freeTeams.find((t) => t.team_id === selectedTeamId);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border border-border/70 shadow-2xl bg-card">
        {/* Header with decorative banner */}
        <div className="relative bg-gradient-to-r from-emerald-600/20 via-primary/15 to-transparent p-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                Area Squadre LCSIM
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  PRO
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Accedi al tuo account oppure scegli e prendi la guida di una squadra libera
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-6 pt-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "claim")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="flex items-center gap-2 text-xs font-semibold">
                <LogIn className="h-4 w-4" /> Accedi
              </TabsTrigger>
              <TabsTrigger value="claim" className="flex items-center gap-2 text-xs font-semibold">
                <Sparkles className="h-4 w-4 text-emerald-500" /> Scegli Squadra Libera
                {freeTeams.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    {freeTeams.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* TAB: LOGIN */}
            <TabsContent value="login" className="space-y-4 focus-visible:outline-none">
              {loginError && (
                <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-lg border border-destructive/30 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username" className="text-xs font-semibold">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Il tuo username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-9 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-xs font-semibold">
                      Password
                    </Label>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 text-sm"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loginLoading} className="w-full font-semibold">
                  {loginLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Accesso in corso...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" /> Accedi alla Tua Squadra
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("claim")}
                    className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    Non hai ancora un account? Scegli una squadra libera tra quelle disponibili
                  </button>
                </div>
              </form>
            </TabsContent>

            {/* TAB: CLAIM FREE TEAM */}
            <TabsContent value="claim" className="space-y-4 focus-visible:outline-none">
              {claimError && (
                <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-lg border border-destructive/30 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{claimError}</span>
                </div>
              )}

              {loadingTeams ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs">Ricerca squadre disponibili in corso...</span>
                </div>
              ) : freeTeams.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border bg-muted/30">
                  <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <h4 className="font-semibold text-sm text-foreground">Nessuna squadra libera disponibile</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Tutte le squadre di Serie A sono attualmente assegnate a un allenatore. Accedi con le tue credenziali.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setActiveTab("login")}
                  >
                    Torna al login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleClaimSubmit} className="space-y-4">
                  {/* Team selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">
                        Scegli una Squadra Libera ({freeTeams.length} disponibili)
                      </Label>
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        Serie A
                      </Badge>
                    </div>

                    <Select value={selectedTeamId} onValueChange={handleSelectTeam}>
                      <SelectTrigger className="w-full h-11 bg-card">
                        <SelectValue placeholder="Seleziona la squadra che vuoi guidare" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[260px]">
                        {freeTeams.map((team) => (
                          <SelectItem key={team.team_id} value={team.team_id}>
                            <div className="flex items-center gap-2.5">
                              <img
                                src={`${SUPABASE_STORAGE_URL}/images/teams/${team.team_id}_Logo.png`}
                                alt={team.name_abbr}
                                className="h-5 w-5 object-contain shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                                }}
                              />
                              <span className="font-semibold">{team.name}</span>
                              <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-auto font-mono">
                                {team.team_id}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Team badge preview */}
                  {selectedTeamDetails && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/40">
                      <img
                        src={`${SUPABASE_STORAGE_URL}/images/teams/${selectedTeamDetails.team_id}_Logo.png`}
                        alt={selectedTeamDetails.name}
                        className="h-10 w-10 object-contain drop-shadow"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-foreground truncate">
                          {selectedTeamDetails.name}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedTeamDetails.manager ? `Mister attuale: ${selectedTeamDetails.manager}` : "Nessun mister registrato"}
                        </p>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                        Libera
                      </Badge>
                    </div>
                  )}

                  {/* Manager Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="manager-name" className="text-xs font-semibold">
                      Nome Allenatore / Mister
                    </Label>
                    <Input
                      id="manager-name"
                      type="text"
                      placeholder="es. Mister Rossi"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1.5">
                    <Label htmlFor="claim-username" className="text-xs font-semibold">
                      Username di Accesso
                    </Label>
                    <Input
                      id="claim-username"
                      type="text"
                      placeholder="es. mister_rossi"
                      value={claimUsername}
                      onChange={(e) => setClaimUsername(e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="claim-password" className="text-xs font-semibold">
                      Password di Accesso
                    </Label>
                    <Input
                      id="claim-password"
                      type="password"
                      placeholder="Almeno 4 caratteri"
                      value={claimPassword}
                      onChange={(e) => setClaimPassword(e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={claimLoading || !selectedTeamId}
                    className="w-full font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {claimLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Assegnazione squadra in corso...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Assegna Squadra e Inizia
                      </>
                    )}
                  </Button>

                  <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                    Nota: ogni squadra può avere un solo account. Una volta scelta, la squadra sarà associata in via esclusiva al tuo profilo.
                  </p>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
