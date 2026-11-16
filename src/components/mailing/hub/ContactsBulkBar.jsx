import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { splitTags } from "@/lib/mailing";
import useStaticLists from "./useStaticLists";

const uniq = a => [...new Set(a.filter(Boolean))];

export default function ContactsBulkBar({ selected, onClear, onDone }) {
  const lists = useStaticLists();
  const [listId, setListId] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);

  async function apply(patchFor, msg) {
    setBusy(true);
    try {
      await base44.entities.MailContact.bulkUpdate(selected.map(c => ({ id: c.id, ...patchFor(c) })));
      toast({ title: msg });
      onClear(); onDone();
    } catch { toast({ title: "העדכון נכשל", variant: "destructive" }); }
    finally { setBusy(false); }
  }
  const approvable = selected.filter(c => c.consent === "pending");

  return <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
    <span className="font-medium">{selected.length} נבחרו</span>
    <select value={listId} onChange={e => setListId(e.target.value)} className="h-9 rounded-md border bg-background px-2" aria-label="בחירת רשימה">
      <option value="">בחירת רשימה...</option>
      {(lists.data || []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
    </select>
    <Button size="sm" variant="outline" disabled={!listId || busy} onClick={() => apply(c => ({ list_ids: uniq([...(c.list_ids || []), listId]) }), "נוספו לרשימה")}>הוספה לרשימה</Button>
    <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="תגיות, מופרדות בפסיק" className="h-9 w-44" />
    <Button size="sm" variant="outline" disabled={!splitTags(tags).length || busy} onClick={() => apply(c => ({ tags: uniq([...(c.tags || []), ...splitTags(tags)]) }), "התגיות נוספו")}>הוספת תגית</Button>
    {approvable.length > 0 && <Button size="sm" variant="outline" disabled={busy}
      onClick={() => window.confirm(`לסמן ${approvable.length} אנשי קשר כמאושרים לדיוור? יש לעשות זאת רק כשיש תיעוד להסכמתם.`) && apply(c => (c.consent === "pending" ? { consent: "subscribed" } : {}), "סומנו כמאושרים לדיוור")}>
      סימון כמאושרים ({approvable.length})
    </Button>}
    <Button size="sm" variant="ghost" onClick={onClear}>ניקוי בחירה</Button>
  </div>;
}