import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Filter, List, X } from "lucide-react";
import { LISTS, fmt } from "./mockData";
import { PageHeader, Pill, Panel } from "./shared";

const FIELDS = ["מקור", "תגית", "סטטוס הסכמה", "פתח קמפיין", "הקליק בקמפיין", "לא פתח ב-X ימים", "נרשם לאירוע", "לקוח פעיל ב-AIO"];

export default function MailLists() {
  const [building, setBuilding] = useState(false);
  const [rules, setRules] = useState([{ field: "מקור", op: "שווה ל", value: "Workies AI" }, { field: "לא פתח ב-X ימים", op: "יותר מ", value: "60" }]);

  return <div className="space-y-4">
    <PageHeader title="רשימות וסגמנטים" subtitle="רשימה סטטית נבנית ידנית או מייבוא. סגמנט דינמי מתעדכן לבד לפי תנאים."
      actions={<Button onClick={() => setBuilding(true)}><Plus className="w-4 h-4 ml-1" />סגמנט חדש</Button>} />

    {building && <Panel title="בניית סגמנט דינמי" actions={<button onClick={() => setBuilding(false)} aria-label="סגירה"><X className="w-4 h-4" /></button>}>
      <div className="space-y-3">
        <Input defaultValue="משתתפי Workies AI שלא פתחו חודשיים" aria-label="שם הסגמנט" />
        {rules.map((r, i) => <div key={i} className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground w-6">{i === 0 ? "אם" : "וגם"}</span>
          <select defaultValue={r.field} className="h-9 rounded-md border bg-background px-2 text-sm">{FIELDS.map(f => <option key={f}>{f}</option>)}</select>
          <select defaultValue={r.op} className="h-9 rounded-md border bg-background px-2 text-sm"><option>שווה ל</option><option>שונה מ</option><option>יותר מ</option><option>פחות מ</option></select>
          <Input defaultValue={r.value} className="h-9 w-40" />
          <button className="text-muted-foreground" onClick={() => setRules(rs => rs.filter((_, j) => j !== i))} aria-label="הסרת תנאי"><X className="w-4 h-4" /></button>
        </div>)}
        <Button size="sm" variant="outline" onClick={() => setRules(rs => [...rs, { field: "תגית", op: "שווה ל", value: "" }])}><Plus className="w-4 h-4 ml-1" />תנאי נוסף</Button>
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <span>תואמים כרגע: <b className="tabular-nums">96</b> אנשי קשר מאושרים</span>
          <Button size="sm" onClick={() => setBuilding(false)}>שמירת סגמנט</Button>
        </div>
        <p className="text-xs text-muted-foreground">אנשי קשר שהסירו את עצמם, חזרו או סימנו ספאם לא ייכללו בשום סגמנט, גם אם הם עונים על התנאים.</p>
      </div>
    </Panel>}

    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {LISTS.map(l => <div key={l.id} className="rounded-xl border bg-card p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold">{l.name}</p>
          <Pill tone={l.type === "dynamic" ? "orange" : "gray"}>{l.type === "dynamic" ? <><Filter className="w-3 h-3" />דינמי</> : <><List className="w-3 h-3" />סטטי</>}</Pill>
        </div>
        <p className="text-xs text-muted-foreground">{l.rule}</p>
        <p className="text-2xl font-bold tabular-nums mt-auto">{fmt(l.count)}<span className="text-sm font-normal text-muted-foreground mr-1">אנשי קשר</span></p>
        <div className="flex gap-2"><Button size="sm" variant="outline">צפייה</Button><Button size="sm" variant="ghost">שליחת קמפיין</Button></div>
      </div>)}
    </div>
  </div>;
}
