import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function MetricCard({ title, value, sub, color, onClick, warning }) {
  return (
    <Card
      onClick={onClick}
      className={cn("p-3.5 transition-all", onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5")}
    >
      <p className="text-[11px] text-muted-foreground mb-1">{title}</p>
      <p className={cn("text-xl font-bold tracking-tight", color, warning && "text-red-600")}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </Card>
  );
}

/**
 * ServiceMetricsCards
 * tickets          — liveTickets כבר מסוננים מבחוץ (periodTickets)
 * surveyResponses  — liveSurveyResponses כבר מסוננים מבחוץ
 */
export default function ServiceMetricsCards({ tickets, surveyResponses }) {
  const navigate = useNavigate();
  const nowMs = Date.now();

  const closedTickets = tickets.filter(t => t.status === "נסגרה");

  // ─── שביעות רצון ────────────────────────────────────────────────
  const responsesWithRating = surveyResponses.filter(r => Number(r.rating) > 0);
  const avgRating = responsesWithRating.length
    ? (responsesWithRating.reduce((s, r) => s + Number(r.rating), 0) / responsesWithRating.length).toFixed(1)
    : null;
  const responseRate = closedTickets.length
    ? Math.round((responsesWithRating.length / closedTickets.length) * 100)
    : null;
  const lowRatingCount = responsesWithRating.filter(r => Number(r.rating) <= 5).length;
  const requiresFollowup = tickets.filter(t => t.requires_manager_followup).length;

  // ─── Google Review ───────────────────────────────────────────────
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  const googleSent = closedTickets.filter(t => t.google_review_request_sent).length;
  const googleWaiting = closedTickets.filter(t =>
    !t.google_review_request_sent &&
    !t.google_review_blocked_reason &&
    t.closed_at &&
    nowMs - new Date(t.closed_at).getTime() >= THREE_DAYS
  ).length;
  const googleRate = closedTickets.length
    ? Math.round((googleSent / closedTickets.length) * 100)
    : null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">מדדי שירות</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        <MetricCard
          title="דירוג ממוצע"
          value={avgRating ? `${avgRating}/10` : "אין נתונים"}
          sub={responsesWithRating.length ? `${responsesWithRating.length} משובים` : "טרם התקבלו משובים"}
          color="text-amber-600"
          onClick={() => navigate("/survey-responses")}
        />
        <MetricCard
          title="אחוז מענה לסקרים"
          value={responseRate !== null ? `${responseRate}%` : "אין נתונים"}
          sub={closedTickets.length ? `מתוך ${closedTickets.length} קריאות סגורות` : "אין קריאות סגורות"}
          color="text-indigo-600"
        />
        <MetricCard
          title="דירוגים נמוכים"
          value={lowRatingCount}
          sub="דירוג 1–5"
          color="text-red-600"
          warning={lowRatingCount > 0}
          onClick={lowRatingCount > 0 ? () => navigate("/survey-responses") : undefined}
        />
        <MetricCard
          title="דורשות מעקב מנהל"
          value={requiresFollowup}
          sub="בעקבות דירוג נמוך"
          color="text-red-600"
          warning={requiresFollowup > 0}
        />
        <MetricCard
          title="Google Reviews נשלחו"
          value={googleSent !== 0 ? googleSent : "אין נתונים"}
          sub={googleRate !== null && googleSent > 0 ? `${googleRate}% מקריאות סגורות` : undefined}
          color="text-blue-600"
        />
        <MetricCard
          title="ממתינות לשליחת Google"
          value={googleWaiting}
          sub="3+ ימים מסגירה"
          color={googleWaiting > 0 ? "text-orange-600" : "text-muted-foreground"}
          warning={googleWaiting > 0}
        />
      </div>
    </div>
  );
}