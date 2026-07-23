import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { REVIEW_TYPE_CONFIG } from "@/lib/onboardingTemplate";

export default function ReviewMeetingList({ meetings, onComplete, user }) {
  const [completingId, setCompletingId] = useState(null);
  const [form, setForm] = useState({ employee_summary: "", manager_summary: "", knowledge_gaps: "", next_actions: "" });

  if (!meetings || meetings.length === 0) {
    return <Card className="p-6 text-center text-sm text-muted-foreground">אין שיחות בקרה מתוכננות</Card>;
  }

  const handleComplete = (meeting) => {
    onComplete(meeting, { ...form, status: "completed", completed_at: new Date().toISOString() });
    setCompletingId(null);
    setForm({ employee_summary: "", manager_summary: "", knowledge_gaps: "", next_actions: "" });
  };

  return (
    <div className="space-y-2 min-w-0" dir="rtl">
      {meetings.map((meeting) => {
        const config = REVIEW_TYPE_CONFIG[meeting.review_type] || {};
        return (
          <Card key={meeting.id} className="p-3 min-w-0">
            <div className="flex items-start gap-2 min-w-0">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{meeting.label || config.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.color || "bg-gray-100"}`}>
                    {config.label}
                  </span>
                  {meeting.status === "completed" ? (
                    <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3" /> הושלמה
                    </span>
                  ) : meeting.status === "missed" ? (
                    <span className="text-[10px] text-red-600 flex items-center gap-0.5">
                      <AlertCircle className="w-3 h-3" /> לא בוצעה
                    </span>
                  ) : (
                    <span className="text-[10px] text-orange-600 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> ממתינה
                    </span>
                  )}
                </div>
                {meeting.scheduled_at && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    מתוכנן: {new Date(meeting.scheduled_at).toLocaleDateString("he-IL")}
                  </p>
                )}
                {meeting.manager_summary && (
                  <p className="text-xs bg-blue-50 rounded p-1.5 mt-1">{meeting.manager_summary}</p>
                )}

                {meeting.status === "scheduled" && (
                  <Button size="sm" variant="outline" className="h-6 text-xs mt-2"
                    onClick={() => { setCompletingId(meeting.id); setForm({ employee_summary: meeting.employee_summary || "", manager_summary: meeting.manager_summary || "", knowledge_gaps: meeting.knowledge_gaps || "", next_actions: meeting.next_actions || "" }); }}>
                    תעד שיחה
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      <Dialog open={!!completingId} onOpenChange={(v) => !v && setCompletingId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>תיעוד שיחת בקרה</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold">סיכום העובדת</label>
              <Textarea value={form.employee_summary} onChange={(e) => setForm(f => ({ ...f, employee_summary: e.target.value }))}
                placeholder="מה נלמד, מה בוצע, מה לא ברור..." className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold">סיכום המנהל</label>
              <Textarea value={form.manager_summary} onChange={(e) => setForm(f => ({ ...f, manager_summary: e.target.value }))}
                placeholder="הערכת התקדמות, נקודות לשיפור..." className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold">פערי ידע</label>
              <Textarea value={form.knowledge_gaps} onChange={(e) => setForm(f => ({ ...f, knowledge_gaps: e.target.value }))}
                placeholder="נושאים שדורשים חיזוק..." className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold">פעולות הבאות</label>
              <Textarea value={form.next_actions} onChange={(e) => setForm(f => ({ ...f, next_actions: e.target.value }))}
                placeholder="משימות למחר, יעדים..." className="text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletingId(null)}>ביטול</Button>
            <Button onClick={() => handleComplete(meetings.find(m => m.id === completingId))}>שמור שיחה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}