import { Link, useLocation } from "react-router-dom";
import { Trophy } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Home" },
    { path: "/classifica", label: "Classifica" },
    { path: "/rose", label: "Rose" },
    { path: "/statistiche", label: "Statistiche" },
    { path: "/calendario", label: "Calendario" },
    { path: "/mia-squadra", label: "La Mia Squadra" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-card shadow-sm backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity">
            <Trophy className="h-6 w-6" />
            <span>Fantasy League</span>
          </Link>
          
          <div className="flex gap-1">
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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
