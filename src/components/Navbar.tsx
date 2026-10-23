import { Link, useLocation, useNavigate } from "react-router-dom";
import { Trophy, ChevronDown, Moon, Sun, Menu, LogIn, LogOut, User, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import LoginDialog from "@/components/LoginDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { user, logout, openLogin, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { path: "/classifica", label: "Classifica" },
    { path: "/rose", label: "Rose" },
    { path: "/statistiche", label: "Statistiche" },
    { path: "/calendario", label: "Calendario" },
    { path: "/draft", label: "Draft" },
  ];

  const miaSquadraItems = [
    { path: "/mia-squadra/roster", label: "Roster" },
    { path: "/mia-squadra/tattica", label: "Tattica" },
    { path: "/mia-squadra/allenamenti", label: "Allenamenti" },
    { path: "/mia-squadra/confronto-giocatori", label: "Confronto Giocatori" },
  ];

  const giocatoriItems = [
    { path: "/giocatori/lista-giocatori", label: "Lista Giocatori" },
    { path: "/giocatori/confronto-giocatori", label: "Confronto Giocatori" },
  ];

  const archivioItems = [
    { path: "/archivio/giocatori", label: "Archivio Giocatori" },
    { path: "/archivio/squadre", label: "Archivio Squadre" },
    { path: "/archivio/hall-of-fame", label: "Hall of Fame" },
  ];

  const isMiaSquadraActive = location.pathname.startsWith("/mia-squadra");
  const isGiocatoriActive = location.pathname.startsWith("/giocatori");
  const isArchivioActive = location.pathname.startsWith("/archivio");

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur-md shadow-sm transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo & Live Broadcast Pill */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img 
              src="/images/LCSIM_Logo_SMALL.png" 
              alt="LCSIM Logo" 
              className="h-8 w-8 object-contain filter drop-shadow" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg text-foreground">LCSIM</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] font-medium leading-none text-muted-foreground hidden sm:block">
                Lega Calcio Simulato • Serie A
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-3 items-center">
            <div className="flex items-center gap-2 mr-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex gap-1 items-center">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    location.pathname === item.path
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm"
                      : "text-foreground/80 hover:text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Dropdown GIOCATORI */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isGiocatoriActive
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm"
                      : "text-foreground/80 hover:text-foreground hover:bg-secondary/80"
                  }`}
                >
                  Giocatori
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card z-50 shadow-lg border">
                  {giocatoriItems.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`cursor-pointer ${
                          location.pathname === item.path
                            ? "bg-secondary font-medium"
                            : ""
                        }`}
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dropdown Archivio */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isArchivioActive
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm"
                      : "text-foreground/80 hover:text-foreground hover:bg-secondary/80"
                  }`}
                >
                  Archivio
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card z-50 shadow-lg border">
                  {archivioItems.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`cursor-pointer ${
                          location.pathname === item.path
                            ? "bg-secondary font-medium"
                            : ""
                        }`}
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dropdown La Mia Squadra (solo se loggato) */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                      isMiaSquadraActive
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm"
                        : "text-foreground/80 hover:text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    La Mia Squadra
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-card z-50 shadow-lg border">
                    {miaSquadraItems.map((item) => (
                      <DropdownMenuItem key={item.path} asChild>
                        <Link
                          to={item.path}
                          className={`cursor-pointer ${
                            location.pathname === item.path
                              ? "bg-secondary font-medium"
                              : ""
                          }`}
                        >
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* User Auth Info / Login */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 border text-sm">
                {isAdmin ? (
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 text-[10px] font-black px-1.5 py-0 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> ADMIN
                  </Badge>
                ) : (
                  user.team && (
                    <img
                      src={`/images/teams/${user.team}_Logo.png`}
                      alt={user.team}
                      className="h-4 w-4 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                      }}
                    />
                  )
                )}
                <span className="font-semibold text-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground font-mono">({user.team})</span>
                <Button size="sm" variant="ghost" className="h-7 px-2 hover:text-destructive" onClick={handleLogout}>
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => openLogin("login")} className="border-border">
                <LogIn className="h-4 w-4 mr-1.5 text-emerald-500" /> Accedi
              </Button>
            )}

            {/* Mobile Navigation Trigger */}
            <div className="flex md:hidden gap-2 items-center">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
                <Moon className="h-4 w-4 text-muted-foreground" />
              </div>

              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 mt-6">
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`px-4 py-3 rounded-lg font-medium transition-all ${
                          location.pathname === item.path
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="pt-2 border-t mt-2">
                      <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Giocatori</p>
                      {giocatoriItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsOpen(false)}
                          className="block px-4 py-2 rounded-lg text-sm text-foreground hover:bg-secondary"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <div className="pt-2 border-t mt-2">
                      <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Archivio</p>
                      {archivioItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsOpen(false)}
                          className="block px-4 py-2 rounded-lg text-sm text-foreground hover:bg-secondary"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    {user && (
                      <div className="pt-2 border-t mt-2">
                        <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">La Mia Squadra</p>
                        {miaSquadraItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-2 rounded-lg text-sm text-foreground hover:bg-secondary"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
      <LoginDialog />
    </nav>
  );
};

export default Navbar;
