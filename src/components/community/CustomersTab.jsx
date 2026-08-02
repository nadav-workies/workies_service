import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, MessageSquare, Users, Lightbulb, Sparkles, Link2, ListChecks, UserX, Cake, ChevronLeft } from "lucide-react";
import CustomerDrawer from "@/components/community/CustomerDrawer";

const FILTERS = {
  all: { label: "הכל", icon: Users },
  conversations_week: { label: "שיחות השבוע", icon: MessageSquare },
  new_insights: { label: "תובנות חדשות", icon: Lightbulb },
  connections: { label: "חיבורים", icon: Link2 },
  follow_ups: { label: "משימות המשך", icon: ListChecks },
  no_recent: { label: "ללא שיחה 60 יום", icon: UserX },
  birthdays: { label: "ימי הולדת", icon: Cake },
};

function getWeekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

function KpiCard({ icon: Icon, label, value, color, active, onClick }) {
  return (
    <button onClick={onClick} className="text-right">
      <Card className={`transition-all ${active ? "ring-2 ring-primary" : "hover:shadow-md"}`}>
        <CardContent className="pt-3 pb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${color || "bg-muted"}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{value ?? 0}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export default function CustomersTab({ onNavigateToContent }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState(null);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["room-tenants"],
    queryFn: () => base44.entities.RoomTenant.list("-created_date", 2000),
  });
  const { data: conversations = [] } = useQuery({
    queryKey: ["community-conversations"],
    queryFn: () => base44.entities.CustomerConversation.list("-conversation_date", 500),
  });
  const { data: insights = [] } = useQuery({
    queryKey: ["community-insights"],
    queryFn: () => base44.entities.CustomerInsight.list("-created_date", 500),
  });
  const { data: connections = [] } = useQuery({
    queryKey: ["community-connections"],
    queryFn: () => base44.entities.CommunityConnectionSuggestion.list("-created_date", 200),
  });

  const weekAgo = getWeekAgo();
  const weekConversations = conversations.filter((c) => c.conversation_date >= weekAgo);
  const newInsights = insights.filter((i) => i.status === "new");
  const newConnections = connections.filter((c) => c.status === "idea");
  const followUps = insights.filter((i) => i.insight_type === "follow_up" && i.status === "new");

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const recentConvTenants = new Set(
    conversations.filter((c) => new Date(c.conversation_date) >= sixtyDaysAgo).map((c) => c.tenant_id)
  );
  const noRecentConversation = tenants.filter((t) => !recentConvTenants.has(t.id));

  const upcomingBirthdays = tenants.filter((t) => {
    if (!t.birthdate) return false;
    const bd = new Date(t.birthdate + "T00:00:00");
    const now = new Date();
    const thisYearBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((thisYearBd - today) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  });

  // Build sets for filters
  const weekConvTenants = new Set(weekConversations.map((c) => c.tenant_id));
  const newInsightTenants = new Set(newInsights.map((i) => i.tenant_id));
  const connectionTenants = new Set(newConnections.map((c) => c.customer_a_id));
  const followUpTenants = new Set(followUps.map((i) => i.tenant_id));

  // Conversation count per tenant
  const convCountByTenant = useMemo(() => {
    const m = new Map();
    conversations.forEach((c) => m.set(c.tenant_id, (m.get(c.tenant_id) || 0) + 1));
    return m;
  }, [conversations]);

  const filteredTenants = useMemo(() => {
    let list = tenants;
    if (filter === "conversations_week") list = list.filter((t) => weekConvTenants.has(t.id));
    else if (filter === "new_insights") list = list.filter((t) => newInsightTenants.has(t.id));
    else if (filter === "connections") list = list.filter((t) => connectionTenants.has(t.id));
    else if (filter === "follow_ups") list = list.filter((t) => followUpTenants.has(t.id));
    else if (filter === "no_recent") list = noRecentConversation;
    else if (filter === "birthdays") list = upcomingBirthdays;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        (t.customer_name || "").toLowerCase().includes(q) ||
        (t.industry || "").toLowerCase().includes(q) ||
        (t.contact_name || "").toLowerCase().includes(q) ||
        (t.room_label || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [tenants, filter, search, noRecentConversation, upcomingBirthdays]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const kpis = [
    { key: "conversations_week", icon: MessageSquare, label: "שיחות השבוע", value: weekConversations.length, color: "bg-blue-100 text-blue-600" },
    { key: "new_insights", icon: Lightbulb, label: "תובנות חדשות", value: newInsights.length, color: "bg-amber-100 text-amber-600" },
    { key: "connections", icon: Link2, label: "חיבורים פוטנציאליים", value: newConnections.length, color: "bg-pink-100 text-pink-600" },
    { key: "follow_ups", icon: ListChecks, label: "משימות המשך", value: followUps.length, color: "bg-orange-100 text-orange-600" },
    { key: "no_recent", icon: UserX, label: "ללא שיחה 60 יום", value: noRecentConversation.length, color: "bg-red-100 text-red-600" },
    { key: "birthdays", icon: Cake, label: "ימי הולדת קרובים", value: upcomingBirthdays.length, color: "bg-rose-100 text-rose-600" },
  ];

  return (
    <div className="space-y-3" dir="rtl">
      {/* Clickable KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {kpis.map((k) => (
          <KpiCard key={k.key} {...k} active={filter === k.key} onClick={() => setFilter(filter === k.key ? "all" : k.key)} />
        ))}
      </div>

      {/* Filter chips + search */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {Object.entries(FILTERS).map(([key, f]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-2.5 py-1 rounded-full text-xs border flex items-center gap-1 ${filter === key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[150px]">
          <Search className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש לקוח..."
            className="h-8 pr-7 text-sm" />
        </div>
      </div>

      {/* Customer list */}
      <p className="text-xs text-muted-foreground">{filteredTenants.length} לקוחות</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {filteredTenants.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">אין לקוחות בסינון זה</p>
        ) : filteredTenants.map((t) => (
          <button key={t.id} onClick={() => setSelectedTenant(t)} className="text-right">
            <Card className="hover:shadow-md hover:border-primary/30 transition-all h-full">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{t.customer_name}</p>
                    {t.contact_name && <p className="text-xs text-muted-foreground truncate">{t.contact_name}</p>}
                    {t.industry && <p className="text-xs text-muted-foreground truncate">{t.industry}</p>}
                    {(t.room_label || t.room_number) && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t.room_label || `חדר ${t.room_number}`}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    {convCountByTenant.get(t.id) > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {convCountByTenant.get(t.id)} שיחות
                      </span>
                    )}
                    {t.birthdate && (() => {
                      const bd = new Date(t.birthdate + "T00:00:00");
                      const now = new Date();
                      const thisYearBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
                      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      const diff = Math.round((thisYearBd - today) / (1000 * 60 * 60 * 24));
                      if (diff >= 0 && diff <= 30) return <Cake className="w-3.5 h-3.5 text-rose-500" />;
                      return null;
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {selectedTenant && (
        <CustomerDrawer
          tenant={selectedTenant}
          open={!!selectedTenant}
          onClose={() => setSelectedTenant(null)}
          onNavigateToContent={onNavigateToContent}
        />
      )}
    </div>
  );
}