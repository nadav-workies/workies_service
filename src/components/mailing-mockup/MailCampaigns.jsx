import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ArrowRight, Check, Send, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
import { CAMPAIGNS, CAMPAIGN_STATUS, LISTS, TEMPLATES, pct, fmt, dateHe } from "./mockData";
import { PageHeader, Pill, Panel, Stat, Table, Bar } from "./shared";
import EmailPreview, { DEFAULT_BLOCKS } from "./EmailPreview";

const STEPS = ["קהל", "תוכן", "בדיקה", "שליחה"];

function Wizard({ onDone }) {
  const [step, setStep] = useState(0);
  const [list, setList] = useState("l2");
  const [tpl, setTpl] = useState("t2");
  const [name, setName] = useState("הזמנה ל-Workies AI Open Stage דצמבר");
  const [when, setWhen] = useState("now");
  const [checks, setChecks] = useState({ test: false, links: false, audience: false });
  const L = LISTS.find(l => l.id === list), T = TEMPLATES.find(t => t.id === tpl);
  const excluded = Math.round(L.count * 0.03);
  const ready = Object.values(checks).every(Boolean);

  return <div className="space-y-4">
    <button onClick={onDone} className="inline-flex items-center gap-1 text-sm text-primary"><ArrowRight className="w-4 h-4" />חזרה לקמפיינים</button>
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((s, i) => <li key={s}><button onClick={() => i < step && setStep(i)}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${i === step ? "border-primary bg-primary text-primary-foreground" : i < step ? "border-primary/40 text-primary" : "text-muted-foreground"}`}>
        <span className="tabular-nums">{i < step ? <Check className="w-4 h-4" /> : i + 1}</span>{s}
      </button></li>)}
    </ol>

    {step === 0 && <Panel title="למי שולחים">
      <div className="space-y-3">
        <label className="text-xs text-muted-foreground">שם הקמפיין (פנימי)</label>
        <Input value={name} onChange={e => setName(e.target.value)} />
        <p className="text-xs text-muted-foreground pt-2">בחירת רשימה או סגמנט</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {LISTS.map(l => <label key={l.id} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${list === l.id ? "border-primary bg-primary/5" : ""}`}>
            <input type="radio" name="list" checked={list === l.id} onChange={() => setList(l.id)} />
            <div className="flex-1"><p className="text-sm font-medium">{l.name}</p><p className="text-xs text-muted-foreground">{l.rule}</p></div>
            <span className="text-sm tabular-nums">{fmt(l.count)}</span>
          </label>)}
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
          נמענים בפועל: <b className="tabular-nums">{fmt(L.count - excluded)}</b>
          <span className="text-muted-foreground"> · {fmt(excluded)} סוננו (הסירו את עצמם / כתובת חוזרת / ממתינים להסכמה)</span>
        </div>
      </div>
    </Panel>}

    {step === 1 && <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4">
      <Panel title="בחירת טמפלט">
        <div className="space-y-2">
          {TEMPLATES.map(t => <label key={t.id} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${tpl === t.id ? "border-primary bg-primary/5" : ""}`}>
            <input type="radio" name="tpl" checked={tpl === t.id} onChange={() => setTpl(t.id)} />
            <div className="flex-1"><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-muted-foreground truncate">נושא: {t.subject}</p></div>
            <Pill>{t.category}</Pill>
          </label>)}
          <label className="text-xs text-muted-foreground block pt-2">שם השולח</label>
          <Input defaultValue="נדב מוורקיז" />
          <label className="text-xs text-muted-foreground block">כתובת לתשובות</label>
          <Input dir="ltr" defaultValue="hello@workies.co.il" />
        </div>
      </Panel>
      <EmailPreview subject={T.subject} preheader="Workies AI Open Stage · 1 בדצמבר · 18:30" blocks={DEFAULT_BLOCKS} compact />
    </div>}

    {step === 2 && <Panel title="בדיקה לפני שליחה">
      <div className="space-y-3">
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">קהל</p><p className="font-medium">{L.name}</p><p className="tabular-nums">{fmt(L.count - excluded)} נמענים</p></div>
          <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">טמפלט</p><p className="font-medium">{T.name}</p><p className="text-muted-foreground truncate">{T.subject}</p></div>
          <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">שולח</p><p className="font-medium">נדב מוורקיז</p><p dir="ltr" className="text-muted-foreground text-right">news@news.workies.co.il</p></div>
        </div>
        <p className="text-sm font-medium pt-2">רשימת בדיקה — חובה לפני מעבר לשליחה</p>
        {[["test", "שלחתי מייל בדיקה לעצמי ובדקתי אותו בטלפון ובמחשב"], ["links", "לחצתי על כל הקישורים במייל הבדיקה והם עובדים"], ["audience", `בדקתי שהקהל נכון: ${fmt(L.count - excluded)} נמענים מתוך "${L.name}"`]].map(([k, t]) =>
          <label key={k} className="flex items-start gap-2 text-sm cursor-pointer"><input type="checkbox" className="mt-1" checked={checks[k]} onChange={() => setChecks(c => ({ ...c, [k]: !c[k] }))} />{t}</label>)}
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><ShieldCheck className="w-4 h-4" />כותרת שולח, סימון "דיוור פרסומי" וקישור הסרה קיימים בטמפלט.</div>
      </div>
    </Panel>}

    {step === 3 && <Panel title="מתי לשלוח">
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm"><input type="radio" checked={when === "now"} onChange={() => setWhen("now")} />עכשיו</label>
        <label className="flex items-center gap-2 text-sm"><input type="radio" checked={when === "later"} onChange={() => setWhen("later")} />תזמון למועד מסוים</label>
        {when === "later" && <div className="flex gap-2"><Input type="date" defaultValue="2026-11-18" className="w-44" /><Input type="time" defaultValue="09:00" className="w-32" /></div>}
        <p className="text-xs text-muted-foreground">השליחה יוצאת במנות של 100 דרך Resend. אפשר לעצור את הקמפיין באמצע; מי שכבר קיבל לא יקבל שוב.</p>
        {!ready && <p className="flex items-center gap-2 text-sm text-amber-800"><AlertTriangle className="w-4 h-4" />יש להשלים את רשימת הבדיקה בשלב הקודם.</p>}
      </div>
    </Panel>}

    <div className="flex justify-between">
      <Button variant="outline" disabled={step === 0} onClick={() => setStep(s => s - 1)}>הקודם</Button>
      {step < 3
        ? <Button onClick={() => setStep(s => s + 1)}>הבא</Button>
        : <Button disabled={!ready} onClick={onDone}>{when === "now" ? <><Send className="w-4 h-4 ml-1" />שליחה ל-{fmt(L.count - excluded)} נמענים</> : <><Clock className="w-4 h-4 ml-1" />תזמון הקמפיין</>}</Button>}
    </div>
  </div>;
}

const LINKS = [
  { url: "service.workies.co.il/workies-ai", label: "כפתור: אני רוצה להגיע", clicks: 71 },
  { url: "service.workies.co.il/daily-office", label: "קישור: משרד יומי", clicks: 18 },
  { url: "instagram.com/workies", label: "אינסטגרם בחתימה", clicks: 8 },
];

function Report({ c, onBack }) {
  return <div className="space-y-4">
    <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-primary"><ArrowRight className="w-4 h-4" />חזרה לקמפיינים</button>
    <PageHeader title={c.name} subtitle={`נשלח ${dateHe(c.sentAt)} · ${c.list}`} />
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <Stat label="נשלחו" value={fmt(c.recipients)} />
      <Stat label="נמסרו" value={`${pct(c.delivered, c.recipients)}%`} hint={fmt(c.delivered)} />
      <Stat label="נפתחו" value={`${pct(c.opened, c.delivered)}%`} hint={`${fmt(c.opened)} מתוך הנמסרים`} tone="orange" />
      <Stat label="הקליקו" value={`${pct(c.clicked, c.delivered)}%`} hint={`${fmt(c.clicked)} אנשים`} tone="orange" />
      <Stat label="הסרות / חזרות" value={`${c.unsub} / ${c.bounced}`} />
    </div>
    <div className="grid lg:grid-cols-2 gap-4">
      <Panel title="הקלקות לפי קישור">
        <ul className="space-y-3">{LINKS.map(l => <li key={l.url} className="text-sm">
          <div className="flex justify-between gap-2"><span>{l.label}</span><span className="tabular-nums">{l.clicks}</span></div>
          <Bar value={l.clicks} max={LINKS[0].clicks} /><p dir="ltr" className="text-xs text-muted-foreground text-right mt-0.5">{l.url}</p>
        </li>)}</ul>
      </Panel>
      <Panel title="מי הקליק — לטיפול מכירות" actions={<Button size="sm" variant="outline">ייצוא CSV</Button>}>
        <ul className="divide-y text-sm">
          {[["מיכל אברהם", "אני רוצה להגיע"], ["עומר גולן", "משרד יומי"], ["אבי מזרחי", "אני רוצה להגיע"], ["דני פרץ", "אני רוצה להגיע"]].map(([n, l]) =>
            <li key={n} className="py-2 flex justify-between"><span className="font-medium">{n}</span><span className="text-muted-foreground">{l}</span></li>)}
        </ul>
        <p className="text-xs text-muted-foreground mt-2">מי שהקליק על "משרד יומי" הוא ליד חם למשרד. בשלב הבא: העברה אוטומטית לרשימת מעקב מכירות.</p>
      </Panel>
    </div>
  </div>;
}

export default function MailCampaigns() {
  const [params, setParams] = useSearchParams();
  const [report, setReport] = useState(null);
  const wizard = params.get("new") === "1";
  if (wizard) return <Wizard onDone={() => setParams({})} />;
  if (report) return <Report c={report} onBack={() => setReport(null)} />;
  return <div className="space-y-4">
    <PageHeader title="קמפיינים" subtitle="שליחה מנוהלת לרשימה או לסגמנט, מיידית או מתוזמנת."
      actions={<Button onClick={() => setParams({ new: "1" })}><Plus className="w-4 h-4 ml-1" />קמפיין חדש</Button>} />
    <Table head={["קמפיין", "סטטוס", "קהל", "מועד", "נמענים", "פתיחה", "הקלקה", ""]}>
      {CAMPAIGNS.map(c => <tr key={c.id} className="hover:bg-muted/40">
        <td className="px-3 py-2.5 font-medium">{c.name}</td>
        <td className="px-3 py-2.5"><Pill tone={CAMPAIGN_STATUS[c.status].tone}>{CAMPAIGN_STATUS[c.status].label}</Pill></td>
        <td className="px-3 py-2.5 text-muted-foreground">{c.list}</td>
        <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{c.sentAt ? dateHe(c.sentAt) : "—"}</td>
        <td className="px-3 py-2.5 tabular-nums">{fmt(c.recipients)}</td>
        <td className="px-3 py-2.5 tabular-nums">{c.status === "sent" ? `${pct(c.opened, c.delivered)}%` : "—"}</td>
        <td className="px-3 py-2.5 tabular-nums">{c.status === "sent" ? `${pct(c.clicked, c.delivered)}%` : "—"}</td>
        <td className="px-3 py-2.5">{c.status === "sent"
          ? <Button size="sm" variant="ghost" onClick={() => setReport(c)}>דוח</Button>
          : <Button size="sm" variant="ghost" onClick={() => setParams({ new: "1" })}>עריכה</Button>}</td>
      </tr>)}
    </Table>
  </div>;
}
