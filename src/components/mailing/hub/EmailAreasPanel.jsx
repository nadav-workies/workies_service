import { Link } from "react-router-dom";
import { Panel, Bar } from "@/components/mailing-mockup/shared";
import { SOURCE_LABELS } from "@/components/messages/messageConfig";

export default function EmailAreasPanel({ areas }) {
  const max = areas[0]?.count || 1;
  return <Panel title="מיילים שנשלחו לפי אזור (30 יום)"
    actions={<Link to="/messages" className="text-xs text-primary">ליומן ההודעות</Link>}>
    {areas.length === 0
      ? <p className="py-6 text-center text-sm text-muted-foreground">לא נשלחו מיילים ב-30 הימים האחרונים.</p>
      : <ul className="space-y-3">{areas.map(a => <li key={a.source || "none"} className="text-sm">
        <div className="flex justify-between gap-2 mb-1"><span>{SOURCE_LABELS[a.source] || "אחר"}</span><span className="tabular-nums font-medium">{a.count.toLocaleString("he-IL")}</span></div>
        <Bar value={a.count} max={max} tone="gray" />
      </li>)}</ul>}
  </Panel>;
}