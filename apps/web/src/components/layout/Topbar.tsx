'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Bell } from 'lucide-react';

export function Topbar() {
  const { profile, signOut } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-gray-100 relative">
          <Bell className="h-5 w-5 text-gray-500" />
        </button>
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
          {profile?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </header>
  );
}
