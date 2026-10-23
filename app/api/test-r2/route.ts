import { NextResponse } from 'next/server';
import { r2Client } from '@/lib/r2/client';
import { HeadBucketCommand } from '@aws-sdk/client-s3';

export async function GET() {
  try {
    // Test by checking the bucket exists (bucket-level permission only)
    await r2Client.send(new HeadBucketCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
    }));
    return NextResponse.json({ success: true, message: 'R2 connection successful!' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access Denied';
    console.error('R2 connection failed:', error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
