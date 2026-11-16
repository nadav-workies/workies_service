import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CONSENT, SOURCES } from "@/lib/mailing";

const EMPTY = { name: "", type: "static", rule_consent: "", rule_source: "", rule_tag: "" };
const selectCls = "h-10 w-full rounded-md border bg-background px-3 text-sm";

export default function ListFormDialog({ list, onClose, onSaved }) {
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (list) { setF({ ...EMPTY, ...list }); setError(""); } }, [list]);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  async function save(e) {
    e.preventDefault();
    if (!f.name.trim()) return setError("יש לתת שם לרשימה");
    setBusy(true); setError("");
    const data = { name: f.name.trim(), type: f.type, rule_consent: f.rule_consent, rule_source: f.rule_source, rule_tag: f.rule_tag.trim() };
    try {
      if (list.id) await base44.entities.MailList.update(list.id, data); else await base44.entities.MailList.create(data);
      onSaved(); onClose();
    } catch { setError("השמירה נכשלה. נסו שוב."); }
    finally { setBusy(false); }
  }

  return <Dialog open={!!list} onOpenChange={v => !v && onClose()}>
    <DialogContent dir="rtl" className="max-w-md">
      <DialogHeader><DialogTitle className="text-right">{list?.id ? "עריכת רשימה" : "רשימה חדשה"}</DialogTitle></DialogHeader>
      <form onSubmit={save} className="space-y-3 text-sm">
        <Input value={f.name} onChange={e => set("name", e.target.value)} placeholder="שם הרשימה" maxLength={120} />
        <div className="grid grid-cols-2 gap-2">
          {[["static", "סטטית (ידנית / ייבוא)"], ["dynamic", "סגמנט דינמי"]].map(([v, l]) =>
            <label key={v} className={`rounded-lg border p-3 cursor-pointer ${f.type === v ? "border-primary bg-primary/5" : ""} ${list?.id ? "opacity-60" : ""}`}>
              <input type="radio" className="ml-2" checked={f.type === v} disabled={!!list?.id} onChange={() => set("type", v)} />{l}
            </label>)}
        </div>
        {f.type === "dynamic" && <div className="space-y-2">
          <p className="text-xs text-muted-foreground">כל התנאים שנבחרו חייבים להתקיים. תנאי ריק לא מסנן.</p>
          <select value={f.rule_consent} onChange={e => set("rule_consent", e.target.value)} className={selectCls} aria-label="סטטוס הסכמה"><option value="">כל סטטוסי ההסכמה</option>{Object.entries(CONSENT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          <select value={f.rule_source} onChange={e => set("rule_source", e.target.value)} className={selectCls} aria-label="מקור"><option value="">כל המקורות</option>{Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <Input value={f.rule_tag} onChange={e => set("rule_tag", e.target.value)} placeholder="תגית (אופציונלי)" maxLength={40} />
        </div>}
        {f.type === "static" && <p className="text-xs text-muted-foreground">מוסיפים אנשי קשר לרשימה ממסך אנשי הקשר או בזמן ייבוא קובץ.</p>}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "שומר..." : "שמירה"}</Button>
      </form>
    </DialogContent>
  </Dialog>;
}