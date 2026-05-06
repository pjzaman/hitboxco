import {
  Firestore,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { User as FirebaseAuthUser } from "firebase/auth";
import { db } from "@/lib/firebase/client";
import { Collections } from "@/lib/firebase/collections";
import { defaultUserSettings, type User } from "@/lib/types";

/**
 * Mirrors `hb/lib/services/user_service.dart` and the user-doc seed
 * logic in `hb/lib/auth.dart`.
 *
 * The Firestore `users/{uid}` doc is the canonical app-side user
 * record. Firebase Auth holds the credential; this collection holds
 * everything else — gamification state, social counts, preferences,
 * etc. The shape must match what Flutter writes via `User.toJson()`
 * so both clients can read each other's docs without translation.
 */

const USERS = Collections.users;

/**
 * Read a user doc. Returns null if it doesn't exist or on permission error.
 */
export async function getUser(
  uid: string,
  database: Firestore = db,
): Promise<User | null> {
  try {
    const ref = doc(database, USERS, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<User, "id">) };
  } catch {
    return null;
  }
}

/**
 * If `users/{uid}` is missing, create it with sensible defaults seeded
 * from the Firebase Auth profile. Idempotent — safe to call after every
 * sign-in / sign-up. Mirrors `AuthService.ensureUserDocument` in
 * `hb/lib/auth.dart`.
 *
 * Failures are non-fatal: the user can still browse the app, and the
 * doc will be retried on the next sign-in.
 */
export async function ensureUserDocument(
  authUser: FirebaseAuthUser,
  database: Firestore = db,
): Promise<void> {
  try {
    const ref = doc(database, USERS, authUser.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return;

    const seed: Omit<User, "id" | "createdAt" | "lastLoginAt"> & {
      createdAt: ReturnType<typeof serverTimestamp>;
      lastLoginAt: ReturnType<typeof serverTimestamp>;
    } = {
      uid: authUser.uid,
      email: authUser.email ?? "",
      displayName: authUser.displayName ?? authUser.email ?? "User",
      photoURL: authUser.photoURL ?? null,
      avatarUrl: null,

      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),

      xp: 0,
      level: 1,
      currentSeasonXP: 0,

      isPremium: false,
      premiumExpiresAt: null,
      isVerified: false,

      totalItems: 0,
      completedSets: 0,
      tradesCompleted: 0,

      followersCount: 0,
      followingCount: 0,

      settings: defaultUserSettings,
      favoriteArtists: [],

      fcmToken: null,
      badges: [],

      referralCode: "",
      referredBy: null,
      loginStreak: 0,

      spotifyConnected: false,
      appleMusicConnected: false,
    };

    await setDoc(ref, seed);
  } catch (err) {
    // Non-fatal: log and move on. Mirrors Flutter behavior.
    console.warn("ensureUserDocument failed:", err);
  }
}
