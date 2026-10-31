import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { supabase } from "@/supabaseClient";
import { AppUser, FreeTeam, TeamOption } from "@/types/auth";

export type { AppUser, FreeTeam, TeamOption } from "@/types/auth";

interface AuthContextType {
  user: AppUser | null;
  isAdmin: boolean;
  effectiveTeam: string;
  effectiveTeamFullName: string;
  adminSelectedTeam: string;
  setAdminSelectedTeam: (teamId: string) => void;
  availableTeams: TeamOption[];
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  claimTeam: (params: { teamId: string; username: string; password: string; name?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  fetchFreeTeams: () => Promise<FreeTeam[]>;
  isLoginOpen: boolean;
  loginTab: "login" | "claim";
  openLogin: (tab?: "login" | "claim") => void;
  closeLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "lcsim_auth_user";
const ADMIN_TEAM_STORAGE_KEY = "lcsim_admin_selected_team";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableTeams, setAvailableTeams] = useState<TeamOption[]>([]);
  const [adminSelectedTeam, setAdminSelectedTeamState] = useState<string>("APD");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginTab, setLoginTab] = useState<"login" | "claim">("login");

  // Load available active Serie A teams
  useEffect(() => {
    async function loadTeams() {
      try {
        const { data, error } = await supabase
          .from("an_team")
          .select('TEAM_ID, NAME, NAME_ABBR')
          .eq("ACTIVE", true)
          .order("NAME");
        if (!error && data) {
          const list = data.map((t: any) => ({
            team_id: t.TEAM_ID,
            name: t.NAME,
            name_abbr: t.NAME_ABBR || t.NAME,
          }));
          setAvailableTeams(list);
        }
      } catch (err) {
        console.error("Error loading active teams:", err);
      }
    }
    loadTeams();
  }, []);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
      const storedAdminTeam = localStorage.getItem(ADMIN_TEAM_STORAGE_KEY);
      if (storedAdminTeam) {
        setAdminSelectedTeamState(storedAdminTeam);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setAdminSelectedTeam = (teamId: string) => {
    setAdminSelectedTeamState(teamId);
    try {
      localStorage.setItem(ADMIN_TEAM_STORAGE_KEY, teamId);
    } catch {
      /* ignore */
    }
  };

  const openLogin = (tab: "login" | "claim" = "login") => {
    setLoginTab(tab);
    setIsLoginOpen(true);
  };

  const closeLogin = () => {
    setIsLoginOpen(false);
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc("rpc_login", {
        p_username: username.trim(),
        p_password: password,
      });

      if (error) {
        console.error("rpc_login error:", error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: "Credenziali non valide. Verifica username e password." };
      }

      const appUser: AppUser = {
        id: data.id,
        username: data.username,
        name: data.name,
        team: data.team || "",
        teamFullName: data.teamFullName || "",
        teamAbbr: data.teamAbbr || data.team || "",
        isAdmin: Boolean(data.isAdmin),
      };

      setUser(appUser);
      if (appUser.isAdmin && appUser.team) {
        setAdminSelectedTeam(appUser.team);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
      return { success: true };
    } catch (err: any) {
      console.error("login exception:", err);
      return { success: false, error: err?.message || "Errore imprevisto durante l'accesso." };
    }
  };

  const claimTeam = async (params: {
    teamId: string;
    username: string;
    password: string;
    name?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc("rpc_claim_team", {
        p_team_id: params.teamId,
        p_username: params.username.trim(),
        p_password: params.password,
        p_name: params.name?.trim() || "",
      });

      if (error) {
        console.error("rpc_claim_team error:", error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: "Errore durante l'assegnazione della squadra." };
      }

      const appUser: AppUser = {
        id: data.id,
        username: data.username,
        name: data.name,
        team: data.team,
        teamFullName: data.teamFullName,
        teamAbbr: data.teamAbbr || data.team,
        isAdmin: false,
      };

      setUser(appUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
      return { success: true };
    } catch (err: any) {
      console.error("claimTeam exception:", err);
      return { success: false, error: err?.message || "Errore imprevisto durante la registrazione." };
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.username) {
      return { success: false, error: "Nessun utente autenticato." };
    }

    try {
      const { data, error } = await supabase.rpc("rpc_change_password", {
        p_username: user.username,
        p_current_password: currentPassword,
        p_new_password: newPassword,
      });

      if (error) {
        console.error("rpc_change_password error:", error);
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        return {
          success: false,
          error: data?.error || "Impossibile aggiornare la password.",
        };
      }

      return { success: true };
    } catch (err: any) {
      console.error("changePassword exception:", err);
      return {
        success: false,
        error: err?.message || "Errore imprevisto durante l'aggiornamento.",
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const fetchFreeTeams = async (): Promise<FreeTeam[]> => {
    try {
      const { data, error } = await supabase.rpc("rpc_get_free_teams");
      if (error) {
        console.error("rpc_get_free_teams error:", error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error("fetchFreeTeams error:", err);
      return [];
    }
  };

  const isAdmin = Boolean(user?.isAdmin);

  // Effective team: if admin, use adminSelectedTeam; else user.team
  const effectiveTeam = useMemo(() => {
    if (!user) return "";
    if (isAdmin) {
      return adminSelectedTeam || user.team || "APD";
    }
    return user.team;
  }, [user, isAdmin, adminSelectedTeam]);

  const effectiveTeamFullName = useMemo(() => {
    if (!effectiveTeam) return "";
    const found = availableTeams.find((t) => t.team_id === effectiveTeam);
    return found ? found.name : user?.teamFullName || effectiveTeam;
  }, [effectiveTeam, availableTeams, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        effectiveTeam,
        effectiveTeamFullName,
        adminSelectedTeam,
        setAdminSelectedTeam,
        availableTeams,
        login,
        claimTeam,
        changePassword,
        logout,
        isLoading,
        fetchFreeTeams,
        isLoginOpen,
        loginTab,
        openLogin,
        closeLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
