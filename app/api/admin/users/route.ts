// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';

export const dynamic = 'force-dynamic';

const USER_ROLES = ['customer', 'admin'] as const;

type UserRole = (typeof USER_ROLES)[number];
type RoleFilter = UserRole | 'all';

type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

const updateUserSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
  full_name: z.string().trim().min(1).nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  role: z.enum(USER_ROLES).optional(),
});

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

function formatZodError(error: z.ZodError) {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join(', ');
}

function cleanSearchTerm(value: string) {
  return value
    .trim()
    .replace(/[,%()]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

function getPositiveInt(value: string | null, fallback: number) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return fallback;

  return Math.max(1, Math.floor(numberValue));
}

function getRoleFilter(value: string | null): RoleFilter {
  if (value === 'admin' || value === 'customer') return value;
  return 'all';
}

async function requireAdmin() {
  const supabase = await createRouteHandlerSupabaseClient();

  /**
   * Important:
   * Use getUser(), not getSession(), because getUser() validates with Supabase Auth.
   */
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false as const,
      response: jsonError('Unauthorized', 401),
    };
  }

  const adminClient = getAdminClient();

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false as const,
      response: jsonError(profileError.message, 500),
    };
  }

  if (profile?.role !== 'admin') {
    return {
      ok: false as const,
      response: jsonError('Forbidden', 403),
    };
  }

  return {
    ok: true as const,
    user,
    adminClient,
  };
}

/**
 * GET /api/admin/users
 *
 * Query params:
 * - q: search by email, full_name, or phone
 * - role: all | customer | admin
 * - page: number
 * - limit: number
 *
 * Example:
 * /api/admin/users?q=john&role=customer&page=1&limit=12
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    const { adminClient } = auth;

    const { searchParams } = new URL(request.url);

    const q = cleanSearchTerm(searchParams.get('q') ?? '');
    const role = getRoleFilter(searchParams.get('role'));

    const page = getPositiveInt(searchParams.get('page'), 1);
    const rawLimit = getPositiveInt(searchParams.get('limit'), 12);
    const limit = Math.min(rawLimit, 100);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let usersQuery = adminClient
      .from('profiles')
      .select(
        `
        id,
        email,
        full_name,
        avatar_url,
        role,
        phone,
        created_at,
        updated_at
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    if (role !== 'all') {
      usersQuery = usersQuery.eq('role', role);
    }

    if (q) {
      const likeQuery = `%${q}%`;

      usersQuery = usersQuery.or(
        `email.ilike.${likeQuery},full_name.ilike.${likeQuery},phone.ilike.${likeQuery}`
      );
    }

    const [
      usersResult,
      totalUsersResult,
      adminUsersResult,
      customerUsersResult,
    ] = await Promise.all([
      usersQuery.range(from, to),
      adminClient.from('profiles').select('id', {
        count: 'exact',
        head: true,
      }),
      adminClient
        .from('profiles')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('role', 'admin'),
      adminClient
        .from('profiles')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('role', 'customer'),
    ]);

    const countError =
      totalUsersResult.error ||
      adminUsersResult.error ||
      customerUsersResult.error;

    if (usersResult.error) {
      return jsonError(usersResult.error.message, 500);
    }

    if (countError) {
      return jsonError(countError.message, 500);
    }

    const filteredCount = usersResult.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(filteredCount / limit));

    return NextResponse.json({
      success: true,
      data: {
        users: (usersResult.data ?? []) as AdminUserRow[],
        stats: {
          totalUsers: totalUsersResult.count ?? 0,
          totalAdmins: adminUsersResult.count ?? 0,
          totalCustomers: customerUsersResult.count ?? 0,
          currentResults: filteredCount,
        },
        pagination: {
          page,
          limit,
          totalPages,
          totalItems: filteredCount,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        filters: {
          q,
          role,
        },
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Server error',
      500
    );
  }
}

/**
 * PATCH /api/admin/users
 *
 * Body:
 * {
 *   "id": "profile-user-id",
 *   "full_name": "New Name",
 *   "phone": "054...",
 *   "role": "admin"
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    const { adminClient, user } = auth;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError('Invalid JSON', 400);
    }

    const validated = updateUserSchema.safeParse(body);

    if (!validated.success) {
      return jsonError(formatZodError(validated.error), 400);
    }

    const { id, full_name, phone, role } = validated.data;

    if (id === user.id && role && role !== 'admin') {
      return jsonError('You cannot remove your own admin access.', 400);
    }

    const updateData: {
      full_name?: string | null;
      phone?: string | null;
      role?: UserRole;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (full_name !== undefined) {
      updateData.full_name = full_name;
    }

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    if (role !== undefined) {
      updateData.role = role;
    }

    if (Object.keys(updateData).length === 1) {
      return jsonError('Nothing to update', 400);
    }

    const { data: updatedUser, error } = await adminClient
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        id,
        email,
        full_name,
        avatar_url,
        role,
        phone,
        created_at,
        updated_at
      `
      )
      .single();

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({
      success: true,
      data: updatedUser as AdminUserRow,
      message: 'User updated successfully',
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Server error',
      500
    );
  }
}

/**
 * DELETE /api/admin/users?id=user-id
 *
 * Optional:
 * DELETE /api/admin/users?id=user-id&deleteAuthUser=true
 *
 * By default, this deletes only the profile row.
 * Use deleteAuthUser=true to delete the Supabase Auth user too.
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    const { adminClient, user } = auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') ?? searchParams.get('userId');
    const deleteAuthUser = searchParams.get('deleteAuthUser') === 'true';

    const idValidation = z.string().uuid().safeParse(id);

    if (!idValidation.success) {
      return jsonError('Valid user ID is required', 400);
    }

    const userId = idValidation.data;

    if (userId === user.id) {
      return jsonError('You cannot delete your own account.', 400);
    }

    if (deleteAuthUser) {
      const { error: authDeleteError } =
        await adminClient.auth.admin.deleteUser(userId);

      if (authDeleteError) {
        return jsonError(authDeleteError.message, 500);
      }

      /**
       * If your profiles table has ON DELETE CASCADE from auth.users,
       * this may already be deleted. This cleanup is safe.
       */
      await adminClient.from('profiles').delete().eq('id', userId);
    } else {
      const { error: profileDeleteError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileDeleteError) {
        return jsonError(profileDeleteError.message, 500);
      }
    }

    return NextResponse.json({
      success: true,
      message: deleteAuthUser
        ? 'User account deleted successfully'
        : 'User profile deleted successfully',
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Server error',
      500
    );
  }
}