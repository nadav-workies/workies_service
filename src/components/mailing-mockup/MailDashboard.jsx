import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Send, Zap, AlertTriangle, Lightbulb } from "lucide-react";
import { CAMPAIGNS, CONTACTS, TREND, SUGGESTIONS, STAGES, STAGE_COUNTS, pct, fmt, dateHe } from "./mockData";
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
        <Button asChild variant="outline"><Link to="/mailing/engagement"><Zap className="w-4 h-4 ml-1" />מנוע מעורבות</Link></Button>
        <Button asChild><Link to="/mailing/campaigns?new=1"><Send className="w-4 h-4 ml-1" />קמפיין חדש</Link></Button>
      </>} />

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Stat label="מאושרים לדיוור" value={fmt(last.contacts)} hint="+94 מתחילת החודש" tone="orange" />
      <Stat label="אחוז פתיחה (30 יום)" value={`${pct(opened, delivered)}%`} hint={`${fmt(opened)} מתוך ${fmt(delivered)} שנמסרו`} />
      <Stat label="אחוז הקלקה (30 יום)" value={`${pct(clicked, delivered)}%`} hint={`${fmt(clicked)} הקלקות`} />
      <Stat label="חמים כרגע" value={fmt(STAGE_COUNTS.hot)} hint="ניקוד 45+ ב-90 יום" tone="orange" />
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
          <li className="flex gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" /><span>נוכחות ב-HR מחוץ לשגרה עדיין לא סומנה, ולכן חוקי "הגיע" ו"לא הגיע" לא רצו.</span></li>
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
        <p className="text-xs text-muted-foreground mt-3">הניקוד כולל פעולות מכל ערוץ: מייל, טפסים, אירועים, שיחות ופגישות.</p>
      </Panel>
    </div>

    <div className="grid lg:grid-cols-3 gap-4">
      <Panel title="פעולות מומלצות שממתינות לך" className="lg:col-span-2" actions={<Link to="/mailing/engagement" className="text-xs text-primary">לכל ההמלצות</Link>}>
        <ul className="divide-y">{SUGGESTIONS.slice(0, 3).map(s => <li key={s.id} className="py-2.5 flex gap-2 text-sm">
          <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1"><p>{s.signal}</p><p className="text-xs text-muted-foreground">מוצע: {s.move}</p></div>
        </li>)}</ul>
      </Panel>
      <Panel title="שלבי מעורבות במאגר">
        <ul className="space-y-2 text-sm">{Object.entries(STAGES).map(([k, st]) => <li key={k} className="flex justify-between"><Pill tone={st.tone}>{st.label}</Pill><span className="tabular-nums">{fmt(STAGE_COUNTS[k])}</span></li>)}</ul>
      </Panel>
    </div>
  </div>;
}
