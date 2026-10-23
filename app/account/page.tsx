'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Calendar,
  Heart,
  Loader2,
  LogOut,
  Mail,
  Package,
  Phone,
  User,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { site } from '@/lib/site';

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function AccountPage() {
  const { user, profile, isLoading, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/account');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('You have been signed out.');
    } catch {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const initial = (profile.full_name || profile.email || 'U')
    .charAt(0)
    .toUpperCase();

  return (
    <div className="container-page py-6 sm:py-8">
      <h1 className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[26px]">
        My account
      </h1>
      <p className="mt-1 text-[12.5px] text-muted">
        Manage your details, orders and saved items.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-[20px] font-extrabold text-brand">
              {initial}
            </span>
            <div>
              <h2 className="text-[15px] font-extrabold text-ink">
                {profile.full_name || 'No name provided'}
              </h2>
              <p className="text-[11.5px] capitalize text-muted">
                {profile.role} · member since {formatDate(user?.created_at ?? '')}
              </p>
            </div>
          </div>

          <dl className="mt-5 divide-y divide-line border-t border-line">
            <InfoRow
              icon={<Mail className="h-4 w-4 text-brand" />}
              label="Email address"
              value={user?.email ?? 'N/A'}
            />
            <InfoRow
              icon={<Phone className="h-4 w-4 text-brand" />}
              label="Phone number"
              value={profile.phone || 'Not provided'}
            />
            <InfoRow
              icon={<Calendar className="h-4 w-4 text-brand" />}
              label="Member since"
              value={formatDate(user?.created_at ?? '')}
            />
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/profile" className="btn-brand h-10 px-4 text-[12.5px]">
              <User className="h-4 w-4" /> Edit profile
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line px-4 text-[12.5px] font-bold text-gray-700 hover:border-red-300 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
              href: '/orders',
              icon: Package,
              title: 'My orders',
              copy: 'Track deliveries and reorder',
            },
            {
              href: '/profile',
              icon: Heart,
              title: 'Saved items',
              copy: 'Your wishlist and favourites',
            },
          ].map(({ href, icon: Icon, title, copy }) => (
            <Link
              key={href}
              href={href}
              className="panel flex items-center gap-3 p-4 transition-colors hover:border-brand/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[12.5px] font-bold text-ink">{title}</p>
                <p className="text-[11px] text-muted">{copy}</p>
              </div>
            </Link>
          ))}

          <div className="rounded-xl bg-ink p-4 text-white">
            <p className="text-[12px] font-bold">Need help?</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/70">
              Call or WhatsApp us on {site.phoneDisplay} — Mon to Sat, 8am – 6pm.
            </p>
            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-[11.5px] font-bold"
            >
              Chat with support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <dt className="flex items-center gap-2 text-[12px] font-semibold text-muted">
        {icon}
        {label}
      </dt>
      <dd className="max-w-[60%] truncate text-right text-[12.5px] font-semibold text-ink">
        {value}
      </dd>
    </div>
  );
}
