import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download, Search, CheckCircle, XCircle, Ban, UserCheck, Building2 } from "lucide-react";
import RegistrationKPIs from "./RegistrationKPIs";
import { exportRegistrationsToCSV, STATUS_LABELS } from "@/lib/eventExport";

const FILTERS = [
  { key: 'all', label: 'הכל' },
  { key: 'active_tenant', label: 'דיירים פעילים' },
  { key: 'new', label: 'חדשים' },
  { key: 'waitlist', label: 'רשימת המתנה' },
  { key: 'approved', label: 'אושרו' },
  { key: 'cancelled', label: 'בוטלו' },
  { key: 'attended', label: 'הגיעו' },
  { key: 'no_show', label: 'לא הגיעו' },
];

const STATUS_COLORS = {
  registered: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  pending_approval: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
  attended: 'bg-green-100 text-green-700',
  no_show: 'bg-red-100 text-red-700',
  waitlist: 'bg-orange-100 text-orange-700',
};

export default function RegistrationsTable({ registrations, activeEvent, isLoading, user }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.EventRegistration.update(id, { registration_status: status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-registrations'] }),
  });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  if (!activeEvent) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          אין אירוע פעיל. צור והפעל אירוע בכרטיסייה "ניהול אירוע".
        </CardContent>
      </Card>
    );
  }

  // Apply filters
  let filtered = registrations;
  if (filter === 'active_tenant') filtered = filtered.filter(r => r.is_active_tenant);
  else if (filter === 'new') filtered = filtered.filter(r => !r.is_active_tenant);
  else if (filter !== 'all') filtered = filtered.filter(r => r.registration_status === filter);

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(r =>
      r.full_name?.toLowerCase().includes(s) ||
      r.phone?.toLowerCase().includes(s) ||
      r.email?.toLowerCase().includes(s) ||
      r.company_name?.toLowerCase().includes(s) ||
      r.room_number?.toLowerCase().includes(s)
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <RegistrationKPIs registrations={registrations} />

      {/* Filters + search + export */}
      <div className="flex flex-col gap-3 min-w-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors shrink-0 ${
                filter === f.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם, טלפון, מייל, חברה, חדר..."
              className="pr-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => exportRegistrationsToCSV(filtered, activeEvent.event_name)}>
            <Download className="w-3.5 h-3.5" />ייצוא לאקסל
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden min-w-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right">שם</TableHead>
                <TableHead className="text-right">טלפון</TableHead>
                <TableHead className="text-right">מייל</TableHead>
                <TableHead className="text-center w-[60px]">משתתפים</TableHead>
                <TableHead className="text-center w-[50px]">ילדים</TableHead>
                <TableHead className="text-center w-[70px]">דייר פעיל</TableHead>
                <TableHead className="text-right">חברה / חדר</TableHead>
                <TableHead className="text-right w-[100px]">סטטוס</TableHead>
                <TableHead className="text-right w-[120px]">תאריך הרשמה</TableHead>
                <TableHead className="text-center w-[180px]">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    אין נרשמים בסינון זה
                  </TableCell>
                </TableRow>
              ) : filtered.map(r => (
                <TableRow key={r.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-sm">{r.full_name}</TableCell>
                  <TableCell className="text-sm" dir="ltr">{r.phone}</TableCell>
                  <TableCell className="text-sm truncate max-w-[150px]" dir="ltr">{r.email}</TableCell>
                  <TableCell className="text-center text-sm">{r.participants_count}</TableCell>
                  <TableCell className="text-center text-sm">{r.children_count}</TableCell>
                  <TableCell className="text-center">
                    {r.is_active_tenant ? (
                      <span className="text-green-600 text-xs font-medium">✓ כן</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.company_name && (
                      <div className="flex items-center gap-1 text-xs">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate max-w-[100px]">{r.company_name}</span>
                      </div>
                    )}
                    {r.room_number && <p className="text-xs text-muted-foreground">חדר {r.room_number}</p>}
                  </TableCell>
                  <TableCell>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.registration_status] || 'bg-gray-100'}`}>
                      {STATUS_LABELS[r.registration_status] || r.registration_status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.registered_at ? new Date(r.registered_at).toLocaleDateString('he-IL') : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-center">
                      <ActionBtn icon={CheckCircle} title="אשר" color="text-green-600" onClick={() => updateStatus.mutate({ id: r.id, status: 'approved' })} disabled={updateStatus.isPending} />
                      <ActionBtn icon={Ban} title="בטל" color="text-red-600" onClick={() => updateStatus.mutate({ id: r.id, status: 'cancelled' })} disabled={updateStatus.isPending} />
                      <ActionBtn icon={UserCheck} title="הגיע" color="text-green-600" onClick={() => updateStatus.mutate({ id: r.id, status: 'attended' })} disabled={updateStatus.isPending} />
                      <ActionBtn icon={XCircle} title="לא הגיע" color="text-red-600" onClick={() => updateStatus.mutate({ id: r.id, status: 'no_show' })} disabled={updateStatus.isPending} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function ActionBtn({ icon: Icon, title, color, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded hover:bg-muted transition-colors ${color} disabled:opacity-50`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}