// app/api/admin/reviews/[id]/route.ts
// PATCH { status: 'published' | 'hidden' } — moderate one review.
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { setReviewStatus } from '@/lib/data/reviews';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { status?: string };
    const status = body.status;
    if (status !== 'published' && status !== 'hidden' && status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'status must be published, hidden or pending' },
        { status: 422 }
      );
    }

    const { id } = await params;

    if (isSupabaseConfigured) {
      // Confirm the caller is an admin before touching another shop's data.
      const supabase = await createRouteHandlerSupabaseClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Admins only' }, { status: 403 });
      }
    }

    const updated = await setReviewStatus(id, status);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
