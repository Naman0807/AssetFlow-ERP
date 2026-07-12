'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Plus, GitBranch } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_HIERARCHY } from '@/lib/constants';

interface Transfer {
  id: string;
  status: string;
  notes: string;
  created_at: string;
  asset: { id: string; asset_tag: string; name: string } | null;
  requester: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
}

export default function TransfersPage() {
  const { profile } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [showNew, setShowNew] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [form, setForm] = useState({ asset_id: '', target_department_id: '', notes: '' });

  const canManage = ROLE_HIERARCHY[profile?.role || 'Employee'] >= ROLE_HIERARCHY['Asset Manager'];

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/v1/transfers?page=${page}&limit=20`);
      setTransfers(data.transfers || []);
      setPagination(data.pagination || { page: 1, total: 0, limit: 20 });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchTransfers(); }, [fetchTransfers]);

  const handleAction = async (id: string, action: string) => {
    try {
      await apiFetch(`/api/v1/transfers/${id}/${action}`, { method: 'PATCH', body: '{}' });
      fetchTransfers();
    } catch (err: any) { alert(err.message); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/transfers', { method: 'POST', body: JSON.stringify(form) });
      setShowNew(false);
      setForm({ asset_id: '', target_department_id: '', notes: '' });
      fetchTransfers();
    } catch (err: any) { alert(err.message); }
  };

  const openNewModal = async () => {
    const [assetData, deptData] = await Promise.all([
      apiFetch('/api/v1/assets?limit=100'),
      apiFetch('/api/v1/admin/departments'),
    ]);
    setAssets(assetData.assets || []);
    setDepartments(deptData.departments || []);
    setShowNew(true);
  };

  const columns = [
    { key: 'asset', header: 'Asset', render: (t: Transfer) => t.asset ? `${t.asset.asset_tag} — ${t.asset.name}` : '-' },
    { key: 'requester', header: 'Requested By', render: (t: Transfer) => t.requester?.name || '-' },
    { key: 'department', header: 'To Department', render: (t: Transfer) => t.department?.name || '-' },
    { key: 'status', header: 'Status', render: (t: Transfer) => <Badge value={t.status} /> },
    { key: 'created_at', header: 'Date', render: (t: Transfer) => formatDate(t.created_at) },
    { key: 'actions', header: '', render: (t: Transfer) => {
      if (!canManage || t.status !== 'Requested') return null;
      return (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleAction(t.id, 'approve')}>Approve</Button>
          <Button size="sm" variant="ghost" onClick={() => handleAction(t.id, 'reject')}>Reject</Button>
        </div>
      );
    }},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transfers</h1>
          <p className="text-gray-500">{pagination.total} transfer requests</p>
        </div>
        <Button onClick={openNewModal}><Plus className="h-4 w-4" /> New Transfer</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : transfers.length === 0 ? (
        <EmptyState icon={<GitBranch className="h-8 w-8 text-gray-400" />} title="No transfers" description="No transfer requests yet" />
      ) : (
        <Card><DataTable columns={columns} data={transfers} pagination={pagination} onPageChange={setPage} /></Card>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Transfer Request"
        footer={<><Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={handleSubmit}>Submit</Button></>}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Asset *</label>
            <select value={form.asset_id} onChange={e => setForm({...form, asset_id: e.target.value})} className="input" required>
              <option value="">Select asset</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.asset_tag} — {a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Target Department *</label>
            <select value={form.target_department_id} onChange={e => setForm({...form, target_department_id: e.target.value})} className="input" required>
              <option value="">Select department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input" rows={3} placeholder="Reason for transfer..." />
          </div>
        </form>
      </Modal>
    </div>
  );
}
