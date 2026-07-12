'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    category_id: '',
    serial_number: '',
    acquisition_date: '',
    acquisition_cost: '',
    condition: 'Good',
    location: '',
    is_shared_bookable: false,
    current_department_id: '',
  });

  useEffect(() => {
    Promise.all([
      apiFetch('/api/v1/admin/categories'),
      apiFetch('/api/v1/admin/departments'),
    ]).then(([catData, deptData]) => {
      setCategories(catData.categories || []);
      setDepartments(deptData.departments || []);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/api/v1/assets', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          acquisition_cost: form.acquisition_cost ? parseFloat(form.acquisition_cost) : null,
          current_department_id: form.current_department_id || null,
        }),
      });
      router.push('/assets');
    } catch (err: any) {
      alert(err.message || 'Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/assets" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold">Register New Asset</h1>
          <p className="text-gray-500">Add a new asset to the system</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Asset Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="label">Category *</label>
                <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="input" required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Serial Number</label>
                <input value={form.serial_number} onChange={e => setForm({...form, serial_number: e.target.value})} className="input" />
              </div>
              <div>
                <label className="label">Acquisition Date *</label>
                <input type="date" value={form.acquisition_date} onChange={e => setForm({...form, acquisition_date: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="label">Acquisition Cost ($)</label>
                <input type="number" step="0.01" value={form.acquisition_cost} onChange={e => setForm({...form, acquisition_cost: e.target.value})} className="input" />
              </div>
              <div>
                <label className="label">Condition *</label>
                <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className="input" required>
                  {['New', 'Good', 'Fair', 'Poor', 'Damaged'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Location *</label>
                <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="input" required placeholder="e.g. Floor 3, Room 301" />
              </div>
              <div>
                <label className="label">Department</label>
                <select value={form.current_department_id} onChange={e => setForm({...form, current_department_id: e.target.value})} className="input">
                  <option value="">None</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="bookable" checked={form.is_shared_bookable} onChange={e => setForm({...form, is_shared_bookable: e.target.checked})} className="rounded" />
              <label htmlFor="bookable" className="text-sm text-gray-700">Shared / Bookable</label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/assets"><Button type="button" variant="secondary">Cancel</Button></Link>
              <Button type="submit" loading={loading}>Create Asset</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
