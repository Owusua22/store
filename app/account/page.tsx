'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, User, Mail, Phone, Calendar, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';

// A simple utility to format dates
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function ProfilePage() {
  const { user, profile, isLoading, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and the user is not authenticated, redirect them.
    if (!isLoading && !isAuthenticated) {
      router.push('/login'); // Or your login page route
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('You have been signed out.');
      // The signOut function in useAuth already handles redirection.
    } catch (error) {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // Display a full-page loader while the auth state is being determined.
  if (isLoading || !profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            My Account
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            View and manage your profile information.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center space-x-4">
              {/* Avatar Placeholder */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {profile.full_name || 'No name provided'}
                </h2>
                <p className="text-sm font-medium text-gray-500 capitalize">
                  Role: {profile.role}
                </p>
              </div>
            </div>

            {/* Profile Details */}
            <div className="mt-6 border-t border-gray-200">
              <dl className="divide-y divide-gray-200">
                <InfoRow 
                  icon={<Mail className="h-5 w-5 text-gray-400" />} 
                  label="Email Address" 
                  value={user?.email || 'N/A'} 
                />
                <InfoRow 
                  icon={<Phone className="h-5 w-5 text-gray-400" />} 
                  label="Phone Number" 
                  value={profile.phone || 'Not provided'} 
                />
                <InfoRow 
                  icon={<Calendar className="h-5 w-5 text-gray-400" />} 
                  label="Member Since" 
                  value={formatDate(user?.created_at || '')} 
                />
              </dl>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end">
            <button
              onClick={handleSignOut}
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// A helper component to keep the list clean
interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
      <dt className="flex items-center gap-3 text-sm font-medium text-gray-600">
        {icon}
        <span>{label}</span>
      </dt>
      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{value}</dd>
    </div>
  );
}