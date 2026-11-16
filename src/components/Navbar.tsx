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
  ArrowLeftRight,
  Megaphone,
  Cpu,
  ClipboardList,
  Newspaper,
  KeyRound,
  UserCheck,
  ListOrdered,
  BookOpen,
  Inbox,
  LayoutDashboard,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useHomeMode } from "@/hooks/use-home-mode";
import LoginDialog from "@/components/LoginDialog";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";
import { EditCoachModal } from "@/components/team/EditCoachModal";
import { useInboxUnreadCount } from "@/hooks/useInboxUnreadCount";
import { GlobalAnnouncementBanner } from "@/components/GlobalAnnouncementBanner";
import { MobileBottomNav, NavGroupItem } from "@/components/MobileBottomNav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isEditCoachOpen, setIsEditCoachOpen] = useState(false);
  const { user, logout, openLogin, isAdmin, effectiveTeam } = useAuth();
  const inboxUnreadCount = useInboxUnreadCount();
  const { homeMode, toggleHomeMode } = useHomeMode();
  const isOffseasonHome = homeMode === "offseason";

  const renderHomeToggleSwitch = () => (
    <span
      aria-hidden="true"
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
        isOffseasonHome
          ? "bg-amber-500 border-amber-600/40"
          : "bg-emerald-500 border-emerald-600/40"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
          isOffseasonHome ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </span>
  );

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
  ];

  // 2. SEZIONE SQUADRE
  const squadreItems: NavGroupItem[] = [
    {
      path: "/squadre",
      label: "Club",
      description: "I club ufficiali della Serie A",
      icon: Shield,
      colorClass: "text-indigo-500",
    },
    {
      path: "/statistiche-squadre",
      label: "Statistiche Squadre",
      description: "Rendimento, gol, possesso e telemetrie collettive",
      icon: BarChart3,
      colorClass: "text-emerald-500",
    },
  ];

  // 3. SEZIONE CALCIATORI
  const calciatoriItems: NavGroupItem[] = [
    {
      path: "/giocatori/lista-giocatori",
      label: "Lista Calciatori",
      description: "Database completo con filtri e ricerca",
      icon: Users,
      colorClass: "text-cyan-500",
    },
    {
      path: "/statistiche",
      label: "Statistiche Calciatori",
      description: "Marcatori, assist, rating e telemetrie EA FC",
      icon: BarChart3,
      colorClass: "text-emerald-500",
    },
    {
      path: "/giocatori/confronto-giocatori",
      label: "Confronto Calciatori",
      description: "Testa a testa tra calciatori di Serie A, Serie B e svincolati",
      icon: Swords,
      colorClass: "text-rose-500",
    },
  ];

  // 4. SEZIONE DRAFT & MERCATO
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

  // 5. SEZIONE MEDIA & NEWS
  const mediaItems: NavGroupItem[] = [
    {
      path: "/comunicati",
      label: "Comunicati Ufficiali",
      description: "Avvisi della Commissione, regolamento e giudice sportivo",
      icon: Megaphone,
      colorClass: "text-rose-500",
    },
    {
      path: "/probabili-formazioni",
      label: "Probabili Formazioni",
      description: "Schieramenti ufficiali e formazioni della giornata",
      icon: ClipboardList,
      colorClass: "text-purple-500",
    },
  ];

  // 6. SEZIONE ARCHIVIO
  const archivioItems: NavGroupItem[] = [
    {
      path: "/archivio/stagioni",
      label: "Archivio Stagioni",
      description: "Storico classifiche, regular season e tabelloni playoff passati",
      icon: ListOrdered,
      colorClass: "text-amber-500",
    },
    {
      path: "/archivio/giocatori",
      label: "Archivio Calciatori",
      description: "Carriere, stagioni a roster, statistiche e movimenti storici",
      icon: History,
      colorClass: "text-purple-500",
    },
    {
      path: "/archivio/statistiche-squadre",
      label: "Statistiche Squadre",
      description: "Analisi storica e aggregata delle performance di squadra",
      icon: BarChart3,
      colorClass: "text-rose-500",
    },
    {
      path: "/archivio/hall-of-fame",
      label: "Hall of Fame",
      description: "Le leggende ufficiali e i campioni storici di Lega",
      icon: Crown,
      colorClass: "text-yellow-500",
    },
    {
      path: "/archivio/record",
      label: "Record All-Time",
      description: "Albo dei primati e classifiche storiche (S1–S11)",
      icon: Trophy,
      colorClass: "text-emerald-500",
    },
    {
      path: "/archivio/wiki",
      label: "Wiki LCSIM",
      description: "Enciclopedia storica delle stagioni e delle vicende di Lega",
      icon: BookOpen,
      colorClass: "text-sky-500",
    },
  ];

  // 7. SEZIONE LA MIA SQUADRA (Per il manager autenticato)
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
      path: "/mia-squadra/scouting?tab=autopick",
      label: "Graduatoria Draft",
      description: "Ordine di priorità e preferenze per le chiamate",
      icon: ListOrdered,
      colorClass: "text-purple-500",
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
  const isCampionatoActive =
    campionatoItems.some((i) => location.pathname === i.path) ||
    (location.pathname.startsWith("/campionato") && !location.pathname.includes("foglio-commento"));
  const isSquadreActive =
    squadreItems.some((i) => location.pathname === i.path) ||
    location.pathname.startsWith("/squadre") ||
    location.pathname === "/rose" ||
    location.pathname === "/statistiche-squadre";
  const isCalciatoriActive =
    calciatoriItems.some((i) => location.pathname === i.path) ||
    location.pathname.startsWith("/giocatori") ||
    location.pathname === "/statistiche";
  const isDraftActive =
    location.pathname.startsWith("/draft") ||
    location.pathname.startsWith("/mercato");
  const isInboxActive =
    location.pathname === "/inbox" ||
    location.pathname.startsWith("/inbox/");
  const isMediaActive =
    mediaItems.some((i) => location.pathname === i.path) ||
    location.pathname.startsWith("/comunicati") ||
    location.pathname.startsWith("/media") ||
    location.pathname === "/probabili-formazioni" ||
    location.pathname.includes("foglio-commento");
  const isArchivioActive = location.pathname.startsWith("/archivio");
  const isMiaSquadraActive =
    location.pathname.startsWith("/mia-squadra") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/amministrazione");

  return (
    <>
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
                  Stagione 11
                </span>
              </div>
              <p className="text-[10px] font-semibold leading-none text-muted-foreground hidden lg:block">
                Lega Calcio Simulato
              </p>
            </div>
          </Link>

          {/* ================================================================= */}
          {/* DESKTOP NAVIGATION (MACRO-AREE PROFESSIONALI RAGGRUPPATE)         */}
          {/* ================================================================= */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">

            {/* 0. LINK DIRETTO: INBOX */}
            <Link
              to="/inbox"
              className={`relative px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 outline-hidden ${isInboxActive
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
                }`}
            >
              <Inbox className="h-4 w-4 text-amber-500" />
              <span>Inbox</span>
              {inboxUnreadCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black leading-none shadow-xs">
                  {inboxUnreadCount > 99 ? "99+" : inboxUnreadCount}
                </span>
              )}
            </Link>

            <div className="h-5 w-px bg-border/70 mx-1.5 xl:mx-2.5" aria-hidden="true" />

            {/* 1. DROPDOWN: CAMPIONATO */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 outline-hidden ${isCampionatoActive
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
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${isCurrent ? "bg-muted font-bold text-foreground" : "hover:bg-muted/50"
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

            {/* 2. DROPDOWN: SQUADRE */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 outline-hidden ${isSquadreActive
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                  : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
                  }`}
              >
                <Shield className="h-4 w-4 text-indigo-500" />
                <span>Squadre</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60 p-1.5 bg-card/95 backdrop-blur-md border border-border/80 shadow-xl rounded-xl z-50">
                <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Club &amp; Performance
                </div>
                {squadreItems.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = location.pathname === item.path;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${isCurrent ? "bg-muted font-bold text-foreground" : "hover:bg-muted/50"
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

            {/* 3. DROPDOWN: CALCIATORI */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 outline-hidden ${isCalciatoriActive
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
                  Database &amp; Performance Individuali
                </div>
                {calciatoriItems.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = location.pathname === item.path;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${isCurrent ? "bg-muted font-bold text-foreground" : "hover:bg-muted/50"
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

            {/* 4. DROPDOWN: DRAFT & MERCATO */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 outline-hidden ${isDraftActive
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
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${isCurrent ? "bg-muted font-bold text-foreground" : "hover:bg-muted/50"
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

            {/* 5. DROPDOWN: MEDIA & NEWS */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 outline-hidden ${isMediaActive
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                  : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
                  }`}
              >
                <Newspaper className="h-4 w-4 text-amber-500" />
                <span>Media &amp; News</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60 p-1.5 bg-card/95 backdrop-blur-md border border-border/80 shadow-xl rounded-xl z-50">
                <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Comunicazione &amp; Stampa
                </div>
                {mediaItems.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = location.pathname === item.path;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${isCurrent ? "bg-muted font-bold text-foreground" : "hover:bg-muted/50"
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

            {/* 6. DROPDOWN: ARCHIVIO */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 outline-hidden ${isArchivioActive
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
                  Memoria Storica di Lega
                </div>
                {archivioItems.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = location.pathname === item.path;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${isCurrent ? "bg-muted font-bold text-foreground" : "hover:bg-muted/50"
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
          {/* RIGHT TOOLS: MOBILE INBOX + THEME TOGGLE + USER PROFILE DROPDOWN  */}
          {/* ================================================================= */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Pulsante Diretto Inbox su Mobile al posto della vecchia campanella */}
            <Link
              to="/inbox"
              className={`relative flex lg:hidden items-center gap-1.5 px-2.5 h-9 rounded-xl text-xs font-bold border transition-all ${
                isInboxActive
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-xs"
                  : "bg-muted/40 text-foreground/90 border-border/70 hover:bg-muted"
              }`}
              title="Inbox & Notifiche"
            >
              <Inbox className="h-4 w-4 text-amber-500" />
              <span className="hidden sm:inline">Inbox</span>
              {inboxUnreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black leading-none shadow-xs">
                  {inboxUnreadCount > 99 ? "99+" : inboxUnreadCount}
                </span>
              )}
            </Link>

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
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 flex items-center gap-1.5 sm:gap-2 outline-hidden border ${isMiaSquadraActive
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
                    <span className="hidden sm:inline">
                      {isAdmin ? "Amministrazione" : "La Mia Squadra"}
                    </span>
                    <span className="sm:hidden font-mono">
                      {effectiveTeam || (isAdmin ? "Admin" : user.name)}
                    </span>
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
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${location.pathname === "/admin/automazioni" ? "bg-amber-500/15 font-bold text-amber-600 dark:text-amber-400" : "hover:bg-amber-500/10 text-foreground"
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
                      const currentFull = `${location.pathname}${location.search}`;
                      const isCurrent = item.path.includes("?")
                        ? currentFull === item.path
                        : location.pathname === item.path && !location.search.includes("tab=autopick");
                      return (
                        <DropdownMenuItem key={item.path} asChild>
                          <Link
                            to={item.path}
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${isCurrent ? "bg-muted font-bold text-foreground" : "hover:bg-muted/50"
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

                  {/* Tasto Modifica Allenatore */}
                  {user?.team && (
                    <DropdownMenuItem
                      onClick={() => setIsEditCoachOpen(true)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold text-foreground hover:bg-muted/60 focus:bg-muted/60 cursor-pointer"
                    >
                      <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <UserCheck className="h-4 w-4" />
                      </div>
                      <span>Modifica Informazioni Societarie</span>
                    </DropdownMenuItem>
                  )}

                  {/* Toggle Versione Home (Stagione / Offseason) */}
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleHomeMode();
                    }}
                    role="switch"
                    aria-checked={isOffseasonHome}
                    className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-foreground hover:bg-muted/60 focus:bg-muted/60 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-md shrink-0 ${
                          isOffseasonHome
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                      </div>
                      <span className="truncate">
                        {isOffseasonHome ? "Home: Offseason" : "Home: Stagione"}
                      </span>
                    </div>
                    {renderHomeToggleSwitch()}
                  </DropdownMenuItem>

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

          </div>
        </div>
      </div>
      <GlobalAnnouncementBanner />
      <LoginDialog />
      <ChangePasswordModal
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
      {user?.team && (
        <EditCoachModal
          open={isEditCoachOpen}
          onOpenChange={setIsEditCoachOpen}
          teamId={user.team}
          teamName={user.teamFullName}
        />
      )}
    </nav>

    {/* NAVIGAZIONE MOBILE STILE APP NATIVA (Bottom Bar + Bottom Sheets) */}
    <MobileBottomNav
      user={user}
      isAdmin={isAdmin}
      effectiveTeam={effectiveTeam}
      inboxUnreadCount={inboxUnreadCount}
      isCampionatoActive={isCampionatoActive}
      isSquadreActive={isSquadreActive}
      isCalciatoriActive={isCalciatoriActive}
      isDraftActive={isDraftActive}
      isMediaActive={isMediaActive}
      isArchivioActive={isArchivioActive}
      isMiaSquadraActive={isMiaSquadraActive}
      isInboxActive={isInboxActive}
      campionatoItems={campionatoItems}
      squadreItems={squadreItems}
      calciatoriItems={calciatoriItems}
      draftItems={draftItems}
      mediaItems={mediaItems}
      archivioItems={archivioItems}
      miaSquadraItems={miaSquadraItems}
      isOffseasonHome={isOffseasonHome}
      toggleHomeMode={toggleHomeMode}
      onOpenLogin={() => openLogin("login")}
      onLogout={handleLogout}
      onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      onOpenEditCoach={() => setIsEditCoachOpen(true)}
    />
    </>
  );
};

export default Navbar;