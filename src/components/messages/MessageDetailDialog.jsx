import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SOURCE_LABELS, STATUS_META, sourceOf, sentAt, formatDate } from "@/components/messages/messageConfig";

function Row({ label, children }) {
  return <div className="grid grid-cols-[110px_1fr] gap-2 text-sm"><span className="text-muted-foreground">{label}</span><span className="break-words">{children}</span></div>;
}

export default function MessageDetailDialog({ log, onClose }) {
  const client = useQueryClient();
  const toggle = useMutation({
    mutationFn: () => base44.entities.NotificationLog.update(log.id, { not_relevant: !log.not_relevant }),
    onSuccess: () => { client.invalidateQueries({ queryKey: ["message-logs"] }); client.invalidateQueries({ queryKey: ["message-log-counts"] }); onClose(); },
  });
  if (!log) return null;
  const vars = log.variables && Object.entries(log.variables);
  return <Dialog open onOpenChange={onClose}>
    <DialogContent dir="rtl" className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle className="text-right">{log.subject || log.notification_key}</DialogTitle></DialogHeader>
      <div className="space-y-2">
        <Row label="נמען"><bdi dir="ltr">{log.recipient_email}</bdi></Row>
        <Row label="נשלח">{formatDate(sentAt(log))}</Row>
        <Row label="סטטוס">{STATUS_META[log.status]?.label || log.status}</Row>
        {log.status === "sent" && <Row label="פתיחה">{log.opened_at ? `נפתח ${formatDate(log.opened_at)}${log.open_count > 1 ? ` · ${log.open_count} פתיחות, אחרונה ${formatDate(log.last_opened_at)}` : ""}` : "עדיין לא נפתח"}</Row>}
        <Row label="אזור">{SOURCE_LABELS[sourceOf(log)]}</Row>
        <Row label="סוג">{log.notification_key}</Row>
        {log.ticket_number && <Row label="קריאה">{log.ticket_number}</Row>}
        {log.template_name && <Row label="תבנית">{log.template_name}</Row>}
        {log.error_message && <Row label="שגיאה"><span className="text-destructive">{log.error_message}</span></Row>}
        {vars?.length > 0 && <Row label="משתנים">{vars.filter(([k]) => k !== "open_pixel_url").map(([k, v]) => `${k}: ${v}`).join(" · ")}</Row>}
      </div>
      {log.body_preview && <div className="mt-3 rounded-lg bg-muted p-3 text-sm leading-relaxed whitespace-pre-wrap">{log.body_preview}</div>}
      <Button variant={log.not_relevant ? "outline" : "destructive"} disabled={toggle.isPending} onClick={() => toggle.mutate()} className="mt-3 min-h-11">
        {log.not_relevant ? "החזרה מהארכיון" : "סימון כלא רלוונטי"}
      </Button>
    </DialogContent>
  </Dialog>;
}