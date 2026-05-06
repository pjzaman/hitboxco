import type { FirestoreDate } from "./firestore";

/**
 * Hitbox platform user. Mirrors `hb/lib/models/user.dart`.
 *
 * Firestore: `users/{uid}` — doc id equals the Firebase Auth uid.
 */
export interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  avatarUrl?: string | null;

  createdAt?: FirestoreDate | null;
  lastLoginAt?: FirestoreDate | null;

  // Gamification
  xp: number;
  level: number;
  currentSeasonXP: number;

  // Premium & status
  isPremium: boolean;
  premiumExpiresAt?: FirestoreDate | null;
  isVerified: boolean;

  // Stats
  totalItems: number;
  completedSets: number;
  tradesCompleted: number;

  // Social
  followersCount: number;
  followingCount: number;

  settings: UserSettings;
  favoriteArtists: string[];

  fcmToken?: string | null;

  badges: UserBadge[];

  referralCode: string;
  referredBy?: string | null;

  loginStreak: number;

  spotifyConnected: boolean;
  appleMusicConnected: boolean;
}

export interface UserSettings {
  notificationsEnabled: boolean;
  darkMode: boolean;
  publicProfile: boolean;
  language?: string | null;
}

export interface UserBadge {
  name: string;
  icon?: string | null;
  description?: string | null;
  earnedAt?: FirestoreDate | null;
}

export const defaultUserSettings: UserSettings = {
  notificationsEnabled: true,
  darkMode: false,
  publicProfile: true,
  language: null,
};
