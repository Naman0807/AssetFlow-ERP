'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, GitBranch } from 'lucide-react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';

interface Allocation {
  id: string;
  status: string;
  expected_return_date: string;
  actual_return_date: string;
  allocated_at: string;
  condition_on_return: string;
  asset: { id: string; asset_tag: string; name: string; status: string } | null;
  user: { id: string; name: string; email: string } | null;
  department: { id: string; name: string } | null;
}

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [returnModal, setReturnModal] = useState<Allocation | null>(null);
  const [returnCondition, setReturnCondition] = useState('');
  const [userModal, setUserModal] = useState<{ userId: string; userName: string } | null>(null);
  const [userAllocations, setUserAllocations] = useState<Allocation[]>([]);
  const [userAllocLoading, setUserAllocLoading] = useState(false);

  const fetchUserAllocations = async (userId: string) => {
    setUserAllocLoading(true);
    try {
      const data = await apiFetch(`/api/v1/allocations?user_id=${userId}&limit=100`);
      setUserAllocations(data.allocations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setUserAllocLoading(false);
    }
  };

  const fetchAllocations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/v1/allocations?page=${page}&limit=20`);
      setAllocations(data.allocations || []);
      setPagination(data.pagination || { page: 1, total: 0, limit: 20 });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchAllocations(); }, [fetchAllocations]);

  const handleReturn = async () => {
    if (!returnModal) return;
    try {
      await apiFetch(`/api/v1/allocations/${returnModal.id}/return`, {
        method: 'POST',
        body: JSON.stringify({ condition_on_return: returnCondition }),
      });
      setReturnModal(null);
      setReturnCondition('');
      fetchAllocations();
    } catch (err: any) { alert(err.message); }
  };

  const columns = [
    { key: 'asset', header: 'Asset', render: (a: Allocation) => <Link href={`/assets/${a.asset?.id}`} className="text-blue-600 hover:underline">{a.asset?.asset_tag} — {a.asset?.name}</Link> },
    { key: 'user', header: 'Assigned To', render: (a: Allocation) => a.user ? (
      <button onClick={() => { setUserModal({ userId: a.user!.id, userName: a.user!.name }); fetchUserAllocations(a.user!.id); }} className="text-blue-600 hover:underline font-medium cursor-pointer">
        {a.user.name}
      </button>
    ) : a.department?.name || '-' },
    { key: 'status', header: 'Status', render: (a: Allocation) => <Badge value={a.status} /> },
    { key: 'expected_return_date', header: 'Expected Return', render: (a: Allocation) => a.expected_return_date ? formatDate(a.expected_return_date) : '-' },
    { key: 'allocated_at', header: 'Allocated', render: (a: Allocation) => formatDate(a.allocated_at) },
    { key: 'actions', header: '', render: (a: Allocation) => a.status === 'Active' ? (
      <Button size="sm" variant="ghost" onClick={() => setReturnModal(a)}>Return</Button>
    ) : null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Allocations</h1>
          <p className="text-gray-500">{pagination.total} allocations</p>
        </div>
        <Link href="/allocations/new"><Button><Plus className="h-4 w-4" /> New Allocation</Button></Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : allocations.length === 0 ? (
        <EmptyState title="No allocations" description="Create your first allocation" />
      ) : (
        <Card><DataTable columns={columns} data={allocations} pagination={pagination} onPageChange={setPage} /></Card>
      )}

      <Modal open={!!returnModal} onClose={() => setReturnModal(null)} title="Return Asset"
        footer={<><Button variant="secondary" onClick={() => setReturnModal(null)}>Cancel</Button><Button onClick={handleReturn}>Confirm Return</Button></>}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Return <strong>{returnModal?.asset?.name}</strong>?</p>
          <div>
            <label className="label">Condition Notes</label>
            <textarea value={returnCondition} onChange={e => setReturnCondition(e.target.value)} className="input" rows={3} placeholder="Describe the condition on return..." />
          </div>
        </div>
      </Modal>

      <Modal open={!!userModal} onClose={() => { setUserModal(null); setUserAllocations([]); }} title={`Allocations — ${userModal?.userName}`} size="lg">
        {userAllocLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : userAllocations.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No allocations found for this user.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{userAllocations.length} allocation(s) found</p>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Asset</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Allocated</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Expected Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {userAllocations.map((alloc) => (
                    <tr key={alloc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/assets/${alloc.asset?.id}`} className="text-blue-600 hover:underline">
                          {alloc.asset?.asset_tag} — {alloc.asset?.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3"><Badge value={alloc.status} /></td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(alloc.allocated_at)}</td>
                      <td className="px-4 py-3 text-gray-600">{alloc.expected_return_date ? formatDate(alloc.expected_return_date) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
