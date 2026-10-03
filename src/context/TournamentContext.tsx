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
  UserRole,
  CloudSyncStatus,
  TournamentClockStatus,
} from '../types/tournament';
import { DEFAULT_TEAMS, PRO_PAIRS_PRESET, DEFAULT_SETTINGS } from '../utils/initialData';
import {
  getToday2PMTimestamp,
  calculateMatchTimings,
  MatchTimingInfo,
} from '../utils/timing';
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
import {
  subscribeToLiveTournament,
  pushTournamentStateToCloud,
  DEFAULT_COACH_KEY,
  DEFAULT_SPECTATOR_KEY,
  CloudTournamentPayload,
} from '../services/firebase';

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

  // Timers & Tournament Clock
  court1Timer: CourtTimerHook;
  court2Timer: CourtTimerHook;
  masterSecondsRemaining: number;
  tournamentClockStatus: TournamentClockStatus;
  secondsUntilStart: number;
  overtimeSeconds: number;
  startTournamentNow: () => void;
  setTournamentStartTime: (newStartTimeMs: number) => void;
  resetTournamentClock: () => void;
  matchTimings: Map<string, MatchTimingInfo>;

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

  // Access Control & Role
  userRole: UserRole;
  isCoach: boolean;
  coachKey: string;
  spectatorKey: string;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  unlockCoachMode: (key: string) => boolean;
  lockCoachMode: () => void;
  updateCoachKey: (newKey: string) => void;

  // Real-time Cloud Sync
  cloudSyncStatus: CloudSyncStatus;
  triggerManualCloudSync: () => Promise<void>;

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
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Access Control State
  const [coachKey, setCoachKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('smashflow_coach_key') || DEFAULT_COACH_KEY;
    }
    return DEFAULT_COACH_KEY;
  });
  const [spectatorKey, setSpectatorKey] = useState<string>(DEFAULT_SPECTATOR_KEY);

  // Determine initial role: Check URL params first (?key=coach2026), then localStorage
  const [userRole, setUserRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const keyFromUrl = urlParams.get('key');
      const savedKey = localStorage.getItem('smashflow_coach_key') || DEFAULT_COACH_KEY;
      if (keyFromUrl && keyFromUrl.trim().toLowerCase() === savedKey.trim().toLowerCase()) {
        localStorage.setItem('smashflow_user_role', 'coach');
        return 'coach';
      }
      const savedRole = localStorage.getItem('smashflow_user_role');
      if (savedRole === 'coach') return 'coach';
    }
    return 'spectator';
  });

  const isCoach = userRole === 'coach';

  // Cloud Sync State
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('synced');
  const lastLocalUpdateTimestamp = useRef<number>(0);
  const versionRef = useRef<number>(1);
  const isIncomingRemoteUpdate = useRef<boolean>(false);

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

  // 1-second clock heartbeat for live master clock, overdue alerts, and time formatting
  const [currentClockTime, setCurrentClockTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentClockTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine current tournament clock status
  const tournamentClockStatus = useMemo<TournamentClockStatus>(() => {
    const isStarted = Boolean(settings.isTournamentStarted) || currentClockTime >= settings.tournamentStartTime;
    if (!isStarted) return 'upcoming';

    const totalDurationMs = settings.targetDurationMinutes * 60 * 1000;
    const elapsedMs = currentClockTime - settings.tournamentStartTime;
    if (elapsedMs > totalDurationMs) return 'overtime';
    return 'running';
  }, [currentClockTime, settings.isTournamentStarted, settings.tournamentStartTime, settings.targetDurationMinutes]);

  // Seconds until tournament start time (0 if already started)
  const secondsUntilStart = useMemo(() => {
    if (settings.isTournamentStarted || currentClockTime >= settings.tournamentStartTime) return 0;
    return Math.max(0, Math.floor((settings.tournamentStartTime - currentClockTime) / 1000));
  }, [currentClockTime, settings.isTournamentStarted, settings.tournamentStartTime]);

  // Tournament Master 3-hour timer: does NOT tick down before tournament start time!
  const masterSecondsRemaining = useMemo(() => {
    const isStarted = Boolean(settings.isTournamentStarted) || currentClockTime >= settings.tournamentStartTime;
    if (!isStarted) {
      // Tournament hasn't started yet! Keep full 3-hour match window intact.
      return settings.targetDurationMinutes * 60;
    }
    const elapsedSeconds = Math.floor((currentClockTime - settings.tournamentStartTime) / 1000);
    const totalDurationSeconds = settings.targetDurationMinutes * 60;
    return Math.max(0, totalDurationSeconds - elapsedSeconds);
  }, [currentClockTime, settings.isTournamentStarted, settings.tournamentStartTime, settings.targetDurationMinutes]);

  // Overtime seconds if tournament exceeds 3 hours
  const overtimeSeconds = useMemo(() => {
    const isStarted = Boolean(settings.isTournamentStarted) || currentClockTime >= settings.tournamentStartTime;
    if (!isStarted) return 0;
    const elapsedSeconds = Math.floor((currentClockTime - settings.tournamentStartTime) / 1000);
    const totalDurationSeconds = settings.targetDurationMinutes * 60;
    if (elapsedSeconds > totalDurationSeconds) {
      return elapsedSeconds - totalDurationSeconds;
    }
    return 0;
  }, [currentClockTime, settings.isTournamentStarted, settings.tournamentStartTime, settings.targetDurationMinutes]);

  // Pre-calculate timing windows and delay/overdue indicators for all fixtures
  const matchTimings = useMemo(() => {
    return calculateMatchTimings(
      matches,
      settings.tournamentStartTime,
      settings.matchSlotMinutes || 8,
      settings.matchTargetDurationMinutes || 7,
      currentClockTime
    );
  }, [
    matches,
    settings.tournamentStartTime,
    settings.matchSlotMinutes,
    settings.matchTargetDurationMinutes,
    currentClockTime,
  ]);

  // Calculate Standings dynamically
  const standings = useMemo(() => {
    return calculateAllStandings(teams, matches, settings.knockoutMode);
  }, [teams, matches, settings.knockoutMode]);

  // Dynamically resolve knockout seeds whenever standings change
  useEffect(() => {
    setKnockoutMatches((prev) => resolveKnockoutSeeds(prev, standings, settings.knockoutMode));
  }, [standings, settings.knockoutMode]);

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

  // Push local updates to Firestore cloud database
  const syncToCloud = useCallback(
    async (overrideData?: Partial<CloudTournamentPayload>) => {
      setCloudSyncStatus('syncing');
      const now = Date.now();
      lastLocalUpdateTimestamp.current = now;
      versionRef.current += 1;

      const payload = {
        teams: overrideData?.teams || teams,
        matches: overrideData?.matches || matches,
        knockoutMatches: overrideData?.knockoutMatches || knockoutMatches,
        settings: overrideData?.settings || settings,
        c1Seconds: overrideData?.c1Seconds ?? c1Seconds,
        c2Seconds: overrideData?.c2Seconds ?? c2Seconds,
        c1Running: overrideData?.c1Running ?? c1Running,
        c2Running: overrideData?.c2Running ?? c2Running,
        coachKey: overrideData?.coachKey || coachKey,
        spectatorKey: overrideData?.spectatorKey || spectatorKey,
        version: versionRef.current,
      };

      const ok = await pushTournamentStateToCloud(payload);
      setCloudSyncStatus(ok ? 'synced' : 'offline');
    },
    [teams, matches, knockoutMatches, settings, c1Seconds, c2Seconds, c1Running, c2Running, coachKey, spectatorKey]
  );

  // Real-time Firestore Cloud Subscription (Listening to changes across all devices)
  useEffect(() => {
    const unsubscribe = subscribeToLiveTournament(
      (cloudData) => {
        // If this update came from another device and is newer than our last local update
        if (cloudData.updatedAt && cloudData.updatedAt > lastLocalUpdateTimestamp.current) {
          isIncomingRemoteUpdate.current = true;
          lastLocalUpdateTimestamp.current = cloudData.updatedAt;
          if (cloudData.version) versionRef.current = cloudData.version;

          if (cloudData.teams) setTeams(cloudData.teams);
          if (cloudData.matches) setMatches(cloudData.matches);
          if (cloudData.knockoutMatches) setKnockoutMatches(cloudData.knockoutMatches);
          if (cloudData.settings) setSettings(cloudData.settings);
          if (typeof cloudData.c1Seconds === 'number') setC1Seconds(cloudData.c1Seconds);
          if (typeof cloudData.c2Seconds === 'number') setC2Seconds(cloudData.c2Seconds);
          if (typeof cloudData.c1Running === 'boolean') setC1Running(cloudData.c1Running);
          if (typeof cloudData.c2Running === 'boolean') setC2Running(cloudData.c2Running);
          if (cloudData.coachKey) setCoachKey(cloudData.coachKey);
          if (cloudData.spectatorKey) setSpectatorKey(cloudData.spectatorKey);

          setCloudSyncStatus('synced');
          setTimeout(() => {
            isIncomingRemoteUpdate.current = false;
          }, 100);
        }
      },
      (err) => {
        console.warn('Firestore live listener offline or reconnecting:', err);
        setCloudSyncStatus('offline');
      }
    );

    return () => unsubscribe();
  }, []);

  // Access Control Helpers
  const unlockCoachMode = useCallback((inputKey: string): boolean => {
    if (inputKey.trim().toLowerCase() === coachKey.trim().toLowerCase()) {
      setUserRole('coach');
      localStorage.setItem('smashflow_user_role', 'coach');
      return true;
    }
    return false;
  }, [coachKey]);

  const lockCoachMode = useCallback(() => {
    setUserRole('spectator');
    localStorage.setItem('smashflow_user_role', 'spectator');
  }, []);

  const updateCoachKey = useCallback((newKey: string) => {
    if (!newKey.trim()) return;
    const cleanKey = newKey.trim();
    setCoachKey(cleanKey);
    localStorage.setItem('smashflow_coach_key', cleanKey);
    syncToCloud({ coachKey: cleanKey });
  }, [syncToCloud]);

  const triggerManualCloudSync = useCallback(async () => {
    await syncToCloud();
  }, [syncToCloud]);

  // Determine Active Court Matches
  const court1Match = useMemo(() => {
    const liveKo = knockoutMatches.find((m) => m.court === 1 && m.status === 'live');
    if (liveKo) return liveKo;
    const liveGroup = matches.find((m) => m.court === 1 && m.status === 'live');
    return liveGroup || null;
  }, [matches, knockoutMatches]);

  const court1UpNext = useMemo(() => {
    const scheduledKo = knockoutMatches.find(
      (m) => m.court === 1 && m.status === 'scheduled' && m.teamAId && m.teamBId
    );
    if (scheduledKo) return scheduledKo;
    const scheduledGroup = matches.find((m) => m.court === 1 && m.status === 'scheduled');
    return scheduledGroup || null;
  }, [matches, knockoutMatches]);

  const court2Match = useMemo(() => {
    const liveKo = knockoutMatches.find((m) => m.court === 2 && m.status === 'live');
    if (liveKo) return liveKo;
    const liveGroup = matches.find((m) => m.court === 2 && m.status === 'live');
    return liveGroup || null;
  }, [matches, knockoutMatches]);

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
      if (!isCoach) {
        setShowAuthModal(true);
        return;
      }
      unlockAudioContext();
      c1WarningBeeped.current = c1Seconds <= 120;
      setC1Running(true);
      syncToCloud({ c1Running: true, c1Seconds });
    },
    pause: () => {
      if (!isCoach) {
        setShowAuthModal(true);
        return;
      }
      setC1Running(false);
      syncToCloud({ c1Running: false, c1Seconds });
    },
    reset: (sec = 420) => {
      if (!isCoach) {
        setShowAuthModal(true);
        return;
      }
      setC1Running(false);
      c1WarningBeeped.current = false;
      setC1Seconds(sec);
      syncToCloud({ c1Running: false, c1Seconds: sec });
    },
    addMinute: () => {
      if (!isCoach) {
        setShowAuthModal(true);
        return;
      }
      setC1Seconds((prev) => {
        const next = prev + 60;
        syncToCloud({ c1Seconds: next });
        return next;
      });
    },
  };

  // Court 2 Timer Hook controls
  const court2Timer: CourtTimerHook = {
    secondsRemaining: c2Seconds,
    isRunning: c2Running,
    start: () => {
      if (!isCoach) {
        setShowAuthModal(true);
        return;
      }
      unlockAudioContext();
      c2WarningBeeped.current = c2Seconds <= 120;
      setC2Running(true);
      syncToCloud({ c2Running: true, c2Seconds });
    },
    pause: () => {
      if (!isCoach) {
        setShowAuthModal(true);
        return;
      }
      setC2Running(false);
      syncToCloud({ c2Running: false, c2Seconds });
    },
    reset: (sec = 420) => {
      if (!isCoach) {
        setShowAuthModal(true);
        return;
      }
      setC2Running(false);
      c2WarningBeeped.current = false;
      setC2Seconds(sec);
      syncToCloud({ c2Running: false, c2Seconds: sec });
    },
    addMinute: () => {
      if (!isCoach) {
        setShowAuthModal(true);
        return;
      }
      setC2Seconds((prev) => {
        const next = prev + 60;
        syncToCloud({ c2Seconds: next });
        return next;
      });
    },
  };

  // Sound Toggle
  const toggleSound = useCallback(() => {
    unlockAudioContext();
    setSettings((prev) => {
      const next = { ...prev, soundEnabled: !prev.soundEnabled };
      syncToCloud({ settings: next });
      return next;
    });
  }, [syncToCloud]);

  // Update Score for a match
  const updateScore = useCallback(
    (matchId: string, team: 'A' | 'B', delta: number) => {
      if (!isCoach) {
        setShowAuthModal(true);
        return;
      }
      unlockAudioContext();

      const isKo = knockoutMatches.some((m) => m.id === matchId);

      if (isKo) {
        setKnockoutMatches((prev) => {
          const next = prev.map((m) => {
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
          });
          syncToCloud({ knockoutMatches: next });
          return next;
        });
      } else {
        // Group match
        setMatches((prev) => {
          const next = prev.map((m) => {
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
          });
          syncToCloud({ matches: next });
          return next;
        });
      }
    },
    [isCoach, knockoutMatches, settings.pointsToWin, settings.soundEnabled, syncToCloud]
  );

  // Quick Finish match (auto-fill 5-3, 5-4, 5-1 etc)
  const quickFinishMatch = useCallback(
    (matchId: string, winnerId: string, winScore = 5, loseScore = 3) => {
      if (!isCoach) {
        setShowAuthModal(true);
        return;
      }
      unlockAudioContext();
      playMatchPointChime(settings.soundEnabled);

      const isKo = knockoutMatches.some((m) => m.id === matchId);

      if (isKo) {
        setKnockoutMatches((prev) => {
          const next = prev.map((m) => {
            if (m.id !== matchId) return m;
            const isWinnerA = m.teamAId === winnerId;
            return {
              ...m,
              scoreA: isWinnerA ? winScore : loseScore,
              scoreB: isWinnerA ? loseScore : winScore,
              winnerId,
            };
          });
          syncToCloud({ knockoutMatches: next });
          return next;
        });
      } else {
        setMatches((prev) => {
          const next = prev.map((m) => {
            if (m.matchId !== matchId) return m;
            const isWinnerA = m.teamA_id === winnerId;
            return {
              ...m,
              scoreA: isWinnerA ? winScore : loseScore,
              scoreB: isWinnerA ? loseScore : winScore,
              winnerId,
            };
          });
          syncToCloud({ matches: next });
          return next;
        });
      }
    },
    [isCoach, knockoutMatches, settings.soundEnabled, syncToCloud]
  );

  // Finish match, mark completed, and advance next queued match on that court
  const finishAndAdvanceMatch = useCallback(
    (matchId: string): { success: boolean; error?: string } => {
      if (!isCoach) {
        setShowAuthModal(true);
        return { success: false, error: 'Coach / Editor Access Required to finish matches' };
      }
      unlockAudioContext();

      const isKo = knockoutMatches.some((m) => m.id === matchId);

      if (isKo) {
        const targetKo = knockoutMatches.find((m) => m.id === matchId);
        if (!targetKo) return { success: false, error: 'Match not found' };

        if (targetKo.scoreA === targetKo.scoreB) {
          return {
            success: false,
            error: 'Cannot complete tied match! Badminton requires a winner (sudden death at 4-4).',
          };
        }

        const winnerId = targetKo.scoreA > targetKo.scoreB ? targetKo.teamAId : targetKo.teamBId;
        const courtNumber = targetKo.court;

        let nextKoMatches: KnockoutMatch[] = [];
        setKnockoutMatches((prev) => {
          nextKoMatches = prev.map((m) => {
            if (m.id === matchId) {
              return {
                ...m,
                status: 'completed',
                winnerId,
              };
            }
            return m;
          });

          // If Grand Final was completed, celebration!
          if (matchId === 'final' && winnerId) {
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
            playPodiumFanfare(settings.soundEnabled);
            setShowPodiumModal(true);
          }

          // Advance next queued match on this court
          const nextScheduledKo = nextKoMatches.find(
            (m) => m.court === courtNumber && m.status === 'scheduled' && m.teamAId && m.teamBId
          );
          if (nextScheduledKo) {
            nextKoMatches = nextKoMatches.map((m) =>
              m.id === nextScheduledKo.id ? { ...m, status: 'live' } : m
            );
          }

          syncToCloud({ knockoutMatches: nextKoMatches });
          return nextKoMatches;
        });

        if (courtNumber === 1) court1Timer.reset(420);
        if (courtNumber === 2) court2Timer.reset(420);

        return { success: true };
      } else {
        // Group match
        const targetGroup = matches.find((m) => m.matchId === matchId);
        if (!targetGroup) return { success: false, error: 'Match not found' };

        if (targetGroup.scoreA === targetGroup.scoreB) {
          return {
            success: false,
            error: 'Cannot complete tied match! Badminton requires a winner (first to 5).',
          };
        }

        const winnerId = targetGroup.scoreA > targetGroup.scoreB ? targetGroup.teamA_id : targetGroup.teamB_id;
        const courtNumber = targetGroup.court;

        setMatches((prev) => {
          let updatedMatches = prev.map((m) => {
            if (m.matchId === matchId) {
              return {
                ...m,
                status: 'completed' as const,
                winnerId,
                completedAt: Date.now(),
              };
            }
            return m;
          });

          // Check if there are scheduled matches on this court
          const nextScheduledGroup = updatedMatches.find(
            (m) => m.court === courtNumber && m.status === 'scheduled'
          );

          if (nextScheduledGroup) {
            updatedMatches = updatedMatches.map((m) =>
              m.matchId === nextScheduledGroup.matchId
                ? { ...m, status: 'live' as const, startedAt: Date.now() }
                : m
            );
          }

          syncToCloud({ matches: updatedMatches });
          return updatedMatches;
        });

        // Reset the timer for that court to 7:00
        if (courtNumber === 1) court1Timer.reset(420);
        if (courtNumber === 2) court2Timer.reset(420);

        return { success: true };
      }
    },
    [isCoach, knockoutMatches, matches, settings.soundEnabled, syncToCloud]
  );

  // Manual Match Override from Modal
  const overrideMatch = useCallback(
    (
      matchId: string,
      updates: Partial<Match> & { scoreA?: number; scoreB?: number; status?: Match['status']; winnerId?: string | null; court?: 1 | 2 }
    ) => {
      if (!isCoach) {
        setShowAuthModal(true);
        return;
      }
      const isKo = knockoutMatches.some((m) => m.id === matchId);
      if (isKo) {
        setKnockoutMatches((prev) => {
          const next = prev.map((m) => (m.id === matchId ? ({ ...m, ...updates } as KnockoutMatch) : m));
          syncToCloud({ knockoutMatches: next });
          return next;
        });
      } else {
        setMatches((prev) => {
          const next = prev.map((m) => (m.matchId === matchId ? { ...m, ...updates } : m));
          syncToCloud({ matches: next });
          return next;
        });
      }
    },
    [isCoach, knockoutMatches, syncToCloud]
  );

  // Dispatch a specific match to a court
  const dispatchToCourt = useCallback(
    (matchId: string, court: 1 | 2) => {
      if (!isCoach) {
        setShowAuthModal(true);
        return;
      }
      const isKo = knockoutMatches.some((m) => m.id === matchId);
      if (isKo) {
        setKnockoutMatches((prev) => {
          const next = prev.map((m) => {
            if (m.id === matchId) return { ...m, court, status: 'live' as const };
            if (m.court === court && m.status === 'live') return { ...m, status: 'scheduled' as const };
            return m;
          });
          syncToCloud({ knockoutMatches: next });
          return next;
        });
      } else {
        setMatches((prev) => {
          const next = prev.map((m) => {
            if (m.matchId === matchId) return { ...m, court, status: 'live' as const };
            if (m.court === court && m.status === 'live') return { ...m, status: 'scheduled' as const };
            return m;
          });
          syncToCloud({ matches: next });
          return next;
        });
      }
    },
    [isCoach, knockoutMatches, syncToCloud]
  );

  // Update Team Name
  const updateTeamName = useCallback(
    (teamId: string, newName: string) => {
      if (!isCoach) {
        setShowAuthModal(true);
        return;
      }
      setTeams((prev) => {
        const next = prev.map((t) => (t.id === teamId ? { ...t, name: newName } : t));
        syncToCloud({ teams: next });
        return next;
      });
    },
    [isCoach, syncToCloud]
  );

  // Load Star Badminton Pairs Preset
  const loadStarPlayers = useCallback(() => {
    if (!isCoach) {
      setShowAuthModal(true);
      return;
    }
    setTeams((prev) => {
      const next = prev.map((t) => {
        const found = PRO_PAIRS_PRESET.find((p) => p.id === t.id);
        return found ? { ...t, name: found.name } : t;
      });
      syncToCloud({ teams: next });
      return next;
    });
  }, [isCoach, syncToCloud]);

  // Load Ground Tournament Teams
  const loadGroundTeams = useCallback(() => {
    if (!isCoach) {
      setShowAuthModal(true);
      return;
    }
    setTeams(DEFAULT_TEAMS);
    syncToCloud({ teams: DEFAULT_TEAMS });
  }, [isCoach, syncToCloud]);

  // Fast Simulate Remaining Group Stage Matches
  const simulateRemainingGroupMatches = useCallback(() => {
    if (!isCoach) {
      setShowAuthModal(true);
      return;
    }
    unlockAudioContext();
    const realisticScores = [
      [5, 3],
      [5, 4],
      [5, 2],
      [5, 1],
      [5, 0],
      [3, 5],
      [4, 5],
      [2, 5],
    ];

    setMatches((prev) => {
      const next = prev.map((m, idx) => {
        if (m.status === 'completed') return m;
        const [scA, scB] = realisticScores[idx % realisticScores.length];
        const winnerId = scA > scB ? m.teamA_id : m.teamB_id;
        return {
          ...m,
          scoreA: scA,
          scoreB: scB,
          status: 'completed' as const,
          winnerId,
          completedAt: Date.now(),
        };
      });
      syncToCloud({ matches: next });
      return next;
    });
  }, [isCoach, syncToCloud]);

  // Set Knockout Mode
  const setKnockoutMode = useCallback(
    (mode: KnockoutMode) => {
      if (!isCoach) {
        setShowAuthModal(true);
        return;
      }
      setSettings((prev) => {
        const next = { ...prev, knockoutMode: mode };
        const initializedKo = initializeKnockoutMatches(mode);
        const resolvedKo = resolveKnockoutSeeds(initializedKo, standings, mode);
        setKnockoutMatches(resolvedKo);
        syncToCloud({ settings: next, knockoutMatches: resolvedKo });
        return next;
      });
    },
    [isCoach, standings, syncToCloud]
  );

  // Reset Tournament
  const resetTournament = useCallback(() => {
    if (!isCoach) {
      setShowAuthModal(true);
      return;
    }
    clearTournamentStorage();
    const freshMatches = generateGroupMatches(DEFAULT_TEAMS);
    const freshKo = initializeKnockoutMatches(DEFAULT_SETTINGS.knockoutMode);
    setTeams(DEFAULT_TEAMS);
    setMatches(freshMatches);
    setKnockoutMatches(freshKo);
    setSettings(DEFAULT_SETTINGS);
    setC1Seconds(420);
    setC2Seconds(420);
    setC1Running(false);
    setC2Running(false);
    setShowPodiumModal(false);

    syncToCloud({
      teams: DEFAULT_TEAMS,
      matches: freshMatches,
      knockoutMatches: freshKo,
      settings: DEFAULT_SETTINGS,
      c1Seconds: 420,
      c2Seconds: 420,
      c1Running: false,
      c2Running: false,
    });
  }, [isCoach, syncToCloud]);

  // Import JSON State
  const importTournamentJSON = useCallback(
    (jsonData: string): boolean => {
      if (!isCoach) {
        setShowAuthModal(true);
        return false;
      }
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed.teams && parsed.matches && parsed.knockoutMatches) {
          setTeams(parsed.teams);
          setMatches(parsed.matches);
          setKnockoutMatches(parsed.knockoutMatches);
          if (parsed.settings) setSettings(parsed.settings);
          syncToCloud({
            teams: parsed.teams,
            matches: parsed.matches,
            knockoutMatches: parsed.knockoutMatches,
            settings: parsed.settings || settings,
          });
          return true;
        }
        return false;
      } catch (err) {
        console.error('Import parse error:', err);
        return false;
      }
    },
    [isCoach, settings, syncToCloud]
  );

  // Derived tournament statistics
  const completedMatchesCount = useMemo(() => {
    return matches.filter((m) => m.status === 'completed').length;
  }, [matches]);

  const totalGroupMatchesCount = matches.length;

  // Podium Winners calculation
  const finalMatch = useMemo(() => {
    return knockoutMatches.find((m) => m.stage === 'final');
  }, [knockoutMatches]);

  const isTournamentFinished = Boolean(
    finalMatch && finalMatch.status === 'completed' && finalMatch.winnerId
  );

  const championTeam = useMemo(() => {
    if (!isTournamentFinished || !finalMatch?.winnerId) return null;
    return teams.find((t) => t.id === finalMatch.winnerId) || null;
  }, [isTournamentFinished, finalMatch, teams]);

  const runnerUpTeam = useMemo(() => {
    if (!isTournamentFinished || !finalMatch) return null;
    const runnerUpId =
      finalMatch.winnerId === finalMatch.teamAId ? finalMatch.teamBId : finalMatch.teamAId;
    return teams.find((t) => t.id === runnerUpId) || null;
  }, [isTournamentFinished, finalMatch, teams]);

  const semiFinalistTeams = useMemo(() => {
    const semiMatches = knockoutMatches.filter((m) => m.stage === 'semi');
    const losers: string[] = [];
    semiMatches.forEach((sm) => {
      if (sm.status === 'completed' && sm.winnerId) {
        const loserId = sm.winnerId === sm.teamAId ? sm.teamBId : sm.teamAId;
        if (loserId) losers.push(loserId);
      }
    });
    return teams.filter((t) => losers.includes(t.id));
  }, [knockoutMatches, teams]);

  // Tournament Clock Controls
  const startTournamentNow = useCallback(() => {
    if (!isCoach) {
      setShowAuthModal(true);
      return;
    }
    const now = Date.now();
    const updatedSettings: TournamentSettings = {
      ...settings,
      tournamentStartTime: now,
      isTournamentStarted: true,
    };
    setSettings(updatedSettings);
    syncToCloud({ settings: updatedSettings });
  }, [isCoach, settings, syncToCloud]);

  const setTournamentStartTime = useCallback(
    (newStartTimeMs: number) => {
      if (!isCoach) {
        setShowAuthModal(true);
        return;
      }
      const updatedSettings: TournamentSettings = {
        ...settings,
        tournamentStartTime: newStartTimeMs,
        isTournamentStarted: Date.now() >= newStartTimeMs,
      };
      setSettings(updatedSettings);
      syncToCloud({ settings: updatedSettings });
    },
    [isCoach, settings, syncToCloud]
  );

  const resetTournamentClock = useCallback(() => {
    if (!isCoach) {
      setShowAuthModal(true);
      return;
    }
    const today2PM = getToday2PMTimestamp();
    const updatedSettings: TournamentSettings = {
      ...settings,
      tournamentStartTime: today2PM,
      isTournamentStarted: false,
    };
    setSettings(updatedSettings);
    syncToCloud({ settings: updatedSettings });
  }, [isCoach, settings, syncToCloud]);

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
    tournamentClockStatus,
    secondsUntilStart,
    overtimeSeconds,
    startTournamentNow,
    setTournamentStartTime,
    resetTournamentClock,
    matchTimings,
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
    userRole,
    isCoach,
    coachKey,
    spectatorKey,
    showAuthModal,
    setShowAuthModal,
    unlockCoachMode,
    lockCoachMode,
    updateCoachKey,
    cloudSyncStatus,
    triggerManualCloudSync,
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
