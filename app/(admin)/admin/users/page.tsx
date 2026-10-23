'use client';

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';

// --- Types ---
type UserRole = 'customer' | 'admin';
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

type AdminUsersStats = {
  totalUsers: number;
  totalAdmins: number;
  totalCustomers: number;
  currentResults: number;
};

type AdminUsersPagination = {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type AdminUsersApiData = {
  users: AdminUserRow[];
  stats: AdminUsersStats;
  pagination: AdminUsersPagination;
};

type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

// --- Constants ---
const DEFAULT_STATS: AdminUsersStats = {
  totalUsers: 0,
  totalAdmins: 0,
  totalCustomers: 0,
  currentResults: 0,
};

const DEFAULT_PAGINATION: AdminUsersPagination = {
  page: 1,
  limit: 10,
  totalPages: 1,
  totalItems: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

// --- Helpers ---
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong');

const formatDate = (val: string | null | undefined) => {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(d);
};

const getInitials = (user: AdminUserRow) => {
  const source = user.full_name || user.email || 'U';
  return source.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

function buildUsersHref(pathname: string, currentParams: string, updates: Record<string, string | number | null>) {
  const params = new URLSearchParams(currentParams);
  Object.entries(updates).forEach(([key, val]) => {
    if (val === null || val === '' || (key === 'page' && Number(val) <= 1)) params.delete(key);
    else params.set(key, String(val));
  });
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}

// --- Sub-Components ---
function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize shadow-sm ring-1 ring-inset',
      role === 'admin' ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-slate-50 text-slate-700 ring-slate-200'
    )}>
      {role === 'admin' && <ShieldCheck className="mr-1 h-3.5 w-3.5" />}
      {role}
    </span>
  );
}

function StatCard({ title, value, icon, tone = 'slate' }: { title: string; value: number; icon: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    indigo: 'bg-red-100 text-red-700 ring-red-100',
    green: 'bg-green-100 text-green-700 ring-green-200',
    purple: 'bg-red-100 text-red-800 ring-red-100',
  };
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{value.toLocaleString()}</p>
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-inset', tones[tone])}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white md:block">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-slate-100 p-5 animate-pulse">
          <div className="h-11 w-11 rounded-2xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/4 rounded bg-slate-100" />
            <div className="h-3 w-1/6 rounded bg-slate-50" />
          </div>
          <div className="h-8 w-20 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

// --- Main Component ---
export default function AdminUsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL State
  const q = searchParams.get('q') ?? '';
  const role = (searchParams.get('role') ?? 'all') as RoleFilter;
  const limit = searchParams.get('limit') ?? '10';
  const page = searchParams.get('page') ?? '1';

  // Local State
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [stats, setStats] = useState<AdminUsersStats>(DEFAULT_STATS);
  const [pagination, setPagination] = useState<AdminUsersPagination>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUserRow | null>(null);

  const apiUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (role !== 'all') p.set('role', role);
    p.set('limit', limit);
    if (page !== '1') p.set('page', page);
    return `/api/admin/users?${p.toString()}`;
  }, [q, role, limit, page]);

  // Unified Fetch Effect (Fixed Cascading Render Error)
  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    fetch(apiUrl, { signal: controller.signal, cache: 'no-store' })
      .then(async (res) => {
        const json = (await res.json()) as ApiResponse<AdminUsersApiData>;
        if (!isActive || controller.signal.aborted) return;
        if (!res.ok || !json.success) throw new Error(!json.success ? json.error : 'Failed to fetch');
        setUsers(json.data.users);
        setStats(json.data.stats);
        setPagination(json.data.pagination);
        setError('');
      })
      .catch((err) => {
        if (!isActive || controller.signal.aborted || err.name === 'AbortError') return;
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!isActive || controller.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [apiUrl]);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    router.push(buildUsersHref(pathname, searchParams.toString(), {
      q: fd.get('q')?.toString().trim() || null,
      role: fd.get('role')?.toString() === 'all' ? null : fd.get('role')?.toString() as string,
      limit: fd.get('limit')?.toString() === '10' ? null : fd.get('limit')?.toString() as string,
      page: 1, // Always reset to page 1 on new search
    }));
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-700 ring-1 ring-inset ring-red-100">
            <Users className="h-3.5 w-3.5" />
            Admin Panel
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">User Directory</h1>
          <p className="text-sm text-slate-500">Manage your system users and their permissions.</p>
        </div>
        <button
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Users" value={stats.totalUsers} tone="indigo" icon={<Users />} />
        <StatCard title="Customers" value={stats.totalCustomers} tone="green" icon={<UserRound />} />
        <StatCard title="Admins" value={stats.totalAdmins} tone="purple" icon={<ShieldCheck />} />
        <StatCard title="Current Results" value={stats.currentResults} tone="slate" icon={<Search />} />
      </div>

      {/* Filter Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearch} className="grid gap-3 lg:grid-cols-[1fr_180px_140px_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name, email..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
            />
          </div>
          <select name="role" defaultValue={role} className="rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 focus:ring-red-500">
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
          </select>
          <select name="limit" defaultValue={limit} className="rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 focus:ring-red-500">
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
          </select>
          <button type="submit" className="rounded-2xl bg-slate-950 px-8 py-3 text-sm font-black text-white hover:bg-slate-800">
            Apply Filters
          </button>
        </form>
      </div>

      {/* User Table */}
      {loading && users.length === 0 ? (
        <SkeletonTable />
      ) : users.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-20 text-center text-slate-400">
          <Users className="mx-auto h-12 w-12 opacity-20" />
          <p className="mt-4 font-bold">No users found match your criteria</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-black uppercase text-slate-500">User Details</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-slate-500">Contact</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-slate-500">Role</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="group transition hover:bg-red-50/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                          {getInitials(user)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-950">{user.full_name || 'Anonymous'}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[150px]">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingUser(user)} className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-white hover:text-red-600">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeletingUser(user)} className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-white hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Enhanced Pagination */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 p-5 sm:flex-row">
            <p className="text-sm font-medium text-slate-500">
              Showing <span className="font-bold text-slate-950">{users.length}</span> of <span className="font-bold text-slate-950">{pagination.totalItems}</span> users
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={buildUsersHref(pathname, searchParams.toString(), { page: pagination.page - 1 })}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold shadow-sm transition",
                  !pagination.hasPreviousPage ? "pointer-events-none opacity-40" : "hover:bg-slate-50"
                )}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Link>
              <div className="px-4 text-sm font-bold text-slate-900">
                {pagination.page} / {pagination.totalPages}
              </div>
              <Link
                href={buildUsersHref(pathname, searchParams.toString(), { page: pagination.page + 1 })}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold shadow-sm transition",
                  !pagination.hasNextPage ? "pointer-events-none opacity-40" : "hover:bg-slate-50"
                )}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
