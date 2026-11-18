import { Link } from "react-router-dom";
import { PageHeader, Panel } from "@/components/mailing-mockup/shared";
import { useContactStats } from "./useMailStats";
import AioConnectionPanel from "./AioConnectionPanel";

const SENDER = [["שם השולח", "Workies"], ["דומיין", "service.workies.co.il"], ["שירות שליחה", "שירות המייל המובנה של המערכת"], ["כתובת בכותרת התחתונה", "אליהו נאווי 24, באר שבע"]];
const n = v => (v || 0).toLocaleString("he-IL");

export default function MailSettingsSection() {
  const { data } = useContactStats();
  const by = data?.by || {};
  return <div className="space-y-4">
    <PageHeader title="הגדרות" subtitle="חיבור ל-AIO, פרטי השולח וכתובות חסומות." />
    <div className="grid lg:grid-cols-2 gap-4">
      <AioConnectionPanel />
      <Panel title="שליחה">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {SENDER.map(([k, v]) => <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}
        </dl>
      </Panel>
      <Panel title="כתובות חסומות לדיוור שיווקי" actions={<Link to="/mailing/contacts" className="text-xs text-primary">לאנשי הקשר</Link>}>
        <div className="space-y-2 text-sm">
          {data
            ? <p>{n(by.unsubscribed)} הסירו את עצמם · {n(by.bounced)} כתובות חוזרות · {n(by.complained)} סימנו כספאם</p>
            : <p className="text-muted-foreground">טוען...</p>}
          <p className="text-xs text-muted-foreground">הספירה לפי הסטטוס במאגר אנשי הקשר. מי שהסיר את עצמו דרך הקישור במייל נחסם בשליחה גם אם עדיין לא מסומן כאן. מיילים תפעוליים (אישורי הרשמה ותזכורות) לא מושפעים.</p>
        </div>
      </Panel>
    </div>
  </div>;
}