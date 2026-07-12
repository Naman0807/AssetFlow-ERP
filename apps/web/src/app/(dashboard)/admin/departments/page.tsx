'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { ArrowLeft, Plus, Building2, Edit } from 'lucide-react';
import Link from 'next/link';

interface Department {
  id: string;
  name: string;
  is_active: boolean;
  manager: { id: string; name: string } | null;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '' });

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/v1/admin/departments');
      setDepartments(data.departments || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editDept) {
        await apiFetch(`/api/v1/admin/departments/${editDept.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      } else {
        await apiFetch('/api/v1/admin/departments', { method: 'POST', body: JSON.stringify(form) });
      }
      setShowModal(false);
      setEditDept(null);
      setForm({ name: '' });
      fetchDepartments();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
          <div><h1 className="text-2xl font-bold">Departments</h1><p className="text-gray-500">{departments.length} departments</p></div>
        </div>
        <Button onClick={() => { setEditDept(null); setForm({ name: '' }); setShowModal(true); }}><Plus className="h-4 w-4" /> Add Department</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : departments.length === 0 ? (
        <EmptyState icon={<Building2 className="h-8 w-8 text-gray-400" />} title="No departments" description="Create your first department" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(d => (
            <Card key={d.id} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{d.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Manager: {d.manager?.name || 'Unassigned'}</p>
                  <p className={`text-xs mt-2 ${d.is_active ? 'text-green-600' : 'text-gray-400'}`}>{d.is_active ? 'Active' : 'Inactive'}</p>
                </div>
                <button onClick={() => { setEditDept(d); setForm({ name: d.name }); setShowModal(true); }} className="p-2 rounded-lg hover:bg-gray-100">
                  <Edit className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editDept ? 'Edit Department' : 'New Department'}
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleSubmit}>Save</Button></>}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Department Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" required />
          </div>
        </form>
      </Modal>
    </div>
  );
}
