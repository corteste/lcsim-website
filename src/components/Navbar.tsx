import { Link, useLocation } from "react-router-dom";
import { Trophy, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Home" },
    { path: "/classifica", label: "Classifica" },
    { path: "/rose", label: "Rose" },
    { path: "/lista-giocatori", label: "Lista Giocatori" },
    { path: "/statistiche", label: "Statistiche" },
    { path: "/calendario", label: "Calendario" },
  ];

  const miaSquadraItems = [
    { path: "/mia-squadra/roster", label: "Roster" },
    { path: "/mia-squadra/tattica", label: "Tattica" },
    { path: "/mia-squadra/allenamenti", label: "Allenamenti" },
    { path: "/mia-squadra/confronto-giocatori", label: "Confronto Giocatori" },
  ];

  const isMiaSquadraActive = location.pathname.startsWith("/mia-squadra");

  return (
    <nav className="sticky top-0 z-50 border-b bg-card shadow-sm backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity">
            <Trophy className="h-6 w-6" />
            <span>Lega Calcio Simulato</span>
          </Link>
          
          <div className="flex gap-1 items-center">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-1 ${
                  isMiaSquadraActive
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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
