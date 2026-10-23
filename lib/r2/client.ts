// src/lib/r2/client.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';

// ✅ Validate and assign environment variables with non-null assertion
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!;

// ✅ Runtime validation (will throw if missing)
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  throw new Error('❌ Missing R2 environment variables. Check your .env.local file.');
}

// ✅ Export the client with properly typed credentials
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ✅ EXPORT THESE (missing in your file)
export const R2_BUCKET = R2_BUCKET_NAME;
export { R2_PUBLIC_URL };

export async function uploadToR2(
  file: Buffer,
  contentType: string,
  folder: string = 'products'
): Promise<{ url: string; key: string }> {
  const extension = contentType.split('/')[1] ?? 'bin';
  const key = `${folder}/${nanoid()}.${extension}`;

  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
        ContentLength: file.length, // 👈 THE MAGIC FIX: Cloudflare requires the exact file size!
      })
    );
  } catch (error: any) {
    // This will print the EXACT reason it failed in your VS Code terminal
    console.error("❌ CLOUDFLARE ACTUAL ERROR DETAILS:", error.message || error);
    throw new Error(`Cloudflare Upload Failed: ${error.message}`);
  }

  const url = `${R2_PUBLIC_URL}/${key}`;
  return { url, key };
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
}

export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

export async function generateUploadPresignedUrl(
  contentType: string,
  folder: string = 'products'
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const extension = contentType.split('/')[1] ?? 'bin';
  const key = `${folder}/${nanoid()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
  const publicUrl = `${R2_PUBLIC_URL}/${key}`;

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