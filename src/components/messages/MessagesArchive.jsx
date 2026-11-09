import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatDate, sentAt } from "@/components/messages/messageConfig";

export default function MessagesArchive({ onOpen }) {
  const [open, setOpen] = useState(false);
  const { data: logs = [], isPending } = useQuery({
    queryKey: ["message-logs", "archive"],
    queryFn: () => base44.entities.NotificationLog.filter({ not_relevant: true }, "-created_date", 200),
  });
  return <section className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5">
    <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="w-full flex items-center justify-between p-4 min-h-12 text-destructive font-bold">
      <span>ארכיון לא רלוונטי · {isPending ? "…" : logs.length}</span>
      <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <ul className="p-3 pt-0 space-y-2">
      {logs.length ? logs.map(l => <li key={l.id}>
        <button type="button" onClick={() => onOpen(l)} className="w-full text-right rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm flex flex-wrap gap-x-4 gap-y-1">
          <bdi dir="ltr" className="text-muted-foreground">{formatDate(sentAt(l))}</bdi>
          <bdi dir="ltr">{l.recipient_email}</bdi>
          <span className="font-medium flex-1 min-w-0 truncate">{l.subject || l.notification_key}</span>
        </button>
      </li>) : <p className="text-sm text-muted-foreground text-center py-3">אין הודעות בארכיון</p>}
    </ul>}
  </section>;
}