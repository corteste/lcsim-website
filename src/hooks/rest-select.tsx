import React, { useEffect, useState } from 'react';
import { Player } from '@/types/player';

const EDGE_URL = 'https://hzenyasrargpsbuaxmxl.supabase.co/functions/v1/rest-read'; // <- replace this
const [players, setPlayers] = useState<Player[] | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [page, setPage] = useState(0);
const LIMIT = 50;

export default function PlayersList() {

  useEffect(() => {
    fetchPlayers(page);
  }, [page]);

  async function fetchPlayers(pageIndex: number) {
    setLoading(true);
    setError(null);
    try {
      const offset = pageIndex * LIMIT;
      const res = await fetch(`${EDGE_URL}/AN_PLAYER?limit=${LIMIT}&offset=${offset}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch players');
      setPlayers(json.data ?? []);
      console.log(json);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setPlayers(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlayerById(id: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${EDGE_URL}/AN_PLAYER/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch player');
      // json.data contains the single player object
      alert(JSON.stringify(json.data, null, 2));
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }
}


export function getPlayers(pageIndex: number) {
 useEffect(() => {
    fetchPlayers(page);
  }, [page]);

  async function fetchPlayers(pageIndex: number) {
    setLoading(true);
    setError(null);
    try {
      const offset = pageIndex * LIMIT;
      const res = await fetch(`${EDGE_URL}/AN_PLAYER?limit=${LIMIT}&offset=${offset}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch players');
      setPlayers(json.data ?? []);
      console.log(json);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setPlayers(null);
    } finally {
      setLoading(false);
    }
  }
}

export function getPlayerById(id: number) {

  useEffect(() => {
    fetchPlayerById(id);
  }, [id]);

  async function fetchPlayerById(id: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${EDGE_URL}/AN_PLAYER/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch player');
      // json.data contains the single player object
      alert(JSON.stringify(json.data, null, 2));
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }
}