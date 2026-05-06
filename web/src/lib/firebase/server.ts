/**
 * Firestore client for Next.js server components (Layer 4 — public SEO pages).
 *
 * Uses the full `firebase/firestore` SDK (same as the browser client) on a
 * separate Firebase app instance. We previously used `firebase/firestore/lite`
 * here, but mixing both SDKs in the same Next.js bundle caused a
 * known SDK-collision class of bug — the lite SDK's internal serializer
 * disagrees with the full SDK's Timestamp/DocumentReference types when a
 * doc reference flows from one half of the app to the other. Standardizing
 * on the full SDK across server+client is what the hardening doc calls
 * for. The bundle cost is acceptable; reads here are still one-shot.
 *
 * The reads here go to Firestore as anonymous, so the collections
 * accessed (artists, collectibles, seasons) MUST have
 * `allow read: if true;` in `firestore.rules`. Anything else fails
 * permission-denied at request time and the page surfaces a 404 / error.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

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

let _dbInstance: Firestore | null = null;

export function getServerDb(): Firestore {
  if (_dbInstance) return _dbInstance;
  _dbInstance = getFirestore(_getServerApp());
  return _dbInstance;
}
