import { Card } from "@/components/ui/card";
import { ScrollText } from "lucide-react";
import moment from "moment";

export default function AuditLogList({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-40" />
        אין פעולות מתועדות עדיין
      </Card>
    );
  }

  return (
    <div className="space-y-1.5 min-w-0" dir="rtl">
      {logs.map((log) => (
        <Card key={log.id} className="p-3 min-w-0">
          <div className="flex items-start gap-2 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{log.action}</p>
              {log.stage_title && (
                <p className="text-xs text-muted-foreground">שלב: {log.stage_title}</p>
              )}
              {log.new_value && (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded p-1.5 mt-1">{log.new_value}</p>
              )}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                <span>{log.actor_name}</span>
                <span>·</span>
                <span>{log.created_date ? moment(log.created_date).format("DD/MM/YYYY HH:mm") : ""}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}