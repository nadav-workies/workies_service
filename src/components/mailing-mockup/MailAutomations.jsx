import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, ArrowRight, Zap, Mail, Clock, GitBranch, LogOut, ArrowDown } from "lucide-react";
import { AUTOMATIONS, fmt } from "./mockData";
import { PageHeader, Pill, Panel } from "./shared";

const ICONS = { email: Mail, delay: Clock, condition: GitBranch, exit: LogOut };
const TRIGGERS = [
  "ליד חדש מעמוד נחיתה (לפי קמפיין)",
  "איש קשר יובא מקובץ",
  "אירוע מ-AIO (חוזה נחתם, סיום התקשרות…)",
  "תגית נוספה לאיש קשר",
  "תאריך (X ימים אחרי הרשמה)",
];

function Node({ icon: Icon, title, sub, tone = "default", children }) {
  const ring = tone === "trigger" ? "border-primary bg-primary/5" : tone === "condition" ? "border-amber-300 bg-amber-50" : "bg-card";
  return <div className={`w-full max-w-md rounded-xl border p-3 ${ring}`}>
    <div className="flex items-center gap-2"><Icon className="w-4 h-4 shrink-0" /><p className="font-medium text-sm flex-1">{title}</p></div>
    {sub && <p className="text-xs text-muted-foreground mt-1 mr-6">{sub}</p>}
    {children}
  </div>;
}

function Builder({ a, onBack }) {
  const [active, setActive] = useState(a.active);
  return <div className="space-y-4">
    <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-primary"><ArrowRight className="w-4 h-4" />חזרה לאוטומציות</button>
    <PageHeader title={a.name} subtitle={`${fmt(a.enrolled)} נכנסו · ${fmt(a.completed)} סיימו · כרגע במסלול: ${a.enrolled - a.completed}`}
      actions={<label className="flex items-center gap-2 text-sm">{active ? "פעילה" : "כבויה"}<Switch checked={active} onCheckedChange={setActive} /></label>} />
    <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-4">
      <Panel title="מסלול">
        <div className="flex flex-col items-center gap-1.5">
          <Node icon={Zap} title="טריגר" sub={a.trigger} tone="trigger" />
          {a.steps.map((s, i) => { const I = ICONS[s.type]; return <div key={i} className="contents">
            <ArrowDown className="w-4 h-4 text-muted-foreground" />
            <Node icon={I} title={s.title} sub={s.template ? `טמפלט: ${s.template}` : null} tone={s.type === "condition" ? "condition" : "default"}>
              {s.type === "condition" && <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div className="rounded-md border bg-white px-2 py-1.5"><b>כן</b> → {s.yes}</div>
                <div className="rounded-md border bg-white px-2 py-1.5"><b>לא</b> → {s.no}</div>
              </div>}
            </Node>
          </div>; })}
          <ArrowDown className="w-4 h-4 text-muted-foreground" />
          <Button variant="outline" size="sm"><Plus className="w-4 h-4 ml-1" />הוספת שלב</Button>
        </div>
      </Panel>
      <div className="space-y-4">
        <Panel title="כללי המסלול">
          <ul className="space-y-2 text-sm">
            <li>איש קשר נכנס למסלול <b>פעם אחת בלבד</b>.</li>
            <li>הסרה מדיוור <b>עוצרת מיד</b> את כל השלבים הבאים.</li>
            <li>מי שהפך ללקוח פעיל ב-AIO יוצא מהמסלול השיווקי.</li>
            <li>שליחה רק בשעות 08:00–20:00, לא בשבת.</li>
          </ul>
        </Panel>
        <Panel title="ביצועים לפי שלב">
          <ul className="space-y-2 text-sm">
            {[["ברוכים הבאים", 58, 71], ["תזכורת התנסות", 33, 52], ["הצעה למשרד", 21, 48]].map(([n, sent, open]) =>
              <li key={n} className="flex justify-between gap-2"><span>{n}</span><span className="text-muted-foreground tabular-nums">{sent} נשלחו · {open}% פתיחה</span></li>)}
          </ul>
          <p className="text-xs text-muted-foreground mt-3">17 מתוך 58 קבעו יום התנסות ויצאו מהמסלול לפני המייל השני.</p>
        </Panel>
      </div>
    </div>
  </div>;
}

export default function MailAutomations() {
  const [open, setOpen] = useState(null);
  const [creating, setCreating] = useState(false);
  if (open) return <Builder a={open} onBack={() => setOpen(null)} />;
  return <div className="space-y-4">
    <PageHeader title="אוטומציות" subtitle="רצפי מיילים שמופעלים לבד: מעמודי נחיתה, מייבוא, מ-AIO או לפי תאריך."
      actions={<Button onClick={() => setCreating(c => !c)}><Plus className="w-4 h-4 ml-1" />אוטומציה חדשה</Button>} />
    {creating && <Panel title="מה מפעיל את האוטומציה?">
      <div className="grid sm:grid-cols-2 gap-2">
        {TRIGGERS.map(t => <button key={t} onClick={() => setOpen(AUTOMATIONS[0])} className="flex items-center gap-2 rounded-lg border p-3 text-sm text-right hover:border-primary"><Zap className="w-4 h-4 text-primary" />{t}</button>)}
      </div>
    </Panel>}
    <div className="space-y-2">
      {AUTOMATIONS.map(a => <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
        <Zap className={`w-5 h-5 ${a.active ? "text-primary" : "text-muted-foreground"}`} />
        <div className="flex-1 min-w-[200px]"><p className="font-semibold">{a.name}</p><p className="text-xs text-muted-foreground">{a.trigger}</p></div>
        <span className="text-sm text-muted-foreground tabular-nums">{fmt(a.enrolled)} נכנסו · {fmt(a.completed)} סיימו</span>
        <Pill tone={a.active ? "green" : "gray"}>{a.active ? "פעילה" : "כבויה"}</Pill>
        <Button size="sm" variant="outline" onClick={() => setOpen(a.steps.length ? a : AUTOMATIONS[0])}>פתיחה</Button>
      </div>)}
    </div>
  </div>;
}
