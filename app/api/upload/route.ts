// app/api/upload/route.ts
// Authenticated image upload to Cloudflare R2 (bucket: CLOUDFLARE_R2_BUCKET_NAME,
// default "glow-up"). Returns { success: true, data: { url, key } }.
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { uploadToR2, isR2Configured, getR2Status } from '@/lib/r2/client';
import { isDemoMode } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);
const ALLOWED_FOLDERS = new Set(['products', 'blog', 'banners', 'categories', 'showrooms']);

export async function POST(request: NextRequest) {
  if (isDemoMode) {
    return NextResponse.json(
      { success: false, error: 'Demo mode: connect Supabase and Cloudflare R2 to upload images.' },
      { status: 503 }
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!isR2Configured()) {
    const status = getR2Status();
    return NextResponse.json(
      {
        success: false,
        error: `Cloudflare R2 is not configured. Missing: ${status.missing.join(', ')}`,
      },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folderParam = String(formData.get('folder') ?? 'products');
    const folder = ALLOWED_FOLDERS.has(folderParam) ? folderParam : 'products';

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Only JPG, PNG, WEBP, AVIF or GIF images are allowed' },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Image is larger than 8 MB. Please compress it first.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, key } = await uploadToR2(buffer, file.type, folder);

    return NextResponse.json({
      success: true,
      data: { url, key, bucket: getR2Status().bucket },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}