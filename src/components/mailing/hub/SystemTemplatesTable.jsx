import { Table, Pill } from "@/components/mailing-mockup/shared";
import { SYSTEM_TEMPLATES, TEMPLATE_LABELS } from "@/lib/mailTemplates";

export default function SystemTemplatesTable({ stats }) {
  return <Table head={["תבנית", "סוג", "נשלחו", "נפתחו", "אחוז פתיחה"]}>
    {SYSTEM_TEMPLATES.map(name => {
      const s = stats?.[name] || { sent: 0, opened: 0 };
      return <tr key={name}>
        <td className="px-3 py-2.5"><p className="font-medium">{TEMPLATE_LABELS[name]}</p><p className="font-mono text-xs text-muted-foreground" dir="ltr" style={{ textAlign: "right" }}>{name}</p></td>
        <td className="px-3 py-2.5"><Pill tone="blue">תפעולי</Pill></td>
        <td className="px-3 py-2.5 tabular-nums">{stats ? s.sent.toLocaleString("he-IL") : "…"}</td>
        <td className="px-3 py-2.5 tabular-nums">{stats ? s.opened.toLocaleString("he-IL") : "…"}</td>
        <td className="px-3 py-2.5 tabular-nums">{s.sent ? `${Math.round((s.opened / s.sent) * 100)}%` : "—"}</td>
      </tr>;
    })}
  </Table>;
}