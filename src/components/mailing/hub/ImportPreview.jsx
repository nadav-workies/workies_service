import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { splitTags } from "@/lib/mailing";
import { Panel, Table } from "@/components/mailing-mockup/shared";
import useStaticLists from "./useStaticLists";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ImportPreview({ fileName, rows, onCancel, onDone }) {
  const lists = useStaticLists();
  const [consented, setConsented] = useState(false);
  const [tags, setTags] = useState("");
  const [listId, setListId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const valid = rows.filter(r => EMAIL.test(String(r.email || "").trim()));
  const tooMany = rows.length > 2000;

  async function run() {
    setBusy(true); setError("");
    try {
      const { data } = await base44.functions.invoke("mailContacts", { action: "import", file_name: fileName, rows, consent: consented ? "subscribed" : "pending", tags: splitTags(tags), list_id: listId || undefined });
      const r = data.result;
      toast({ title: "הייבוא הושלם", description: `${r.added} נוספו · ${r.updated} עודכנו · ${r.rejected} נדחו` });
      onDone();
    } catch (e) { setError(e.response?.data?.error || "הייבוא נכשל. נסו שוב."); setBusy(false); }
  }

  return <Panel title={`${fileName} · ${rows.length} שורות · ${valid.length} כתובות תקינות`}>
    <div className="space-y-4 text-sm">
      <Table head={["מייל", "שם", "טלפון", "חברה"]}>
        {rows.slice(0, 5).map((r, i) => <tr key={i} className={EMAIL.test(String(r.email || "").trim()) ? "" : "bg-destructive/10"}>
          <td className="px-3 py-2 text-right" dir="ltr">{r.email || "—"}</td><td className="px-3 py-2">{r.name}</td><td className="px-3 py-2" dir="ltr">{r.phone}</td><td className="px-3 py-2">{r.company}</td>
        </tr>)}
      </Table>
      {rows.length > 5 && <p className="text-xs text-muted-foreground">מוצגות 5 שורות ראשונות. שורות ללא מייל תקין יידחו.</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="תגיות לכל המיובאים (בפסיק)" />
        <select value={listId} onChange={e => setListId(e.target.value)} className="h-10 rounded-md border bg-background px-3" aria-label="הוספה לרשימה">
          <option value="">בלי הוספה לרשימה</option>
          {(lists.data || []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <label className="flex items-start gap-2 cursor-pointer"><input type="checkbox" className="mt-1" checked={consented} onChange={e => setConsented(e.target.checked)} />
        <span>יש לי תיעוד שכל הכתובות בקובץ הסכימו לקבל דיוור. בלי סימון, הן ייכנסו כ"ממתין להסכמה" ולא יקבלו דיוור שיווקי.</span></label>
      {tooMany && <p className="text-destructive">הקובץ מכיל יותר מ-2,000 שורות. פצלו אותו לכמה קבצים.</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={busy}>ביטול</Button>
        <Button onClick={run} disabled={busy || tooMany || !valid.length}>{busy ? "מייבא..." : `ייבוא ${valid.length} אנשי קשר`}</Button>
      </div>
    </div>
  </Panel>;
}