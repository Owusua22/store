// lib/r2/client.ts
// Cloudflare R2 helpers. The client is created lazily so the app can build and
// run without storage credentials (demo mode) instead of crashing at import.

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';

/** Bucket used when CLOUDFLARE_R2_BUCKET_NAME is not set. */
export const DEFAULT_R2_BUCKET = 'glow-up';

function getConfig() {
  return {
    accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? '',
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? '',
    bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || DEFAULT_R2_BUCKET,
    publicUrl: (process.env.CLOUDFLARE_R2_PUBLIC_URL ?? '').replace(/\/+$/, ''),
  };
}

export interface R2Status {
  configured: boolean;
  bucket: string;
  accountIdSet: boolean;
  accessKeySet: boolean;
  secretKeySet: boolean;
  publicUrl: string | null;
  missing: string[];
}

/** Safe-to-display configuration summary (never returns secret values). */
export function getR2Status(): R2Status {
  const config = getConfig();
  const missing: string[] = [];

  if (!config.accountId) missing.push('CLOUDFLARE_R2_ACCOUNT_ID');
  if (!config.accessKeyId) missing.push('CLOUDFLARE_R2_ACCESS_KEY_ID');
  if (!config.secretAccessKey) missing.push('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
  if (!config.publicUrl) missing.push('CLOUDFLARE_R2_PUBLIC_URL');

  return {
    configured: isR2Configured() && Boolean(config.publicUrl),
    bucket: config.bucket,
    accountIdSet: Boolean(config.accountId),
    accessKeySet: Boolean(config.accessKeyId),
    secretKeySet: Boolean(config.secretAccessKey),
    publicUrl: config.publicUrl || null,
    missing,
  };
}

export function isR2Configured() {
  const config = getConfig();
  return Boolean(
    config.accountId &&
      config.accessKeyId &&
      config.secretAccessKey &&
      config.bucket
  );
}

let cachedClient: S3Client | null = null;

export function getR2Client(): S3Client {
  const config = getConfig();

  if (!config.accountId || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error(
      'Cloudflare R2 is not configured. Add the CLOUDFLARE_R2_* variables to .env.local.'
    );
  }

  if (!cachedClient) {
    cachedClient = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return cachedClient;
}

/** @deprecated use getR2Client() — kept for backwards compatibility */
export const r2Client = {
  send: (...args: Parameters<S3Client['send']>) => getR2Client().send(...args),
} as unknown as S3Client;

export const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || DEFAULT_R2_BUCKET;
export const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL ?? '';

export async function uploadToR2(
  file: Buffer,
  contentType: string,
  folder: string = 'products'
): Promise<{ url: string; key: string }> {
  const config = getConfig();

  if (!config.bucket) {
    throw new Error('Cloudflare R2 bucket missing. Set CLOUDFLARE_R2_BUCKET_NAME (e.g. glow-up).');
  }
  if (!config.publicUrl) {
    throw new Error(
      'CLOUDFLARE_R2_PUBLIC_URL is not set. Enable public access on the bucket (r2.dev URL or a custom domain) and add that URL to .env.local.'
    );
  }

  const extension = (contentType.split('/')[1] ?? 'bin').replace('jpeg', 'jpg');
  const key = `${folder}/${nanoid()}.${extension}`;

  try {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
        ContentLength: file.length,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Cloudflare upload failed:', message);
    throw new Error(`Cloudflare Upload Failed: ${message}`);
  }

  const url = `${config.publicUrl}/${key}`;
  return { url, key };
}

export async function deleteFromR2(key: string): Promise<void> {
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: getConfig().bucket,
      Key: key,
    })
  );
}

export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getConfig().bucket,
    Key: key,
  });
  return getSignedUrl(getR2Client(), command, { expiresIn });
}

export async function generateUploadPresignedUrl(
  contentType: string,
  folder: string = 'products'
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const config = getConfig();
  const extension = contentType.split('/')[1] ?? 'bin';
  const key = `${folder}/${nanoid()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 300 });
  const publicUrl = `${config.publicUrl}/${key}`;

  return { uploadUrl, key, publicUrl };
}

export function extractR2KeyFromUrl(url: string): string {
  const publicUrl = R2_PUBLIC_URL.replace(/\/+$/, '');
  if (url.startsWith(publicUrl)) {
    return url.slice(publicUrl.length).replace(/^\/+/, '');
  }
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\/+/, '');
  } catch {
    return url;
  }
}
