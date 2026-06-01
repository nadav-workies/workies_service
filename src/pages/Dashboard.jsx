import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Ticket, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import KPICards from "@/components/dashboard/KPICards";
import TicketTable from "@/components/tickets/TicketTable";
import TicketCard from "@/components/tickets/TicketCard";
import { isManagerOrAdmin, getTimeRemainingLabel } from "@/lib/slaUtils";
import { StatusBadge, PriorityBadge, SlaBadge } from "@/components/tickets/TicketStatusBadge";

function UserDashboard({ user }) {
  const navigate = useNavigate();
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['my-tickets', user?.id],
    queryFn: () => base44.entities.ServiceTicket.filter({ created_by_id: user.id }, '-created_date', 50),
    enabled: !!user?.id,
  });

  const open = tickets.filter(t => t.status !== 'נסגרה');
  const closed = tickets.filter(t => t.status === 'נסגרה').slice(0, 5);

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">שלום, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground text-sm">הקריאות שלי</p>
        </div>
        <Button onClick={() => navigate("/tickets/new")} className="gap-2" size="sm">
          <Plus className="w-4 h-4" />קריאה חדשה
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold mb-1">אין קריאות עדיין</p>
          <p className="text-sm text-muted-foreground mb-4">כאן יופיעו קריאות השירות לאחר פתיחת הקריאה הראשונה.</p>
          <Button onClick={() => navigate("/tickets/new")} className="gap-2">
            <Plus className="w-4 h-4" />פתח קריאת שירות
          </Button>
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3 text-sm">קריאות פתוחות ({open.length})</h2>
              <div className="space-y-3">
                {open.map(t => <TicketCard key={t.id} ticket={t} />)}
              </div>
            </div>
          )}
          {closed.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3 text-sm text-muted-foreground">קריאות אחרונות שנסגרו</h2>
              <div className="space-y-3">
                {closed.map(t => <TicketCard key={t.id} ticket={t} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ManagerDashboard({ user }) {
  const navigate = useNavigate();
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.ServiceTicket.list('-created_date', 300),
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const now = new Date();
  const open = tickets.filter(t => t.status !== 'נסגרה');
  const breached = open.filter(t => t.sla_deadline && new Date(t.sla_deadline) < now);
  const critical = open.filter(t => t.priority === 'קריטית');
  const warning = open.filter(t => {
    if (!t.sla_deadline) return false;
    const dl = new Date(t.sla_deadline);
    const diffMin = (dl - now) / 60000;
    return diffMin > 0 && diffMin <= 30 && dl > now;
  });

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">דשבורד תפעול</h1>
          <p className="text-muted-foreground text-sm">תמונת מצב בזמן אמת</p>
        </div>
        <Button onClick={() => navigate("/tickets/new")} className="gap-2" size="sm">
          <Plus className="w-4 h-4" />קריאה חדשה
        </Button>
      </div>

      <KPICards tickets={tickets} />

      {/* Urgent sections */}
      {breached.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm text-red-600 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />חורגות SLA ({breached.length})
          </h2>
          <div className="hidden md:block"><TicketTable tickets={breached} /></div>
          <div className="md:hidden space-y-2">{breached.map(t => <TicketCard key={t.id} ticket={t} />)}</div>
        </div>
      )}

      {warning.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm text-orange-600 mb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />מתקרבות לחריגה ({warning.length})
          </h2>
          <div className="hidden md:block"><TicketTable tickets={warning} /></div>
          <div className="md:hidden space-y-2">{warning.map(t => <TicketCard key={t.id} ticket={t} />)}</div>
        </div>
      )}

      {critical.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-2">קריטיות פתוחות ({critical.length})</h2>
          <div className="hidden md:block"><TicketTable tickets={critical} /></div>
          <div className="md:hidden space-y-2">{critical.map(t => <TicketCard key={t.id} ticket={t} />)}</div>
        </div>
      )}

      {/* All open */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm">כל הקריאות הפתוחות ({open.length})</h2>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/tickets')}>הצג הכל</Button>
        </div>
        <div className="hidden md:block"><TicketTable tickets={open.slice(0, 15)} /></div>
        <div className="md:hidden space-y-2">{open.slice(0, 10).map(t => <TicketCard key={t.id} ticket={t} />)}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  if (isManagerOrAdmin(user)) return <ManagerDashboard user={user} />;
  return <UserDashboard user={user} />;
}