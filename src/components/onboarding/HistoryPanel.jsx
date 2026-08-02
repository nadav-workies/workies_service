import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, History, ClipboardList } from "lucide-react";
import AuditLogList from "@/components/onboarding/AuditLogList";

export default function HistoryPanel({ attempts, logs, meetings }) {
  const [open, setOpen] = useState(false);

  return (
    <div dir="rtl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1 text-muted-foreground"
      >
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <History className="w-4 h-4" /> היסטוריה ובקרה
      </Button>

      {open && (
        <div className="space-y-4 mt-2">
          {attempts?.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2">היסטוריית מבדקים</p>
              <div className="space-y-1.5">
                {attempts.map((att) => (
                  <Card key={att.id} className="p-2 flex items-center gap-2 text-xs">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${att.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                      {att.score_1_to_10}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{att.stage_title}</p>
                      <p className="text-muted-foreground">ניסיון {att.attempt_number} · {att.passed ? "עבר" : "נכשל"}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {meetings?.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2">שיחות בקרה</p>
              <div className="space-y-1.5">
                {meetings.map((m) => (
                  <Card key={m.id} className="p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{m.label}</span>
                      <span className={`px-1.5 py-0.5 rounded-full ${m.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {m.status === "completed" ? "הושלם" : "מתוכנן"}
                      </span>
                    </div>
                    {m.manager_summary && <p className="text-muted-foreground mt-1">{m.manager_summary}</p>}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {logs?.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2">יומן פעילות</p>
              <AuditLogList logs={logs} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}