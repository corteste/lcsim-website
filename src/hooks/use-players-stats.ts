import { useEffect, useState } from "react";
import { PlayerStatsAvg, PlayerStatsSum } from "../types/playerStats";
import { fetchPlayerSumBySeason, fetchPlayerAvgBySeason, fetchPlayerStatsByPlayer, fetchPlayerStatsByTeam } from "@/services/playerStatsService";

export function getPlayersSumStats(season?: number,player?: String,team?: String) {
  const [playersStats, setPlayersSumStats] = useState<PlayerStatsSum[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  useEffect(() => {
    async function fetchPlayerStatsWrapper() {
      if (season !== null) {
        console.log("Fetching players for season:", season);
        fetchPlayerSumBySeason(season)
      .then(setPlayersSumStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
      } 
      // else if (player !== null) {
      //   console.log("Fetching players for player:", player);
      //   fetchPlayerStatsByPlayer(player)
      // .then(setPlayersSumStats)
      // .catch((err) => setError(err.message))
      // .finally(() => setLoading(false));
      // } else if (team !== null) {
      //   console.log("Fetching players for team:", team);
      //   fetchPlayerStatsByTeam(team)
      // .then(setPlayersSumStats)
      // .catch((err) => setError(err.message))
      // .finally(() => setLoading(false));
      // }
      // else {
      //   console.log("Fetching all players");
      //   fetchPlayers()
      // .then(setPlayers)
      // .catch((err) => setError(err.message))
      // .finally(() => setLoading(false));
      // }
      setLoading(false);
    }

    fetchPlayerStatsWrapper();
  }, [season, player, team]);

  return { playersStats, loading, error };
}


export function getPlayersAvgStats(season?: number,player?: String,team?: String) {
  const [playersStats, setPlayersStats] = useState<PlayerStatsAvg[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  useEffect(() => {
    async function fetchPlayerStatsWrapper() {
      if (season !== null) {
        console.log("Fetching players for season:", season);
        fetchPlayerAvgBySeason(season)
      .then(setPlayersStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
      } 
      // else if (player !== null) {
      //   console.log("Fetching players for player:", player);
      //   fetchPlayerStatsByPlayer(player)
      // .then(setPlayersStats)
      // .catch((err) => setError(err.message))
      // .finally(() => setLoading(false));
      // } else if (team !== null) {
      //   console.log("Fetching players for team:", team);
      //   fetchPlayerStatsByTeam(team)
      // .then(setPlayersStats)
      // .catch((err) => setError(err.message))
      // .finally(() => setLoading(false));
      // }
      // else {
      //   console.log("Fetching all players");
      //   fetchPlayers()
      // .then(setPlayers)
      // .catch((err) => setError(err.message))
      // .finally(() => setLoading(false));
      // }
      setLoading(false);
    }

    fetchPlayerStatsWrapper();
  }, [season, player, team]);

  return { playersStats, loading, error };
}