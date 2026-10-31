import { SUPABASE_STORAGE_URL } from "@/constants/App";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Trophy,
  Calendar,
  BarChart3,
  Users,
  Shield,
  Swords,
  Sparkles,
  History,
  Crown,
  Star,
  Shirt,
  Compass,
  Zap,
  Target,
  Sun,
  Moon,
  LogIn,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Menu,
  ArrowLeftRight,
  Megaphone,
  Cpu,
  ClipboardList,
  Newspaper,
  KeyRound,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import LoginDialog from "@/components/LoginDialog";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";
import { NotificationsMenu } from "@/components/NotificationsMenu";
import { GlobalAnnouncementBanner } from "@/components/GlobalAnnouncementBanner";
import { FormationCountdown } from "@/components/FormationCountdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavGroupItem {
  path: string;
  label: string;
  description: string;
  icon: any;
  colorClass: string;
}

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const { user, logout, openLogin, isAdmin, effectiveTeam } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // 1. SEZIONE CAMPIONATO
  const campionatoItems: NavGroupItem[] = [
    {
      path: "/classifica",
      label: "Classifica",
      description: "Posizioni e andamento della stagione",
      icon: Trophy,
      colorClass: "text-amber-500",
    },
    {
      path: "/calendario",
      label: "Calendario",
      description: "Risultati e prossime giornate di gara",
      icon: Calendar,
      colorClass: "text-blue-500",
    },
    {
      path: "/campionato/foglio-commento",
      label: "Foglio Commento",
      description: "Schieramenti ufficiali e formazioni della giornata",
      icon: ClipboardList,
      colorClass: "text-purple-500",
    },
    {
      path: "/statistiche",
      label: "Statistiche",
      description: "Marcatori, assist, rating e rendimento club",
      icon: BarChart3,
      colorClass: "text-emerald-500",
    },
    {
      path: "/comunicati",
      label: "Comunicati Ufficiali",
      description: "Avvisi della Commissione, regolamento e giudice sportivo",
      icon: Megaphone,
      colorClass: "text-rose-500",
    },
    {
      path: "/sala-stampa",
      label: "Sala Stampa & Rumor",
      description: "Dichiarazioni dei presidenti e scoop del Giornalista AI",
      icon: Newspaper,
      colorClass: "text-amber-500",
    },
  ];

  // 2. SEZIONE CALCIATORI (Richiesta utente)
  const calciatoriItems: NavGroupItem[] = [
    {
      path: "/squadre",
      label: "Squadre",
      description: "Tutti i 12 club ufficiali della Serie A",
      icon: Shield,
      colorClass: "text-indigo-500",
    },
    {
      path: "/giocatori/lista-giocatori",
      label: "Lista Calciatori",
      description: "Database completo con filtri e ricerca",
      icon: Users,
      colorClass: "text-cyan-500",
    },
    {
      path: "/giocatori/confronto-giocatori",
      label: "Confronto Serie A",
      description: "Testa a testa tra calciatori del campionato",
      icon: Swords,
      colorClass: "text-rose-500",
    },
  ];

  // 3. SEZIONE DRAFT & MERCATO
  const draftItems: NavGroupItem[] = [
    {
      path: "/draft",
      label: "Draft Room",
      description: "Tabellone scelte e i 72 Rookie del Draft",
      icon: Sparkles,
      colorClass: "text-amber-500",
    },
    {
      path: "/mercato/scambi",
      label: "Bacheca Mercato & Scambi",
      description: "Bisogni delle 12 squadre e ufficialità di mercato",
      icon: ArrowLeftRight,
      colorClass: "text-emerald-500",
    },
  ];

  // 4. SEZIONE ARCHIVIO
  const archivioItems: NavGroupItem[] = [
    {
      path: "/archivio/giocatori",
      label: "Archivio Storico",
      description: "Statistiche e giocatori delle stagioni passate",
      icon: History,
      colorClass: "text-purple-500",
    },
    {
      path: "/archivio/hall-of-fame",
      label: "Hall of Fame",
      description: "Palmarès, scudetti e leggende di lega",
      icon: Crown,
      colorClass: "text-yellow-500",
    },
  ];

  // 5. SEZIONE LA MIA SQUADRA (Per il manager autenticato)
  const miaSquadraItems: NavGroupItem[] = [
    {
      path: "/mia-squadra/roster",
      label: "Roster",
      description: "Gestione rosa, numeri di maglia e ruoli",
      icon: Shirt,
      colorClass: "text-blue-500",
    },
    {
      path: "/mia-squadra/tattica",
      label: "Tattica",
      description: "Modulo 2D e formazione titolare settimanale",
      icon: Compass,
      colorClass: "text-emerald-500",
    },
    {
      path: "/mia-squadra/allenamenti",
      label: "Allenamenti",
      description: "Sviluppo XP dinamico per blocchi attributi",
      icon: Zap,
      colorClass: "text-yellow-500",
    },
    {
      path: "/mia-squadra/scouting",
      label: "Scouting",
      description: "Osservazione e sblocco attributi dei 72 Rookie",
      icon: Target,
      colorClass: "text-teal-500",
    },
    {
      path: "/mia-squadra/confronto-giocatori",
      label: "Confronto vs Rookie",
      description: "Duello statistiche tra la tua rosa e i prospetti",
      icon: Swords,
      colorClass: "text-orange-500",
    },
    {
      path: "/mia-squadra/trattative",
      label: "Trattative & Scambi",
      description: "Proposte segrete, offerte e storico",
      icon: ArrowLeftRight,
      colorClass: "text-rose-500",
    },
  ];

  // Verifica stati attivi
  const isCampionatoActive = campionatoItems.some((i) => location.pathname === i.path);
  const isCalciatoriActive =
    calciatoriItems.some((i) => location.pathname === i.path) ||
    location.pathname.startsWith("/giocatori");
  const isDraftActive = location.pathname.startsWith("/draft");
  const isArchivioActive = location.pathname.startsWith("/archivio");
  const isMiaSquadraActive = location.pathname.startsWith("/mia-squadra") || location.pathname.startsWith("/admin") || location.pathname.startsWith("/amministrazione");

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/90 backdrop-blur-md shadow-xs transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* ================================================================= */}
          {/* BRAND LOGO & LIVE BADGE                                           */}
          {/* ================================================================= */}
          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0"
          >
            <img
              src={`${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`}
              alt="LCSIM Logo"
              className="h-8 w-8 object-contain filter drop-shadow-xs"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black tracking-tight text-lg text-foreground">
                  LCSIM
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm tracking-widest uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] font-semibold leading-none text-muted-foreground hidden lg:block">
                Lega Calcio Simulato • Serie A
              </p>
            </div>
          </Link>

          {/* ================================================================= */}
          {/* DESKTOP NAVIGATION (MACRO-AREE PROFESSIONALI RAGGRUPPATE)         */}
          {/* ================================================================= */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
            
            {/* 1. DROPDOWN: CAMPIONATO */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 outline-hidden ${
                  isCampionatoActive
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                    : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>Campionato</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60 p-1.5 bg-card/95 backdrop-blur-md border border-border/80 shadow-xl rounded-xl z-50">
                <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Competizione Ufficiale
                </div>
                {campionatoItems.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = location.pathname === item.path;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                          isCurrent ? "bg-muted font-bold text-foreground" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className={`p-1.5 rounded-md bg-muted/60 ${item.colorClass} shrink-0`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-foreground leading-tight">
                          {item.label}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 2. DROPDOWN: CALCIATORI */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 outline-hidden ${
                  isCalciatoriActive
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                    : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Users className="h-4 w-4 text-cyan-500" />
                <span>Calciatori</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60 p-1.5 bg-card/95 backdrop-blur-md border border-border/80 shadow-xl rounded-xl z-50">
                <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Database &amp; Squadre
                </div>
                {calciatoriItems.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = location.pathname === item.path;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                          isCurrent ? "bg-muted font-bold text-foreground" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className={`p-1.5 rounded-md bg-muted/60 ${item.colorClass} shrink-0`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-foreground leading-tight">
                          {item.label}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 3. DROPDOWN / LINK: DRAFT & MERCATO */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 outline-hidden ${
                  isDraftActive
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                    : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Draft &amp; Mercato</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60 p-1.5 bg-card/95 backdrop-blur-md border border-border/80 shadow-xl rounded-xl z-50">
                <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Acquisizioni &amp; Nuovi Talenti
                </div>
                {draftItems.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = location.pathname === item.path;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                          isCurrent ? "bg-muted font-bold text-foreground" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className={`p-1.5 rounded-md bg-muted/60 ${item.colorClass} shrink-0`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-foreground leading-tight">
                          {item.label}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 4. DROPDOWN: ARCHIVIO */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 outline-hidden ${
                  isArchivioActive
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                    : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <History className="h-4 w-4 text-purple-500" />
                <span>Archivio</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60 p-1.5 bg-card/95 backdrop-blur-md border border-border/80 shadow-xl rounded-xl z-50">
                <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Storia &amp; Albo d'Oro
                </div>
                {archivioItems.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = location.pathname === item.path;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                          isCurrent ? "bg-muted font-bold text-foreground" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className={`p-1.5 rounded-md bg-muted/60 ${item.colorClass} shrink-0`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-foreground leading-tight">
                          {item.label}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

          </div>

          {/* ================================================================= */}
          {/* RIGHT TOOLS: THEME TOGGLE (COMPACT) + USER PROFILE DROPDOWN       */}
          {/* ================================================================= */}
          <div className="flex items-center gap-2">
            
            {/* Widget Scadenza Consegna Formazioni */}
            <Link
              to="/mia-squadra/tattica"
              className="hidden lg:block hover:opacity-90 transition-opacity"
              title="Scadenza consegna formazioni per la Giornata di campionato"
            >
              <FormationCountdown compact={true} />
            </Link>

            {/* Centro Notifiche & Comunicazioni Realtime */}
            <NotificationsMenu />

            {/* Theme Toggle Compatto a Icona Singola Rotante */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground relative shrink-0"
              title={theme === "dark" ? "Passa a tema Chiaro" : "Passa a tema Scuro"}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
              <span className="sr-only">Cambia Tema</span>
            </Button>

            {/* Sezione La Mia Squadra / Amministrazione (Unificata con Profilo e Logout) */}
            {user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 flex items-center gap-2 outline-hidden border ${
                      isMiaSquadraActive
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-xs"
                    }`}
                  >
                    {effectiveTeam ? (
                      <img
                        src={`${SUPABASE_STORAGE_URL}/images/teams/${effectiveTeam}_Logo.png`}
                        alt={effectiveTeam}
                        className="h-4 w-4 object-contain shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                        }}
                      />
                    ) : isAdmin ? (
                      <ShieldCheck className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    )}
                    <span>{isAdmin ? "Amministrazione" : "La Mia Squadra"}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-70 ml-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 p-1.5 bg-card/95 backdrop-blur-md border border-border/80 shadow-xl rounded-xl z-50"
                >
                  {/* Intestazione Manager & Club */}
                  <div className="px-2.5 py-2 border-b border-border/60">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-xs text-foreground truncate">{user.name}</div>
                      {effectiveTeam ? (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono font-bold flex items-center gap-1">
                          <img
                            src={`${SUPABASE_STORAGE_URL}/images/teams/${effectiveTeam}_Logo.png`}
                            alt={effectiveTeam}
                            className="h-3 w-3 object-contain shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                            }}
                          />
                          {effectiveTeam}
                        </Badge>
                      ) : isAdmin ? (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono font-bold text-amber-500 border-amber-500/30">
                          LEGA
                        </Badge>
                      ) : null}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {isAdmin ? "Super Admin di Lega" : "Gestione Club"}
                    </div>
                  </div>

                  {/* Automazioni Admin (se admin) */}
                  {isAdmin && (
                    <>
                      <div className="py-1">
                        <DropdownMenuItem asChild>
                          <Link
                            to="/admin/automazioni"
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                              location.pathname === "/admin/automazioni" ? "bg-amber-500/15 font-bold text-amber-600 dark:text-amber-400" : "hover:bg-amber-500/10 text-foreground"
                            }`}
                          >
                            <div className="p-1.5 rounded-md bg-amber-500/15 text-amber-500 shrink-0">
                              <Cpu className="h-4 w-4" />
                            </div>
                            <div className="flex items-center justify-between flex-1">
                              <span className="text-sm font-bold leading-tight">
                                Automazioni
                              </span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 font-bold border-amber-500/40 text-amber-600 dark:text-amber-400">
                                ADMIN
                              </Badge>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      <DropdownMenuSeparator className="my-1" />
                    </>
                  )}

                  {/* Voci Gestione Squadra */}
                  <div className="py-1">
                    {miaSquadraItems.map((item) => {
                      const Icon = item.icon;
                      const isCurrent = location.pathname === item.path;
                      return (
                        <DropdownMenuItem key={item.path} asChild>
                          <Link
                            to={item.path}
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                              isCurrent ? "bg-muted font-bold text-foreground" : "hover:bg-muted/50"
                            }`}
                          >
                            <div className={`p-1.5 rounded-md bg-muted/60 ${item.colorClass} shrink-0`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-bold text-foreground leading-tight">
                              {item.label}
                            </span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>

                  <DropdownMenuSeparator className="my-1" />

                  {/* Tasto Cambia Password */}
                  <DropdownMenuItem
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold text-foreground hover:bg-muted/60 focus:bg-muted/60 cursor-pointer"
                  >
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <span>Cambia Password</span>
                  </DropdownMenuItem>

                  {/* Tasto Disconnetti integrato */}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-600 cursor-pointer"
                  >
                    <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span>Disconnetti ({user.name})</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => openLogin("login")}
                className="h-9 text-xs font-bold border-border/80 hover:bg-muted rounded-xl gap-1.5"
              >
                <LogIn className="h-3.5 w-3.5 text-emerald-500" /> Accedi
              </Button>
            )}

            {/* ================================================================= */}
            {/* MOBILE HAMBURGER MENU (SHEET CASSETTO)                            */}
            {/* ================================================================= */}
            <div className="flex md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[360px] p-0 flex flex-col justify-between bg-card">
                  <div className="overflow-y-auto p-5 space-y-4">
                    <SheetHeader className="text-left pb-3 border-b border-border/70">
                      <SheetTitle className="flex items-center gap-2 text-base font-black">
                        <img
                          src={`${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`}
                          alt="LCSIM Logo"
                          className="h-6 w-6 object-contain"
                        />
                        <span>Navigazione LCSIM</span>
                      </SheetTitle>
                    </SheetHeader>

                    {/* Widget Scadenza Consegna Formazioni Mobile */}
                    <div className="pt-2 pb-1">
                      <Link to="/mia-squadra/tattica" onClick={() => setIsOpen(false)}>
                        <FormationCountdown compact={true} className="w-full justify-center py-1.5" />
                      </Link>
                    </div>

                    {/* Gruppo: Campionato */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                        <Trophy className="h-3 w-3 text-amber-500" /> Campionato
                      </div>
                      {campionatoItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                            location.pathname === item.path
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold"
                              : "text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <item.icon className={`h-4 w-4 ${item.colorClass}`} />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>

                    {/* Gruppo: Calciatori */}
                    <div className="space-y-1 pt-2 border-t border-border/60">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-cyan-500" /> Calciatori
                      </div>
                      {calciatoriItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                            location.pathname === item.path
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold"
                              : "text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <item.icon className={`h-4 w-4 ${item.colorClass}`} />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>

                    {/* Gruppo: Draft & Mercato */}
                    <div className="space-y-1 pt-2 border-t border-border/60">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-amber-500" /> Draft &amp; Mercato
                      </div>
                      {draftItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                            location.pathname === item.path
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold"
                              : "text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <item.icon className={`h-4 w-4 ${item.colorClass}`} />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>

                    {/* Gruppo: Archivio */}
                    <div className="space-y-1 pt-2 border-t border-border/60">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                        <History className="h-3 w-3 text-purple-500" /> Archivio
                      </div>
                      {archivioItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                            location.pathname === item.path
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold"
                              : "text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <item.icon className={`h-4 w-4 ${item.colorClass}`} />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>

                    {/* Gruppo: La Mia Squadra (Solo utenti autenticati) */}
                    {user && (
                      <div className="space-y-1 pt-2 border-t border-border/60">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-2 py-1 flex items-center gap-1.5 font-mono">
                          {effectiveTeam ? (
                            <img
                              src={`${SUPABASE_STORAGE_URL}/images/teams/${effectiveTeam}_Logo.png`}
                              alt={effectiveTeam}
                              className="h-3.5 w-3.5 object-contain shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                              }}
                            />
                          ) : isAdmin ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                          ) : (
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          )}
                          <span>{isAdmin ? "Amministrazione" : "La Mia Squadra"}</span>
                        </div>
                        {isAdmin && (
                          <Link
                            to="/admin/automazioni"
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                              location.pathname === "/admin/automazioni"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold"
                                : "text-foreground hover:bg-muted/50"
                            }`}
                          >
                            <Cpu className="h-4 w-4 text-amber-500" />
                            <span>Automazioni Lega</span>
                          </Link>
                        )}
                        {miaSquadraItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                              location.pathname === item.path
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold"
                                : "text-foreground hover:bg-muted/50"
                            }`}
                          >
                            <item.icon className={`h-4 w-4 ${item.colorClass}`} />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* Footer Mobile Sheet */}
                  <div className="p-4 border-t border-border/70 bg-muted/20">
                    {user ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {user.team && (
                              <img
                                src={`${SUPABASE_STORAGE_URL}/images/teams/${user.team}_Logo.png`}
                                alt={user.team}
                                className="h-5 w-5 object-contain"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate">{user.name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">{user.team || (isAdmin ? "Admin di Lega" : "")}</div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setIsOpen(false);
                              handleLogout();
                            }}
                            className="h-8 text-xs text-rose-600 hover:bg-rose-500/10"
                          >
                            <LogOut className="h-3.5 w-3.5 mr-1" /> Esci
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsOpen(false);
                            setIsChangePasswordOpen(true);
                          }}
                          className="w-full h-8 text-xs font-bold border-border/80 gap-1.5"
                        >
                          <KeyRound className="h-3.5 w-3.5 text-primary" /> Cambia Password
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full text-xs font-bold h-9 bg-emerald-600 hover:bg-emerald-500 text-white"
                        onClick={() => {
                          setIsOpen(false);
                          openLogin("login");
                        }}
                      >
                        <LogIn className="h-3.5 w-3.5 mr-1.5" /> Accedi a LCSIM
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

          </div>
        </div>
      </div>
      <GlobalAnnouncementBanner />
      <LoginDialog />
      <ChangePasswordModal
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </nav>
  );
};

export default Navbar;