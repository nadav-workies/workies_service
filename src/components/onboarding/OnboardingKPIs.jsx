import { Card } from "@/components/ui/card";
import { Users, TrendingUp, AlertTriangle, GraduationCap } from "lucide-react";

export default function OnboardingKPIs({ tracks }) {
  const active = tracks.filter((t) => t.status === "active");
  const atRisk = tracks.filter((t) => t.status === "at_risk");
  const avgProgress = tracks.length > 0
    ? Math.round(tracks.reduce((s, t) => s + (t.progress_percent || 0), 0) / tracks.length)
    : 0;
  const avgScore = tracks.length > 0
    ? Math.round(tracks.reduce((s, t) => s + (t.average_knowledge_score || 0), 0) / tracks.length * 10) / 10
    : 0;

  const items = [
    { label: "עובדים פעילים בחפיפה", value: active.length, icon: Users, color: "text-blue-600" },
    { label: "אחוז השלמה ממוצע", value: `${avgProgress}%`, icon: TrendingUp, color: "text-green-600" },
    { label: "ציון ידע ממוצע", value: avgScore || "—", icon: GraduationCap, color: "text-indigo-600" },
    { label: "מסלולים בסיכון", value: atRisk.length, icon: AlertTriangle, color: "text-red-600" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 min-w-0">
      {items.map((item, i) => (
        <Card key={i} className="p-2.5 sm:p-3 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{item.label}</p>
              <p className={`text-base sm:text-lg font-bold ${item.color}`}>{item.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}