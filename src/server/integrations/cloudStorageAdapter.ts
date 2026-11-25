import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { StoredMediaAssetRecord } from '../../types/domain';
import { DatabaseSchema } from '../dbSchema';

export type PermanentStorageDriver = 'local_persistent' | 's3_compatible';

export interface CloudStorageStatus {
  activeDriver: PermanentStorageDriver;
  providerLabel: 'cloudflare_r2' | 's3_compatible' | 'local_persistent';
  localPersistentReady: boolean;
  localFallbackActive: boolean;
  firebaseBucketConfigured: boolean;
  firebaseStorageRulesPresent: boolean;
  firebaseBlazeApprovalRequired: boolean;
  bucketName: string | null;
  s3Configured: boolean;
  s3EndpointHost: string | null;
  s3Bucket: string | null;
  s3Region: string | null;
  cloudUploadEnabled: boolean;
  privateMediaAccessControl: boolean;
  missingRequiredVars: string[];
}

export interface S3CompatibleConfig {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string | null;
}

export interface CloudStorageOverrides {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
}

export const REQUIRED_R2_ENV_VARS = [
  'STORAGE_DRIVER',
  'S3_ENDPOINT',
  'S3_BUCKET',
  'S3_REGION',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
] as const;

/**
 * Prevents outbound requests to localhost / private RFC1918 / link-local cloud metadata endpoints
 * when validating server-side S3-compatible / Cloudflare R2 endpoints.
 */
export function isSafeCloudStorageEndpoint(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host === '169.254.169.254' ||
      host === 'metadata.google.internal' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
      /^169\.254\./.test(host)
    ) {
      return false;
    }
    return host.includes('.');
  } catch {
    return false;
  }
}

function normalizeS3Endpoint(rawEndpoint: string, bucket: string): string {
  const cleaned = rawEndpoint.trim().replace(/\/+$/, '');
  if (!cleaned) return '';
  if (bucket && cleaned.endsWith(`/${bucket}`)) {
    return cleaned.slice(0, -(`/${bucket}`).length);
  }
  return cleaned;
}

export function isCloudStorageDriverEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const requestedDriver = (env.STORAGE_DRIVER || 'local_persistent').trim().toLowerCase();
  return requestedDriver === 's3_compatible' || requestedDriver === 'r2';
}

