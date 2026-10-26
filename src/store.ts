import { useCallback, useEffect, useState } from 'react';
import type { ParkId, Ride } from './data/rides';

export interface RideLog {
  ridden: boolean;
  count: number;
  ratings: Record<string, number>;
  notes: string;
  lastRidden?: string; // ISO date
}

export interface AppState {
  version: 1;
  logs: Record<string, RideLog>;
  custom: Ride[];
  hidden: string[];
}

const KEY = 'ride-log-v1';

const empty: AppState = { version: 1, logs: {}, custom: [], hidden: [] };

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return { ...empty, ...parsed };
  } catch {
    return empty;
  }
}

export const blankLog = (): RideLog => ({ ridden: false, count: 0, ratings: {}, notes: '' });

export function useAppState() {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked — keep working in memory */
    }
  }, [state]);

  const updateLog = useCallback((id: string, fn: (log: RideLog) => RideLog) => {
    setState((s) => ({ ...s, logs: { ...s.logs, [id]: fn(s.logs[id] ?? blankLog()) } }));
  }, []);

  const addCustom = useCallback((park: ParkId, name: string, land: string) => {
    const ride: Ride = {
      id: `custom-${Date.now().toString(36)}`,
      park,
      name,
      land: land || 'My additions',
      custom: true,
    };
    setState((s) => ({ ...s, custom: [...s.custom, ride] }));
  }, []);

  const removeCustom = useCallback((id: string) => {
    setState((s) => {
      const logs = { ...s.logs };
      delete logs[id];
      return { ...s, custom: s.custom.filter((r) => r.id !== id), logs };
    });
  }, []);

  const replaceAll = useCallback((next: AppState) => setState({ ...empty, ...next }), []);

  return { state, updateLog, addCustom, removeCustom, replaceAll };
}

export function averageOf(log: RideLog | undefined): number | null {
  if (!log) return null;
  const vals = Object.values(log.ratings).filter((v) => v > 0);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
