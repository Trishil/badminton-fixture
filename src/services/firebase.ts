import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { Team, Match, KnockoutMatch, TournamentSettings } from '../types/tournament';

// Firebase configuration using active Firestore database
export const FIREBASE_CONFIG = {
  projectId: "excellent-nexus-442111-t5",
  appId: "1:735454245560:web:07d7ddac587a68210dba4d",
  apiKey: "AIzaSyD5QcxLwAL7xJk3GE5VgTruh-rvzlDcFpE",
  authDomain: "excellent-nexus-442111-t5.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-udhnafactorydash-31767b26-11ea-4815-88ba-bc2f32b7296a",
};

// Default tournament access keys
export const DEFAULT_COACH_KEY = 'coach2026';
export const DEFAULT_SPECTATOR_KEY = 'spectator';

// Document path in Firestore
export const TOURNAMENT_COLLECTION = 'workflow_designs';
export const TOURNAMENT_DOC_ID = 'smashflow_badminton_live_state';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();

// Initialize Anonymous Auth so Firestore permissions work seamlessly
export const auth = getAuth(app);
signInAnonymously(auth).catch((err) => {
  console.warn('Anonymous auth note:', err);
});

// Initialize Firestore
export const db = getFirestore(app, FIREBASE_CONFIG.firestoreDatabaseId);

export interface CloudTournamentPayload {
  teams: Team[];
  matches: Match[];
  knockoutMatches: KnockoutMatch[];
  settings: TournamentSettings;
  c1Seconds: number;
  c2Seconds: number;
  c1Running: boolean;
  c2Running: boolean;
  coachKey: string;
  spectatorKey: string;
  updatedAt: number;
  version: number;
}

/**
 * Subscribe to real-time tournament state changes from Firestore
 */
export function subscribeToLiveTournament(
  onUpdate: (data: CloudTournamentPayload) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, TOURNAMENT_COLLECTION, TOURNAMENT_DOC_ID);
  
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CloudTournamentPayload;
        if (data && data.teams && data.matches) {
          onUpdate(data);
        }
      }
    },
    (err) => {
      console.warn('Live tournament subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Push updated tournament state to Firestore
 */
export async function pushTournamentStateToCloud(
  payload: Omit<CloudTournamentPayload, 'updatedAt' | 'version'> & { version?: number }
): Promise<boolean> {
  try {
    const docRef = doc(db, TOURNAMENT_COLLECTION, TOURNAMENT_DOC_ID);
    const dataToSave: CloudTournamentPayload = {
      ...payload,
      updatedAt: Date.now(),
      version: (payload.version || 0) + 1,
    };
    await setDoc(docRef, dataToSave, { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to sync tournament to cloud:', err);
    return false;
  }
}

/**
 * Fetch initial cloud state once
 */
export async function fetchLiveTournamentOnce(): Promise<CloudTournamentPayload | null> {
  try {
    const docRef = doc(db, TOURNAMENT_COLLECTION, TOURNAMENT_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as CloudTournamentPayload;
    }
    return null;
  } catch (err) {
    console.warn('Initial cloud fetch note:', err);
    return null;
  }
}
