'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch, formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Activity } from 'lucide-react';

interface LogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
  user: { id: string; name: string; email: string } | null;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 50 });
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (entityFilter) params.set('entity_type', entityFilter);
      const data = await apiFetch(`/api/v1/activity-log?${params}`);
      setLogs(data.logs || []);
      setPagination(data.pagination || { page: 1, total: 0, limit: 50 });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const columns = [
    { key: 'user', header: 'User', render: (l: LogEntry) => (
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
          {l.user?.name?.charAt(0) || '?'}
        </div>
        <span className="text-sm">{l.user?.name || 'System'}</span>
      </div>
    )},
    { key: 'action', header: 'Action', render: (l: LogEntry) => (
      <span className="text-sm font-medium capitalize">{l.action.replace(/_/g, ' ')}</span>
    )},
    { key: 'entity_type', header: 'Entity', render: (l: LogEntry) => <Badge value={l.entity_type} /> },
    { key: 'entity_id', header: 'Entity ID', render: (l: LogEntry) => <span className="font-mono text-xs text-gray-500">{l.entity_id?.slice(0, 8)}...</span> },
    { key: 'created_at', header: 'Timestamp', render: (l: LogEntry) => <span className="text-sm text-gray-500">{formatDateTime(l.created_at)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="text-gray-500">Immutable audit trail of all system actions</p>
      </div>

      <Card className="p-4">
        <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }} className="input w-48">
          <option value="">All Entities</option>
          {['asset', 'allocation', 'booking', 'maintenance', 'transfer', 'audit_cycle', 'profile', 'department'].map(e => (
            <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : logs.length === 0 ? (
        <EmptyState icon={<Activity className="h-8 w-8 text-gray-400" />} title="No activity" description="No log entries found" />
      ) : (
        <Card><DataTable columns={columns} data={logs} pagination={{ ...pagination, limit: 50 }} onPageChange={setPage} /></Card>
      )}
    </div>
  );
}
