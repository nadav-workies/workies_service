import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Ticket, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import KPICards from "@/components/dashboard/KPICards";
import TicketDistributionCards from "@/components/dashboard/TicketDistributionCards";
import OperationalMetricsCards from "@/components/dashboard/OperationalMetricsCards";
import BirthdayListCard from "@/components/dashboard/BirthdayListCard";
import BirthdayPromptModal from "@/components/user/BirthdayPromptModal";
import DateRangeFilter from "@/components/dashboard/DateRangeFilter";
import TicketTable from "@/components/tickets/TicketTable";
import TicketCard from "@/components/tickets/TicketCard";
import RoomPickerModal from "@/components/user/RoomPickerModal";
import { isManagerOrAdmin } from "@/lib/slaUtils";
import { isTicketSlaBreached, calculateMonthlySlaMetrics, getLiveTickets, getLiveSurveyResponses, isTicketTerminal } from "@/lib/slaAgent.js";
import { getTodayRange, filterTicketsByDateRange, filterSurveyResponsesBySubmittedDate } from "@/lib/dateRangeUtils";

// ─── User dashboard ───────────────────────────────────────────────
function UserDashboard({ user, onUserUpdated }) {
  const navigate = useNavigate();
  const [showRoomPicker, setShowRoomPicker] = useState(
    !isManagerOrAdmin(user) && (!user?.default_location_type || user?.default_location_type === "none")
  );

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['my-tickets', user?.id],
    queryFn: () => base44.entities.ServiceTicket.filter({ created_by_id: user.id }, '-created_date', 50),
    enabled: !!user?.id,
  });

  const open = tickets.filter(t => !isTicketTerminal(t));
  const closed = tickets.filter(t => t.status === 'נסגרה' || t.status === 'הושלם').slice(0, 5);

  const locationLine = user?.default_location_type === "room" && user?.default_room_label
    ? `חדר ${user.default_room_label}`
    : user?.default_location_type === "guest" ? "אורח"
    : user?.default_location_type === "openspace" ? "Open Space"
    : user?.default_location_type === "event" ? "אירוע"
    : null;

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-5" dir="rtl">
      <RoomPickerModal
        open={showRoomPicker}
        onClose={() => setShowRoomPicker(false)}
        onSaved={onUserUpdated}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">שלום, {user?.full_name?.split(' ')[0]} 👋</h1>
          {locationLine && <p className="text-xs text-muted-foreground mt-0.5">{locationLine}</p>}
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
              <h2 className="font-semibold text-sm mb-3">קריאות פתוחות ({open.length})</h2>
              <div className="space-y-2">
                {open.map(t => <TicketCard key={t.id} ticket={t} />)}
              </div>
            </div>
          )}
          {closed.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-muted-foreground mb-3">קריאות שנסגרו לאחרונה</h2>
              <div className="space-y-2">
                {closed.map(t => <TicketCard key={t.id} ticket={t} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Manager dashboard ────────────────────────────────────────────
function ManagerDashboard({ user }) {
  const navigate = useNavigate();

  const [selectedRange, setSelectedRange] = useState(() => getTodayRange());

  const { data: tickets = [], isLoading, refetch: refetchTickets } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.ServiceTicket.list('-created_date', 500),
    refetchInterval: 60000,
  });
  const { data: surveyResponses = [] } = useQuery({
    queryKey: ['survey-responses-dash'],
    queryFn: () => base44.entities.SurveyResponse.list('-submitted_at', 300),
    refetchInterval: 60000,
  });

  // רענון מיידי כשנוצרת קריאה חדשה (real-time)
  useEffect(() => {
    const unsubscribe = base44.entities.ServiceTicket.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        refetchTickets();
      }
    });
    return unsubscribe;
  }, [refetchTickets]);

  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  // ─── סינון: חיות → תקופה → סקרים ────────────────────────────────
  const liveTickets     = getLiveTickets(tickets);
  const periodTickets        = filterTicketsByDateRange(liveTickets, selectedRange);
  const liveSurveys          = getLiveSurveyResponses(surveyResponses);
  const periodSurveys        = filterSurveyResponsesBySubmittedDate(liveSurveys, selectedRange);

  // ─── מדדי SLA לפי טווח נבחר ─────────────────────────────────────
  const slaMetrics = calculateMonthlySlaMetrics(periodTickets, selectedRange, nowMs);

  // ─── קריאות פתוחות (בזמן אמת, ללא קשר לתקופה) ────────────────
  // פתוחות = כל קריאה שאינה בסטטוס סופי (נסגרה / הושלם / בוטל)
  const openAll   = liveTickets.filter(t => !isTicketTerminal(t));
  const breached  = openAll.filter(t => isTicketSlaBreached(t, nowMs));
  const warning   = openAll.filter(t => {
    const dlMs = t.sla_deadline_ms ? Number(t.sla_deadline_ms) : (t.sla_deadline ? new Date(t.sla_deadline).getTime() : null);
    if (!dlMs) return false;
    const diffMin = (dlMs - nowMs) / 60000;
    return diffMin > 0 && diffMin <= 30;
  });
  const open      = periodTickets.filter(t => !isTicketTerminal(t));

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

      <DateRangeFilter value={selectedRange} onChange={setSelectedRange} />

      <KPICards tickets={periodTickets} slaMetrics={slaMetrics} selectedRange={selectedRange} />

      <TicketDistributionCards openTickets={openAll} nowMs={nowMs} selectedRange={selectedRange} />

      <OperationalMetricsCards surveyResponses={periodSurveys} />

      <BirthdayListCard />

      {breached.length > 0 && (
        <section>
          <h2 className="font-semibold text-sm text-red-600 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />חורגות SLA ({breached.length})
          </h2>
          <div className="hidden md:block"><TicketTable tickets={breached} /></div>
          <div className="md:hidden space-y-2">{breached.map(t => <TicketCard key={t.id} ticket={t} />)}</div>
        </section>
      )}

      {warning.length > 0 && (
        <section className="rounded-xl border-2 border-orange-300 bg-orange-50/60 p-3 animate-pulse-border">
          <h2 className="font-semibold text-sm text-orange-700 mb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4 animate-pulse" />
            ⚠️ מתקרבות לחריגת SLA — נדרש טיפול מיידי! ({warning.length})
          </h2>
          <div className="hidden md:block"><TicketTable tickets={warning} /></div>
          <div className="md:hidden space-y-2">{warning.map(t => <TicketCard key={t.id} ticket={t} />)}</div>
        </section>
      )}

      {open.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold mb-1">אין קריאות פתוחות בתקופה זו</p>
          <p className="text-sm text-muted-foreground mb-4">שנה את טווח התאריכים או פתח קריאה חדשה.</p>
          <Button onClick={() => navigate("/tickets/new")} className="gap-2">
            <Plus className="w-4 h-4" />פתח קריאת שירות
          </Button>
        </div>
      ) : (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm">קריאות פתוחות בתקופה ({open.length})</h2>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(`/tickets?from=${selectedRange.dateFrom}&to=${selectedRange.dateTo}`)}>הצג הכל</Button>
          </div>
          <div className="hidden md:block"><TicketTable tickets={open.slice(0, 20)} /></div>
          <div className="md:hidden space-y-2">{open.slice(0, 10).map(t => <TicketCard key={t.id} ticket={t} />)}</div>
        </section>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleUserUpdated = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  // Prompt for birthdate if missing (before entering the dashboard)
  if (user && !user.birthdate) {
    return <BirthdayPromptModal user={user} onSaved={handleUserUpdated} />;
  }

  if (isManagerOrAdmin(user)) return <ManagerDashboard user={user} />;
  return <UserDashboard user={user} onUserUpdated={handleUserUpdated} />;
}