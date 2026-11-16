import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Pencil, Trash2, Filter, List } from "lucide-react";
import { listQuery, listRuleText, exportContacts } from "@/lib/mailing";
import { Pill } from "@/components/mailing-mockup/shared";

export default function ListCard({ list, onEdit, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const query = listQuery(list);
  const counts = useQuery({
    queryKey: ["mail", "listCount", list.id, query],
    queryFn: async () => {
      const [total, subscribed] = await Promise.all([base44.entities.MailContact.count(query), base44.entities.MailContact.count({ ...query, consent: "subscribed" })]);
      return { total, subscribed };
    },
  });
  async function remove() {
    if (!window.confirm(`למחוק את "${list.name}"? אנשי הקשר עצמם לא יימחקו.`)) return;
    await base44.entities.MailList.delete(list.id);
    onDeleted();
  }
  async function download() { setBusy(true); try { await exportContacts(query, list.name); } finally { setBusy(false); } }
  const Icon = list.type === "static" ? List : Filter;

  return <article className="rounded-xl border bg-card p-4 space-y-3">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0"><p className="font-semibold flex items-center gap-1.5"><Icon className="w-4 h-4 text-primary shrink-0" />{list.name}</p><p className="text-xs text-muted-foreground mt-1">{listRuleText(list)}</p></div>
      <Pill tone={list.type === "static" ? "blue" : "orange"}>{list.type === "static" ? "סטטית" : "דינמית"}</Pill>
    </div>
    <div className="flex gap-4 text-sm">
      <div><p className="text-2xl font-bold tabular-nums">{counts.data ? counts.data.total.toLocaleString("he-IL") : "…"}</p><p className="text-xs text-muted-foreground">אנשי קשר</p></div>
      <div><p className="text-2xl font-bold tabular-nums text-primary">{counts.data ? counts.data.subscribed.toLocaleString("he-IL") : "…"}</p><p className="text-xs text-muted-foreground">מאושרים לדיוור</p></div>
    </div>
    <div className="flex flex-wrap gap-2 border-t pt-3">
      <Button size="sm" variant="outline" onClick={download} disabled={busy}><Download className="w-4 h-4 ml-1" />{busy ? "מייצא..." : "ייצוא"}</Button>
      <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="w-4 h-4 ml-1" />עריכה</Button>
      <Button size="sm" variant="ghost" className="text-destructive" onClick={remove} aria-label={`מחיקת ${list.name}`}><Trash2 className="w-4 h-4" /></Button>
    </div>
  </article>;
}