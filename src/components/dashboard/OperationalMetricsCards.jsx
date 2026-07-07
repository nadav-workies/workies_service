import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ClipboardList, Users, Sparkles, Star } from "lucide-react";

function OpCard({ title, value, sub, icon: Icon, color, onClick }) {
  const iconBg = color?.includes("red") ? "bg-red-50"
    : color?.includes("amber") ? "bg-amber-50"
    : color?.includes("green") ? "bg-emerald-50"
    : color?.includes("blue") ? "bg-blue-50"
    : color?.includes("indigo") ? "bg-indigo-50"
    : "bg-primary/5";
  return (
    <Card
      onClick={onClick}
      className="p-4 cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className={cn("text-2xl font-bold mt-1 tracking-tight", color)}>{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={cn("p-2 rounded-lg", iconBg)}>
          <Icon className={cn("w-4 h-4", color || "text-primary")} />
        </div>
      </div>
    </Card>
  );
}

/**
 * OperationalMetricsCards — שורת מדדים תפעוליים:
 * כמות סקרים, לקוחות רשומים, בקרות ניקיון (כמות+ציון), ציון שביעות רצון (כמות+ציון).
 * surveyResponses — סקרים חיים מסוננים לתקופה (מגיע מבחוץ).
 */
export default function OperationalMetricsCards({ surveyResponses }) {
  const navigate = useNavigate();

  const { data: tenants = [] } = useQuery({
    queryKey: ["room-tenants-dashboard"],
    queryFn: () => base44.entities.RoomTenant.list("-created_date", 2000),
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ["cleaning-dashboard"],
    queryFn: () => base44.entities.CleaningInspection.list("-created_date", 200),
  });

  // ─── שביעות רצון ────────────────────────────────────────────────
  const surveysWithRating = surveyResponses.filter(r => Number(r.rating) > 0);
  const avgRating = surveysWithRating.length
    ? (surveysWithRating.reduce((s, r) => s + Number(r.rating), 0) / surveysWithRating.length).toFixed(1)
    : null;

  // ─── ניקיון ─────────────────────────────────────────────────────
  const cleaningAvg = inspections.length
    ? (inspections.reduce((s, i) => s + Number(i.cleanliness_rating), 0) / inspections.length).toFixed(1)
    : null;

  const cleaningColor = cleaningAvg === null ? "text-muted-foreground"
    : Number(cleaningAvg) >= 8 ? "text-emerald-600"
    : Number(cleaningAvg) >= 6 ? "text-amber-600"
    : "text-red-600";

  const surveyColor = avgRating === null ? "text-muted-foreground"
    : Number(avgRating) >= 8 ? "text-emerald-600"
    : Number(avgRating) >= 6 ? "text-amber-600"
    : "text-red-600";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <OpCard
        title="סקרים"
        value={surveyResponses.length}
        sub={surveysWithRating.length ? `${surveysWithRating.length} עם דירוג` : "טרם התקבלו דירוגים"}
        icon={ClipboardList}
        color="text-indigo-600"
        onClick={() => navigate("/survey-responses")}
      />
      <OpCard
        title="לקוחות רשומים"
        value={tenants.length}
        sub="במערכת"
        icon={Users}
        color="text-blue-600"
        onClick={() => navigate("/users")}
      />
      <OpCard
        title="בקרות ניקיון"
        value={cleaningAvg !== null ? `${cleaningAvg}/10` : "אין נתונים"}
        sub={`${inspections.length} בקרות`}
        icon={Sparkles}
        color={cleaningColor}
        onClick={() => navigate("/cleaning-report")}
      />
      <OpCard
        title="ציון שביעות רצון"
        value={avgRating !== null ? `${avgRating}/10` : "אין נתונים"}
        sub={`${surveysWithRating.length} דירוגים`}
        icon={Star}
        color={surveyColor}
        onClick={() => navigate("/survey-responses")}
      />
    </div>
  );
}