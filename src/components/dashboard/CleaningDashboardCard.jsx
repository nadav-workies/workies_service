import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { getTodayRange } from "@/lib/dateRangeUtils";
import { format } from "date-fns";

export default function CleaningDashboardCard() {
  const navigate = useNavigate();
  const today = getTodayRange();

  const { data: allInspections = [] } = useQuery({
    queryKey: ["cleaning-today"],
    queryFn: () => base44.entities.CleaningInspection.list("-created_date", 100),
    refetchInterval: 60000,
  });

  const todayInspections = allInspections.filter(i => {
    const d = new Date(`${i.inspection_date}T${i.inspection_time || "00:00"}`).getTime();
    return d >= today.startMs && d <= today.endMs;
  });

  const avg = todayInspections.length
    ? (todayInspections.reduce((s, i) => s + Number(i.cleanliness_rating), 0) / todayInspections.length).toFixed(1)
    : null;
  const low = todayInspections.filter(i => Number(i.cleanliness_rating) <= 5).length;

  const avgColor = avg === null ? "text-muted-foreground"
    : Number(avg) >= 8 ? "text-emerald-600"
    : Number(avg) >= 6 ? "text-amber-600"
    : "text-red-600";

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">בקרת ניקיון היום</p>
      <Card
        className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
        onClick={() => navigate("/cleaning-report")}
      >
        <CardContent className="pt-4 pb-3">
          {todayInspections.length === 0 ? (
            <p className="text-sm text-muted-foreground">לא בוצעו בקרות ניקיון היום</p>
          ) : (
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-[11px] text-muted-foreground">ממוצע ניקיון</p>
                <p className={`text-xl font-bold ${avgColor}`}>{avg}/10</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">בקרות היום</p>
                <p className="text-xl font-bold">{todayInspections.length}</p>
              </div>
              {low > 0 && (
                <div>
                  <p className="text-[11px] text-muted-foreground">דירוגים נמוכים</p>
                  <p className="text-xl font-bold text-red-600">{low}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}