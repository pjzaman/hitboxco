import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAuth as fbGetAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFunctions, type Functions } from "firebase/functions";

/**
 * Firebase web client — lazy initialized.
 *
 * Why lazy: Next.js evaluates module imports during server-side rendering
 * (including build-time static page generation) even for "use client"
 * components. Calling `initializeApp` at module load means the build
 * crashes with `auth/invalid-api-key` if env vars aren't yet present —
 * e.g. on Vercel before the env vars propagate, or when the layout chain
 * pulls in the AuthProvider during static generation of the not-found
 * page. Deferring init to first access keeps build-time SSR clean and
 * surfaces config errors at the call site instead of at compile.
 *
 * The module still exports `auth`, `db`, `storage`, `functions`, and
 * `firebaseApp` as before — they're now thin Proxies that initialize on
 * first property access.
 */

function _readConfig(): FirebaseOptions {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;
let _storage: FirebaseStorage | undefined;
let _functions: Functions | undefined;

function _getApp(): FirebaseApp {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApp();
    return _app;
  }
  const config = _readConfig();
  // Validate at first use — gives a clearer error than Firebase's
  // generic `auth/invalid-api-key` if env vars are absent.
  if (!config.apiKey || !config.projectId || !config.appId) {
    throw new Error(
      "Firebase web config missing. Set NEXT_PUBLIC_FIREBASE_API_KEY / " +
        "PROJECT_ID / APP_ID (and the rest) in Vercel → Project → " +
        "Settings → Environment Variables for the matching scope " +
        "(Production / Preview / Development), then redeploy.",
    );
  }
  _app = initializeApp(config);
  return _app;
}

function _lazy<T extends object>(getter: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const real = getter();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (real as any)[prop];
      return typeof value === "function" ? value.bind(real) : value;
    },
    has(_target, prop) {
      return prop in (getter() as object);
    },
    getPrototypeOf() {
      return Object.getPrototypeOf(getter());
    },
  });
}

export const firebaseApp: FirebaseApp = _lazy(_getApp);

export const auth: Auth = _lazy(() => {
  if (!_auth) _auth = fbGetAuth(_getApp());
  return _auth;
});

export const db: Firestore = _lazy(() => {
  if (!_db) _db = getFirestore(_getApp());
  return _db;
});

export const storage: FirebaseStorage = _lazy(() => {
  if (!_storage) _storage = getStorage(_getApp());
  return _storage;
});

export const functions: Functions = _lazy(() => {
  if (!_functions) _functions = getFunctions(_getApp());
  return _functions;
});
