// app/api/test-r2/route.ts
// Admin-only storage diagnostics: confirms the R2 credentials and bucket
// (e.g. "glow-up") are reachable and that the public URL is configured.
import { NextResponse } from 'next/server';
import { HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

import { getR2Client, getR2Status, isR2Configured } from '@/lib/r2/client';
import { requireAdmin } from '@/lib/admin/guard';
import { isDemoMode } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (isDemoMode) {
    return NextResponse.json(
      {
        success: false,
        demo: true,
        message:
          'Demo mode: add Supabase keys to .env.local first, then sign in as an admin to test storage.',
      },
      { status: 503 }
    );
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const status = getR2Status();

  if (!isR2Configured()) {
    return NextResponse.json(
      {
        success: false,
        storage: status,
        message: `Cloudflare R2 is not configured. Missing: ${status.missing.join(', ')}`,
      },
      { status: 400 }
    );
  }

  try {
    await getR2Client().send(new HeadBucketCommand({ Bucket: status.bucket }));

    // A tiny listing proves the token has object-level access too.
    const { Contents } = await getR2Client().send(
      new ListObjectsV2Command({ Bucket: status.bucket, MaxKeys: 3 })
    );

    return NextResponse.json({
      success: true,
      storage: status,
      message: `Connected to the "${status.bucket}" bucket.`,
      sampleObjects: (Contents ?? []).map((object) => object.Key).filter(Boolean),
      warnings: status.publicUrl
        ? []
        : ['CLOUDFLARE_R2_PUBLIC_URL is missing — uploaded images will not render.'],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('R2 connection failed:', error);

    return NextResponse.json(
      {
        success: false,
        storage: status,
        message: `Could not reach the "${status.bucket}" bucket: ${message}`,
        hints: [
          'Check the bucket name matches CLOUDFLARE_R2_BUCKET_NAME.',
          'The API token needs Object Read & Write for this bucket.',
          'CLOUDFLARE_R2_ACCOUNT_ID must be the account that owns the bucket.',
        ],
      },
      { status: 500 }
    );
  }
}
