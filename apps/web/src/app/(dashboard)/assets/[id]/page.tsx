'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, formatDate, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, MapPin, Tag, Calendar, DollarSign, User, Building2 } from 'lucide-react';

interface AssetDetail {
  id: string;
  asset_tag: string;
  name: string;
  status: string;
  serial_number: string;
  acquisition_date: string;
  acquisition_cost: number;
  condition: string;
  location: string;
  is_shared_bookable: boolean;
  category: { id: string; name: string } | null;
  current_holder: { id: string; name: string; email: string } | null;
  department: { id: string; name: string } | null;
  allocation_history: any[];
}

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/v1/assets/${params.id}`)
      .then(setAsset)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!asset) return <div className="text-center py-20 text-gray-500">Asset not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/assets" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{asset.name}</h1>
            <Badge value={asset.status} />
          </div>
          <p className="text-gray-500 font-mono">{asset.asset_tag}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Asset Details</CardTitle></CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><Tag className="h-4 w-4 text-gray-400" /><div><p className="text-xs text-gray-500">Category</p><p className="text-sm font-medium">{asset.category?.name || '-'}</p></div></div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /><div><p className="text-xs text-gray-500">Location</p><p className="text-sm font-medium">{asset.location}</p></div></div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" /><div><p className="text-xs text-gray-500">Acquired</p><p className="text-sm font-medium">{formatDate(asset.acquisition_date)}</p></div></div>
              <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-gray-400" /><div><p className="text-xs text-gray-500">Cost</p><p className="text-sm font-medium">{asset.acquisition_cost ? formatCurrency(asset.acquisition_cost) : '-'}</p></div></div>
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" /><div><p className="text-xs text-gray-500">Holder</p><p className="text-sm font-medium">{asset.current_holder?.name || 'Unassigned'}</p></div></div>
              <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-gray-400" /><div><p className="text-xs text-gray-500">Department</p><p className="text-sm font-medium">{asset.department?.name || '-'}</p></div></div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500">Condition</p>
              <p className="text-sm font-medium">{asset.condition}</p>
            </div>
          </CardContent>
        </Card>

        {/* Allocation History */}
        <Card>
          <CardHeader><CardTitle>Allocation History</CardTitle></CardHeader>
          <CardContent className="p-6">
            {asset.allocation_history?.length === 0 ? (
              <p className="text-sm text-gray-500">No allocation history</p>
            ) : (
              <div className="space-y-4">
                {asset.allocation_history?.map((h: any) => (
                  <div key={h.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{h.user?.name || h.department?.name || 'Unknown'}</p>
                      <Badge value={h.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Since {formatDate(h.allocated_at)}</p>
                    {h.actual_return_date && <p className="text-xs text-gray-500">Returned {formatDate(h.actual_return_date)}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
