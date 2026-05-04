/**
 * Firestore client for Next.js server components (Layer 4 — public SEO pages).
 *
 * Uses `firebase/firestore/lite` — same Firestore wire protocol but no
 * realtime listeners and a much smaller bundle, suitable for server
 * rendering where we just need one-shot reads.
 *
 * The reads here go to Firestore as anonymous, so the collections
 * accessed (artists, collectibles, seasons) MUST have
 * `allow read: if true;` in `firestore.rules`. Anything else fails
 * permission-denied at request time and the page surfaces a 404 / error.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore as getLiteFirestore,
  type Firestore as LiteFirestore,
} from "firebase/firestore/lite";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Use a separate Firebase app instance for server reads so it doesn't
// collide with the browser-side `firebaseApp` (which sets up Auth /
// Storage / Functions). The `[server]` name is arbitrary.
const SERVER_APP_NAME = "[server]";

function _getServerApp(): FirebaseApp {
  const existing = getApps().find((a) => a.name === SERVER_APP_NAME);
  if (existing) return existing;
  return initializeApp(firebaseConfig, SERVER_APP_NAME);
}

let _dbInstance: LiteFirestore | null = null;

export function getServerDb(): LiteFirestore {
  if (_dbInstance) return _dbInstance;
  _dbInstance = getLiteFirestore(_getServerApp());
  return _dbInstance;
}
