import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings, Info } from "lucide-react";
import { isManagerOrAdmin, PRIORITY_COLORS } from "@/lib/slaUtils";
import { QUICK_TICKET_LIST } from "@/lib/quickTickets";
import { cn } from "@/lib/utils";

const FULL_SLA_TABLE = [
  { id: 1, ticket_type: "תחזוקת חדר", examples: "תלייה, צביעה, פתיחת דלת, תיקון חדר בסיסי", sla_label: "עד 30 דקות", area: "משרד / חדר לקוח", priority: "גבוהה", assignee: "חיים / תמי", execution: "אתי / ספק לפי צורך", management_status: "פתוח לניהול" },
  { id: 2, ticket_type: "מזגן SOS", examples: "מזגן לא עובד / תקלה משביתה", sla_label: "מענה עד 30 דקות", area: "מיזוג", priority: "קריטית", assignee: "חיים", execution: "נתי / ספק מזגנים", management_status: "פתוח לניהול" },
  { id: 3, ticket_type: "מזגן סיום טיפול", examples: "תקלה שדורשת ספק חיצוני", sla_label: "עד 24 שעות", area: "מיזוג", priority: "גבוהה", assignee: "חיים", execution: "ספקים חלופיים", management_status: "פתוח לניהול" },
  { id: 4, ticket_type: "שירותים", examples: "מים ברצפה, סוללה, דלת, מאגרה, נייר, סבון", sla_label: "עד 10 דקות", area: "שירותים", priority: "קריטית", assignee: "רוני / חיים", execution: "ניקיון / תחזוקה", management_status: "פתוח לניהול" },
  { id: 5, ticket_type: "חדר ישיבות", examples: "HDMI, חיבור מערכת, בעיית מצגת / מחשב", sla_label: "עד 5 דקות", area: "חדר ישיבות", priority: "קריטית", assignee: "חיים / תמי", execution: "נדב לסרטון מדריך", management_status: "פתוח לניהול" },
  { id: 6, ticket_type: "תאורה בחללים", examples: "תאורה בחדרים ובחללים ציבוריים", sla_label: "עד 30 דקות", area: "תחזוקה כללית", priority: "גבוהה", assignee: "חיים", execution: "אתי", management_status: "פתוח לניהול" },
  { id: 7, ticket_type: "קודנים", examples: "קודן / צ׳יפ / בקר גישה", sla_label: "פנימי עד 30 דק׳, חיצוני עד סוף יום", area: "תחזוקה כללית", priority: "גבוהה", assignee: "חיים", execution: "אלון / אתי / ספק גביו", management_status: "פתוח לניהול" },
  { id: 8, ticket_type: "מכונת קפה", examples: "תקלה במכונת קפה לפני או בזמן שימוש", sla_label: "עד 20 דקות", area: "מטבחון", priority: "גבוהה", assignee: "חיים / תמי", execution: "מדריכי וידאו קיימים", management_status: "פתוח לניהול" },
  { id: 9, ticket_type: "ניקיון חללים ציבוריים", examples: "ניקיון שוטף במסדרונות ובחללים", sla_label: "שוטף — ללא SLA נקודתי", area: "ניקיון", priority: "רגילה", assignee: "רוני / ניקיון", execution: "חיים בבקרה", management_status: "שוטף" },
];

export default function SLASettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!isManagerOrAdmin(user)) return <div className="text-center py-20 text-muted-foreground">אין הרשאה לצפות בדף זה</div>;

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            הגדרות SLA
          </h1>
          <p className="text-muted-foreground text-sm mt-1">סוגי קריאות מהירות ויעדי זמן טיפול</p>
        </div>
        {user?.role === 'admin' && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            <Info className="w-3 h-3 ml-1" />
            עריכה תהיה זמינה בקרוב
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right">סוג קריאה</TableHead>
                  <TableHead className="text-right">דוגמאות</TableHead>
                  <TableHead className="text-right w-[120px]">יעד SLA</TableHead>
                  <TableHead className="text-right w-[120px]">אזור</TableHead>
                  <TableHead className="text-right w-[80px]">דחיפות</TableHead>
                  <TableHead className="text-right">אחראי מוביל</TableHead>
                  <TableHead className="text-right">גורם ביצוע</TableHead>
                  <TableHead className="text-right w-[90px]">סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FULL_SLA_TABLE.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-semibold text-sm">{row.ticket_type}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px]">{row.examples}</TableCell>
                    <TableCell className="text-xs font-medium">{row.sla_label}</TableCell>
                    <TableCell className="text-xs">{row.area}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", PRIORITY_COLORS[row.priority])}>
                        {row.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{row.assignee}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.execution}</TableCell>
                    <TableCell>
                      <Badge variant={row.management_status === 'שוטף' ? 'secondary' : 'outline'} className="text-xs">
                        {row.management_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}