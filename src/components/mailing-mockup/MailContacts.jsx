import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Upload, Tag, ListPlus, Mail, MousePointerClick, Eye, PhoneCall, CalendarCheck, Plus } from "lucide-react";
import { CONTACTS, CONSENT, SOURCES, STAGES, ENGAGEMENT_TYPES, stageOf, dateHe } from "./mockData";
import { PageHeader, Pill, Table } from "./shared";

const HISTORY = [
  { at: "2026-11-12", what: "הקליק על קישור", detail: "הזמנה ל-Workies AI Open Stage · כפתור הרשמה", icon: MousePointerClick, src: "אוטומטי · מייל", pts: 3 },
  { at: "2026-11-10", what: "ענה לשיחה", detail: "מתעניין במשרד לשניים מינואר", icon: PhoneCall, src: "ידני · נדב", pts: 4 },
  { at: "2026-11-09", what: "הגיע לאירוע", detail: "Workies AI Open Stage", icon: CalendarCheck, src: "ידני · סימון נוכחות", pts: 10 },
  { at: "2026-11-09", what: "פתח מייל", detail: "הזמנה ל-Workies AI Open Stage", icon: Eye, src: "אוטומטי · מייל", pts: 1 },
  { at: "2026-11-04", what: "פתח מייל", detail: "ניוזלטר נובמבר", icon: Eye, src: "אוטומטי · מייל", pts: 1 },
  { at: "2026-10-21", what: "נרשם בעמוד נחיתה", detail: "Workies AI · אישר דיוור", icon: Mail, src: "אוטומטי · עמוד נחיתה", pts: 6 },
];

