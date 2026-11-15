import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Zap, Check, X, Pencil, Plus, Hand, Bot, Lightbulb, CalendarCheck, PhoneCall } from "lucide-react";
import { RULES, SUGGESTIONS, ENGAGEMENT_TYPES, STAGES, STAGE_COUNTS, EVENTS_FOR_ATTENDANCE, CONTACTS, fmt, dateHe } from "./mockData";
import { PageHeader, Pill, Panel } from "./shared";

const TABS = [
  { key: "suggestions", label: "פעולות מומלצות", icon: Lightbulb },
  { key: "rules", label: "חוקי מעורבות", icon: Zap },
  { key: "manual", label: "רישום ידני", icon: Hand },
  { key: "scoring", label: "ניקוד ושלבים", icon: Bot },
];
const URG = { high: ["orange", "דחוף"], mid: ["yellow", "השבוע"], low: ["gray", "כשיש זמן"] };
const SIGNALS = ["פתח מייל", "הקליק על קישור מסוים", "השיב למייל", "נרשם (טופס / אירוע)", "הגיע לאירוע", "ענה לשיחה", "פגישה / סיור", "ניקוד עבר סף", "לא עשה כלום X ימים"];
const MOVES = ["שליחת מייל מטמפלט", "משימת שיחה למכירות", "התראה למנהל", "הוספה לסגמנט", "הוספת תגית"];

