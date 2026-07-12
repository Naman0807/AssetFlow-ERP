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
import { Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_HIERARCHY } from '@/lib/constants';

interface AuditCycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  scope_location: string;
  department: { id: string; name: string } | null;
  assignments: any[];
}

export default function AuditsPage() {
  const { profile } = useAuth();
  const [cycles, setCycles] = useState<AuditCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [showNew, setShowNew] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', scope_department_id: '', scope_location: '', start_date: '', end_date: '' });

  const isAdmin = ROLE_HIERARCHY[profile?.role || 'Employee'] >= ROLE_HIERARCHY['Admin'];

  const fetchCycles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/v1/audits/cycles?page=${page}&limit=20`);
      setCycles(data.cycles || []);
      setPagination(data.pagination || { page: 1, total: 0, limit: 20 });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchCycles(); }, [fetchCycles]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/audits/cycles', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          scope_department_id: form.scope_department_id || null,
          scope_location: form.scope_location || null,
        }),
      });
      setShowNew(false);
      setForm({ name: '', scope_department_id: '', scope_location: '', start_date: '', end_date: '' });
      fetchCycles();
    } catch (err: any) { alert(err.message); }
  };

  const openNew = async () => {
    const data = await apiFetch('/api/v1/admin/departments');
    setDepartments(data.departments || []);
    setShowNew(true);
  };

  const handleClose = async (id: string) => {
    if (!confirm('Close this audit cycle? This will lock all results.')) return;
    try {
      await apiFetch(`/api/v1/audits/cycles/${id}/close`, { method: 'POST', body: '{}' });
      fetchCycles();
    } catch (err: any) { alert(err.message); }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (c: AuditCycle) => <Link href={`/audits/${c.id}`} className="text-blue-600 hover:underline font-medium">{c.name}</Link> },
    { key: 'department', header: 'Department', render: (c: AuditCycle) => c.department?.name || 'All' },
    { key: 'scope_location', header: 'Location', render: (c: AuditCycle) => c.scope_location || 'All' },
    { key: 'dates', header: 'Period', render: (c: AuditCycle) => `${formatDate(c.start_date)} — ${formatDate(c.end_date)}` },
    { key: 'assignments', header: 'Auditors', render: (c: AuditCycle) => c.assignments?.length || 0 },
    { key: 'is_closed', header: 'Status', render: (c: AuditCycle) => c.is_closed ? <Badge value="Closed" /> : <Badge value="Active" /> },
    { key: 'actions', header: '', render: (c: AuditCycle) => {
      if (!isAdmin || c.is_closed) return null;
      return <Button size="sm" variant="ghost" onClick={() => handleClose(c.id)}>Close Cycle</Button>;
    }},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Cycles</h1>
          <p className="text-gray-500">{pagination.total} cycles</p>
        </div>
        {isAdmin && <Button onClick={openNew}><Plus className="h-4 w-4" /> New Cycle</Button>}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : cycles.length === 0 ? (
        <EmptyState icon={<ShieldCheck className="h-8 w-8 text-gray-400" />} title="No audit cycles" description="Create your first audit cycle" />
      ) : (
        <Card><DataTable columns={columns} data={cycles} pagination={pagination} onPageChange={setPage} /></Card>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Audit Cycle"
        footer={<><Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={handleCreate}>Create</Button></>}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Cycle Name *</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" required placeholder="e.g. Q1 2026 Verification" />
          </div>
          <div>
            <label className="label">Department</label>
            <select value={form.scope_department_id} onChange={e => setForm({...form, scope_department_id: e.target.value})} className="input">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input value={form.scope_location} onChange={e => setForm({...form, scope_location: e.target.value})} className="input" placeholder="e.g. Building A" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date *</label>
              <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="input" required />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="input" required />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
