import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Ticket } from "lucide-react";
import TicketFilters from "@/components/tickets/TicketFilters";
import TicketTable from "@/components/tickets/TicketTable";
import TicketCard from "@/components/tickets/TicketCard";
import DateRangeFilter from "@/components/dashboard/DateRangeFilter";
import { isManagerOrAdmin } from "@/lib/slaUtils";
import { getLiveTickets, isTicketSlaBreached } from "@/lib/slaAgent.js";
import { getCurrentCalendarMonthRange, getCustomDateRange, filterTicketsByDateRange } from "@/lib/dateRangeUtils";

// KPI filter mappings (applied after date range)
const KPI_FILTER_MAP = {
  open:       { label: 'קריאות פתוחות',             fn: (t) => t.status !== 'נסגרה' },
  inProgress: { label: 'קריאות בטיפול',              fn: (t) => ['בטיפול', 'שויכה לטיפול'].includes(t.status) },
  breached:   { label: 'קריאות חורגות SLA',          fn: (t) => isTicketSlaBreached(t, Date.now()) },
  critical:   { label: 'קריאות קריטיות',             fn: (t) => t.priority === 'קריטית' && t.status !== 'נסגרה' },
  closed:     { label: 'קריאות סגורות',               fn: (t) => t.status === 'נסגרה' },
  slaRate:    { label: 'קריאות סגורות — עמידת SLA',  fn: (t) => t.status === 'נסגרה' },
};

export default function Tickets() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [filters, setFilters] = useState({ status: "הכל", priority: "הכל", sla: "הכל", search: "" });

  // Read params from URL
  const kpiKey      = searchParams.get('kpi');
  const kpiFilter   = kpiKey ? KPI_FILTER_MAP[kpiKey] : null;
  const fromParam   = searchParams.get('from');
  const toParam     = searchParams.get('to');
  const statusParam = searchParams.get('status');
  const slaParam    = searchParams.get('sla');

  const initialRange = fromParam && toParam
    ? getCustomDateRange(fromParam, toParam)
    : getCurrentCalendarMonthRange();

  const [selectedRange, setSelectedRange] = useState(initialRange);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setUserLoaded(true); }).catch(() => setUserLoaded(true));
  }, []);

  const { data: rawTickets = [], isLoading } = useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: () => {
      if (isManagerOrAdmin(user)) {
        return base44.entities.ServiceTicket.list('-created_date', 500);
      }
      return base44.entities.ServiceTicket.filter({ created_by_id: user.id }, '-created_date', 200);
    },
    enabled: userLoaded && !!user,
  });

  // סינון: חיות → תקופה → KPI / filters
  const liveTickets   = getLiveTickets(rawTickets);
  const periodTickets = isManagerOrAdmin(user) ? filterTicketsByDateRange(liveTickets, selectedRange) : liveTickets;
  const now = new Date();

  const filtered = periodTickets.filter(t => {
    if (kpiFilter) return kpiFilter.fn(t);
    if (statusParam && t.status !== statusParam) return false;
    if (slaParam === 'breached' && !isTicketSlaBreached(t, Date.now())) return false;
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

  const showDateFilter = isManagerOrAdmin(user);

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

      {showDateFilter && (
        <DateRangeFilter value={selectedRange} onChange={setSelectedRange} />
      )}

      {!kpiFilter && !statusParam && !slaParam && (
        <TicketFilters filters={filters} onChange={setFilters} />
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16" dir="rtl">
          <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold mb-1">אין קריאות בתקופה זו</p>
          <p className="text-sm text-muted-foreground">נסה לשנות את טווח התאריכים או הפילטרים.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <TicketTable tickets={filtered} />
          </div>
          <div className="md:hidden space-y-3">
            {filtered.map(t => <TicketCard key={t.id} ticket={t} />)}
          </div>
        </>
      )}
    </div>
  );
}