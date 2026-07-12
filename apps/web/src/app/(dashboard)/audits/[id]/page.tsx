'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ArrowLeft, Users, Plus } from 'lucide-react';

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

export default function AuditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [cycle, setCycle] = useState<AuditCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const fetchCycle = async () => {
    try {
      const data = await apiFetch(`/api/v1/audits/cycles/${params.id}`);
      setCycle(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCycle(); }, [params.id]);

  const openAssign = async () => {
    const data = await apiFetch('/api/v1/admin/users?limit=100');
    setUsers(data.users || []);
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    try {
      await apiFetch(`/api/v1/audits/cycles/${params.id}/assignments`, {
        method: 'POST',
        body: JSON.stringify({ auditor_ids: selectedUsers }),
      });
      setShowAssignModal(false);
      setSelectedUsers([]);
      fetchCycle();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!cycle) return <div className="text-center py-20 text-gray-500">Cycle not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/audits" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{cycle.name}</h1>
            <Badge value={cycle.is_closed ? 'Closed' : 'Active'} />
          </div>
          <p className="text-gray-500">{formatDate(cycle.start_date)} — {formatDate(cycle.end_date)}</p>
        </div>
        {!cycle.is_closed && (
          <Button onClick={openAssign}><Users className="h-4 w-4" /> Assign Auditors</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Department</p>
            <p className="font-semibold">{cycle.department?.name || 'All'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-semibold">{cycle.scope_location || 'All'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Assigned Auditors</p>
            <p className="font-semibold">{cycle.assignments?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Auditors</CardTitle></CardHeader>
        <CardContent className="p-6">
          {cycle.assignments?.length === 0 ? (
            <p className="text-gray-500 text-sm">No auditors assigned yet</p>
          ) : (
            <div className="space-y-3">
              {cycle.assignments.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm font-medium">
                      {a.auditor?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{a.auditor?.name}</p>
                      <p className="text-xs text-gray-500">{a.auditor?.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">Assignment #{a.id.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Auditors"
        footer={<><Button variant="secondary" onClick={() => setShowAssignModal(false)}>Cancel</Button><Button onClick={handleAssign}>Assign</Button></>}>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {users.map(u => (
            <label key={u.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedUsers.includes(u.id)}
                onChange={e => {
                  if (e.target.checked) setSelectedUsers([...selectedUsers, u.id]);
                  else setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                }}
                className="rounded"
              />
              <div>
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
}
