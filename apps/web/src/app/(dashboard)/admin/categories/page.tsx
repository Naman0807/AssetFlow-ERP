'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { ArrowLeft, Plus, Tag, Edit } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  custom_fields: Record<string, any>;
  created_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', custom_fields: '{}' });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/v1/admin/categories');
      setCategories(data.categories || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body: any = { name: form.name };
      try { body.custom_fields = JSON.parse(form.custom_fields); } catch { body.custom_fields = {}; }

      if (editCat) {
        await apiFetch(`/api/v1/admin/categories/${editCat.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await apiFetch('/api/v1/admin/categories', { method: 'POST', body: JSON.stringify(body) });
      }
      setShowModal(false);
      setEditCat(null);
      setForm({ name: '', custom_fields: '{}' });
      fetchCategories();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
          <div><h1 className="text-2xl font-bold">Asset Categories</h1><p className="text-gray-500">{categories.length} categories</p></div>
        </div>
        <Button onClick={() => { setEditCat(null); setForm({ name: '', custom_fields: '{}' }); setShowModal(true); }}><Plus className="h-4 w-4" /> Add Category</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : categories.length === 0 ? (
        <EmptyState icon={<Tag className="h-8 w-8 text-gray-400" />} title="No categories" description="Create your first asset category" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(c => (
            <Card key={c.id} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{c.name}</h3>
                  {Object.keys(c.custom_fields || {}).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(c.custom_fields).map(([k, v]) => (
                        <p key={k} className="text-xs text-gray-500"><span className="font-medium">{k}:</span> {String(v)}</p>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => { setEditCat(c); setForm({ name: c.name, custom_fields: JSON.stringify(c.custom_fields, null, 2) }); setShowModal(true); }} className="p-2 rounded-lg hover:bg-gray-100">
                  <Edit className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editCat ? 'Edit Category' : 'New Category'}
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleSubmit}>Save</Button></>}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Category Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" required />
          </div>
          <div>
            <label className="label">Custom Fields (JSON)</label>
            <textarea value={form.custom_fields} onChange={e => setForm({...form, custom_fields: e.target.value})} className="input font-mono text-sm" rows={4} placeholder='{"warranty_period_months": 12}' />
          </div>
        </form>
      </Modal>
    </div>
  );
}
