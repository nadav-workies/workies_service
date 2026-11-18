import { Panel, Pill } from "@/components/mailing-mockup/shared";
import { formatDate } from "@/components/messages/messageConfig";
import { TEMPLATE_LABELS } from "@/lib/mailTemplates";

export default function RecentOpensPanel({ logs }) {
  return <Panel title="מיילים שנפתחו לאחרונה" actions={<span className="text-xs text-muted-foreground">לפי מעקב פתיחה</span>}>
    {logs.length === 0
      ? <p className="py-6 text-center text-sm text-muted-foreground">עדיין לא נרשמה פתיחה של מייל.</p>
      : <ul className="divide-y">{logs.map(l => <li key={l.id} className="py-2.5 flex items-center gap-3 text-sm">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" dir="ltr" style={{ textAlign: "right" }}>{l.recipient_email}</p>
          <p className="text-xs text-muted-foreground truncate">{TEMPLATE_LABELS[l.template_name] || l.subject || l.notification_key}</p>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(l.last_opened_at || l.opened_at)}</span>
        <Pill tone="orange">{l.open_count}</Pill>
      </li>)}</ul>}
  </Panel>;
}