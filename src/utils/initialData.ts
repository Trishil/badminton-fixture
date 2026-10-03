import { Team, TournamentSettings, GroupId } from '../types/tournament';

export const DEFAULT_TEAMS: Team[] = [
  // Pool A (T1 to T5)
  { id: 'T1', name: 'Team 1 (Player A & Player B)', group: 'A', seed: 1 },
  { id: 'T2', name: 'Team 2 (Player C & Player D)', group: 'A', seed: 2 },
  { id: 'T3', name: 'Team 3 (Player E & Player F)', group: 'A', seed: 3 },
  { id: 'T4', name: 'Team 4 (Player G & Player H)', group: 'A', seed: 4 },
  { id: 'T5', name: 'Team 5 (Player I & Player J)', group: 'A', seed: 5 },

  // Pool B (T6 to T10)
  { id: 'T6', name: 'Team 6 (Player K & Player L)', group: 'B', seed: 1 },
  { id: 'T7', name: 'Team 7 (Player M & Player N)', group: 'B', seed: 2 },
  { id: 'T8', name: 'Team 8 (Player O & Player P)', group: 'B', seed: 3 },
  { id: 'T9', name: 'Team 9 (Player Q & Player R)', group: 'B', seed: 4 },
  { id: 'T10', name: 'Team 10 (Player S & Player T)', group: 'B', seed: 5 },

  // Pool C (T11 to T15)
  { id: 'T11', name: 'Team 11 (Player U & Player V)', group: 'C', seed: 1 },
  { id: 'T12', name: 'Team 12 (Player W & Player X)', group: 'C', seed: 2 },
  { id: 'T13', name: 'Team 13 (Player Y & Player Z)', group: 'C', seed: 3 },
  { id: 'T14', name: 'Team 14 (Player AA & Player BB)', group: 'C', seed: 4 },
  { id: 'T15', name: 'Team 15 (Player CC & Player DD)', group: 'C', seed: 5 },

  // Pool D (T16 to T20)
  { id: 'T16', name: 'Team 16 (Player EE & Player FF)', group: 'D', seed: 1 },
  { id: 'T17', name: 'Team 17 (Player GG & Player HH)', group: 'D', seed: 2 },
  { id: 'T18', name: 'Team 18 (Player II & Player JJ)', group: 'D', seed: 3 },
  { id: 'T19', name: 'Team 19 (Player KK & Player LL)', group: 'D', seed: 4 },
  { id: 'T20', name: 'Team 20 (Player MM & Player NN)', group: 'D', seed: 5 },
];

export const PRO_PAIRS_PRESET: Array<{ id: string; name: string; group: GroupId }> = [
  // Pool A
  { id: 'T1', name: 'Ahsan & Setiawan (INA)', group: 'A' },
  { id: 'T2', name: 'Rankireddy & Shetty (IND)', group: 'A' },
  { id: 'T3', name: 'Chia & Soh W.Y. (MAS)', group: 'A' },
  { id: 'T4', name: 'Lane & Vendy (ENG)', group: 'A' },
  { id: 'T5', name: 'Kjaer & Soegaard (DEN)', group: 'A' },

  // Pool B
  { id: 'T6', name: 'Liang W.K. & Wang C. (CHN)', group: 'B' },
  { id: 'T7', name: 'Kang M.H. & Seo S.J. (KOR)', group: 'B' },
  { id: 'T8', name: 'Astrup & Rasmussen (DEN)', group: 'B' },
  { id: 'T9', name: 'Carnando & Marthin (INA)', group: 'B' },
  { id: 'T10', name: 'Man W.C. & Tee K.W. (MAS)', group: 'B' },

  // Pool C
  { id: 'T11', name: 'Hoki & Kobayashi (JPN)', group: 'C' },
  { id: 'T12', name: 'Alfian & Ardianto (INA)', group: 'C' },
  { id: 'T13', name: 'Ong Y.S. & Teo E.Y. (MAS)', group: 'C' },
  { id: 'T14', name: 'Lu C.Y. & Yang P. (TPE)', group: 'C' },
  { id: 'T15', name: 'Gutti & Ponnappa (IND)', group: 'C' },

  // Pool D
  { id: 'T16', name: 'Lee Y. & Wang C.L. (TPE)', group: 'D' },
  { id: 'T17', name: 'Matsutomo & Takahashi (JPN)', group: 'D' },
  { id: 'T18', name: 'Polii & Rahayu (INA)', group: 'D' },
  { id: 'T19', name: 'Fukushima & Hirota (JPN)', group: 'D' },
  { id: 'T20', name: 'Kusumawardana & Rambitan (INA)', group: 'D' },
];

export const DEFAULT_SETTINGS: TournamentSettings = {
  tournamentStartTime: Date.now(),
  targetDurationMinutes: 180, // 3 hours total tournament window
  matchTargetDurationMinutes: 7, // 7 min countdown
  pointsToWin: 5,
  suddenDeathAt: 4,
  knockoutMode: 'top1_semis',
  soundEnabled: true,
};
