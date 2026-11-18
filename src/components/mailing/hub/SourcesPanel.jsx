import { Link } from "react-router-dom";
import { Panel, Bar } from "@/components/mailing-mockup/shared";

export default function SourcesPanel({ sources, className }) {
  const rows = sources.filter(s => s.count > 0).sort((a, b) => b.count - a.count);
  const max = rows[0]?.count || 1;
  return <Panel title="מאיפה הגיעו אנשי הקשר" className={className}
    actions={<Link to="/mailing/contacts" className="text-xs text-primary">לכל אנשי הקשר</Link>}>
    {rows.length === 0
      ? <p className="py-6 text-center text-sm text-muted-foreground">המאגר ריק. אפשר לסנכרן מלידים ומדיירים או לייבא קובץ.</p>
      : <ul className="space-y-3">{rows.map(s => <li key={s.key} className="text-sm">
        <div className="flex justify-between gap-2 mb-1"><span>{s.label}</span><span className="tabular-nums font-medium">{s.count.toLocaleString("he-IL")}</span></div>
        <Bar value={s.count} max={max} />
      </li>)}</ul>}
    <p className="text-xs text-muted-foreground mt-3">איש קשר שהגיע מכמה מקורות נספר בכל אחד מהם.</p>
  </Panel>;
}