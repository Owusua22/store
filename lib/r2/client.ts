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

function getConfig() {
  return {
    accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? '',
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? '',
    bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME ?? '',
    publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL ?? '',
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

export const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? '';
export const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL ?? '';

export async function uploadToR2(
  file: Buffer,
  contentType: string,
  folder: string = 'products'
): Promise<{ url: string; key: string }> {
  const config = getConfig();
  const extension = contentType.split('/')[1] ?? 'bin';
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

  const url = `${config.publicUrl.replace(/\/+$/, '')}/${key}`;
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
  const publicUrl = `${config.publicUrl.replace(/\/+$/, '')}/${key}`;

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