export default function MailContacts() {
  const [q, setQ] = useState("");
  const [consent, setConsent] = useState("all");
  const [source, setSource] = useState("all");
  const [selected, setSelected] = useState([]);
  const [open, setOpen] = useState(null);
  const [logging, setLogging] = useState(false);

  const rows = useMemo(() => CONTACTS.filter(c =>
    (consent === "all" || c.consent === consent) &&
    (source === "all" || c.sources.includes(source)) &&
    (!q || [c.name, c.email, c.phone, c.company].join(" ").toLowerCase().includes(q.toLowerCase()))
  ), [q, consent, source]);

  const toggle = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allOn = rows.length > 0 && rows.every(r => selected.includes(r.id));

  return <div className="space-y-4">
    <PageHeader title="אנשי קשר" subtitle="רשומה אחת לכל כתובת מייל, מכל המקורות. 1,496 אנשי קשר במאגר המלא; מוצגות 12 לדוגמה."
      actions={<Button asChild variant="outline"><Link to="/mailing/import"><Upload className="w-4 h-4 ml-1" />ייבוא</Link></Button>} />

    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש לפי שם, מייל, טלפון או חברה" className="pr-9" />
      </div>
      <select value={consent} onChange={e => setConsent(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm" aria-label="סינון לפי הסכמה">
        <option value="all">כל סטטוסי ההסכמה</option>
        {Object.entries(CONSENT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <select value={source} onChange={e => setSource(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm" aria-label="סינון לפי מקור">
        <option value="all">כל המקורות</option>
        {Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </div>

    {selected.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
      <span className="font-medium">{selected.length} נבחרו</span>
      <Button size="sm" variant="outline"><Tag className="w-4 h-4 ml-1" />הוספת תגית</Button>
      <Button size="sm" variant="outline"><ListPlus className="w-4 h-4 ml-1" />הוספה לרשימה</Button>
      <Button size="sm" variant="ghost" onClick={() => setSelected([])}>ניקוי בחירה</Button>
    </div>}

    <Table head={[
      <input key="all" type="checkbox" aria-label="בחירת הכל" checked={allOn} onChange={() => setSelected(allOn ? [] : rows.map(r => r.id))} />,
      "שם", "מייל", "מקורות", "תגיות", "הסכמה", "פעילות אחרונה", "שלב מעורבות"]}>
      {rows.map(c => <tr key={c.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => setOpen(c)}>
        <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}><input type="checkbox" aria-label={`בחירת ${c.name}`} checked={selected.includes(c.id)} onChange={() => toggle(c.id)} /></td>
        <td className="px-3 py-2.5 font-medium whitespace-nowrap">{c.name}<div className="text-xs text-muted-foreground font-normal">{c.company}</div></td>
        <td className="px-3 py-2.5 text-muted-foreground" dir="ltr" style={{ textAlign: "right" }}>{c.email}</td>
        <td className="px-3 py-2.5"><div className="flex flex-wrap gap-1">{c.sources.map(s => <Pill key={s} tone="blue">{SOURCES[s]}</Pill>)}</div></td>
        <td className="px-3 py-2.5"><div className="flex flex-wrap gap-1">{c.tags.map(t => <Pill key={t}>{t}</Pill>)}</div></td>
        <td className="px-3 py-2.5"><Pill tone={CONSENT[c.consent].tone}>{CONSENT[c.consent].label}</Pill></td>
        <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{dateHe(c.last)}</td>
        <td className="px-3 py-2.5 whitespace-nowrap"><Pill tone={STAGES[stageOf(c.score)].tone}>{STAGES[stageOf(c.score)].label} · {c.score}</Pill></td>
      </tr>)}
      {rows.length === 0 && <tr><td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">אין אנשי קשר שמתאימים לסינון.</td></tr>}
    </Table>

    <Sheet open={!!open} onOpenChange={v => !v && setOpen(null)}>
      <SheetContent side="left" dir="rtl" className="w-full sm:max-w-md overflow-y-auto">
        {open && <>
          <SheetHeader><SheetTitle className="text-right">{open.name}</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-5 text-sm">
            <dl className="grid grid-cols-3 gap-y-2">
              <dt className="text-muted-foreground">מייל</dt><dd className="col-span-2" dir="ltr" style={{ textAlign: "right" }}>{open.email}</dd>
              <dt className="text-muted-foreground">טלפון</dt><dd className="col-span-2" dir="ltr" style={{ textAlign: "right" }}>{open.phone}</dd>
              <dt className="text-muted-foreground">חברה</dt><dd className="col-span-2">{open.company || "—"}</dd>
              <dt className="text-muted-foreground">הסכמה</dt><dd className="col-span-2"><Pill tone={CONSENT[open.consent].tone}>{CONSENT[open.consent].label}</Pill></dd>
              <dt className="text-muted-foreground">בסיס הסכמה</dt><dd className="col-span-2">{open.consent === "pending" ? "לא תועד — ייבוא ממאגר ישן" : "תיבת הסכמה בעמוד נחיתה"}</dd>
            </dl>
            <div>
              <p className="font-medium mb-2">מקורות</p>
              <div className="flex flex-wrap gap-1">{open.sources.map(s => <Pill key={s} tone="blue">{SOURCES[s]}</Pill>)}</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">מעורבות <Pill tone={STAGES[stageOf(open.score)].tone}>{STAGES[stageOf(open.score)].label} · {open.score}</Pill></p>
                <Button size="sm" variant="outline" onClick={() => setLogging(l => !l)}><Plus className="w-3.5 h-3.5 ml-1" />רישום מעורבות</Button>
              </div>
              {logging && <div className="mb-3 space-y-2 rounded-lg border bg-muted/40 p-3">
                <select className="h-9 w-full rounded-md border bg-background px-2">{Object.entries(ENGAGEMENT_TYPES).filter(([, t]) => !t.auto).map(([k, t]) => <option key={k}>{t.label} (+{t.points})</option>)}</select>
                <Input placeholder="הערה (אופציונלי)" />
                <div className="flex justify-end"><Button size="sm" onClick={() => setLogging(false)}>שמירה</Button></div>
              </div>}
              <ol className="space-y-3 border-r pr-3">
                {HISTORY.map((h, i) => <li key={i} className="flex gap-2">
                  <h.icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1"><p>{h.what} <span className="text-muted-foreground text-xs">· {dateHe(h.at)}</span></p><p className="text-xs text-muted-foreground">{h.detail}</p><p className="text-[11px] text-muted-foreground mt-0.5">{h.src}</p></div><span className="text-xs tabular-nums text-primary">+{h.pts}</span>
                </li>)}
              </ol>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button size="sm" variant="outline">עריכת פרטים</Button>
              <Button size="sm" variant="outline">הוספה לרשימה</Button>
              <Button size="sm" variant="ghost" className="text-rose-700">הסרה מדיוור</Button>
            </div>
          </div>
        </>}
      </SheetContent>
    </Sheet>
  </div>;
}
