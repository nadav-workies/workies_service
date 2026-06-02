import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Loader2, Archive, ShieldAlert } from "lucide-react";

export default function ResetTestData() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmText, setConfirmText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  // ספירת נתונים קיימים
  const [counts, setCounts] = useState({ tickets: 0, surveys: 0, logs: 0, feedback: 0 });
  const [countsLoading, setCountsLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    setCountsLoading(true);
    Promise.all([
      base44.entities.ServiceTicket.list('-created_date', 1000),
      base44.entities.SurveyResponse.list('-submitted_at', 500),
      base44.entities.NotificationLog.list('-sent_at', 500),
      base44.entities.ServiceFeedback.list('-submitted_at', 500),
    ]).then(([tickets, surveys, logs, feedback]) => {
      setCounts({
        tickets: tickets.filter(t => !t.archived).length,
        surveys: surveys.length,
        logs: logs.length,
        feedback: feedback.length,
      });
    }).catch(() => {}).finally(() => setCountsLoading(false));
  }, [user]);

  const handleReset = async () => {
    if (confirmText !== 'איפוס') return;
    setRunning(true);
    setDialogOpen(false);

    const now = new Date().toISOString();
    const archivedBy = user?.full_name || user?.email || 'Admin';
    const archiveUpdates = {
      is_test_data: true,
      archived: true,
      archived_at: now,
      archived_by: archivedBy,
      archive_reason: 'איפוס נתוני ניסיון לפני עלייה לאוויר',
      exclude_from_metrics: true,
      sla_excluded: true,
      sla_exclusion_reason: 'נתוני בדיקה לפני עלייה לאוויר',
    };

    let ticketsArchived = 0;
    let surveysDeleted = 0;
    let logsDeleted = 0;
    let feedbackDeleted = 0;

    try {
      // 1. ארכיון כל קריאות שאינן בארכיון
      const tickets = await base44.entities.ServiceTicket.list('-created_date', 1000);
      const activeTickets = tickets.filter(t => !t.archived);
      for (const t of activeTickets) {
        await base44.entities.ServiceTicket.update(t.id, archiveUpdates);
        ticketsArchived++;
      }

      // 2. מחיקת SurveyResponse
      const surveys = await base44.entities.SurveyResponse.list('-submitted_at', 500);
      for (const s of surveys) {
        await base44.entities.SurveyResponse.delete(s.id);
        surveysDeleted++;
      }

      // 3. מחיקת NotificationLog
      const logs = await base44.entities.NotificationLog.list('-sent_at', 500);
      for (const l of logs) {
        await base44.entities.NotificationLog.delete(l.id);
        logsDeleted++;
      }

      // 4. מחיקת ServiceFeedback
      const feedback = await base44.entities.ServiceFeedback.list('-submitted_at', 500);
      for (const f of feedback) {
        await base44.entities.ServiceFeedback.delete(f.id);
        feedbackDeleted++;
      }

      setResult({ success: true, ticketsArchived, surveysDeleted, logsDeleted, feedbackDeleted });
      // רענון מלא כדי לנקות cache
      setTimeout(() => { window.location.href = "/"; }, 2500);
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (user?.role !== 'admin') return <div className="text-center py-20 text-muted-foreground">אין הרשאה לדף זה</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5" dir="rtl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-orange-500" />
          איפוס נתוני ניסיון
        </h1>
        <p className="text-sm text-muted-foreground mt-1">העברת קריאות בדיקה לארכיון לפני תחילת עבודה בלייב</p>
      </div>

      {/* תוצאת האיפוס */}
      {result && (
        <Card className={result.success ? "border-green-300 bg-green-50/50" : "border-red-300 bg-red-50/50"}>
          <CardContent className="pt-5 space-y-2">
            {result.success ? (
              <>
                <div className="flex items-center gap-2 text-green-700 font-semibold">
                  <CheckCircle className="w-5 h-5" />האיפוס הושלם בהצלחה!
                </div>
                <ul className="text-sm space-y-1 text-green-800">
                  <li>✅ {result.ticketsArchived} קריאות הועברו לארכיון</li>
                  <li>✅ {result.surveysDeleted} סקרים נמחקו</li>
                  <li>✅ {result.logsDeleted} לוגי התראות נמחקו</li>
                  <li>✅ {result.feedbackDeleted} משובי שירות נמחקו</li>
                </ul>
                <p className="text-xs text-green-700 mt-2 font-medium">המדידה מתחילה עכשיו מנקודת אפס. קריאות חדשות שתפתח יכנסו למדידה אמיתית.</p>
                <Button className="mt-3" onClick={() => navigate('/')}>מעבר לדשבורד</Button>
              </>
            ) : (
              <div className="text-red-700">
                <div className="font-semibold flex items-center gap-2"><AlertTriangle className="w-5 h-5" />שגיאה בביצוע האיפוס</div>
                <p className="text-sm mt-1">{result.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!result && (
        <>
          {/* נתונים קיימים */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">נתונים קיימים שיועברו לארכיון / יימחקו</CardTitle>
            </CardHeader>
            <CardContent>
              {countsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" />טוען...</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <StatRow label="קריאות שירות פעילות" value={counts.tickets} action="יועברו לארכיון" />
                  <StatRow label="סקרי שירות" value={counts.surveys} action="יימחקו" />
                  <StatRow label="לוגי התראות" value={counts.logs} action="יימחקו" />
                  <StatRow label="משובי שירות" value={counts.feedback} action="יימחקו" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* מה לא נמחק */}
          <Card className="border-green-200">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-green-800 mb-2">✅ לא נמחק ולא משתנה:</p>
              <ul className="text-sm text-green-700 space-y-0.5">
                <li>• משתמשים והרשאות</li>
                <li>• הגדרות SLA</li>
                <li>• תבניות סקר</li>
                <li>• הגדרות התראות</li>
                <li>• סוגי קריאות (Quick Tickets)</li>
                <li>• מפת החדרים</li>
              </ul>
            </CardContent>
          </Card>

          {/* כפתור */}
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">פעולה בלתי הפיכה</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    הקריאות יועברו לארכיון (לא יימחקו לצמיתות), אך יוסרו מכל מדידה, דשבורד ודוח. הסקרים והלוגים יימחקו לצמיתות.
                  </p>
                </div>
              </div>
              <Button
                className="mt-4 w-full gap-2 bg-orange-600 hover:bg-orange-700"
                onClick={() => setDialogOpen(true)}
                disabled={running}
              >
                <Archive className="w-4 h-4" />
                איפוס נתוני ניסיון והתחלת מדידה בלייב
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal אישור */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              איפוס נתוני ניסיון והתחלת מדידה בלייב
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              פעולה זו תעביר לארכיון את כל הקריאות, הסקרים והלוגים שנוצרו בהרצה, ותנקה את הדשבורד והדוחות ממדידת עבר.
              ההגדרות, המשתמשים, סוגי הקריאות, SLA, תבניות הסקר ומפת החדרים לא יימחקו.
            </p>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">להמשך, הקלד <span className="font-bold text-orange-600">איפוס</span>:</p>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder='הקלד "איפוס" לאישור'
                className="text-center"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDialogOpen(false); setConfirmText(""); }}>ביטול</Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleReset}
              disabled={confirmText !== 'איפוס'}
            >
              אפס והתחל מדידה בלייב
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatRow({ label, value, action }) {
  return (
    <div className="flex flex-col p-2.5 rounded-lg bg-muted/50">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-bold">{value}</span>
      <span className="text-xs text-orange-600">{action}</span>
    </div>
  );
}