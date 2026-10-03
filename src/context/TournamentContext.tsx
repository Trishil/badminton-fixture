import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Team,
  Match,
  KnockoutMatch,
  GroupStanding,
  GroupId,
  TournamentSettings,
  KnockoutMode,
} from '../types/tournament';
import { DEFAULT_TEAMS, PRO_PAIRS_PRESET, DEFAULT_SETTINGS } from '../utils/initialData';
import { generateGroupMatches } from '../utils/scheduler';
import { calculateAllStandings } from '../utils/standings';
import { initializeKnockoutMatches, resolveKnockoutSeeds } from '../utils/knockout';
import {
  loadTournamentFromStorage,
  saveTournamentToStorage,
  clearTournamentStorage,
} from '../utils/storage';
import {
  playScoreChime,
  playMatchPointChime,
  playWarningBeep,
  playBuzzer,
  playPodiumFanfare,
  unlockAudioContext,
} from '../utils/audio';

interface CourtTimerHook {
  secondsRemaining: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (seconds?: number) => void;
  addMinute: () => void;
}

interface TournamentContextType {
  teams: Team[];
  matches: Match[];
  knockoutMatches: KnockoutMatch[];
  standings: Record<GroupId, GroupStanding[]>;
  settings: TournamentSettings;
  activeTab: 'courts' | 'schedule' | 'standings' | 'knockout' | 'admin';
  setActiveTab: (tab: 'courts' | 'schedule' | 'standings' | 'knockout' | 'admin') => void;

  // Live court matches
  court1Match: Match | KnockoutMatch | null;
  court1UpNext: Match | KnockoutMatch | null;
  court2Match: Match | KnockoutMatch | null;
  court2UpNext: Match | KnockoutMatch | null;

  // Timers
  court1Timer: CourtTimerHook;
  court2Timer: CourtTimerHook;
  masterSecondsRemaining: number;

  // Actions
  updateScore: (matchId: string, team: 'A' | 'B', delta: number) => void;
  quickFinishMatch: (matchId: string, winnerId: string, winScore?: number, loseScore?: number) => void;
  finishAndAdvanceMatch: (matchId: string) => { success: boolean; error?: string };
  overrideMatch: (
    matchId: string,
    updates: Partial<Match> & { scoreA?: number; scoreB?: number; status?: Match['status']; winnerId?: string | null; court?: 1 | 2 }
  ) => void;
  dispatchToCourt: (matchId: string, court: 1 | 2) => void;
  updateTeamName: (teamId: string, newName: string) => void;
  loadStarPlayers: () => void;
  loadGroundTeams: () => void;
  simulateRemainingGroupMatches: () => void;
  setKnockoutMode: (mode: KnockoutMode) => void;
  toggleSound: () => void;
  resetTournament: () => void;
  importTournamentJSON: (jsonData: string) => boolean;

  // Celebration & Podium
  showPodiumModal: boolean;
  setShowPodiumModal: (show: boolean) => void;
  championTeam: Team | null;
  runnerUpTeam: Team | null;
  semiFinalistTeams: Team[];
  isTournamentFinished: boolean;

