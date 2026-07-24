import { useState } from "react";
import { Card } from "@/components/ui/card";
import AuditLogList from "@/components/onboarding/AuditLogList";
import { CATEGORY_LABELS } from "@/lib/onboardingTemplate";
import { ChevronDown, ChevronUp, BarChart3, FileText, History } from "lucide-react";

export default function AdditionalInfoPanel({ categoryMap, attempts, logs, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full p-3 flex items-center gap-2 hover:bg-muted/30 transition-colors">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-sm flex-1 text-right">מידע נוסף</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="border-t p-3 space-y-4">
          {/* Full Map */}
          <div>
            <h4 className="text-xs font-bold mb-2">מפת החפיפה המלאה</h4>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-right p-2">תחום</th>
                    <th className="text-center p-2">התקדמות</th>
                    <th className="text-center p-2">ציון</th>
                    <th className="text-center p-2">סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(categoryMap).map(([cat, data]) => {
                    const catAvg = data.scores.length > 0 ? Math.round(data.scores.reduce((s, v) => s + v, 0) / data.scores.length * 10) / 10 : null;
                    const pct = Math.round((data.completed / data.total) * 100);
                    return (
                      <tr key={cat} className="border-t">
                        <td className="p-2 font-medium">{CATEGORY_LABELS[cat] || cat}</td>
                        <td className="text-center p-2">{data.completed}/{data.total} ({pct}%)</td>
                        <td className="text-center p-2">{catAvg || "—"}</td>
                        <td className="text-center p-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${pct === 100 ? "bg-green-100 text-green-700" : pct > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                            {pct === 100 ? "הושלם" : pct > 0 ? "בתהליך" : "טרם התחיל"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Quiz Attempts */}
          <div>
            <h4 className="text-xs font-bold mb-2 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> כל המבדקים</h4>
            <div className="space-y-2">
              {attempts.length === 0 ? (
                <p className="text-xs text-muted-foreground">אין ניסיונות מבדק עדיין</p>
              ) : attempts.map(att => (
                <div key={att.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 min-w-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${att.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                    {att.score_1_to_10}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{att.stage_title}</p>
                    <p className="text-[10px] text-muted-foreground">ניסיון {att.attempt_number} · {att.passed ? "עבר" : "נכשל"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Log */}
          <div>
            <h4 className="text-xs font-bold mb-2 flex items-center gap-1"><History className="w-3.5 h-3.5" /> יומן פעילות</h4>
            <AuditLogList logs={logs} />
          </div>
        </div>
      )}
    </Card>
  );
}