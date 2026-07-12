'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Package, Calendar, Wrench, GitBranch, AlertTriangle, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface KPIs {
  total_assets: number;
  available: number;
  allocated: number;
  maintenance_pending: number;
  active_bookings: number;
  pending_transfers: number;
  overdue_allocations: number;
}

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user?: { name: string };
  created_at: string;
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/v1/dashboard/kpis'),
      apiFetch('/api/v1/dashboard/recent-activity'),
    ]).then(([kpiData, activityData]) => {
      setKpis(kpiData);
      setActivities(activityData.activities || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const kpiCards = [
    { label: 'Total Assets', value: kpis?.total_assets || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Available', value: kpis?.available || 0, icon: Package, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Allocated', value: kpis?.allocated || 0, icon: GitBranch, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Maintenance Pending', value: kpis?.maintenance_pending || 0, icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Active Bookings', value: kpis?.active_bookings || 0, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pending Transfers', value: kpis?.pending_transfers || 0, icon: GitBranch, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Overdue Allocations', value: kpis?.overdue_allocations || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Real-time overview of your assets and operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{kpi.label}</p>
                  <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${kpi.bg}`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                      {activity.user?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{activity.user?.name || 'System'}</span>
                        {' '}{activity.action.replace('_', ' ')}
                        {' '}<span className="text-gray-500">{activity.entity_type}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{formatDateTime(activity.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
