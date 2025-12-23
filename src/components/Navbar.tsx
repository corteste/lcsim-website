import { Link, useLocation } from "react-router-dom";
import { Trophy, ChevronDown, Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
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
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    //{ path: "/", label: "Home" }, // disabilitato, se clicco sul logo mi porta alla home
    { path: "/classifica", label: "Classifica" },
    { path: "/rose", label: "Rose" },
    //{ path: "/giocatori", label: "Giocatori" },
    { path: "/statistiche", label: "Statistiche" },
    { path: "/calendario", label: "Calendario" },
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
  ];

  const isMiaSquadraActive = location.pathname.startsWith("/mia-squadra");
  const isGiocatoriActive = location.pathname.startsWith("/giocatori");
  const isArchivioActive = location.pathname.startsWith("/archivio");

  return (
    <nav className="sticky top-0 z-50 border-b bg-card shadow-sm backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg md:text-xl text-primary hover:opacity-80 transition-opacity">
            <img src="/images/LCSIM_Logo_SMALL.png" alt="Custom Trophy" className="h-6 w-6 object-contain" />
            <span className="hidden sm:inline">Lega Calcio Simulato</span>
            <span className="sm:hidden">LCSIM</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-3 items-center">
            <div className="flex items-center gap-2">
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
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${location.pathname === item.path
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground hover:bg-secondary"
                    }`}
                >
                  {item.label}
                </Link>
              ))}

               {/* Parte GIOCATORI */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-1 ${isGiocatoriActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground hover:bg-secondary"
                    }`}
                >
                  Giocatori
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card z-50">
                  {giocatoriItems.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`cursor-pointer ${location.pathname === item.path
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
              {/* Fine Parte Giocatori */}

              {/* Parte Archivio */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-1 ${isArchivioActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground hover:bg-secondary"
                    }`}
                >
                  Archivio
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card z-50">
                  {archivioItems.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`cursor-pointer ${location.pathname === item.path
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
              {/* Fine Parte Archivio */}


              {/* Parte la mia squadra, da disattivare per pubblico */}
              {/* <DropdownMenu>
                <DropdownMenuTrigger
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-1 ${isMiaSquadraActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground hover:bg-secondary"
                    }`}
                >
                  La Mia Squadra
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card z-50">
                  {miaSquadraItems.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`cursor-pointer ${location.pathname === item.path
                            ? "bg-secondary font-medium"
                            : ""
                          }`}
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu> */}
              {/* Fine Parte la mia squadra */}
            </div>
          </div>

          {/* Mobile Navigation */}
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
                      className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${location.pathname === item.path
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-foreground hover:bg-secondary"
                        }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
