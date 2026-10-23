// app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/types';

const supabase = createClient();

function getProfileForm(profile?: Profile | null) {
  return {
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    avatar_url: profile?.avatar_url ?? '',
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, isAuthenticated, signOut } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => getProfileForm(profile));
  const [error, setError] = useState<string | null>(null);

  // 🔒 Protect route: redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/profile');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading while auth is initializing
  if (authLoading || !isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Handle save (update profiles table)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('You must be signed in to update your profile.');
      return;
    }

    if (!supabase) {
      toast.error('Profile updates need a connected Supabase project.');
      setSaving(false);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim() || null,
          phone: form.phone.trim() || null,
          avatar_url: form.avatar_url.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('[Profile] update error:', updateError);
        throw updateError;
      }

      toast.success('Profile updated successfully ✅');
      setIsEditing(false);
      // Optionally trigger a refetch in your auth store / revalidate cache if you have it
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">
            Manage your account information and preferences.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ← Back to Home
          </Link>
          <button
            onClick={async () => {
              await signOut();
            }}
            className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Card: User summary */}
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.full_name ?? 'User avatar'}
                className="w-24 h-24 rounded-full object-cover border-2 border-red-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-2xl font-bold">
                {(profile?.full_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
              </div>
            )}
          </div>

          {/* Basic info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-semibold text-gray-900">
                {profile?.full_name ?? 'Unnamed user'}
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {profile?.role ?? 'customer'}
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900 font-medium">{user?.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-900">{profile?.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">User ID</dt>
                <dd className="text-gray-900 font-mono text-xs break-all">{user?.id ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Joined</dt>
                <dd className="text-gray-900">{formatDate(profile?.created_at)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (isEditing) {
                    setIsEditing(false);
                    setError(null);
                    return;
                  }

                  setForm(getProfileForm(profile));
                  setIsEditing(true);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                {isEditing ? 'Cancel edit' : 'Edit profile'}
              </button>
              <Link
                href="/auth?mode=reset"
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Change password
              </Link>
            </div>
          </div>
        </div>

        {/* Edit form */}
        {isEditing && (
          <form onSubmit={handleSave} className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Edit your information</h3>
            <p className="text-sm text-gray-600 mb-4">
              Update your name, phone number, and avatar URL. Changes are saved to your account.
            </p>

            {error && (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full name
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+233 50 123 4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar URL
                </label>
                <input
                  id="avatar_url"
                  type="url"
                  value={form.avatar_url}
                  onChange={(e) => setForm((f) => ({ ...f, avatar_url: e.target.value }))}
                  placeholder="https://.../avatar.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Paste a direct image URL (https). You can use Gravatar, Cloudinary, Supabase Storage, etc.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(getProfileForm(profile));
                  setIsEditing(false);
                  setError(null);
                }}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Discard
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Optional: Security / account section */}
      <div className="mt-8 bg-white rounded-2xl shadow border border-gray-200 p-6 md:p-8">
        <h3 className="text-lg font-semibold text-gray-900">Account & security</h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage your authentication and account security settings.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Email</h4>
                <p className="text-sm text-gray-600">{user?.email ?? '—'}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">Verified</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Email verification is handled by Supabase (via confirmation link). If you need to change it, contact support or update via your auth provider.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900">Password</h4>
            <p className="text-sm text-gray-600 mt-1">Reset your password anytime.</p>
            <div className="mt-3">
              <Link
                href="/auth?mode=reset"
                className="inline-block px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Reset password
              </Link>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-500">
        Tip: If you can’t update your profile, check your <span className="font-medium">Row Level Security (RLS)</span> policies on <span className="font-mono">public.profiles</span> (only the owner should be able to UPDATE their own row).
      </p>
    </div>
  );
}
