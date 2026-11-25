import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import {
  doc,
  Firestore,
  getDocFromServer,
  getFirestore,
} from 'firebase/firestore';
import firebaseAppletConfig from '../../../firebase-applet-config.json';
import { FirebaseConfigRequirements } from '../../types/domain';
import { resolveFirebaseAuthDomain } from '../../utils/googleAuthFlow';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function getFirebaseConfigStatus(): FirebaseConfigRequirements {
  const isConfigured = Boolean(
    firebaseAppletConfig.apiKey &&
      firebaseAppletConfig.projectId &&
      firebaseAppletConfig.appId
  );

  return {
    isConfigured,
    missingKeys: isConfigured ? [] : ['firebase-applet-config.json'],
    projectId: firebaseAppletConfig.projectId || null,
    firestoreDatabaseId: firebaseAppletConfig.firestoreDatabaseId || null,
    servicesReady: {
      auth: isConfigured,
      firestore: isConfigured,
      storage: false,
      functions: false,
    },
  };
}

export interface FirebaseClients {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  status: FirebaseConfigRequirements;
}

const effectiveAuthDomain = resolveFirebaseAuthDomain(
  typeof window !== 'undefined' ? window.location : null,
  firebaseAppletConfig.authDomain || ''
);

const runtimeFirebaseConfig = {
  ...firebaseAppletConfig,
  authDomain: effectiveAuthDomain,
};

const existingApps = getApps();
export const firebaseApp: FirebaseApp =
  existingApps.length > 0
    ? existingApps[0]
    : initializeApp(runtimeFirebaseConfig);

export const auth: Auth = getAuth(firebaseApp);
if (typeof window !== 'undefined') {
  void setPersistence(auth, browserLocalPersistence).catch(() => {
    // Fallback to Firebase default persistence in restricted storage environments
  });
}
export const db: Firestore = getFirestore(
  firebaseApp,
  firebaseAppletConfig.firestoreDatabaseId
);

let connectionTested = false;

export async function testFirestoreConnection(): Promise<void> {
  if (connectionTested) return;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Run startup connection check automatically per firebase-integration-rpc guidelines
void testFirestoreConnection();

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getFirebaseClients(): FirebaseClients {
  return {
    app: firebaseApp,
    auth,
    db,
    status: getFirebaseConfigStatus(),
  };
}
