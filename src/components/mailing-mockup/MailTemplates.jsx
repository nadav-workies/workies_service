import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ArrowUp, ArrowDown, Trash2, Heading, Type, Image, MousePointerClick, Minus, PenLine, ArrowRight, Send, Lock } from "lucide-react";
import { TEMPLATES, dateHe } from "./mockData";
import { PageHeader, Pill, Panel } from "./shared";
import EmailPreview, { DEFAULT_BLOCKS } from "./EmailPreview";

const BLOCK_TYPES = [
  { type: "heading", label: "כותרת", icon: Heading, text: "כותרת חדשה" },
  { type: "text", label: "טקסט", icon: Type, text: "פסקת טקסט" },
  { type: "image", label: "תמונה", icon: Image, text: "תמונה" },
  { type: "button", label: "כפתור", icon: MousePointerClick, text: "לפרטים", url: "https://" },
  { type: "divider", label: "מפריד", icon: Minus },
  { type: "signature", label: "חתימה", icon: PenLine, text: "נדב בנג'ו\nמנכ\"ל וורקיז" },
];
const VARS = ["{{first_name}}", "{{company}}", "{{event_name}}", "{{page_url}}"];

function Editor({ onBack }) {
  const [subject, setSubject] = useState("{{first_name}}, שמרנו לך מקום");
  const [preheader, setPreheader] = useState("Workies AI Open Stage · 1 בדצמבר · 18:30");
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [sel, setSel] = useState("b2");
  const [tested, setTested] = useState(false);
  const cur = blocks.find(b => b.id === sel);
  const set = patch => setBlocks(bs => bs.map(b => b.id === sel ? { ...b, ...patch } : b));
  const move = (id, d) => setBlocks(bs => { const i = bs.findIndex(b => b.id === id), j = i + d; if (j < 0 || j >= bs.length) return bs; const c = [...bs]; [c[i], c[j]] = [c[j], c[i]]; return c; });
  const add = t => { const id = `n${Date.now()}`; setBlocks(bs => [...bs, { id, type: t.type, text: t.text, url: t.url }]); setSel(id); };

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-primary"><ArrowRight className="w-4 h-4" />חזרה לטמפלטים</button>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setTested(true)}><Send className="w-4 h-4 ml-1" />מייל בדיקה אליי</Button>
        <Button>שמירת טמפלט</Button>
      </div>
    </div>
    {tested && <p className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800">במערכת האמיתית: מייל בדיקה נשלח לכתובת שלך. במוקאפ לא נשלח דבר.</p>}

    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-4">
      <div className="space-y-4">
        <Panel title="נושא ותקציר">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">שורת נושא</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} />
            <label className="text-xs text-muted-foreground">טקסט מקדים (מופיע אחרי הנושא בתיבת הדואר)</label>
            <Input value={preheader} onChange={e => setPreheader(e.target.value)} />
            <div className="flex flex-wrap gap-1 pt-1">{VARS.map(v => <button key={v} onClick={() => setSubject(s => s + " " + v)} className="rounded border px-2 py-0.5 text-xs font-mono text-muted-foreground hover:bg-muted" dir="ltr">{v}</button>)}</div>
          </div>
        </Panel>
        <Panel title="בלוקים">
          <ul className="space-y-1.5">
            {blocks.map(b => { const t = BLOCK_TYPES.find(x => x.type === b.type); return <li key={b.id}
              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm cursor-pointer ${sel === b.id ? "border-primary bg-primary/5" : ""}`} onClick={() => setSel(b.id)}>
              <t.icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate">{b.type === "divider" ? "מפריד" : (b.text || "").split("\n")[0]}</span>
              <button onClick={e => { e.stopPropagation(); move(b.id, -1); }} aria-label="למעלה"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button onClick={e => { e.stopPropagation(); move(b.id, 1); }} aria-label="למטה"><ArrowDown className="w-3.5 h-3.5" /></button>
              <button onClick={e => { e.stopPropagation(); setBlocks(bs => bs.filter(x => x.id !== b.id)); }} aria-label="מחיקה"><Trash2 className="w-3.5 h-3.5 text-rose-600" /></button>
            </li>; })}
          </ul>
          <div className="flex flex-wrap gap-1.5 mt-3">{BLOCK_TYPES.map(t => <Button key={t.type} size="sm" variant="outline" onClick={() => add(t)}><t.icon className="w-3.5 h-3.5 ml-1" />{t.label}</Button>)}</div>
          {cur && cur.type !== "divider" && <div className="mt-4 space-y-2 border-t pt-3">
            <label className="text-xs text-muted-foreground">תוכן הבלוק הנבחר</label>
            <Textarea rows={3} value={cur.text || ""} onChange={e => set({ text: e.target.value })} />
            {cur.type === "button" && <Input dir="ltr" value={cur.url || ""} onChange={e => set({ url: e.target.value })} placeholder="https://" />}
          </div>}
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="w-3.5 h-3.5" />כותרת תחתונה עם פרטי השולח וקישור הסרה נוספת אוטומטית ולא ניתנת למחיקה.</p>
        </Panel>
      </div>
      <div className="lg:sticky lg:top-4 self-start">
        <p className="text-xs text-muted-foreground mb-2">תצוגה מקדימה · הנמענת לדוגמה: מיכל אברהם</p>
        <EmailPreview subject={subject} preheader={preheader} blocks={blocks} />
      </div>
    </div>
  </div>;
}

export default function MailTemplates() {
  const [editing, setEditing] = useState(false);
  if (editing) return <Editor onBack={() => setEditing(false)} />;
  return <div className="space-y-4">
    <PageHeader title="טמפלטים" subtitle="תבניות לשימוש חוזר בקמפיינים ובאוטומציות. כל תבנית נבנית מבלוקים, כך שהעברית וה-RTL נשמרים בכל תיבת דואר."
      actions={<Button onClick={() => setEditing(true)}><Plus className="w-4 h-4 ml-1" />טמפלט חדש</Button>} />
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {TEMPLATES.map(t => <button key={t.id} onClick={() => setEditing(true)} className="text-right rounded-xl border bg-card overflow-hidden hover:border-primary transition-colors">
        <div className="h-32 bg-gradient-to-br from-teal-50 to-zinc-100 flex flex-col items-center justify-center gap-2 border-b">
          <span className="text-sm font-black tracking-wide" style={{ color: "#0f5c63" }}>WORKIES</span>
          <span className="h-1.5 w-28 rounded bg-zinc-300" /><span className="h-1.5 w-20 rounded bg-zinc-200" />
          <span className="h-4 w-16 rounded" style={{ background: "#0f5c63" }} />
        </div>
        <div className="p-3 space-y-1">
          <div className="flex items-center justify-between gap-2"><p className="font-semibold text-sm">{t.name}</p><Pill>{t.category}</Pill></div>
          <p className="text-xs text-muted-foreground truncate">נושא: {t.subject}</p>
          <p className="text-xs text-muted-foreground">עודכן {dateHe(t.updated)}</p>
        </div>
      </button>)}
    </div>
  </div>;
}
