import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, HardDrive, CheckCircle2, AlertTriangle } from "lucide-react";
import { IMPORT_HISTORY, dateHe, fmt } from "./mockData";
import { PageHeader, Panel, Table, Pill } from "./shared";

const COLUMNS = [
  { file: "Email", sample: "ronit@example.co.il", map: "email" },
  { file: "שם מלא", sample: "רונית לוי", map: "name" },
  { file: "נייד", sample: "054-1112233", map: "phone" },
  { file: "ארגון", sample: "לוי משאבי אנוש", map: "company" },
  { file: "הערות", sample: "פגשנו בכנס", map: "skip" },
];
const TARGETS = { email: "מייל (חובה)", name: "שם", phone: "טלפון", company: "חברה", tag: "תגית", skip: "לא לייבא" };

export default function MailImport() {
  const [step, setStep] = useState(0);
  const [basis, setBasis] = useState("");
  return <div className="space-y-4">
    <PageHeader title="ייבוא אנשי קשר" subtitle="Excel או CSV מהמחשב, או קובץ מ-Google Drive. כל ייבוא מתועד: מי, מתי, ומה נכנס." />

    {step === 0 && <div className="grid sm:grid-cols-2 gap-3">
      <button onClick={() => setStep(1)} className="rounded-xl border-2 border-dashed bg-card p-8 flex flex-col items-center gap-2 hover:border-primary">
        <Upload className="w-8 h-8 text-primary" /><p className="font-semibold">העלאת קובץ</p><p className="text-xs text-muted-foreground">xlsx, csv · עד 10,000 שורות</p>
      </button>
      <button onClick={() => setStep(1)} className="rounded-xl border-2 border-dashed bg-card p-8 flex flex-col items-center gap-2 hover:border-primary">
        <HardDrive className="w-8 h-8 text-primary" /><p className="font-semibold">בחירה מ-Google Drive</p><p className="text-xs text-muted-foreground">מתיקיית "אנשי קשר לדיוור"</p>
      </button>
    </div>}

    {step === 1 && <Panel title={<span className="inline-flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" />אנשי HR - כנס דצמבר.xlsx · 162 שורות</span>}>
      <div className="space-y-4">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="text-muted-foreground"><tr><th className="text-right font-medium py-2">עמודה בקובץ</th><th className="text-right font-medium py-2">דוגמה</th><th className="text-right font-medium py-2">שדה במערכת</th></tr></thead>
          <tbody className="divide-y">{COLUMNS.map(c => <tr key={c.file}>
            <td className="py-2 font-medium">{c.file}</td><td className="py-2 text-muted-foreground">{c.sample}</td>
            <td className="py-2"><select defaultValue={c.map} className="h-9 rounded-md border bg-background px-2 text-sm">{Object.entries(TARGETS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
          </tr>)}</tbody>
        </table></div>
        <div className="space-y-2">
          <p className="text-sm font-medium">על איזה בסיס מותר לשלוח לאנשים האלה דיוור?</p>
          {[["customers", "לקוחות קיימים או לשעבר של וורקיז"], ["optin", "נתנו הסכמה מפורשת (טופס, כנס עם תיבת הסכמה)"], ["none", "לא ידוע — ייכנסו כ\"ממתינים להסכמה\" ולא יקבלו דיוור"]].map(([k, t]) =>
            <label key={k} className="flex items-center gap-2 text-sm"><input type="radio" name="basis" checked={basis === k} onChange={() => setBasis(k)} />{t}</label>)}
        </div>
        <div className="flex justify-between"><Button variant="outline" onClick={() => setStep(0)}>ביטול</Button><Button disabled={!basis} onClick={() => setStep(2)}>בדיקת הקובץ</Button></div>
      </div>
    </Panel>}

    {step === 2 && <Panel title="תוצאות הבדיקה — לפני אישור">
      <div className="space-y-3">
        <div className="grid sm:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg border p-3"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><p className="text-2xl font-bold tabular-nums mt-1">131</p><p className="text-muted-foreground">חדשים</p></div>
          <div className="rounded-lg border p-3"><CheckCircle2 className="w-4 h-4 text-sky-600" /><p className="text-2xl font-bold tabular-nums mt-1">24</p><p className="text-muted-foreground">כבר במאגר — יעודכנו</p></div>
          <div className="rounded-lg border p-3"><AlertTriangle className="w-4 h-4 text-amber-600" /><p className="text-2xl font-bold tabular-nums mt-1">5</p><p className="text-muted-foreground">כתובת לא תקינה — יידחו</p></div>
          <div className="rounded-lg border p-3"><AlertTriangle className="w-4 h-4 text-zinc-500" /><p className="text-2xl font-bold tabular-nums mt-1">2</p><p className="text-muted-foreground">הסירו את עצמם בעבר — לא ישונו</p></div>
        </div>
        <p className="text-xs text-muted-foreground">אנשי קשר קיימים: מתווספים מקור ותגית חדשים. סטטוס הסכמה קיים לא נדרס לעולם.</p>
        <div className="flex justify-between"><Button variant="outline" onClick={() => setStep(1)}>חזרה למיפוי</Button><Button onClick={() => setStep(0)}>אישור ייבוא 155 אנשי קשר</Button></div>
      </div>
    </Panel>}

    <h3 className="font-semibold pt-2">היסטוריית ייבוא</h3>
    <Table head={["קובץ", "יובא ע\"י", "תאריך", "נוספו", "עודכנו", "נדחו"]}>
      {IMPORT_HISTORY.map(i => <tr key={i.id}>
        <td className="px-3 py-2.5 font-medium">{i.file}</td><td className="px-3 py-2.5">{i.by}</td><td className="px-3 py-2.5">{dateHe(i.at)}</td>
        <td className="px-3 py-2.5 tabular-nums">{fmt(i.added)}</td><td className="px-3 py-2.5 tabular-nums">{fmt(i.updated)}</td>
        <td className="px-3 py-2.5"><Pill tone={i.rejected ? "yellow" : "gray"}>{i.rejected}</Pill></td>
      </tr>)}
    </Table>
  </div>;
}
