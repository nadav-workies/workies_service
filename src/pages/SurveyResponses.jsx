import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Star, ExternalLink, Filter, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateRangeFilter from "@/components/dashboard/DateRangeFilter";
import { getLiveTickets, getLiveSurveyResponses } from "@/lib/slaAgent.js";
import { getCurrentCalendarMonthRange, filterSurveyResponsesBySubmittedDate, filterTicketsByClosedDate } from "@/lib/dateRangeUtils";
import RecordActionsMenu from "@/components/admin/RecordActionsMenu";

function RatingBadge({ rating }) {
  if (!rating) return <span className="text-muted-foreground text-xs">—</span>;
  const color = rating >= 9 ? "bg-emerald-100 text-emerald-700" : rating >= 6 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}><Star className="w-3 h-3" />{rating}/10</span>;
}

function MetricCard({ label, value, sub, color = "text-foreground" }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold mt-0.5 ${color}`}>{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const VIEW_FILTERS = [
  { key: "all", label: "הכל" },
  { key: "rated", label: "מדורגות" },
  { key: "unrated", label: "לא מדורגות" },
];

const ARCHIVE_FILTERS = [
  { key: "active", label: "פעילים" },
  { key: "archived", label: "מאורכבים" },
  { key: "all", label: "הכל" },
];

export default function SurveyResponses() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [filterRating, setFilterRating]   = useState("all");
  const [filterAssigned, setFilterAssigned] = useState("all");
  const [selectedRange, setSelectedRange] = useState(() => getCurrentCalendarMonthRange());
  const [viewFilter, setViewFilter] = useState("all");
  const [archiveFilter, setArchiveFilter] = useState("active");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';
  const surveyQueryKeys = ['survey-responses', 'service-feedbacks', 'tickets-for-surveys'];

  const { data: rawTickets = [] } = useQuery({
    queryKey: ["tickets-for-surveys"],
    queryFn: () => base44.entities.ServiceTicket.list('-created_date', 500),
  });

  const { data: rawResponses = [], isLoading: loadingResponses } = useQuery({
    queryKey: ["survey-responses"],
    queryFn: () => base44.entities.SurveyResponse.list("-submitted_at", 500),
  });

  const { data: rawFeedbacks = [], isLoading: loadingFeedbacks } = useQuery({
    queryKey: ["service-feedbacks"],
    queryFn: () => base44.entities.ServiceFeedback.list("-submitted_at", 500),
  });

  const isLoading = loadingResponses || loadingFeedbacks;

  // Normalize ServiceFeedback to match SurveyResponse shape (preserve archive fields)
  const normalizedFeedbacks = rawFeedbacks.map(f => ({
    id: f.id,
    _entity_name: "ServiceFeedback",
    ticket_id: f.ticket_id,
    ticket_number: f.ticket_number,
    customer_name: f.customer_name || "",
    customer_email: f.customer_email || "",
    room_label: null,
    room_number: null,
    assigned_to: null,
    rating: f.rating,
    comment: f.comment,
    submitted_at: f.submitted_at,
    archived: f.archived || false,
    exclude_from_metrics: f.exclude_from_metrics || false,
    archive_reason: f.archive_reason || null,
    archived_at: f.archived_at || null,
    archived_by: f.archived_by || null,
    source: "in_app",
  }));

  // Tag SurveyResponse records
  const taggedResponses = rawResponses.map(r => ({ ...r, _entity_name: "SurveyResponse" }));

  const liveTickets   = getLiveTickets(rawTickets);
  const liveResponses = getLiveSurveyResponses(rawResponses);

  // Merge ALL (tagged + normalized), deduplicating by ticket_id (SurveyResponse wins)
  const allSrTicketIds = new Set(taggedResponses.map(r => r.ticket_id));
  const allDedupedFeedbacks = normalizedFeedbacks.filter(f => !allSrTicketIds.has(f.ticket_id));
  const allMerged = [...taggedResponses, ...allDedupedFeedbacks];

  // Active-only set (for metrics — always live regardless of archive filter)
  const liveMerged = allMerged.filter(r => !r.archived && !r.exclude_from_metrics);

  // Display set based on archive filter
  const displayBase = archiveFilter === 'archived'
    ? allMerged.filter(r => r.archived === true)
    : archiveFilter === 'all'
      ? allMerged
      : liveMerged;

  const responses     = filterSurveyResponsesBySubmittedDate(displayBase, selectedRange);
  const closedTickets = filterTicketsByClosedDate(liveTickets, selectedRange);

  // For metrics: always use live (active) data
  const liveResponsesForMetrics = filterSurveyResponsesBySubmittedDate(liveMerged, selectedRange);

  // Rated ticket IDs across ALL time (live only) — for finding unrated tickets
  const allRatedTicketIds = new Set(liveMerged.filter(r => Number(r.rating) > 0).map(r => r.ticket_id));
  const unratedTickets = closedTickets.filter(t => !allRatedTicketIds.has(t.id));

  // Rated ticket IDs within selected period (live only) — for accurate response rate
  const ratedTicketIdsInPeriod = new Set(liveResponsesForMetrics.filter(r => Number(r.rating) > 0).map(r => r.ticket_id));

  // Aggregation (always based on live/active data)
  const responsesWithRating = liveResponsesForMetrics.filter(r => Number(r.rating) > 0);
  const avgRating           = responsesWithRating.length
    ? (responsesWithRating.reduce((s, r) => s + Number(r.rating), 0) / responsesWithRating.length).toFixed(1)
    : null;
  const responseRate        = closedTickets.length
    ? Math.round((ratedTicketIdsInPeriod.size / closedTickets.length) * 100)
    : null;
  const lowRatingCount      = responsesWithRating.filter(r => Number(r.rating) <= 5).length;
  const highRatingCount     = responsesWithRating.filter(r => Number(r.rating) >= 9).length;
  const responseTicketIds   = new Set(liveResponsesForMetrics.map(r => r.ticket_id));
  const requiresFollowup    = liveTickets.filter(t => responseTicketIds.has(t.id) && t.requires_manager_followup).length;

  // Display filter for rated responses
  const filtered = responses.filter(r => {
    if (filterRating === "low" && Number(r.rating) > 5) return false;
    if (filterRating === "high" && Number(r.rating) < 9) return false;
    if (filterAssigned !== "all" && r.assigned_to !== filterAssigned) return false;
    return true;
  });

  const assignees = [...new Set(responses.map(r => r.assigned_to).filter(Boolean))];

  const showUnrated = viewFilter === "unrated";
  const showRated   = viewFilter === "rated" || viewFilter === "all";

  return (
    <div className="max-w-5xl mx-auto space-y-5" dir="rtl">
      <div>
        <h1 className="text-xl font-bold">סקרי שירות</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {showUnrated
            ? `${unratedTickets.length} קריאות סגורות ללא משוב בתקופה הנבחרת`
            : `${responses.length} משובים בתקופה הנבחרת`}
        </p>
      </div>

      <DateRangeFilter value={selectedRange} onChange={setSelectedRange} />

      {/* View filter buttons — like UsersManagement */}
      <div className="flex gap-1 flex-wrap">
        {VIEW_FILTERS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setViewFilter(opt.key)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${viewFilter === opt.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Archive filter — admin only */}
      {isAdmin && (
        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-xs text-muted-foreground ml-1">תצוגה:</span>
          {ARCHIVE_FILTERS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setArchiveFilter(opt.key)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${archiveFilter === opt.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Summary metrics — only for rated/all views */}
      {showRated && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <MetricCard label="דירוג ממוצע" value={avgRating ? `${avgRating}/10` : "אין נתונים"} sub={responsesWithRating.length ? `${responsesWithRating.length} משובים` : undefined} color="text-amber-600" />
          <MetricCard label="אחוז מענה" value={responseRate !== null ? `${responseRate}%` : "אין נתונים"} sub={closedTickets.length ? `מתוך ${closedTickets.length} סגורות` : "אין קריאות סגורות"} color="text-indigo-600" />
          <MetricCard label="דירוגים נמוכים" value={lowRatingCount} sub="דירוג 1–5" color={lowRatingCount > 0 ? "text-red-600" : "text-muted-foreground"} />
          <MetricCard label="דירוגים גבוהים" value={highRatingCount} sub="דירוג 9–10" color={highRatingCount > 0 ? "text-emerald-600" : "text-muted-foreground"} />
          <MetricCard label="דורשות מעקב" value={requiresFollowup} sub="בעקבות דירוג נמוך" color={requiresFollowup > 0 ? "text-orange-600" : "text-muted-foreground"} />
          <MetricCard label="סה״כ משובים" value={responses.length} sub="בתקופה הנבחרת" />
        </div>
      )}

      {/* Rating/Assignee filters — only for rated/all views */}
      {showRated && (
        <div className="flex gap-3 flex-wrap items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="דירוג" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הדירוגים</SelectItem>
              <SelectItem value="low">נמוך (1-5)</SelectItem>
              <SelectItem value="high">גבוה (9-10)</SelectItem>
            </SelectContent>
          </Select>
          {assignees.length > 0 && (
            <Select value={filterAssigned} onValueChange={setFilterAssigned}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="אחראי" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל האחראים</SelectItem>
                {assignees.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground text-sm">טוען...</div>
      ) : showUnrated && !showRated ? (
        /* Unrated closed tickets table */
        unratedTickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">כל הקריאות הסגורות מדורגות</p>
              <p className="text-sm text-muted-foreground">לא נמצאו קריאות סגורות ללא משוב בתקופה הנבחרת.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">נסגרה</th>
                      <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">קריאה</th>
                      <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">לקוח</th>
                      <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">חדר</th>
                      <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">אחראי</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {unratedTickets.map(t => (
                      <tr key={t.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {t.closed_at ? format(new Date(t.closed_at), "dd/MM/yy HH:mm") : "—"}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs">{t.ticket_number}</td>
                        <td className="px-4 py-2.5">{t.customer_name || "—"}</td>
                        <td className="px-4 py-2.5 text-xs">{t.room_label || "—"}</td>
                        <td className="px-4 py-2.5 text-xs">{t.assigned_to || "—"}</td>
                        <td className="px-4 py-2.5">
                          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => navigate(`/tickets/${t.id}`)}>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">אין משובים</p>
            <p className="text-sm text-muted-foreground">לא התקבלו משובים בתקופה הנבחרת.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">תאריך</th>
                    <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">קריאה</th>
                    <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">לקוח</th>
                    <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">חדר</th>
                    <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">אחראי</th>
                    <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">דירוג</th>
                    <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">הערה</th>
                    <th className="px-4 py-2.5"></th>
                    {isAdmin && <th className="px-4 py-2.5"></th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className={`border-b hover:bg-muted/20 transition-colors ${r.archived ? "bg-amber-50/40" : ""}`}>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {r.submitted_at ? format(new Date(r.submitted_at), "dd/MM/yy HH:mm") : "—"}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">
                        {r.ticket_number}
                        {r.archived && <span className="block text-[10px] text-amber-600 font-medium">מאורכב</span>}
                      </td>
                      <td className="px-4 py-2.5">{r.customer_name || "—"}</td>
                      <td className="px-4 py-2.5 text-xs">{r.room_label || "—"}</td>
                      <td className="px-4 py-2.5 text-xs">{r.assigned_to || "—"}</td>
                      <td className="px-4 py-2.5"><RatingBadge rating={r.rating} /></td>
                      <td className="px-4 py-2.5 text-xs max-w-[200px] truncate text-muted-foreground">{r.comment || "—"}</td>
                      <td className="px-4 py-2.5">
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => navigate(`/tickets/${r.ticket_id}`)}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-2.5">
                          <RecordActionsMenu
                            entityName={r._entity_name}
                            record={r}
                            recordType="survey"
                            user={user}
                            queryKeys={surveyQueryKeys}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}