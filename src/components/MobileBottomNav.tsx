import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Trophy,
  Shield,
  ShieldCheck,
  Inbox,
  LayoutGrid,
  Cpu,
  UserCheck,
  LayoutDashboard,
  KeyRound,
  LogOut,
  LogIn,
  Bell,
  BellOff,
  Smartphone,
  Sun,
  Moon,
  Share,
  PlusSquare,
  Sparkles,
  Newspaper,
  History,
  Users,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormationCountdown } from "@/components/FormationCountdown";
import { SUPABASE_STORAGE_URL } from "@/constants/App";
import { useTheme } from "next-themes";
import { usePwa } from "@/hooks/use-pwa";

export interface NavGroupItem {
  path: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

type ActiveSheet = "lega" | "squadra" | "altro" | null;

interface MobileBottomNavProps {
  user: {
    id?: string;
    username?: string;
    name: string;
    team?: string | null;
    teamFullName?: string;
  } | null;
  isAdmin: boolean;
  effectiveTeam: string | null | undefined;
  inboxUnreadCount: number;
  isCampionatoActive: boolean;
  isSquadreActive: boolean;
  isCalciatoriActive: boolean;
  isDraftActive: boolean;
  isMediaActive: boolean;
  isArchivioActive: boolean;
  isMiaSquadraActive: boolean;
  isInboxActive: boolean;
  campionatoItems: NavGroupItem[];
  squadreItems: NavGroupItem[];
  calciatoriItems: NavGroupItem[];
  draftItems: NavGroupItem[];
  mediaItems: NavGroupItem[];
  archivioItems: NavGroupItem[];
  miaSquadraItems: NavGroupItem[];
  isOffseasonHome: boolean;
  toggleHomeMode: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenChangePassword: () => void;
  onOpenEditCoach: () => void;
}

/**
 * Navigazione mobile in stile app nativa: Bottom Bar fissa a 5 tab + Drawer scorrevoli dal basso.
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  user,
  isAdmin,
  effectiveTeam,
  inboxUnreadCount,
  isCampionatoActive,
  isSquadreActive,
  isCalciatoriActive,
  isDraftActive,
  isMediaActive,
  isArchivioActive,
  isMiaSquadraActive,
  isInboxActive,
  campionatoItems,
  squadreItems,
  calciatoriItems,
  draftItems,
  mediaItems,
  archivioItems,
  miaSquadraItems,
  isOffseasonHome,
  toggleHomeMode,
  onOpenLogin,
  onLogout,
  onOpenChangePassword,
  onOpenEditCoach,
}) => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  const userKey = user?.id || user?.username || user?.team || undefined;
  const {
    showInstallButton,
    iosGuideOpen,
    setIosGuideOpen,
    triggerInstall,
    pushSupported,
    pushEnabled,
    togglePushNotifications,
  } = usePwa({ userKey, teamId: user?.team });

  const isHomeActive = location.pathname === "/";
  const isLegaTabActive = isCampionatoActive || isSquadreActive || isCalciatoriActive;
  const isAltroTabActive = isDraftActive || isMediaActive || isArchivioActive;

  const isItemCurrent = (path: string) => {
    const currentFull = `${location.pathname}${location.search}`;
    return path.includes("?")
      ? currentFull === path
      : location.pathname === path && !location.search.includes("tab=autopick");
  };

  const renderDrawerLinks = (items: NavGroupItem[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isItemCurrent(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setActiveSheet(null)}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-[0.98] ${
              active
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                : "bg-muted/30 border-border/70 hover:bg-muted/60 text-foreground"
            }`}
          >
            <div className={`p-2 rounded-xl bg-background/80 border border-border/60 ${item.colorClass} shrink-0`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold leading-tight truncate">{item.label}</div>
              <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                {item.description}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );

  const renderTogglePill = (active: boolean, activeClass = "bg-emerald-500 border-emerald-600/40") => (
    <span
      aria-hidden="true"
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
        active ? activeClass : "bg-muted border-border"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
          active ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </span>
  );

  return (
    <>
      {/* BOTTOM NAVIGATION BAR FISSA MOBILE (< lg) */}
      <nav
        aria-label="Navigazione app mobile"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/80 bg-card/95 backdrop-blur-lg shadow-[0_-6px_24px_rgba(0,0,0,0.22)] pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="grid grid-cols-5 h-16 max-w-xl mx-auto px-1">
          {/* 1. HOME */}
          <Link
            to="/"
            onClick={() => setActiveSheet(null)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
              isHomeActive
                ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "text-muted-foreground hover:text-foreground font-semibold"
            }`}
          >
            <Home className={`h-5 w-5 ${isHomeActive ? "scale-110" : ""} transition-transform`} />
            <span className="text-[10px] leading-none">Home</span>
          </Link>

          {/* 2. LEGA (Campionato, Squadre, Calciatori) */}
          <button
            type="button"
            onClick={() => setActiveSheet("lega")}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
              activeSheet === "lega" || isLegaTabActive
                ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "text-muted-foreground hover:text-foreground font-semibold"
            }`}
          >
            <Trophy className="h-5 w-5" />
            <span className="text-[10px] leading-none">Lega</span>
          </button>

          {/* 3. SQUADRA / ADMIN */}
          <button
            type="button"
            onClick={() => {
              if (!user) {
                onOpenLogin();
              } else {
                setActiveSheet("squadra");
              }
            }}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
              activeSheet === "squadra" || isMiaSquadraActive
                ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "text-muted-foreground hover:text-foreground font-semibold"
            }`}
          >
            {effectiveTeam ? (
              <img
                src={`${SUPABASE_STORAGE_URL}/images/teams/${effectiveTeam}_Logo.png`}
                alt={effectiveTeam}
                className="h-5 w-5 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                }}
              />
            ) : isAdmin ? (
              <ShieldCheck className="h-5 w-5 text-amber-500" />
            ) : (
              <Shield className="h-5 w-5" />
            )}
            <span className="text-[10px] leading-none">
              {!user ? "Accedi" : isAdmin ? "Admin" : "Squadra"}
            </span>
          </button>

          {/* 4. INBOX */}
          <Link
            to="/inbox"
            onClick={() => setActiveSheet(null)}
            className={`relative flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
              isInboxActive
                ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "text-muted-foreground hover:text-foreground font-semibold"
            }`}
          >
            <div className="relative">
              <Inbox className="h-5 w-5" />
              {inboxUnreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black leading-none shadow-xs">
                  {inboxUnreadCount > 99 ? "99+" : inboxUnreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-none">Inbox</span>
          </Link>

          {/* 5. ALTRO (Draft, Media, Archivio, Notifiche, PWA Install) */}
          <button
            type="button"
            onClick={() => setActiveSheet("altro")}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
              activeSheet === "altro" || isAltroTabActive
                ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "text-muted-foreground hover:text-foreground font-semibold"
            }`}
          >
            <LayoutGrid className="h-5 w-5" />
            <span className="text-[10px] leading-none">Altro</span>
          </button>
        </div>
      </nav>

      {/* DRAWER 1: LEGA (Campionato, Squadre, Calciatori) */}
      <Drawer open={activeSheet === "lega"} onOpenChange={(o) => !o && setActiveSheet(null)}>
        <DrawerContent className="max-h-[85vh] bg-card border-border/80">
          <DrawerHeader className="text-left pb-2 border-b border-border/60">
            <DrawerTitle className="flex items-center gap-2 text-base font-black">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>Competizione &amp; Statistiche</span>
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              Classifica, calendario, club e database giocatori
            </DrawerDescription>
          </DrawerHeader>

          <div className="overflow-y-auto p-4 space-y-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            <Link
              to="/mia-squadra/tattica"
              onClick={() => setActiveSheet(null)}
              className="block"
            >
              <FormationCountdown compact={true} className="w-full justify-center py-2" />
            </Link>

            <div className="space-y-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                <Trophy className="h-3 w-3 text-amber-500" /> Campionato
              </div>
              {renderDrawerLinks(campionatoItems)}
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                <Shield className="h-3 w-3 text-indigo-500" /> Squadre
              </div>
              {renderDrawerLinks(squadreItems)}
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                <Users className="h-3 w-3 text-cyan-500" /> Calciatori
              </div>
              {renderDrawerLinks(calciatoriItems)}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* DRAWER 2: LA MIA SQUADRA / AMMINISTRAZIONE */}
      <Drawer open={activeSheet === "squadra"} onOpenChange={(o) => !o && setActiveSheet(null)}>
        <DrawerContent className="max-h-[85vh] bg-card border-border/80">
          <DrawerHeader className="text-left pb-2 border-b border-border/60">
            <DrawerTitle className="flex items-center justify-between gap-2 text-base font-black">
              <span className="flex items-center gap-2 min-w-0 truncate">
                {effectiveTeam ? (
                  <img
                    src={`${SUPABASE_STORAGE_URL}/images/teams/${effectiveTeam}_Logo.png`}
                    alt={effectiveTeam}
                    className="h-5 w-5 object-contain shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                    }}
                  />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0" />
                )}
                <span className="truncate">{isAdmin ? "Amministrazione" : "La Mia Squadra"}</span>
              </span>
              {user && (
                <Badge variant="outline" className="text-[10px] font-mono font-bold shrink-0">
                  {user.team || (isAdmin ? "LEGA" : user.name)}
                </Badge>
              )}
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              {user?.name ? `Gestione ${isAdmin ? "Lega LCSIM" : user.teamFullName || user.name}` : ""}
            </DrawerDescription>
          </DrawerHeader>

          <div className="overflow-y-auto p-4 space-y-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            {isAdmin && (
              <Link
                to="/admin/automazioni"
                onClick={() => setActiveSheet(null)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  location.pathname === "/admin/automazioni"
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400"
                    : "bg-amber-500/5 border-amber-500/30 hover:bg-amber-500/15 text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-black">Automazioni Lega</div>
                    <div className="text-[11px] text-muted-foreground">
                      Risultati, scadenze, mercato, aging e controlli Admin
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] font-bold border-amber-500/40 text-amber-500">
                  ADMIN
                </Badge>
              </Link>
            )}

            {renderDrawerLinks(miaSquadraItems)}

            {/* Azioni Rapide Profilo Squadra */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              {user?.team && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setActiveSheet(null);
                    onOpenEditCoach();
                  }}
                  className="w-full justify-start h-10 rounded-xl text-xs font-bold gap-2.5 text-emerald-600 dark:text-emerald-400 border-border/80"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Modifica Informazioni Societarie</span>
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                role="switch"
                aria-checked={isOffseasonHome}
                onClick={toggleHomeMode}
                className="w-full justify-between h-10 rounded-xl text-xs font-bold px-3 border-border/80"
              >
                <span className="inline-flex items-center gap-2.5">
                  <LayoutDashboard
                    className={`h-4 w-4 ${isOffseasonHome ? "text-amber-500" : "text-emerald-500"}`}
                  />
                  <span>{isOffseasonHome ? "Home: Offseason" : "Home: Stagione"}</span>
                </span>
                {renderTogglePill(
                  isOffseasonHome,
                  "bg-amber-500 border-amber-600/40"
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setActiveSheet(null);
                    onOpenChangePassword();
                  }}
                  className="h-10 rounded-xl text-xs font-bold gap-2 border-border/80"
                >
                  <KeyRound className="h-4 w-4 text-primary" />
                  <span>Cambia Password</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setActiveSheet(null);
                    onLogout();
                  }}
                  className="h-10 rounded-xl text-xs font-bold gap-2 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Disconnetti</span>
                </Button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* DRAWER 3: ALTRO (Draft & Mercato, Media, Archivio, Push & PWA Install) */}
      <Drawer open={activeSheet === "altro"} onOpenChange={(o) => !o && setActiveSheet(null)}>
        <DrawerContent className="max-h-[85vh] bg-card border-border/80">
          <DrawerHeader className="text-left pb-2 border-b border-border/60">
            <DrawerTitle className="flex items-center gap-2 text-base font-black">
              <LayoutGrid className="h-4 w-4 text-emerald-500" />
              <span>Menu App &amp; Sezioni</span>
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              Draft, Media, Archivio Storico e preferenze App
            </DrawerDescription>
          </DrawerHeader>

          <div className="overflow-y-auto p-4 space-y-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            {/* Azioni App: Installa PWA (solo mobile) + Notifiche Push + Tema */}
            <div className="space-y-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-1">
                App &amp; Preferenze Dispositivo
              </div>

              {showInstallButton && (
                <Button
                  type="button"
                  onClick={() => {
                    setActiveSheet(null);
                    triggerInstall();
                  }}
                  className="w-full justify-start h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2.5 shadow-sm"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>📲 Installa App LCSIM</span>
                </Button>
              )}

              {pushSupported && (
                <Button
                  type="button"
                  variant="outline"
                  role="switch"
                  aria-checked={pushEnabled}
                  onClick={togglePushNotifications}
                  className="w-full justify-between h-11 rounded-2xl px-3.5 border-border/80 text-xs font-bold"
                >
                  <span className="inline-flex items-center gap-2.5">
                    {pushEnabled ? (
                      <Bell className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>Notifiche Push (Inbox &amp; Formazioni -24h)</span>
                  </span>
                  {renderTogglePill(pushEnabled)}
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full justify-between h-10 rounded-2xl px-3.5 border-border/80 text-xs font-bold"
              >
                <span className="inline-flex items-center gap-2.5">
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4 text-blue-400" />
                  ) : (
                    <Sun className="h-4 w-4 text-amber-500" />
                  )}
                  <span>Aspetto: {theme === "dark" ? "Tema Scuro" : "Tema Chiaro"}</span>
                </span>
                <span className="text-[11px] text-muted-foreground">Cambia</span>
              </Button>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                <Sparkles className="h-3 w-3 text-amber-500" /> Draft &amp; Mercato
              </div>
              {renderDrawerLinks(draftItems)}
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                <Newspaper className="h-3 w-3 text-amber-500" /> Media &amp; News
              </div>
              {renderDrawerLinks(mediaItems)}
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                <History className="h-3 w-3 text-purple-500" /> Archivio Storico
              </div>
              {renderDrawerLinks(archivioItems)}
            </div>

            {!user && (
              <Button
                type="button"
                onClick={() => {
                  setActiveSheet(null);
                  onOpenLogin();
                }}
                className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span>Accedi a LCSIM</span>
              </Button>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* GUIDA RAPIDA INSTALLAZIONE iOS / SAFARI */}
      <Dialog open={iosGuideOpen} onOpenChange={setIosGuideOpen}>
        <DialogContent className="sm:max-w-sm border-border/80 bg-card rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <Smartphone className="h-5 w-5 text-emerald-500" />
              <span>Installa App LCSIM su iPhone / iPad</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Segui questi 2 rapidi passaggi in Safari per usare LCSIM come app nativa a schermo intero e abilitare le notifiche Push:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs pt-1">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/70">
              <Share className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-foreground">1. Tocca &ldquo;Condividi&rdquo;</div>
                <div className="text-muted-foreground mt-0.5">
                  Premi l&apos;icona con il quadrato e la freccia verso l&apos;alto nella barra di Safari.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/70">
              <PlusSquare className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-foreground">
                  2. Seleziona &ldquo;Aggiungi alla schermata Home&rdquo;
                </div>
                <div className="text-muted-foreground mt-0.5">
                  Conferma con &ldquo;Aggiungi&rdquo; in alto a destra e apri LCSIM dalla tua Home.
                </div>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setIosGuideOpen(false)}
            className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Ho capito
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
