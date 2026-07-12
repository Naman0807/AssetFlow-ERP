'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_HIERARCHY } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  GitBranch,
  Calendar,
  Wrench,
  ShieldCheck,
  ClipboardList,
  Users,
  Building2,
  Tag,
  Activity,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, minRole: 'Employee' },
  { href: '/assets', label: 'Assets', icon: Package, minRole: 'Employee' },
  { href: '/allocations', label: 'Allocations', icon: GitBranch, minRole: 'Employee' },
  { href: '/bookings', label: 'Bookings', icon: Calendar, minRole: 'Employee' },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, minRole: 'Employee' },
  { href: '/transfers', label: 'Transfers', icon: ClipboardList, minRole: 'Employee' },
  { href: '/audits', label: 'Audits', icon: ShieldCheck, minRole: 'Asset Manager' },
  { href: '/activity-log', label: 'Activity Log', icon: Activity, minRole: 'Asset Manager' },
  { href: '/admin', label: 'Admin', icon: Users, minRole: 'Admin', children: [
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/departments', label: 'Departments', icon: Building2 },
    { href: '/admin/categories', label: 'Categories', icon: Tag },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const userRoleLevel = ROLE_HIERARCHY[profile?.role || 'Employee'] ?? 0;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      <div className="px-6 py-5 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <Package className="h-6 w-6" />
          AssetFlow
        </h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => userRoleLevel >= ROLE_HIERARCHY[item.minRole])
          .map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const minRoleLevel = ROLE_HIERARCHY[item.minRole];

            if (item.children) {
              return (
                <div key={item.href}>
                  <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-500 uppercase tracking-wider">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  <div className="ml-4 space-y-1">
                    {item.children
                      .filter((child) => userRoleLevel >= minRoleLevel)
                      .map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                              childActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            )}
                          >
                            <ChildIcon className="h-4 w-4" />
                            {child.label}
                          </Link>
                        );
                      })}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
      </nav>

      {profile && (
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{profile.name}</p>
              <p className="text-xs text-gray-500 truncate">{profile.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
