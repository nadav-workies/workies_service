import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Users, Lightbulb, Sparkles, Link2, ListChecks, UserX, Cake } from "lucide-react";
import {
  INSIGHT_TYPE_LABELS, INSIGHT_TYPE_COLORS, INSIGHT_STATUS_COLORS, INSIGHT_STATUS_LABELS,
  CONFIDENCE_COLORS, CONFIDENCE_LABELS,
} from "@/lib/communityConfig";

function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color || "bg-muted"}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{value ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getWeekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

export default function CommunityDashboard() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("new");

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["community-conversations"],
    queryFn: () => base44.entities.CustomerConversation.list("-conversation_date", 500),
  });

  const { data: insights = [] } = useQuery({
    queryKey: ["community-insights"],
    queryFn: () => base44.entities.CustomerInsight.list("-created_date", 500),
  });

  const { data: contentIdeas = [] } = useQuery({
    queryKey: ["community-content-ideas"],
    queryFn: () => base44.entities.WeeklyContentIdea.list("-created_date", 200),
  });

  const { data: connections = [] } = useQuery({
    queryKey: ["community-connections"],
    queryFn: () => base44.entities.CommunityConnectionSuggestion.list("-created_date", 200),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["room-tenants"],
    queryFn: () => base44.entities.RoomTenant.list("-created_date", 2000),
  });

  const weekAgo = getWeekAgo();
  const weekConversations = conversations.filter((c) => c.conversation_date >= weekAgo);
  const customersUpdatedThisWeek = new Set(weekConversations.map((c) => c.tenant_id)).size;
  const newInsights = insights.filter((i) => i.status === "new");
  const newContentIdeas = contentIdeas.filter((i) => i.status === "idea");
  const newConnections = connections.filter((c) => c.status === "idea");
  const followUps = insights.filter((i) => i.insight_type === "follow_up" && i.status === "new");

  // Customers without conversation in 60 days
  const tenantsWithConvs = new Set(conversations.map((c) => c.tenant_id));
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const recentConvTenants = new Set(
    conversations.filter((c) => new Date(c.conversation_date) >= sixtyDaysAgo).map((c) => c.tenant_id)
  );
  const noRecentConversation = tenants.filter((t) => !recentConvTenants.has(t.id));

  // Upcoming birthdays
  const upcomingBirthdays = tenants.filter((t) => {
    if (!t.birthdate) return false;
    const bd = new Date(t.birthdate + "T00:00:00");
    const now = new Date();
    const thisYearBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((thisYearBd - today) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  });

  const filteredInsights = statusFilter === "all"
    ? insights
    : insights.filter((i) => i.status === statusFilter);

  const handleStatusChange = async (insight, newStatus) => {
    await base44.entities.CustomerInsight.update(insight.id, { status: newStatus });
    qc.invalidateQueries({ queryKey: ["community-insights"] });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={MessageSquare} label="שיחות שתועדו השבוע" value={weekConversations.length} color="bg-blue-100 text-blue-600" />
        <KpiCard icon={Users} label="לקוחות שעודכנו השבוע" value={customersUpdatedThisWeek} color="bg-cyan-100 text-cyan-600" />
        <KpiCard icon={Lightbulb} label="תובנות חדשות" value={newInsights.length} color="bg-amber-100 text-amber-600" />
        <KpiCard icon={Sparkles} label="רעיונות תוכן חדשים" value={newContentIdeas.length} color="bg-purple-100 text-purple-600" />
        <KpiCard icon={Link2} label="חיבורים פוטנציאליים" value={newConnections.length} color="bg-pink-100 text-pink-600" />
        <KpiCard icon={ListChecks} label="משימות המשך" value={followUps.length} color="bg-orange-100 text-orange-600" />
        <KpiCard icon={UserX} label="לקוחות ללא שיחה 60 יום" value={noRecentConversation.length} color="bg-red-100 text-red-600" />
        <KpiCard icon={Cake} label="ימי הולדת קרובים" value={upcomingBirthdays.length} color="bg-rose-100 text-rose-600" />
      </div>

      {/* Insights table */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-base font-semibold">תובנות ({filteredInsights.length})</h2>
            <div className="flex gap-1 flex-wrap">
              {["new", "reviewed", "used", "dismissed", "all"].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-full text-xs border ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                  {INSIGHT_STATUS_LABELS[s] || "הכל"}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-2 font-semibold">לקוח</th>
                  <th className="p-2 font-semibold">סוג תובנה</th>
                  <th className="p-2 font-semibold">תובנה</th>
                  <th className="p-2 font-semibold">מקור</th>
                  <th className="p-2 font-semibold">ביטחון</th>
                  <th className="p-2 font-semibold">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {filteredInsights.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">אין תובנות</td></tr>
                ) : filteredInsights.slice(0, 100).map((ins) => (
                  <tr key={ins.id} className="border-b hover:bg-muted/30">
                    <td className="p-2 text-xs">{ins.customer_name || "—"}</td>
                    <td className="p-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${INSIGHT_TYPE_COLORS[ins.insight_type] || "bg-gray-100"}`}>
                        {INSIGHT_TYPE_LABELS[ins.insight_type] || ins.insight_type}
                      </span>
                    </td>
                    <td className="p-2 text-xs">
                      <p className="font-medium">{ins.title}</p>
                      {ins.content && ins.content !== ins.title && <p className="text-muted-foreground">{ins.content}</p>}
                    </td>
                    <td className="p-2 text-xs text-muted-foreground italic max-w-[200px] truncate" title={ins.source_quote}>
                      {ins.source_quote || "—"}
                    </td>
                    <td className="p-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CONFIDENCE_COLORS[ins.confidence] || "bg-gray-100"}`}>
                        {CONFIDENCE_LABELS[ins.confidence] || ins.confidence}
                      </span>
                    </td>
                    <td className="p-2">
                      <select value={ins.status}
                        onChange={(e) => handleStatusChange(ins, e.target.value)}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border-0 ${INSIGHT_STATUS_COLORS[ins.status] || "bg-gray-100"}`}>
                        {Object.entries(INSIGHT_STATUS_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}