function Suggestions() {
  const [state, setState] = useState({});
  const open = SUGGESTIONS.filter(s => !state[s.id]);
  return <div className="space-y-3">
    <p className="text-sm text-muted-foreground">המערכת סורקת את אירועי המעורבות כל לילה ומציעה את המהלך הבא. שום דבר לא יוצא בלי אישור, חוץ מחוקים שהוגדרו כאוטומטיים.</p>
    {open.length === 0 && <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">אין פעולות פתוחות. כל ההמלצות טופלו.</p>}
    {open.map(s => { const r = RULES.find(x => x.id === s.rule); return <div key={s.id} className="rounded-xl border bg-card p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={URG[s.urgency][0]}>{URG[s.urgency][1]}</Pill>
        <span className="text-xs text-muted-foreground">חוק: {r.name}</span>
      </div>
      <p className="font-medium">{s.signal}</p>
      <p className="text-sm"><span className="text-muted-foreground">מהלך מוצע: </span>{s.move}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" onClick={() => setState(v => ({ ...v, [s.id]: "done" }))}><Check className="w-4 h-4 ml-1" />אישור וביצוע ({fmt(s.count)})</Button>
        <Button size="sm" variant="outline"><Pencil className="w-4 h-4 ml-1" />עריכה לפני ביצוע</Button>
        <Button size="sm" variant="ghost" onClick={() => setState(v => ({ ...v, [s.id]: "dismissed" }))}><X className="w-4 h-4 ml-1" />דחייה</Button>
      </div>
    </div>; })}
    {Object.keys(state).length > 0 && <p className="text-xs text-muted-foreground">{Object.values(state).filter(v => v === "done").length} אושרו · {Object.values(state).filter(v => v === "dismissed").length} נדחו (במוקאפ לא נשלח דבר)</p>}
  </div>;
}

function Rules() {
  const [rules, setRules] = useState(RULES);
  const [adding, setAdding] = useState(false);
  const set = (id, patch) => setRules(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
  return <div className="space-y-3">
    <div className="flex justify-between items-center gap-2 flex-wrap">
      <p className="text-sm text-muted-foreground">כל חוק: אות מעורבות (או היעדר אות) → מהלך. לא קשור למקור הליד ולא למסלול קבוע.</p>
      <Button size="sm" onClick={() => setAdding(a => !a)}><Plus className="w-4 h-4 ml-1" />חוק חדש</Button>
    </div>
    {adding && <Panel title="חוק חדש">
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <label className="space-y-1"><span className="text-xs text-muted-foreground">כאשר</span>
          <select className="h-9 w-full rounded-md border bg-background px-2">{SIGNALS.map(s => <option key={s}>{s}</option>)}</select></label>
        <label className="space-y-1"><span className="text-xs text-muted-foreground">וגם לא קרה (אופציונלי)</span>
          <select className="h-9 w-full rounded-md border bg-background px-2"><option>—</option>{SIGNALS.map(s => <option key={s}>{s}</option>)}</select></label>
        <label className="space-y-1"><span className="text-xs text-muted-foreground">בתוך</span>
          <div className="flex gap-2 items-center"><Input defaultValue="3" className="h-9 w-20" /> ימים</div></label>
        <label className="space-y-1"><span className="text-xs text-muted-foreground">המהלך</span>
          <select className="h-9 w-full rounded-md border bg-background px-2">{MOVES.map(s => <option key={s}>{s}</option>)}</select></label>
        <label className="space-y-1 sm:col-span-2"><span className="text-xs text-muted-foreground">אופן ביצוע</span>
          <div className="flex gap-4"><label className="flex items-center gap-2"><input type="radio" name="mode" defaultChecked />הצעה לאישור</label><label className="flex items-center gap-2"><input type="radio" name="mode" />אוטומטי</label></div></label>
      </div>
      <div className="flex justify-end mt-3"><Button size="sm" onClick={() => setAdding(false)}>שמירה</Button></div>
    </Panel>}
    {rules.map(r => <div key={r.id} className="rounded-xl border bg-card p-4 flex flex-wrap items-start gap-3">
      <Zap className={`w-5 h-5 mt-0.5 ${r.active ? "text-primary" : "text-muted-foreground"}`} />
      <div className="flex-1 min-w-[240px] space-y-1">
        <p className="font-semibold">{r.name}</p>
        <p className="text-sm"><span className="text-muted-foreground">כאשר: </span>{r.when}</p>
        <p className="text-sm"><span className="text-muted-foreground">מהלך: </span>{r.move}</p>
        <p className="text-xs text-muted-foreground">הופעל {fmt(r.hits)} פעמים ב-30 הימים האחרונים</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <button onClick={() => set(r.id, { mode: r.mode === "auto" ? "suggest" : "auto" })}>
          <Pill tone={r.mode === "auto" ? "blue" : "yellow"}>{r.mode === "auto" ? "אוטומטי" : "הצעה לאישור"}</Pill>
        </button>
        <Switch checked={r.active} onCheckedChange={v => set(r.id, { active: v })} aria-label="הפעלה" />
      </div>
    </div>)}
    <p className="text-xs text-muted-foreground">כללי בטיחות לכל החוקים: מי שהסיר את עצמו לא מקבל דבר · לכל היותר מייל שיווקי אחד ל-3 ימים לאיש קשר · משלוח בין 08:00 ל-20:00, לא בשבת.</p>
  </div>;
}

function Manual() {
  const [ev, setEv] = useState("e1");
  const [present, setPresent] = useState({});
  const [saved, setSaved] = useState("");
  const E = EVENTS_FOR_ATTENDANCE.find(e => e.id === ev);
  const people = E.registered.map(id => CONTACTS.find(c => c.id === id));
  return <div className="grid lg:grid-cols-2 gap-4">
    <Panel title={<span className="inline-flex items-center gap-2"><CalendarCheck className="w-4 h-4" />סימון נוכחות באירוע</span>}>
      <div className="space-y-3 text-sm">
        <select value={ev} onChange={e => { setEv(e.target.value); setPresent({}); }} className="h-9 w-full rounded-md border bg-background px-2">
          {EVENTS_FOR_ATTENDANCE.map(e => <option key={e.id} value={e.id}>{e.name} · {dateHe(e.date)}</option>)}
        </select>
        <ul className="divide-y rounded-lg border">{people.map(p => <li key={p.id} className="flex items-center gap-2 px-3 py-2">
          <input type="checkbox" checked={!!present[p.id]} onChange={() => setPresent(v => ({ ...v, [p.id]: !v[p.id] }))} aria-label={`הגיע: ${p.name}`} />
          <span className="flex-1">{p.name}</span><span className="text-xs text-muted-foreground">{p.company}</span>
        </li>)}</ul>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{Object.values(present).filter(Boolean).length} מתוך {people.length} סומנו כהגיעו</span>
          <Button size="sm" onClick={() => setSaved(`נרשמו ${Object.values(present).filter(Boolean).length} אירועי 'הגיע לאירוע' (+10 לכל אחד). השאר יסומנו 'נרשם ולא הגיע'.`)}>שמירת נוכחות</Button>
        </div>
        <p className="text-xs text-muted-foreground">אפשר גם לייבא רשימת נוכחות מקובץ, דרך מסך הייבוא.</p>
      </div>
    </Panel>
    <Panel title={<span className="inline-flex items-center gap-2"><PhoneCall className="w-4 h-4" />רישום פעולה בודדת</span>}>
      <div className="space-y-2 text-sm">
        <label className="text-xs text-muted-foreground">איש קשר</label>
        <select className="h-9 w-full rounded-md border bg-background px-2">{CONTACTS.map(c => <option key={c.id}>{c.name} · {c.email}</option>)}</select>
        <label className="text-xs text-muted-foreground">סוג מעורבות</label>
        <select className="h-9 w-full rounded-md border bg-background px-2">{Object.entries(ENGAGEMENT_TYPES).filter(([, t]) => !t.auto).map(([k, t]) => <option key={k}>{t.label} (+{t.points})</option>)}</select>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-xs text-muted-foreground">תאריך</label><Input type="date" defaultValue="2026-11-15" className="h-9" /></div>
          <div><label className="text-xs text-muted-foreground">קמפיין / אירוע (אופציונלי)</label><Input className="h-9" placeholder="למשל: מבצע משרד יחיד" /></div>
        </div>
        <label className="text-xs text-muted-foreground">הערה</label>
        <Input placeholder="למשל: ענה, מתעניין במשרד ל-2 מינואר" />
        <div className="flex justify-end"><Button size="sm" onClick={() => setSaved("הפעולה נרשמה בכרטיס איש הקשר ועדכנה את הניקוד.")}>רישום</Button></div>
      </div>
    </Panel>
    {saved && <p className="lg:col-span-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800">{saved} (מוקאפ — לא נשמר)</p>}
  </div>;
}

function Scoring() {
  const total = Object.values(STAGE_COUNTS).reduce((a, b) => a + b, 0);
  return <div className="grid lg:grid-cols-2 gap-4">
    <Panel title="ניקוד לכל סוג מעורבות">
      <table className="w-full text-sm"><tbody className="divide-y">
        {Object.entries(ENGAGEMENT_TYPES).map(([k, t]) => <tr key={k}>
          <td className="py-2">{t.label}</td>
          <td className="py-2"><Pill tone={t.auto ? "blue" : "gray"}>{t.auto ? "נאסף אוטומטית" : "רישום ידני"}</Pill></td>
          <td className="py-2 w-20"><Input defaultValue={t.points} className="h-8 w-16 text-center" aria-label={`ניקוד ${t.label}`} /></td>
        </tr>)}
      </tbody></table>
      <p className="text-xs text-muted-foreground mt-3">הניקוד נספר על 90 הימים האחרונים בלבד, כך שמי שהיה פעיל בעבר ונעלם יורד בשלב.</p>
    </Panel>
    <Panel title="התפלגות המאגר לפי שלב מעורבות">
      <div className="space-y-3">
        {Object.entries(STAGES).map(([k, s]) => <div key={k} className="text-sm">
          <div className="flex justify-between"><span className="flex items-center gap-2"><Pill tone={s.tone}>{s.label}</Pill></span><span className="tabular-nums">{fmt(STAGE_COUNTS[k])}</span></div>
          <div className="h-2 mt-1 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary/80 rounded-full" style={{ width: `${(STAGE_COUNTS[k] / total) * 100}%` }} /></div>
        </div>)}
        <p className="text-xs text-muted-foreground">ספי שלבים: קר 0–9 · מתחמם 10–24 · מעורב 25–44 · חם 45 ומעלה.</p>
      </div>
    </Panel>
  </div>;
}

export default function MailEngagement() {
  const [tab, setTab] = useState("suggestions");
  return <div className="space-y-4">
    <PageHeader title="מנוע מעורבות" subtitle="המערכת לא מניחה מה קרה ללקוח. היא קוראת מה הוא עושה בפועל, מכל ערוץ, ויוזמת את המהלך הבא." />
    <div className="flex flex-wrap gap-1 border-b">
      {TABS.map(t => <button key={t.key} onClick={() => setTab(t.key)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px ${tab === t.key ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground"}`}>
        <t.icon className="w-4 h-4" />{t.label}{t.key === "suggestions" && <span className="rounded-full bg-primary text-primary-foreground text-[10px] px-1.5">{SUGGESTIONS.length}</span>}
      </button>)}
    </div>
    {tab === "suggestions" && <Suggestions />}
    {tab === "rules" && <Rules />}
    {tab === "manual" && <Manual />}
    {tab === "scoring" && <Scoring />}
  </div>;
}
