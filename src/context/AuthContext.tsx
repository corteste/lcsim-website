import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AppUser {
  id: string;
  email: string;
  username: string;
  name: string;
  team: string; // abbreviazione squadra (es. "APD", "JUV", ecc.)
  teamFullName: string;
}

/** Utenti mock — sostituire con chiamata al DB reale */
const MOCK_USERS: Record<string, { password: string; user: AppUser }> = {
  "cotestekkio": {
    password: "forzatoro",
    user: { id: "1", email: "admin@lcsim.it", username: "admin@lcsim.it", name: "Admin", team: "APD", teamFullName: "Average Pegiò Drivers" },
  },
  "user2@lcsim.it": {
    password: "user2",
    user: { id: "2", email: "user2@lcsim.it", username: "admin@lcsim.it",name: "Mister B", team: "PFC", teamFullName: "Panormus FC"  },
  },
  "user3@lcsim.it": {
    password: "user3",
    user: { id: "3", email: "user3@lcsim.it", username: "admin@lcsim.it",name: "Mister C", team: "ACD", teamFullName: "AC Denti"  },
  },
  "mar9125": {
    password: "rioux96",
    user: { id: "4", email: "user3@lcsim.it", username: "mar9215",name: "Mario San", team: "MAR", teamFullName: "Mar's Attack"  },
  },
};

interface AuthContextType {
  user: AppUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "lcsim_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // TODO: sostituire con chiamata al DB
    const entry = MOCK_USERS[username.toLowerCase()];
    if (!entry || entry.password !== password) return false;
    setUser(entry.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry.user));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
