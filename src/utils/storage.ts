const STORAGE_KEY = 'smashflow_badminton_tournament_v2';

export function loadTournamentFromStorage<T>(fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn('Failed to load tournament from localStorage:', err);
    return fallback;
  }
}

export function saveTournamentToStorage<T>(data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save tournament to localStorage:', err);
  }
}

export function clearTournamentStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear tournament from localStorage:', err);
  }
}
