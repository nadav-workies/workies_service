import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Panel } from "@/components/mailing-mockup/shared";
import { CONSENT } from "@/lib/mailing";

export default function ImportHistory() {
  const history = useQuery({
    queryKey: ["mail", "imports"],
    queryFn: async () => (await base44.entities.MailImport.list({ sort: "-created_date", limit: 20 })).items,
  });
  const items = history.data || [];
  return <Panel title="היסטוריית ייבוא">
    {history.isLoading ? <p className="text-sm text-muted-foreground">טוען...</p>
      : items.length === 0 ? <p className="text-sm text-muted-foreground">עדיין לא בוצע ייבוא.</p>
        : <ul className="divide-y text-sm">{items.map(i => <li key={i.id} className="py-2 flex flex-wrap justify-between gap-2">
          <div><p className="font-medium break-all">{i.file_name}</p><p className="text-xs text-muted-foreground">{i.imported_by} · {new Date(i.created_date).toLocaleDateString("he-IL")} · {CONSENT[i.consent]?.label}</p></div>
          <p className="text-xs tabular-nums text-muted-foreground">{i.added} נוספו · {i.updated} עודכנו · {i.rejected} נדחו</p>
        </li>)}</ul>}
  </Panel>;
}