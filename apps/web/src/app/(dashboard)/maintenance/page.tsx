'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Wrench } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_HIERARCHY } from '@/lib/constants';

interface MaintenanceRequest {
  id: string;
  description: string;
  priority: string;
  status: string;
  technician_name: string;
  created_at: string;
  asset: { id: string; asset_tag: string; name: string } | null;
  reporter: { id: string; name: string } | null;
}

export default function MaintenancePage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [statusFilter, setStatusFilter] = useState('');

  const canManage = ROLE_HIERARCHY[profile?.role || 'Employee'] >= ROLE_HIERARCHY['Asset Manager'];

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const data = await apiFetch(`/api/v1/maintenance?${params}`);
      setRequests(data.requests || []);
      setPagination(data.pagination || { page: 1, total: 0, limit: 20 });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (id: string, action: string) => {
    try {
      await apiFetch(`/api/v1/maintenance/${id}/${action}`, { method: 'PATCH', body: '{}' });
      fetchRequests();
    } catch (err: any) { alert(err.message); }
  };

  const columns = [
    { key: 'asset', header: 'Asset', render: (r: MaintenanceRequest) => r.asset ? `${r.asset.asset_tag} — ${r.asset.name}` : '-' },
    { key: 'description', header: 'Issue', render: (r: MaintenanceRequest) => <p className="truncate max-w-xs">{r.description}</p> },
    { key: 'priority', header: 'Priority', render: (r: MaintenanceRequest) => <Badge value={r.priority} /> },
    { key: 'status', header: 'Status', render: (r: MaintenanceRequest) => <Badge value={r.status} /> },
    { key: 'reporter', header: 'Reporter', render: (r: MaintenanceRequest) => r.reporter?.name || '-' },
    { key: 'technician_name', header: 'Technician', render: (r: MaintenanceRequest) => r.technician_name || '-' },
    { key: 'created_at', header: 'Date', render: (r: MaintenanceRequest) => formatDate(r.created_at) },
    { key: 'actions', header: '', render: (r: MaintenanceRequest) => {
      if (!canManage) return null;
      if (r.status === 'Pending') return <Button size="sm" variant="ghost" onClick={() => handleAction(r.id, 'approve')}>Approve</Button>;
      if (r.status === 'Approved') return <Button size="sm" variant="ghost" onClick={() => handleAction(r.id, 'assign')}>Assign</Button>;
      return null;
    }},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maintenance</h1>
          <p className="text-gray-500">{pagination.total} requests</p>
        </div>
        <Link href="/maintenance/new"><Button><Plus className="h-4 w-4" /> Report Issue</Button></Link>
      </div>

      <Card className="p-4">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input w-48">
          <option value="">All Statuses</option>
          {['Pending', 'Approved', 'Rejected', 'Technician Assigned', 'In Progress', 'Resolved'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : requests.length === 0 ? (
        <EmptyState icon={<Wrench className="h-8 w-8 text-gray-400" />} title="No maintenance requests" />
      ) : (
        <Card><DataTable columns={columns} data={requests} pagination={pagination} onPageChange={setPage} /></Card>
      )}
    </div>
  );
}