  // Stats
  completedMatchesCount: number;
  totalGroupMatchesCount: number;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

interface StoredTournamentState {
  teams: Team[];
  matches: Match[];
  knockoutMatches: KnockoutMatch[];
  settings: TournamentSettings;
  court1TimerSec: number;
  court2TimerSec: number;
  savedAt: number;
}

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial state setup with localStorage persistence
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = loadTournamentFromStorage<StoredTournamentState | null>(null);
    return saved?.teams || DEFAULT_TEAMS;
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = loadTournamentFromStorage<StoredTournamentState | null>(null);
    if (saved?.matches && saved.matches.length > 0) return saved.matches;
    return generateGroupMatches(DEFAULT_TEAMS);
  });

  const [settings, setSettings] = useState<TournamentSettings>(() => {
    const saved = loadTournamentFromStorage<StoredTournamentState | null>(null);
    return saved?.settings || DEFAULT_SETTINGS;
  });

  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatch[]>(() => {
    const saved = loadTournamentFromStorage<StoredTournamentState | null>(null);
    if (saved?.knockoutMatches && saved.knockoutMatches.length > 0) return saved.knockoutMatches;
    return initializeKnockoutMatches(DEFAULT_SETTINGS.knockoutMode);
  });

  const [activeTab, setActiveTab] = useState<'courts' | 'schedule' | 'standings' | 'knockout' | 'admin'>('courts');
  const [showPodiumModal, setShowPodiumModal] = useState<boolean>(false);

  // Court 1 Timer
  const [c1Seconds, setC1Seconds] = useState<number>(() => {
    const saved = loadTournamentFromStorage<StoredTournamentState | null>(null);
    return saved?.court1TimerSec ?? 420;
  });
  const [c1Running, setC1Running] = useState<boolean>(false);
  const c1WarningBeeped = useRef<boolean>(false);

  // Court 2 Timer
  const [c2Seconds, setC2Seconds] = useState<number>(() => {
    const saved = loadTournamentFromStorage<StoredTournamentState | null>(null);
    return saved?.court2TimerSec ?? 420;
  });
  const [c2Running, setC2Running] = useState<boolean>(false);
  const c2WarningBeeped = useRef<boolean>(false);

  // Tournament Master 3-hour timer
  const [masterSecondsRemaining, setMasterSecondsRemaining] = useState<number>(() => {
    const elapsedSeconds = Math.floor((Date.now() - settings.tournamentStartTime) / 1000);
    const totalDurationSeconds = settings.targetDurationMinutes * 60;
    return Math.max(0, totalDurationSeconds - elapsedSeconds);
  });

  // Calculate Standings dynamically
  const standings = useMemo(() => {
    return calculateAllStandings(teams, matches, settings.knockoutMode);
  }, [teams, matches, settings.knockoutMode]);

  // Dynamically resolve knockout seeds whenever standings change
  useEffect(() => {
    setKnockoutMatches((prev) => resolveKnockoutSeeds(prev, standings, settings.knockoutMode));
  }, [standings, settings.knockoutMode]);

  // Master Clock interval
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - settings.tournamentStartTime) / 1000);
      const totalDurationSeconds = settings.targetDurationMinutes * 60;
      setMasterSecondsRemaining(Math.max(0, totalDurationSeconds - elapsedSeconds));
    }, 1000);
    return () => clearInterval(interval);
  }, [settings.tournamentStartTime, settings.targetDurationMinutes]);

  // Court 1 Timer loop
  useEffect(() => {
    if (!c1Running) return;
    const interval = setInterval(() => {
      setC1Seconds((prev) => {
        if (prev <= 1) {
          setC1Running(false);
          playBuzzer(settings.soundEnabled);
          return 0;
        }
        if (prev === 121 && !c1WarningBeeped.current) {
          playWarningBeep(settings.soundEnabled);
          c1WarningBeeped.current = true;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [c1Running, settings.soundEnabled]);

  // Court 2 Timer loop
  useEffect(() => {
    if (!c2Running) return;
    const interval = setInterval(() => {
      setC2Seconds((prev) => {
        if (prev <= 1) {
          setC2Running(false);
          playBuzzer(settings.soundEnabled);
          return 0;
        }
        if (prev === 121 && !c2WarningBeeped.current) {
          playWarningBeep(settings.soundEnabled);
          c2WarningBeeped.current = true;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [c2Running, settings.soundEnabled]);

  // Auto-save to localStorage
  useEffect(() => {
    const dataToSave: StoredTournamentState = {
      teams,
      matches,
      knockoutMatches,
      settings,
      court1TimerSec: c1Seconds,
      court2TimerSec: c2Seconds,
      savedAt: Date.now(),
    };
    saveTournamentToStorage(dataToSave);
  }, [teams, matches, knockoutMatches, settings, c1Seconds, c2Seconds]);

  // Determine Active Court Matches
  // Court 1: First check if a knockout match is assigned & live on Court 1, else find live group match on Court 1
  const court1Match = useMemo(() => {
    const liveKo = knockoutMatches.find((m) => m.court === 1 && m.status === 'live');
    if (liveKo) return liveKo;
    const liveGroup = matches.find((m) => m.court === 1 && m.status === 'live');
    return liveGroup || null;
  }, [matches, knockoutMatches]);

  // Court 1 "Up Next" match
  const court1UpNext = useMemo(() => {
    const scheduledKo = knockoutMatches.find(
      (m) => m.court === 1 && m.status === 'scheduled' && m.teamAId && m.teamBId
    );
    if (scheduledKo) return scheduledKo;
    const scheduledGroup = matches.find((m) => m.court === 1 && m.status === 'scheduled');
    return scheduledGroup || null;
  }, [matches, knockoutMatches]);

  // Court 2: Check knockout first, then group
  const court2Match = useMemo(() => {
    const liveKo = knockoutMatches.find((m) => m.court === 2 && m.status === 'live');
    if (liveKo) return liveKo;
    const liveGroup = matches.find((m) => m.court === 2 && m.status === 'live');
    return liveGroup || null;
  }, [matches, knockoutMatches]);

  // Court 2 "Up Next" match
  const court2UpNext = useMemo(() => {
    const scheduledKo = knockoutMatches.find(
      (m) => m.court === 2 && m.status === 'scheduled' && m.teamAId && m.teamBId
    );
    if (scheduledKo) return scheduledKo;
    const scheduledGroup = matches.find((m) => m.court === 2 && m.status === 'scheduled');
    return scheduledGroup || null;
  }, [matches, knockoutMatches]);

  // Court 1 Timer Hook controls
  const court1Timer: CourtTimerHook = {
    secondsRemaining: c1Seconds,
    isRunning: c1Running,
    start: () => {
      unlockAudioContext();
      c1WarningBeeped.current = c1Seconds <= 120;
      setC1Running(true);
    },
    pause: () => setC1Running(false),
    reset: (sec = 420) => {
      setC1Running(false);
      c1WarningBeeped.current = false;
      setC1Seconds(sec);
    },
    addMinute: () => setC1Seconds((prev) => prev + 60),
  };

  // Court 2 Timer Hook controls
  const court2Timer: CourtTimerHook = {
    secondsRemaining: c2Seconds,
    isRunning: c2Running,
    start: () => {
      unlockAudioContext();
      c2WarningBeeped.current = c2Seconds <= 120;
      setC2Running(true);
    },
    pause: () => setC2Running(false),
    reset: (sec = 420) => {
      setC2Running(false);
      c2WarningBeeped.current = false;
      setC2Seconds(sec);
    },
    addMinute: () => setC2Seconds((prev) => prev + 60),
  };

  // Sound Toggle
  const toggleSound = useCallback(() => {
    unlockAudioContext();
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  // Update Score for a match
  const updateScore = useCallback(
    (matchId: string, team: 'A' | 'B', delta: number) => {
      unlockAudioContext();

      // Check if it's a knockout match
      const isKo = knockoutMatches.some((m) => m.id === matchId);

      if (isKo) {
        setKnockoutMatches((prev) =>
          prev.map((m) => {
            if (m.id !== matchId) return m;
            const newScoreA = team === 'A' ? Math.max(0, m.scoreA + delta) : m.scoreA;
            const newScoreB = team === 'B' ? Math.max(0, m.scoreB + delta) : m.scoreB;

            if (delta > 0) {
              if (newScoreA === settings.pointsToWin || newScoreB === settings.pointsToWin) {
                playMatchPointChime(settings.soundEnabled);
              } else {
                playScoreChime(settings.soundEnabled);
              }
            }

            let winnerId: string | null = null;
            if (newScoreA >= settings.pointsToWin && newScoreA > newScoreB) {
              winnerId = m.teamAId;
            } else if (newScoreB >= settings.pointsToWin && newScoreB > newScoreA) {
              winnerId = m.teamBId;
            }

            return {
              ...m,
              scoreA: newScoreA,
              scoreB: newScoreB,
              winnerId,
            };
          })
        );
      } else {
        // Group match
        setMatches((prev) =>
          prev.map((m) => {
            if (m.matchId !== matchId) return m;
            const newScoreA = team === 'A' ? Math.max(0, m.scoreA + delta) : m.scoreA;
            const newScoreB = team === 'B' ? Math.max(0, m.scoreB + delta) : m.scoreB;

            if (delta > 0) {
              if (newScoreA === settings.pointsToWin || newScoreB === settings.pointsToWin) {
                playMatchPointChime(settings.soundEnabled);
              } else {
                playScoreChime(settings.soundEnabled);
              }
            }

            let winnerId: string | null = null;
            if (newScoreA >= settings.pointsToWin && newScoreA > newScoreB) {
              winnerId = m.teamA_id;
            } else if (newScoreB >= settings.pointsToWin && newScoreB > newScoreA) {
              winnerId = m.teamB_id;
            }

            return {
              ...m,
              scoreA: newScoreA,
              scoreB: newScoreB,
              winnerId,
            };
          })
        );
      }
    },
    [knockoutMatches, settings.pointsToWin, settings.soundEnabled]
  );

  // Quick Finish match (auto-fill 5-3, 5-4, 5-1 etc)
  const quickFinishMatch = useCallback(
    (matchId: string, winnerId: string, winScore = 5, loseScore = 3) => {
      unlockAudioContext();
      playMatchPointChime(settings.soundEnabled);

      const isKo = knockoutMatches.some((m) => m.id === matchId);

      if (isKo) {
        setKnockoutMatches((prev) =>
          prev.map((m) => {
            if (m.id !== matchId) return m;
            const isWinnerA = m.teamAId === winnerId;
            return {
              ...m,
              scoreA: isWinnerA ? winScore : loseScore,
              scoreB: isWinnerA ? loseScore : winScore,
              winnerId,
            };
          })
        );
      } else {
        setMatches((prev) =>
          prev.map((m) => {
            if (m.matchId !== matchId) return m;
            const isWinnerA = m.teamA_id === winnerId;
            return {
              ...m,
              scoreA: isWinnerA ? winScore : loseScore,
              scoreB: isWinnerA ? loseScore : winScore,
              winnerId,
            };
          })
        );
      }
    },
    [knockoutMatches, settings.soundEnabled]
  );

  // Finish and Advance Match (frees court, automatically queues next match)
  const finishAndAdvanceMatch = useCallback(
    (matchId: string): { success: boolean; error?: string } => {
      unlockAudioContext();

      // Check if knockout match
      const koMatch = knockoutMatches.find((m) => m.id === matchId);
      if (koMatch) {
        if (koMatch.scoreA === koMatch.scoreB) {
          return { success: false, error: 'Cannot finish match with tied score! Badminton requires a winner.' };
        }
        const winnerId = koMatch.scoreA > koMatch.scoreB ? koMatch.teamAId : koMatch.teamBId;
        if (!winnerId) {
          return { success: false, error: 'Winner could not be determined.' };
        }

        const courtNum = koMatch.court;

        // If this is the Grand Final!
        const isFinal = koMatch.id === 'final';

        setKnockoutMatches((prev) =>
          prev.map((m) => {
            if (m.id !== matchId) return m;
            return {
              ...m,
              status: 'completed',
              winnerId,
            };
          })
        );

        if (courtNum === 1) {
          court1Timer.reset(420);
        } else {
          court2Timer.reset(420);
        }

        if (isFinal) {
          // Trigger victory celebration!
          playPodiumFanfare(settings.soundEnabled);
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
          setShowPodiumModal(true);
        }

        return { success: true };
      }

      // Group match
      const groupMatch = matches.find((m) => m.matchId === matchId);
      if (!groupMatch) {
        return { success: false, error: 'Match not found.' };
      }

      if (groupMatch.scoreA === groupMatch.scoreB) {
        return {
          success: false,
          error: 'Scores are tied (sudden-death required: first to 5 points wins)!',
        };
      }

      const winnerId = groupMatch.scoreA > groupMatch.scoreB ? groupMatch.teamA_id : groupMatch.teamB_id;
      const courtNum = groupMatch.court;

      // Mark this match completed, and find next scheduled match on this court to promote to live
      setMatches((prev) => {
        let promotedNext = false;
        return prev.map((m) => {
          if (m.matchId === matchId) {
            return {
              ...m,
              status: 'completed',
              winnerId,
              completedAt: Date.now(),
            };
          }
          if (!promotedNext && m.court === courtNum && m.status === 'scheduled') {
            promotedNext = true;
            return {
              ...m,
              status: 'live',
              startedAt: Date.now(),
            };
          }
          return m;
        });
      });

      // Reset timer on this court
      if (courtNum === 1) {
        court1Timer.reset(420);
      } else {
        court2Timer.reset(420);
      }

      return { success: true };
    },
    [matches, knockoutMatches, court1Timer, court2Timer, settings.soundEnabled]
  );

  // Manual Match Override (Coordinator typo fix or status change)
  const overrideMatch = useCallback(
    (
      matchId: string,
      updates: Partial<Match> & { scoreA?: number; scoreB?: number; status?: Match['status']; winnerId?: string | null; court?: 1 | 2 }
    ) => {
      const isKo = knockoutMatches.some((m) => m.id === matchId);

      if (isKo) {
        setKnockoutMatches((prev) =>
          prev.map((m) => {
            if (m.id !== matchId) return m;
            return {
              ...m,
              scoreA: updates.scoreA !== undefined ? updates.scoreA : m.scoreA,
              scoreB: updates.scoreB !== undefined ? updates.scoreB : m.scoreB,
              status: updates.status || m.status,
              court: updates.court || m.court,
              winnerId: updates.winnerId !== undefined ? updates.winnerId : m.winnerId,
            };
          })
        );
      } else {
        setMatches((prev) =>
          prev.map((m) => {
            if (m.matchId !== matchId) return m;
            return {
              ...m,
              scoreA: updates.scoreA !== undefined ? updates.scoreA : m.scoreA,
              scoreB: updates.scoreB !== undefined ? updates.scoreB : m.scoreB,
              status: updates.status || m.status,
              court: updates.court || m.court,
              courtAssigned: updates.court || m.courtAssigned,
              winnerId: updates.winnerId !== undefined ? updates.winnerId : m.winnerId,
            };
          })
        );
      }
    },
    [knockoutMatches]
  );

  // Dispatch scheduled match to Court 1 or Court 2
  const dispatchToCourt = useCallback((matchId: string, targetCourt: 1 | 2) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.matchId === matchId) {
          return {
            ...m,
            court: targetCourt,
            courtAssigned: targetCourt,
            status: 'live',
          };
        }
        // If there was already a live match on targetCourt, keep it or allow manual
        return m;
      })
    );
  }, []);

  // Update Team Name
  const updateTeamName = useCallback((teamId: string, newName: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, name: newName } : t))
    );
  }, []);

  // Load Star Badminton Pairs Preset
  const loadStarPlayers = useCallback(() => {
    setTeams((prev) =>
      prev.map((t) => {
        const found = PRO_PAIRS_PRESET.find((p) => p.id === t.id);
        return found ? { ...t, name: found.name } : t;
      })
    );
  }, []);

  // Load Ground Tournament Teams
  const loadGroundTeams = useCallback(() => {
    setTeams(DEFAULT_TEAMS);
  }, []);

  // Fast Simulate Remaining Group Stage Matches
  const simulateRemainingGroupMatches = useCallback(() => {
    unlockAudioContext();
    const realisticScores = [
      [5, 3],
      [5, 4],
      [5, 2],
      [5, 1],
      [3, 5],
      [4, 5],
      [2, 5],
      [1, 5],
    ];

    setMatches((prev) =>
      prev.map((m, idx) => {
        if (m.status === 'completed') return m;
        const [scA, scB] = realisticScores[(idx * 7 + 3) % realisticScores.length];
        const winner = scA > scB ? m.teamA_id : m.teamB_id;
        return {
          ...m,
          scoreA: scA,
          scoreB: scB,
          status: 'completed',
          winnerId: winner,
          completedAt: Date.now(),
        };
      })
    );

    // Switch active tab to Standings or Knockout to view results
    setActiveTab('standings');
  }, []);

  // Knockout Mode Toggle
  const setKnockoutMode = useCallback((mode: KnockoutMode) => {
    setSettings((prev) => ({ ...prev, knockoutMode: mode }));
    setKnockoutMatches(initializeKnockoutMatches(mode));
  }, []);

  // Reset Tournament
  const resetTournament = useCallback(() => {
    clearTournamentStorage();
    const newTeams = DEFAULT_TEAMS;
    const newMatches = generateGroupMatches(newTeams);
    const newSettings = { ...DEFAULT_SETTINGS, tournamentStartTime: Date.now() };
    const newKnockout = initializeKnockoutMatches(newSettings.knockoutMode);

    setTeams(newTeams);
    setMatches(newMatches);
    setSettings(newSettings);
    setKnockoutMatches(newKnockout);
    setC1Seconds(420);
    setC1Running(false);
    setC2Seconds(420);
    setC2Running(false);
    setShowPodiumModal(false);
    setActiveTab('courts');
  }, []);

  // Import JSON backup
  const importTournamentJSON = useCallback((jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData) as StoredTournamentState;
      if (parsed && Array.isArray(parsed.teams) && Array.isArray(parsed.matches)) {
        setTeams(parsed.teams);
        setMatches(parsed.matches);
        if (parsed.knockoutMatches) setKnockoutMatches(parsed.knockoutMatches);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.court1TimerSec) setC1Seconds(parsed.court1TimerSec);
        if (parsed.court2TimerSec) setC2Seconds(parsed.court2TimerSec);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }, []);

  // Final Podium calculations
  const finalMatch = knockoutMatches.find((m) => m.id === 'final');
  const isTournamentFinished = Boolean(finalMatch && finalMatch.status === 'completed' && finalMatch.winnerId);

  const championTeam = useMemo(() => {
    if (!finalMatch || !finalMatch.winnerId) return null;
    return teams.find((t) => t.id === finalMatch.winnerId) || null;
  }, [finalMatch, teams]);

  const runnerUpTeam = useMemo(() => {
    if (!finalMatch || !finalMatch.winnerId) return null;
    const loserId = finalMatch.winnerId === finalMatch.teamAId ? finalMatch.teamBId : finalMatch.teamAId;
    return teams.find((t) => t.id === loserId) || null;
  }, [finalMatch, teams]);

  const semiFinalistTeams = useMemo(() => {
    const semis = knockoutMatches.filter((m) => m.stage === 'semi' && m.status === 'completed');
    const losers = semis
      .map((s) => (s.winnerId === s.teamAId ? s.teamBId : s.teamAId))
      .filter((id): id is string => Boolean(id));
    return teams.filter((t) => losers.includes(t.id));
  }, [knockoutMatches, teams]);

  const completedMatchesCount = useMemo(() => {
    return matches.filter((m) => m.status === 'completed').length;
  }, [matches]);

  const totalGroupMatchesCount = matches.length;

  const value: TournamentContextType = {
    teams,
    matches,
    knockoutMatches,
    standings,
    settings,
    activeTab,
    setActiveTab,
    court1Match,
    court1UpNext,
    court2Match,
    court2UpNext,
    court1Timer,
    court2Timer,
    masterSecondsRemaining,
    updateScore,
    quickFinishMatch,
    finishAndAdvanceMatch,
    overrideMatch,
    dispatchToCourt,
    updateTeamName,
    loadStarPlayers,
    loadGroundTeams,
    simulateRemainingGroupMatches,
    setKnockoutMode,
    toggleSound,
    resetTournament,
    importTournamentJSON,
    showPodiumModal,
    setShowPodiumModal,
    championTeam,
    runnerUpTeam,
    semiFinalistTeams,
    isTournamentFinished,
    completedMatchesCount,
    totalGroupMatchesCount,
  };

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
};

export const useTournament = (): TournamentContextType => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
