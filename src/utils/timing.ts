import { Match } from '../types/tournament';

/**
 * Returns epoch timestamp for today at 2:00 PM (14:00:00 local time).
 */
export function getToday2PMTimestamp(): number {
  const now = new Date();
  const today2PM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0, 0);
  return today2PM.getTime();
}

/**
 * Formats epoch timestamp into 12-hour clock string (e.g., "2:00 PM", "2:08 PM").
 */
export function formatClockTime(timestampMs: number): string {
  const d = new Date(timestampMs);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 is 12 AM / 12 PM
  const minStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minStr} ${ampm}`;
}

/**
 * Formats duration in seconds into human readable format (e.g. "12h 5m" or "45m").
 */
export function formatDurationHuman(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}

export interface MatchTimingInfo {
  matchId: string;
  court: 1 | 2;
  courtIndex: number;
  startTimeMs: number;
  endTimeMs: number;
  formattedStartTime: string;
  formattedEndTime: string;
  formattedTimeWindow: string; // e.g. "2:00 PM – 2:07 PM"
  isOverdue: boolean; // match should have ended by now but is not completed
  overdueMinutes: number; // minutes past scheduled end time
  isLateStarting: boolean; // match is scheduled and should have started by now
  lateMinutes: number; // minutes past scheduled start time
}

/**
 * Computes scheduled time window and delay/overdue indicators for all matches.
 * - Court 1 and Court 2 host parallel matches starting at tournamentStartTime.
 * - Each match slot is spaced by slotMinutes (default 8 min: 7 min match + 1 min turnaround).
 */
export function calculateMatchTimings(
  matches: Match[],
  tournamentStartTime: number,
  slotMinutes = 8,
  matchDurationMinutes = 7,
  currentTime = Date.now()
): Map<string, MatchTimingInfo> {
  const timingMap = new Map<string, MatchTimingInfo>();

  const court1Matches = matches.filter((m) => m.court === 1);
  const court2Matches = matches.filter((m) => m.court === 2);

  const processCourt = (courtList: Match[], courtNum: 1 | 2) => {
    courtList.forEach((m, index) => {
      const startTimeMs = tournamentStartTime + index * slotMinutes * 60 * 1000;
      const endTimeMs = startTimeMs + matchDurationMinutes * 60 * 1000;

      const isCompleted = m.status === 'completed';

      // A match is overdue if it is not completed and the current time has passed its scheduled end time
      const isOverdue = !isCompleted && currentTime > endTimeMs;
      const overdueMinutes = isOverdue
        ? Math.max(1, Math.floor((currentTime - endTimeMs) / 60000))
        : 0;

      // A match is late starting if it is still 'scheduled' and current time has passed its start time
      const isLateStarting =
        m.status === 'scheduled' && currentTime > startTimeMs && currentTime <= endTimeMs;
      const lateMinutes = isLateStarting
        ? Math.max(1, Math.floor((currentTime - startTimeMs) / 60000))
        : 0;

      timingMap.set(m.matchId, {
        matchId: m.matchId,
        court: courtNum,
        courtIndex: index,
        startTimeMs,
        endTimeMs,
        formattedStartTime: formatClockTime(startTimeMs),
        formattedEndTime: formatClockTime(endTimeMs),
        formattedTimeWindow: `${formatClockTime(startTimeMs)} – ${formatClockTime(endTimeMs)}`,
        isOverdue,
        overdueMinutes,
        isLateStarting,
        lateMinutes,
      });
    });
  };

  processCourt(court1Matches, 1);
  processCourt(court2Matches, 2);

  return timingMap;
}
