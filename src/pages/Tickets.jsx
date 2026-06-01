import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Ticket } from "lucide-react";
import TicketFilters from "@/components/tickets/TicketFilters";
import TicketTable from "@/components/tickets/TicketTable";
import TicketCard from "@/components/tickets/TicketCard";
import { isManagerOrAdmin } from "@/lib/slaUtils";

// KPI filter mappings
const KPI_FILTER_MAP = {
  open:       { label: 'קריאות פתוחות',        fn: (t, now) => t.status === 'פתוחה' },
  inProgress: { label: 'קריאות בטיפול',         fn: (t, now) => ['בטיפול', 'שויכה לטיפול'].includes(t.status) },
  breached:   { label: 'קריאות חורגות SLA',     fn: (t, now) => t.sla_breached || (t.sla_deadline && new Date(t.sla_deadline) < now && t.status !== 'נסגרה') },
  critical:   { label: 'קריאות קריטיות',        fn: (t, now) => t.priority === 'קריטית' && t.status !== 'נסגרה' },
  closed:     { label: 'קריאות סגורות',          fn: (t, now) => t.status === 'נסגרה' },
  slaRate:    { label: 'קריאות סגורות — עמידת SLA', fn: (t, now) => t.status === 'נסגרה' },
};

export default function Tickets() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [filters, setFilters] = useState({ status: "הכל", priority: "הכל", sla: "הכל", search: "" });

  // Read KPI filter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const kpiKey = urlParams.get('kpi');
  const kpiFilter = kpiKey ? KPI_FILTER_MAP[kpiKey] : null;

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setUserLoaded(true); }).catch(() => setUserLoaded(true));
  }, []);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: () => {
      if (isManagerOrAdmin(user)) {
        return base44.entities.ServiceTicket.list('-created_date', 500);
      }
      return base44.entities.ServiceTicket.filter({ created_by_id: user.id }, '-created_date', 200);
    },
    enabled: userLoaded && !!user,
  });

  const now = new Date();
  const filtered = tickets.filter(t => {
    // KPI filter overrides regular filters
    if (kpiFilter) return kpiFilter.fn(t, now);
    if (filters.status !== "הכל" && t.status !== filters.status) return false;
    if (filters.priority !== "הכל" && t.priority !== filters.priority) return false;
    if (filters.sla !== "הכל") {
      const deadline = t.sla_deadline ? new Date(t.sla_deadline) : null;
      if (filters.sla === "חריגה" && (!deadline || deadline >= now || t.status === 'נסגרה')) return false;
      if (filters.sla === "בזמן" && deadline && deadline < now && t.status !== 'נסגרה') return false;
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!t.customer_name?.toLowerCase().includes(s) && !t.room_number?.toLowerCase().includes(s) && !t.issue_description?.toLowerCase().includes(s) && !t.ticket_number?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  if (!userLoaded || isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-20" dir="rtl">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Ticket className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-semibold mb-1">אין קריאות שירות</p>
        <p className="text-muted-foreground text-sm mb-6">כאן יופיעו קריאות השירות לאחר פתיחת הקריאה הראשונה.</p>
        <Button onClick={() => navigate("/tickets/new")} className="gap-2">
          <Plus className="w-4 h-4" />פתח קריאת שירות
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{kpiFilter ? kpiFilter.label : 'קריאות שירות'}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-muted-foreground text-sm">{filtered.length} קריאות</p>
            {kpiFilter && (
              <button onClick={() => navigate('/tickets')} className="text-xs text-primary hover:underline">הצג הכל</button>
            )}
          </div>
        </div>
        <Button onClick={() => navigate("/tickets/new")} className="gap-2" size="sm">
          <Plus className="w-4 h-4" />קריאה חדשה
        </Button>
      </div>

      {!kpiFilter && <TicketFilters filters={filters} onChange={setFilters} />}

      {/* Desktop table */}
      <div className="hidden md:block">
        <TicketTable tickets={filtered} />
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">אין קריאות להצגה</p>
        ) : (
          filtered.map(t => <TicketCard key={t.id} ticket={t} />)
        )}
      </div>
    </div>
  );
}