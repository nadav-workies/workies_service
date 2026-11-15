import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Clock, Copy, KeyRound } from "lucide-react";
import { PageHeader, Panel, Pill } from "./shared";

const DNS = [
  { type: "TXT", name: "send.news", purpose: "SPF", ok: true },
  { type: "TXT", name: "resend._domainkey.news", purpose: "DKIM", ok: true },
  { type: "TXT", name: "_dmarc.news", purpose: "DMARC", ok: false },
  { type: "MX", name: "send.news", purpose: "החזרות", ok: true },
];

export default function MailSettings() {
  const [shown, setShown] = useState(false);
  return <div className="space-y-4">
    <PageHeader title="הגדרות" subtitle="ספק השליחה, הדומיין, פרטי השולח וחיבור ל-AIO." />
    <div className="grid lg:grid-cols-2 gap-4">
      <Panel title="שולח ברירת מחדל">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">שם השולח</label><Input defaultValue="נדב מוורקיז" />
          <label className="text-xs text-muted-foreground">כתובת שליחה</label><Input dir="ltr" defaultValue="news@news.workies.co.il" />
          <label className="text-xs text-muted-foreground">כתובת לתשובות</label><Input dir="ltr" defaultValue="hello@workies.co.il" />
          <label className="text-xs text-muted-foreground">כתובת פיזית בכותרת התחתונה (חובה לפי חוק)</label><Input defaultValue="אליהו נאווי 24, באר שבע" />
        </div>
      </Panel>
      <Panel title="Resend" actions={<Pill tone="green"><CheckCircle2 className="w-3 h-3" />מחובר</Pill>}>
        <div className="space-y-3 text-sm">
          <p>דומיין שליחה: <b dir="ltr">news.workies.co.il</b></p>
          <table className="w-full text-sm"><tbody className="divide-y">
            {DNS.map(d => <tr key={d.purpose}><td className="py-1.5 w-14 text-muted-foreground">{d.type}</td><td className="py-1.5" dir="ltr" style={{ textAlign: "right" }}>{d.name}</td><td className="py-1.5">{d.purpose}</td>
              <td className="py-1.5">{d.ok ? <Pill tone="green">אומת</Pill> : <Pill tone="yellow"><Clock className="w-3 h-3" />ממתין</Pill>}</td></tr>)}
          </tbody></table>
          <p className="text-xs text-muted-foreground">Webhook לאירועי שליחה: פעיל · אירוע אחרון לפני 4 דקות</p>
        </div>
      </Panel>
      <Panel title="חיבור API ל-AIO">
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">AIO שולח לכאן אנשי קשר חדשים ואירועים עסקיים שמפעילים אוטומציות.</p>
          <div className="flex gap-2 items-center">
            <Input readOnly dir="ltr" value={shown ? "wk_live_8f3a…c21d" : "••••••••••••••••"} />
            <Button variant="outline" size="sm" onClick={() => setShown(s => !s)}><KeyRound className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm"><Copy className="w-4 h-4" /></Button>
          </div>
          <p dir="ltr" className="rounded-md bg-muted px-3 py-2 font-mono text-xs text-left">POST /functions/mailingApi<br />{"{ action: \"upsert_contact\" | \"trigger_event\", … }"}</p>
          <Pill tone="yellow">טרם נשלחה קריאה ראשונה</Pill>
        </div>
      </Panel>
      <Panel title="רשימת חסומים">
        <div className="space-y-2 text-sm">
          <p>38 כתובות חסומות: 21 הסירו את עצמן, 14 חזרו, 3 סימנו ספאם.</p>
          <p className="text-xs text-muted-foreground">כתובת חסומה לא מקבלת דיוור שיווקי מאף מסלול. מיילים תפעוליים (אישור הרשמה, תזכורות לאירוע) לא מושפעים.</p>
          <Button size="sm" variant="outline">צפייה ברשימה</Button>
        </div>
      </Panel>
    </div>
  </div>;
}
