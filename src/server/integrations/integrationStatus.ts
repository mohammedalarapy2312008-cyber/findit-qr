import fs from 'node:fs';
import path from 'node:path';
import {
  COVER_LIBRARY_CATALOG,
  FALLBACK_LIBRARY_COVERS,
  GROUP_LIBRARY_COVERS,
  ITEM_LIBRARY_COVERS,
} from '../../data/coverLibraryCatalog';
import { CloudStorageStatus, getPermanentStorageStatus } from './cloudStorageAdapter';
import { getEmailIntegrationStatus } from './emailService';
import { getGeminiIntegrationStatus } from './geminiService';
import { ALLOWED_IMAGE_MIME_TYPES, ALLOWED_MEDIA_FOLDERS, MAX_MEDIA_UPLOAD_BYTES } from './mediaStorageService';
import { getWhatsAppIntegrationStatus } from './whatsappService';

export interface IntegrationsHealthSnapshot {
  checkedAt: string;
  gemini: ReturnType<typeof getGeminiIntegrationStatus>;
  coverLibrary: {
    active: boolean;
    total: number;
    items: number;
    groups: number;
    fallbacks: number;
    smartMatchingActive: boolean;
    zeroPerItemGeminiCalls: boolean;
  };
  firebaseAuth: {
    configured: boolean;
    projectId: string | null;
    authDomain: string | null;
    sameOriginProxyActive: boolean;
    googleSignInReady: boolean;
  };
  firestore: {
    configured: boolean;
    projectId: string | null;
    databaseId: string | null;
    rulesFilePresent: boolean;
    blueprintPresent: boolean;
  };
  cloudStorage: CloudStorageStatus;
  mediaUpload: {
    active: boolean;
    maxBytes: number;
    allowedMimeTypes: readonly string[];
    magicByteValidation: boolean;
    privateAccessControl: boolean;
    folders: readonly string[];
  };
  email: ReturnType<typeof getEmailIntegrationStatus>;
  whatsapp: ReturnType<typeof getWhatsAppIntegrationStatus>;
  serverEnv: {
    appUrlConfigured: boolean;
    adminEmailConfigured: boolean;
    secretsIsolatedServerSide: boolean;
  };
}

interface FirebaseAppletConfigShape {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  appId?: string;
  firestoreDatabaseId?: string;
  oAuthClientId?: string;
}

function readFirebaseAppletConfig(cwd: string): FirebaseAppletConfigShape {
  try {
    const filePath = path.resolve(cwd, 'firebase-applet-config.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as FirebaseAppletConfigShape;
    }
  } catch {
    // ignore malformed or missing file
  }
  return {};
}

export function buildIntegrationsHealthSnapshot(options?: {
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  configuredAdminEmail?: string;
}): IntegrationsHealthSnapshot {
  const env = options?.env ?? process.env;
  const cwd = options?.cwd ?? process.cwd();
  const fb = readFirebaseAppletConfig(cwd);

  const firebaseConfigured = Boolean(fb.apiKey && fb.projectId && fb.appId);
  const rulesFilePresent = fs.existsSync(path.resolve(cwd, 'firestore.rules'));
  const blueprintPresent = fs.existsSync(path.resolve(cwd, 'firebase-blueprint.json'));

  const appUrlRaw = (env.APP_URL || '').trim();
  const appUrlConfigured = Boolean(appUrlRaw && appUrlRaw !== 'MY_APP_URL' && /^https?:\/\//i.test(appUrlRaw));

  const effectiveAdminEmail =
    options?.configuredAdminEmail !== undefined
      ? options.configuredAdminEmail
      : (env.ADMIN_EMAIL || '').trim();

  const cloudStorage = getPermanentStorageStatus({ env, cwd });

  return {
    checkedAt: new Date().toISOString(),
    gemini: getGeminiIntegrationStatus(env),
    coverLibrary: {
      active: true,
      total: COVER_LIBRARY_CATALOG.length,
      items: ITEM_LIBRARY_COVERS.length,
      groups: GROUP_LIBRARY_COVERS.length,
      fallbacks: FALLBACK_LIBRARY_COVERS.length,
      smartMatchingActive: true,
      zeroPerItemGeminiCalls: true,
    },
    firebaseAuth: {
      configured: firebaseConfigured,
      projectId: fb.projectId || null,
      authDomain: fb.authDomain || null,
      sameOriginProxyActive: firebaseConfigured,
      googleSignInReady: Boolean(firebaseConfigured && fb.oAuthClientId),
    },
    firestore: {
      configured: Boolean(firebaseConfigured && fb.firestoreDatabaseId),
      projectId: fb.projectId || null,
      databaseId: fb.firestoreDatabaseId || null,
      rulesFilePresent,
      blueprintPresent,
    },
    cloudStorage,
    mediaUpload: {
      active: true,
      maxBytes: MAX_MEDIA_UPLOAD_BYTES,
      allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
      magicByteValidation: true,
      privateAccessControl: true,
      folders: ALLOWED_MEDIA_FOLDERS,
    },
    email: getEmailIntegrationStatus(env),
    whatsapp: getWhatsAppIntegrationStatus(env),
    serverEnv: {
      appUrlConfigured,
      adminEmailConfigured: Boolean(effectiveAdminEmail),
      secretsIsolatedServerSide: true,
    },
  };
}