export function resolveS3CompatibleConfig(
  env: NodeJS.ProcessEnv = process.env
): S3CompatibleConfig | null {
  if (!isCloudStorageDriverEnabled(env)) {
    return null;
  }

  const bucket = (env.S3_BUCKET || '').trim();
  const endpoint = normalizeS3Endpoint(env.S3_ENDPOINT || '', bucket);
  const region = (env.S3_REGION || 'auto').trim() || 'auto';
  const accessKeyId = (env.S3_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (env.S3_SECRET_ACCESS_KEY || '').trim();
  const publicBaseUrlRaw = (env.S3_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }
  if (!isSafeCloudStorageEndpoint(endpoint)) {
    return null;
  }

  return {
    endpoint,
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl:
      publicBaseUrlRaw && isSafeCloudStorageEndpoint(publicBaseUrlRaw) ? publicBaseUrlRaw : null,
  };
}

export function getPermanentStorageStatus(options?: {
  env?: NodeJS.ProcessEnv;
  cwd?: string;
}): CloudStorageStatus {
  const env = options?.env ?? process.env;
  const cwd = options?.cwd ?? process.cwd();

  let fbBucket: string | null = null;
  try {
    const fbPath = path.resolve(cwd, 'firebase-applet-config.json');
    if (fs.existsSync(fbPath)) {
      const parsed = JSON.parse(fs.readFileSync(fbPath, 'utf8')) as { storageBucket?: string };
      if (typeof parsed.storageBucket === 'string' && parsed.storageBucket.trim()) {
        fbBucket = parsed.storageBucket.trim();
      }
    }
  } catch {
    // ignore missing or invalid config
  }

  const firebaseBucket = (env.FIREBASE_STORAGE_BUCKET || '').trim() || fbBucket;
  const firebaseStorageRulesPresent = fs.existsSync(path.resolve(cwd, 'storage.rules'));
  const s3Cfg = resolveS3CompatibleConfig(env);
  const s3Active = Boolean(s3Cfg);

  let s3EndpointHost: string | null = null;
  let isCloudflareR2 = false;
  if (s3Cfg) {
    try {
      s3EndpointHost = new URL(s3Cfg.endpoint).host;
      isCloudflareR2 = s3EndpointHost.endsWith('.r2.cloudflarestorage.com');
    } catch {
      s3EndpointHost = null;
    }
  }

  const missingRequiredVars: string[] = [];
  const requestedDriver = (env.STORAGE_DRIVER || '').trim().toLowerCase();
  if (!['s3_compatible', 'r2'].includes(requestedDriver)) {
    missingRequiredVars.push('STORAGE_DRIVER');
  }
  if (!(env.S3_ENDPOINT || '').trim()) missingRequiredVars.push('S3_ENDPOINT');
  if (!(env.S3_BUCKET || '').trim()) missingRequiredVars.push('S3_BUCKET');
  if (!(env.S3_REGION || '').trim()) missingRequiredVars.push('S3_REGION');
  if (!(env.S3_ACCESS_KEY_ID || '').trim()) missingRequiredVars.push('S3_ACCESS_KEY_ID');
  if (!(env.S3_SECRET_ACCESS_KEY || '').trim()) missingRequiredVars.push('S3_SECRET_ACCESS_KEY');

  return {
    activeDriver: s3Active ? 's3_compatible' : 'local_persistent',
    providerLabel: s3Active
      ? isCloudflareR2
        ? 'cloudflare_r2'
        : 's3_compatible'
      : 'local_persistent',
    localPersistentReady: true,
    localFallbackActive: true,
    firebaseBucketConfigured: Boolean(firebaseBucket),
    firebaseStorageRulesPresent,
    firebaseBlazeApprovalRequired: Boolean(firebaseBucket && !s3Active),
    bucketName: s3Cfg ? s3Cfg.bucket : firebaseBucket,
    s3Configured: Boolean(s3Cfg),
    s3EndpointHost,
    s3Bucket: s3Cfg?.bucket || null,
    s3Region: s3Cfg?.region || null,
    cloudUploadEnabled: s3Active,
    privateMediaAccessControl: true,
    missingRequiredVars,
  };
}

function sha256Hex(payload: Buffer | string): string {
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function encodeRfc3986Segment(segment: string): string {
  return encodeURIComponent(segment).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function encodeS3ObjectKey(key: string): string {
  return key
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeRfc3986Segment(segment))
    .join('/');
}

/**
 * Builds standard AWS Signature Version 4 headers for Cloudflare R2 & S3-compatible
 * cloud object storage (PUT, GET, HEAD, DELETE) using Node's built-in crypto.
 */
export function buildSigV4Request(params: {
  config: S3CompatibleConfig;
  method: 'PUT' | 'GET' | 'HEAD' | 'DELETE';
  objectKey: string;
  body: Buffer;
  contentType?: string;
}): { url: string; headers: Record<string, string> } {
  const { config, method, objectKey, body, contentType } = params;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const encodedKey = encodeS3ObjectKey(objectKey);
  const fullUrl = `${config.endpoint}/${encodeRfc3986Segment(config.bucket)}/${encodedKey}`;
  const parsedUrl = new URL(fullUrl);
  const payloadHash = sha256Hex(body);

  const canonicalHeadersMap: Record<string, string> = {
    host: parsedUrl.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  if (contentType) {
    canonicalHeadersMap['content-type'] = contentType;
  }

  const sortedHeaderKeys = Object.keys(canonicalHeadersMap).sort();
  const canonicalHeaders = sortedHeaderKeys
    .map((k) => `${k}:${canonicalHeadersMap[k].trim()}\n`)
    .join('');
  const signedHeaders = sortedHeaderKeys.join(';');

  const canonicalRequest = [
    method,
    parsedUrl.pathname,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmacSha256(`AWS4${config.secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, config.region);
  const kService = hmacSha256(kRegion, 's3');
  const kSigning = hmacSha256(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers: Record<string, string> = {
    Authorization: authorization,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  return { url: fullUrl, headers };
}

export async function mirrorBufferToCloudStorage(params: {
  objectKey: string;
  buffer: Buffer;
  contentType: string;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
}): Promise<{ mirrored: boolean; driver: PermanentStorageDriver; cloudKey?: string; error?: string }> {
  const config = resolveS3CompatibleConfig(params.env ?? process.env);
  if (!config) {
    return { mirrored: false, driver: 'local_persistent' };
  }

  const doFetch = params.fetchImpl ?? fetch;
  try {
    const signed = buildSigV4Request({
      config,
      method: 'PUT',
      objectKey: params.objectKey,
      body: params.buffer,
      contentType: params.contentType,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const resp = await doFetch(signed.url, {
      method: 'PUT',
      headers: signed.headers,
      body: new Uint8Array(params.buffer),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!resp.ok) {
      return {
        mirrored: false,
        driver: 'local_persistent',
        error: `CLOUD_PUT_HTTP_${resp.status}`,
      };
    }

    return {
      mirrored: true,
      driver: 's3_compatible',
      cloudKey: params.objectKey,
    };
  } catch {
    return {
      mirrored: false,
      driver: 'local_persistent',
      error: 'CLOUD_PUT_NETWORK_ERROR',
    };
  }
}

export async function fetchBufferFromCloudStorage(params: {
  objectKey: string;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true; buffer: Buffer; contentType: string } | { ok: false; status?: number }> {
  const config = resolveS3CompatibleConfig(params.env ?? process.env);
  if (!config) {
    return { ok: false };
  }

  const doFetch = params.fetchImpl ?? fetch;
  try {
    const signed = buildSigV4Request({
      config,
      method: 'GET',
      objectKey: params.objectKey,
      body: Buffer.alloc(0),
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const resp = await doFetch(signed.url, {
      method: 'GET',
      headers: signed.headers,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!resp.ok) {
      return { ok: false, status: resp.status };
    }

    const arrayBuf = await resp.arrayBuffer();
    const contentType = resp.headers.get('content-type') || 'application/octet-stream';
    return {
      ok: true,
      buffer: Buffer.from(arrayBuf),
      contentType,
    };
  } catch {
    return { ok: false };
  }
}

export async function headObjectInCloudStorage(params: {
  objectKey: string;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
}): Promise<{ exists: boolean; sizeBytes?: number; status?: number }> {
  const config = resolveS3CompatibleConfig(params.env ?? process.env);
  if (!config) {
    return { exists: false };
  }

  const doFetch = params.fetchImpl ?? fetch;
  try {
    const signed = buildSigV4Request({
      config,
      method: 'HEAD',
      objectKey: params.objectKey,
      body: Buffer.alloc(0),
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const resp = await doFetch(signed.url, {
      method: 'HEAD',
      headers: signed.headers,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!resp.ok) {
      return { exists: false, status: resp.status };
    }

    const lenHeader = resp.headers.get('content-length');
    const sizeBytes = lenHeader ? Number(lenHeader) : undefined;
    return {
      exists: true,
      sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : undefined,
      status: resp.status,
    };
  } catch {
    return { exists: false };
  }
}

export async function deleteObjectFromCloudStorage(params: {
  objectKey: string;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
}): Promise<{ deleted: boolean; skipped?: boolean; error?: string }> {
  const config = resolveS3CompatibleConfig(params.env ?? process.env);
  if (!config) {
    return { deleted: false, skipped: true };
  }

  const doFetch = params.fetchImpl ?? fetch;
  try {
    const signed = buildSigV4Request({
      config,
      method: 'DELETE',
      objectKey: params.objectKey,
      body: Buffer.alloc(0),
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const resp = await doFetch(signed.url, {
      method: 'DELETE',
      headers: signed.headers,
      signal: controller.signal,
    });
    clearTimeout(timer);

    // S3 / R2 return 204 No Content or 200 OK (and 404 when already removed)
    if (resp.ok || resp.status === 404) {
      return { deleted: true };
    }
    return { deleted: false, error: `CLOUD_DELETE_HTTP_${resp.status}` };
  } catch {
    return { deleted: false, error: 'CLOUD_DELETE_NETWORK_ERROR' };
  }
}

export interface CloudStorageRoundtripReport {
  ok: boolean;
  configured: boolean;
  providerLabel: CloudStorageStatus['providerLabel'];
  endpointHost: string | null;
  bucket: string | null;
  steps: {
    put: boolean;
    head: boolean;
    get: boolean;
    byteMatch: boolean;
    delete: boolean;
  };
  errorCode?: string;
}

/**
 * Safely verifies live Cloudflare R2 connectivity by writing a tiny probe object,
 * verifying HEAD + GET exact bytes, and deleting the probe object immediately.
 * Never returns or logs credentials.
 */
export async function verifyCloudStorageRoundtrip(
  overrides?: CloudStorageOverrides
): Promise<CloudStorageRoundtripReport> {
  const env = overrides?.env ?? process.env;
  const status = getPermanentStorageStatus({ env });
  const config = resolveS3CompatibleConfig(env);

  if (!config) {
    return {
      ok: false,
      configured: false,
      providerLabel: status.providerLabel,
      endpointHost: status.s3EndpointHost,
      bucket: status.s3Bucket,
      steps: { put: false, head: false, get: false, byteMatch: false, delete: false },
      errorCode: 'R2_NOT_CONFIGURED',
    };
  }

  const probeKey = `healthchecks/r2-probe-${crypto.randomBytes(6).toString('hex')}.txt`;
  const probePayload = Buffer.from(`finditqr-r2-probe-${Date.now()}`, 'utf8');

  const putRes = await mirrorBufferToCloudStorage({
    objectKey: probeKey,
    buffer: probePayload,
    contentType: 'text/plain',
    env,
    fetchImpl: overrides?.fetchImpl,
  });
  if (!putRes.mirrored) {
    return {
      ok: false,
      configured: true,
      providerLabel: status.providerLabel,
      endpointHost: status.s3EndpointHost,
      bucket: status.s3Bucket,
      steps: { put: false, head: false, get: false, byteMatch: false, delete: false },
      errorCode: putRes.error || 'CLOUD_PUT_FAILED',
    };
  }

  const headRes = await headObjectInCloudStorage({
    objectKey: probeKey,
    env,
    fetchImpl: overrides?.fetchImpl,
  });

  const getRes = await fetchBufferFromCloudStorage({
    objectKey: probeKey,
    env,
    fetchImpl: overrides?.fetchImpl,
  });
  const byteMatch = Boolean(getRes.ok && getRes.buffer.equals(probePayload));

  const delRes = await deleteObjectFromCloudStorage({
    objectKey: probeKey,
    env,
    fetchImpl: overrides?.fetchImpl,
  });

  const allOk = Boolean(putRes.mirrored && headRes.exists && getRes.ok && byteMatch && delRes.deleted);
  return {
    ok: allOk,
    configured: true,
    providerLabel: status.providerLabel,
    endpointHost: status.s3EndpointHost,
    bucket: status.s3Bucket,
    steps: {
      put: putRes.mirrored,
      head: headRes.exists,
      get: getRes.ok,
      byteMatch,
      delete: delRes.deleted,
    },
    errorCode: allOk ? undefined : 'R2_ROUNDTRIP_INCOMPLETE',
  };
}

export interface LocalMediaMigrationEntry {
  assetId: string;
  folder: 'originals' | 'covers' | 'avatars' | 'tickets';
  filename: string;
  url: string;
  ownerUid: string | null;
  targetCloudKey: string;
  sizeBytes: number;
  mimeType: string;
  alreadyMirrored: boolean;
}

export interface LocalMediaMigrationPlan {
  dryRun: true;
  r2Configured: boolean;
  preserveLocalBackups: true;
  totalLocalFiles: number;
  alreadyMirroredCount: number;
  pendingCopyCount: number;
  entries: LocalMediaMigrationEntry[];
}

const FOLDER_LIST = ['originals', 'covers', 'avatars', 'tickets'] as const;
const EXT_MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/**
 * Inspects local persistent media files and maps each to its permanent Cloudflare R2 object key
 * WITHOUT modifying any files, URLs, or database records.
 */
export function planLocalToCloudMigration(params: {
  mediaRoot: string;
  db: DatabaseSchema;
  manifestRecords?: Record<string, StoredMediaAssetRecord>;
  env?: NodeJS.ProcessEnv;
}): LocalMediaMigrationPlan {
  const root = path.resolve(params.mediaRoot);
  const env = params.env ?? process.env;
  const r2Configured = Boolean(resolveS3CompatibleConfig(env));
  const entries: LocalMediaMigrationEntry[] = [];

  for (const folder of FOLDER_LIST) {
    const folderDir = path.resolve(root, folder);
    if (!folderDir.startsWith(root + path.sep) || !fs.existsSync(folderDir)) continue;
    const files = fs.readdirSync(folderDir);
    for (const filename of files) {
      if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(filename)) continue;
      const fullPath = path.resolve(folderDir, filename);
      if (!fullPath.startsWith(folderDir + path.sep)) continue;
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) continue;

      const assetId = `${folder}/${filename}`;
      const existing = params.db.mediaAssets?.[assetId] || params.manifestRecords?.[assetId];
      const ownerUid = existing?.ownerUid || null;
      const targetCloudKey =
        existing?.cloudKey ||
        (ownerUid ? `users/${ownerUid}/${folder}/${filename}` : `legacy/${folder}/${filename}`);
      const ext = path.extname(filename).toLowerCase();
      const mimeType = existing?.mimeType || EXT_MIME_MAP[ext] || 'application/octet-stream';
      const alreadyMirrored = Boolean(
        existing?.storageDriver === 's3_compatible' && existing?.cloudKey
      );

      entries.push({
        assetId,
        folder,
        filename,
        url: `/api/media/${folder}/${filename}`,
        ownerUid,
        targetCloudKey,
        sizeBytes: stat.size,
        mimeType,
        alreadyMirrored,
      });
    }
  }

  const alreadyMirroredCount = entries.filter((e) => e.alreadyMirrored).length;
  return {
    dryRun: true,
    r2Configured,
    preserveLocalBackups: true,
    totalLocalFiles: entries.length,
    alreadyMirroredCount,
    pendingCopyCount: entries.length - alreadyMirroredCount,
    entries,
  };
}

export interface LocalMediaMigrationResult {
  ok: boolean;
  dryRun: boolean;
  preserveLocalBackups: true;
  deletedLocalCount: 0;
  totalScanned: number;
  copiedCount: number;
  verifiedCount: number;
  skippedAlreadyMirrored: number;
  failedCount: number;
  failures: Array<{ assetId: string; reason: string }>;
}

/**
 * Safely copies local persistent media files into Cloudflare R2 while:
 * 1. Keeping exact `/api/media/:folder/:filename` URLs & DB relationships unchanged.
 * 2. Verifying each copied object via HEAD.
 * 3. NEVER deleting local backup copies (`deletedLocalCount: 0` always).
 * Defaults to `dryRun: true` unless `{ dryRun: false, confirmMigration: true }` is explicitly passed.
 */
export async function executeLocalToCloudMigration(params: {
  mediaRoot: string;
  db: DatabaseSchema;
  manifestRecords?: Record<string, StoredMediaAssetRecord>;
  persistRecord?: (record: StoredMediaAssetRecord) => void;
  saveDatabase?: () => void;
  dryRun?: boolean;
  confirmMigration?: boolean;
  overrides?: CloudStorageOverrides;
}): Promise<LocalMediaMigrationResult> {
  const env = params.overrides?.env ?? process.env;
  const plan = planLocalToCloudMigration({
    mediaRoot: params.mediaRoot,
    db: params.db,
    manifestRecords: params.manifestRecords,
    env,
  });

  const isDryRun = params.dryRun !== false || params.confirmMigration !== true;
  if (isDryRun) {
    return {
      ok: true,
      dryRun: true,
      preserveLocalBackups: true,
      deletedLocalCount: 0,
      totalScanned: plan.totalLocalFiles,
      copiedCount: 0,
      verifiedCount: 0,
      skippedAlreadyMirrored: plan.alreadyMirroredCount,
      failedCount: 0,
      failures: [],
    };
  }

  if (!plan.r2Configured) {
    return {
      ok: false,
      dryRun: false,
      preserveLocalBackups: true,
      deletedLocalCount: 0,
      totalScanned: plan.totalLocalFiles,
      copiedCount: 0,
      verifiedCount: 0,
      skippedAlreadyMirrored: plan.alreadyMirroredCount,
      failedCount: plan.pendingCopyCount,
      failures: [{ assetId: '*', reason: 'R2_NOT_CONFIGURED' }],
    };
  }

  const root = path.resolve(params.mediaRoot);
  let copiedCount = 0;
  let verifiedCount = 0;
  let skippedAlreadyMirrored = 0;
  const failures: Array<{ assetId: string; reason: string }> = [];

  if (!params.db.mediaAssets) {
    params.db.mediaAssets = {};
  }

  for (const entry of plan.entries) {
    if (entry.alreadyMirrored) {
      skippedAlreadyMirrored++;
      continue;
    }

    const folderDir = path.resolve(root, entry.folder);
    const fullPath = path.resolve(folderDir, entry.filename);
    if (!fullPath.startsWith(folderDir + path.sep) || !fs.existsSync(fullPath)) {
      failures.push({ assetId: entry.assetId, reason: 'LOCAL_FILE_MISSING' });
      continue;
    }

    const buffer = fs.readFileSync(fullPath);
    const putRes = await mirrorBufferToCloudStorage({
      objectKey: entry.targetCloudKey,
      buffer,
      contentType: entry.mimeType,
      env,
      fetchImpl: params.overrides?.fetchImpl,
    });

    if (!putRes.mirrored) {
      failures.push({ assetId: entry.assetId, reason: putRes.error || 'CLOUD_PUT_FAILED' });
      continue;
    }
    copiedCount++;

    const headRes = await headObjectInCloudStorage({
      objectKey: entry.targetCloudKey,
      env,
      fetchImpl: params.overrides?.fetchImpl,
    });
    if (!headRes.exists) {
      failures.push({ assetId: entry.assetId, reason: 'CLOUD_HEAD_VERIFY_FAILED' });
      continue;
    }
    verifiedCount++;

    const nowIso = new Date().toISOString();
    const existing = params.db.mediaAssets[entry.assetId] || params.manifestRecords?.[entry.assetId];
    const updatedRecord: StoredMediaAssetRecord = existing
      ? {
          ...existing,
          storageDriver: 's3_compatible',
          cloudKey: entry.targetCloudKey,
          updatedAt: nowIso,
        }
      : {
          id: entry.assetId,
          ownerUid: entry.ownerUid || 'legacy',
          folder: entry.folder,
          filename: entry.filename,
          url: entry.url,
          mimeType: entry.mimeType,
          sizeBytes: entry.sizeBytes,
          visibility:
            entry.folder === 'tickets' || entry.folder === 'originals' ? 'private' : 'public',
          storageDriver: 's3_compatible',
          cloudKey: entry.targetCloudKey,
          originalName: entry.filename,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

    params.db.mediaAssets[entry.assetId] = updatedRecord;
    if (params.persistRecord) {
      params.persistRecord(updatedRecord);
    }
  }

  if (copiedCount > 0 && params.saveDatabase) {
    params.saveDatabase();
  }

  return {
    ok: failures.length === 0,
    dryRun: false,
    preserveLocalBackups: true,
    deletedLocalCount: 0,
    totalScanned: plan.totalLocalFiles,
    copiedCount,
    verifiedCount,
    skippedAlreadyMirrored,
    failedCount: failures.length,
    failures,
  };
}
