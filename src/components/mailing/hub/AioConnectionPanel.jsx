import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { Panel, Pill } from "@/components/mailing-mockup/shared";
import { formatDate } from "@/components/messages/messageConfig";

function verdict(d) {
  if (!d.configured) return ["yellow", "לא מוגדר", `חסרים פרטי חיבור: ${d.missing.join(", ")}. מזינים אותם במסך הסודות של האפליקציה, ואז בודקים שוב.`];
  if (d.ok) return ["green", "המפתח אומת", d.json ? "AIO קיבל את המפתח והחזיר נתונים." : "AIO קיבל את המפתח, אבל התשובה אינה רשימת נתונים."];
  if (d.reason === "invalid_url") return ["red", "כתובת לא תקינה", "כתובת ה-API חייבת להתחיל ב-https://"];
  if (d.reason === "unreachable") return ["red", "אין תשובה", "לא התקבלה תשובה מ-AIO בתוך 10 שניות."];
  if (d.status === 401 || d.status === 403) return ["red", "המפתח נדחה", `AIO דחה את המפתח (קוד ${d.status}). המפתח לא תואם לכתובת.`];
  return ["red", "שגיאה", `AIO החזיר קוד ${d.status}. כדאי לבדוק את כתובת ה-API.`];
}

export default function AioConnectionPanel() {
  const check = useQuery({ queryKey: ["mail", "aio"], queryFn: async () => (await base44.functions.invoke("aioConnection", {})).data, retry: false });
  const d = check.data;
  const [tone, label, text] = d ? verdict(d) : ["gray", "בבדיקה", ""];
  return <Panel title="חיבור ל-AIO" actions={check.isFetching ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : check.error ? <Pill tone="red">הבדיקה נכשלה</Pill> : <Pill tone={tone}>{label}</Pill>}>
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground">AIO היא מערכת ניהול הלקוחות של Workies. הבדיקה פונה אליה עם המפתח השמור ומציגה רק את תשובת השירות. המפתח עצמו לא מוצג.</p>
      {check.error && <p>לא ניתן היה להריץ את הבדיקה. נסו שוב.</p>}
      {d && <p>{text}</p>}
      {d?.configured && <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        {d.host && <><dt className="text-muted-foreground">שרת</dt><dd dir="ltr" style={{ textAlign: "right" }}>{d.host}</dd></>}
        {d.records != null && <><dt className="text-muted-foreground">רשומות שהתקבלו</dt><dd className="tabular-nums">{d.records.toLocaleString("he-IL")}</dd></>}
        {d.fields?.length > 0 && <><dt className="text-muted-foreground">שדות</dt><dd dir="ltr" style={{ textAlign: "right" }}>{d.fields.join(", ")}</dd></>}
        <dt className="text-muted-foreground">נבדק</dt><dd>{formatDate(d.checked_at)}</dd>
      </dl>}
      <Button size="sm" variant="outline" onClick={() => check.refetch()} disabled={check.isFetching}><RefreshCw className="w-4 h-4 ml-1" />בדיקה חוזרת</Button>
    </div>
  </Panel>;
}