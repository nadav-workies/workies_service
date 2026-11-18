import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Panel } from "@/components/mailing-mockup/shared";

export default function AttentionPanel({ contacts, emails }) {
  const pending = contacts.by.pending || 0, subscribed = contacts.by.subscribed || 0;
  const items = [
    pending > 0 && { to: "/mailing/contacts", text: `${pending.toLocaleString("he-IL")} אנשי קשר ממתינים להסכמה ולא יקבלו דיוור שיווקי.` },
    contacts.total > 0 && subscribed === 0 && { to: "/mailing/contacts", text: "אין עדיין אף איש קשר שמאושר לדיוור." },
    contacts.lists === 0 && { to: "/mailing/lists", text: "עדיין לא נוצרו רשימות תפוצה." },
    emails.failed > 0 && { to: "/messages", text: `${emails.failed.toLocaleString("he-IL")} מיילים נכשלו ב-30 הימים האחרונים.` },
  ].filter(Boolean);
  return <Panel title="דורש תשומת לב">
    {items.length === 0
      ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-emerald-600" />אין נושאים פתוחים כרגע.</p>
      : <ul className="space-y-3 text-sm">{items.map(i => <li key={i.text}>
        <Link to={i.to} className="flex gap-2 hover:text-primary transition-colors">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" /><span>{i.text}</span>
        </Link>
      </li>)}</ul>}
  </Panel>;
}