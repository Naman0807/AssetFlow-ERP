'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Users, Building2, Tag } from 'lucide-react';

const sections = [
  { href: '/admin/users', label: 'User Directory', description: 'Manage employee roles and assignments', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { href: '/admin/departments', label: 'Departments', description: 'Create and manage organizational departments', icon: Building2, color: 'text-green-600', bg: 'bg-green-50' },
  { href: '/admin/categories', label: 'Asset Categories', description: 'Define asset classification types', icon: Tag, color: 'text-purple-600', bg: 'bg-purple-50' },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administration</h1>
        <p className="text-gray-500">System configuration and user management</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className={`inline-flex p-3 rounded-xl ${s.bg} mb-4`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-1">{s.label}</h3>
                <p className="text-sm text-gray-500">{s.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
