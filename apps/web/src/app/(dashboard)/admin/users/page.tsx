'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Card } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { Modal } from '@/components/ui/Modal';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  department: { id: string; name: string } | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [editModal, setEditModal] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const data = await apiFetch(`/api/v1/admin/users?${params}`);
      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, total: 0, limit: 20 });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async () => {
    if (!editModal) return;
    try {
      await apiFetch(`/api/v1/admin/users/${editModal.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setEditModal(null);
      fetchUsers();
    } catch (err: any) { alert(err.message); }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (u: User) => <span className="font-medium">{u.name}</span> },
    { key: 'email', header: 'Email' },
    { key: 'department', header: 'Department', render: (u: User) => u.department?.name || '-' },
    { key: 'role', header: 'Role', render: (u: User) => <Badge value={u.role} /> },
    { key: 'is_active', header: 'Status', render: (u: User) => u.is_active ? <span className="text-green-600 text-sm">Active</span> : <span className="text-gray-400 text-sm">Inactive</span> },
    { key: 'actions', header: '', render: (u: User) => (
      <Button size="sm" variant="ghost" onClick={() => { setEditModal(u); setNewRole(u.role); }}>
        <ShieldCheck className="h-4 w-4" /> Edit Role
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
        <div><h1 className="text-2xl font-bold">User Directory</h1><p className="text-gray-500">{pagination.total} users</p></div>
      </div>

      <Card className="p-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search users..." />
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <Card><DataTable columns={columns} data={users} pagination={pagination} onPageChange={setPage} /></Card>
      )}

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Change User Role"
        footer={<><Button variant="secondary" onClick={() => setEditModal(null)}>Cancel</Button><Button onClick={handleRoleChange}>Save</Button></>}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Change role for <strong>{editModal?.name}</strong></p>
          <select value={newRole} onChange={e => setNewRole(e.target.value)} className="input">
            {['Employee', 'Asset Manager', 'Department Head', 'Admin'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  );
}
