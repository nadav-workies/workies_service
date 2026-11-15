import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Send, Workflow, AlertTriangle } from "lucide-react";
import { CAMPAIGNS, CONTACTS, TREND, AUTOMATIONS, pct, fmt, dateHe } from "./mockData";
import { PageHeader, Stat, Panel, Pill, Bar } from "./shared";

export default function MailDashboard() {
  const sent = CAMPAIGNS.filter(c => c.status === "sent");
  const delivered = sent.reduce((a, c) => a + c.delivered, 0);
  const opened = sent.reduce((a, c) => a + c.opened, 0);
  const clicked = sent.reduce((a, c) => a + c.clicked, 0);
  const last = TREND.at(-1);
  const maxContacts = Math.max(...TREND.map(t => t.contacts));
  const top = [...CONTACTS].sort((a, b) => b.score - a.score).slice(0, 5);

  return <div className="space-y-4">
    <PageHeader title="תמונת מצב" subtitle="נכון ל-15.11.2026 · נתוני דמה"
      actions={<>
        <Button asChild variant="outline"><Link to="/mailing/automations"><Workflow className="w-4 h-4 ml-1" />אוטומציה חדשה</Link></Button>
        <Button asChild><Link to="/mailing/campaigns?new=1"><Send className="w-4 h-4 ml-1" />קמפיין חדש</Link></Button>
      </>} />

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Stat label="מאושרים לדיוור" value={fmt(last.contacts)} hint="+94 מתחילת החודש" tone="orange" />
      <Stat label="אחוז פתיחה (30 יום)" value={`${pct(opened, delivered)}%`} hint={`${fmt(opened)} מתוך ${fmt(delivered)} שנמסרו`} />
      <Stat label="אחוז הקלקה (30 יום)" value={`${pct(clicked, delivered)}%`} hint={`${fmt(clicked)} הקלקות`} />
      <Stat label="ממתינים להסכמה" value="212" hint="לא נכללים בשליחה" />
    </div>

    <div className="grid lg:grid-cols-3 gap-4">
      <Panel title="גודל המאגר המאושר לפי חודש" className="lg:col-span-2">
        <div className="flex items-end gap-3 h-44" role="img" aria-label="גידול המאגר המאושר מ-910 ל-1,284 בחצי שנה">
          {TREND.map(t => <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs tabular-nums text-muted-foreground">{fmt(t.contacts)}</span>
            <div className="w-full rounded-t-md bg-primary/80" style={{ height: `${(t.contacts / maxContacts) * 120}px` }} />
            <span className="text-xs text-muted-foreground">{t.month}</span>
          </div>)}
        </div>
      </Panel>
      <Panel title="דורש תשומת לב">
        <ul className="space-y-3 text-sm">
          <li className="flex gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" /><span>212 אנשי קשר ממאגר ישן ללא בסיס הסכמה. מומלץ מייל פתיחה עם הסרה בולטת.</span></li>
          <li className="flex gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" /><span>אחוז ההחזרות בניוזלטר נובמבר: 1.8%. רוב ההחזרות מהייבוא של 2023.</span></li>
          <li className="flex gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" /><span>אוטומציית AIO כבויה עד שיוגדר מפתח API.</span></li>
        </ul>
      </Panel>
    </div>

    <div className="grid lg:grid-cols-2 gap-4">
      <Panel title="קמפיינים אחרונים" actions={<Link to="/mailing/campaigns" className="text-xs text-primary">לכל הקמפיינים</Link>}>
        <ul className="divide-y">
          {CAMPAIGNS.map(c => <li key={c.id} className="py-2.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.list} · {c.sentAt ? dateHe(c.sentAt) : "ללא מועד"}</p>
            </div>
            {c.status === "sent"
              ? <div className="w-28 text-xs text-muted-foreground"><span className="tabular-nums">{pct(c.opened, c.delivered)}% פתיחה</span><Bar value={c.opened} max={c.delivered} /></div>
              : <Pill tone={c.status === "scheduled" ? "yellow" : "gray"}>{c.status === "scheduled" ? "מתוזמן" : "טיוטה"}</Pill>}
          </li>)}
        </ul>
      </Panel>
      <Panel title="אנשי הקשר הכי מעורבים" actions={<span className="text-xs text-muted-foreground">לפי פתיחות והקלקות</span>}>
        <ul className="divide-y">
          {top.map(c => <li key={c.id} className="py-2.5 flex items-center gap-3 text-sm">
            <div className="flex-1 min-w-0"><p className="font-medium truncate">{c.name}</p><p className="text-xs text-muted-foreground truncate">{c.company || c.email}</p></div>
            <span className="text-xs text-muted-foreground tabular-nums">{c.opens} פתיחות · {c.clicks} הקלקות</span>
            <Pill tone="orange">{c.score}</Pill>
          </li>)}
        </ul>
        <p className="text-xs text-muted-foreground mt-3">אלה המועמדים לשיחת מכירה. בשלב הבא: שליחה ישירה למעקב מכירות.</p>
      </Panel>
    </div>

    <Panel title="אוטומציות פעילות">
      <div className="grid sm:grid-cols-3 gap-3">
        {AUTOMATIONS.map(a => <div key={a.id} className="rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2"><p className="font-medium text-sm">{a.name}</p><Pill tone={a.active ? "green" : "gray"}>{a.active ? "פעילה" : "כבויה"}</Pill></div>
          <p className="text-xs text-muted-foreground mt-1">{fmt(a.enrolled)} נכנסו · {fmt(a.completed)} סיימו</p>
        </div>)}
      </div>
    </Panel>
  </div>;
}
