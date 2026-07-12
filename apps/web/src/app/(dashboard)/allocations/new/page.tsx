'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';

export default function NewAllocationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [form, setForm] = useState({ asset_id: '', assigned_to_user_id: '', assigned_to_dept_id: '', expected_return_date: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/api/v1/assets?status=Available&limit=100'),
      apiFetch('/api/v1/admin/users?limit=100'),
      apiFetch('/api/v1/admin/departments'),
    ]).then(([assetData, userData, deptData]) => {
      setAssets(assetData.assets || []);
      setUsers(userData.users || []);
      setDepartments(deptData.departments || []);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/v1/allocations', {
        method: 'POST',
        body: JSON.stringify({
          asset_id: form.asset_id,
          assigned_to_user_id: form.assigned_to_user_id || null,
          assigned_to_dept_id: form.assigned_to_dept_id || null,
          expected_return_date: form.expected_return_date || null,
        }),
      });
      router.push('/allocations');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/allocations" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
        <div><h1 className="text-2xl font-bold">New Allocation</h1><p className="text-gray-500">Assign an available asset</p></div>
      </div>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="label">Asset *</label>
              <select value={form.asset_id} onChange={e => setForm({...form, asset_id: e.target.value})} className="input" required>
                <option value="">Select available asset</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.asset_tag} — {a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Assign to Employee</label>
              <select value={form.assigned_to_user_id} onChange={e => setForm({...form, assigned_to_user_id: e.target.value, assigned_to_dept_id: ''})} className="input">
                <option value="">None</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Assign to Department</label>
              <select value={form.assigned_to_dept_id} onChange={e => setForm({...form, assigned_to_dept_id: e.target.value, assigned_to_user_id: ''})} className="input">
                <option value="">None</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Expected Return Date</label>
              <input type="date" value={form.expected_return_date} onChange={e => setForm({...form, expected_return_date: e.target.value})} className="input" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/allocations"><Button type="button" variant="secondary">Cancel</Button></Link>
              <Button type="submit" loading={loading}>Create Allocation</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
