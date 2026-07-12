'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch, formatDate, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { Plus, Package, Filter } from 'lucide-react';

interface Asset {
  id: string;
  asset_tag: string;
  name: string;
  status: string;
  serial_number: string;
  location: string;
  condition: string;
  acquisition_cost: number;
  is_shared_bookable: boolean;
  category: { id: string; name: string } | null;
  current_holder: { id: string; name: string; email: string } | null;
  department: { id: string; name: string } | null;
  created_at: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const data = await apiFetch(`/api/v1/assets?${params}`);
      setAssets(data.assets || []);
      setPagination(data.pagination || { page: 1, total: 0, limit: 20 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const columns = [
    { key: 'asset_tag', header: 'Tag', render: (a: Asset) => <span className="font-mono text-sm font-medium">{a.asset_tag}</span> },
    { key: 'name', header: 'Name', render: (a: Asset) => (
      <Link href={`/assets/${a.id}`} className="text-blue-600 hover:underline font-medium">{a.name}</Link>
    )},
    { key: 'category', header: 'Category', render: (a: Asset) => a.category?.name || '-' },
    { key: 'status', header: 'Status', render: (a: Asset) => <Badge value={a.status} /> },
    { key: 'location', header: 'Location' },
    { key: 'current_holder', header: 'Holder', render: (a: Asset) => a.current_holder?.name || <span className="text-gray-400">Unassigned</span> },
    { key: 'is_shared_bookable', header: 'Bookable', render: (a: Asset) => a.is_shared_bookable ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <p className="text-gray-500">{pagination.total} assets total</p>
        </div>
        <Link href="/assets/new">
          <Button><Plus className="h-4 w-4" /> Register Asset</Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by tag, name, serial..." />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input w-48"
          >
            <option value="">All Statuses</option>
            {['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : assets.length === 0 ? (
        <EmptyState title="No assets found" description="Register your first asset to get started" action={
          <Link href="/assets/new"><Button><Plus className="h-4 w-4" /> Register Asset</Button></Link>
        } />
      ) : (
        <Card>
          <DataTable columns={columns} data={assets} pagination={pagination} onPageChange={setPage} />
        </Card>
      )}
    </div>
  );
}
