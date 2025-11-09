import { useEffect, useState } from "react";
import { Player } from "../types/player";
import { PLAYER_TABLE } from "@/constants/App";
import { supabase } from "@/supabaseClient";


export function getPlayers(fromTeam?: string) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchPlayers() {
      let query = supabase.from(PLAYER_TABLE).select("*");

      if (fromTeam) {
        query = query.eq("Squadra", fromTeam);
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        setError(error);
      } else {
        setPlayers(data || []);
      }
      setLoading(false);
    }

    fetchPlayers();
  }, [fromTeam]);

  return { players, loading, error };
}