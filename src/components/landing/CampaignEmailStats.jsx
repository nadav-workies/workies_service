import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Mail, MailOpen } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Sent vs opened emails to this page's registrants (confirmations and reminders).
export default function CampaignEmailStats({ campaign }) {
  const keys = { $regex: `_${campaign}$` };
  const { data } = useQuery({
    queryKey: ["campaign-email-stats", campaign],
    queryFn: async () => {
      const [sent, opened] = await Promise.all([
        base44.entities.NotificationLog.count({ notification_key: keys, status: "sent" }),
        base44.entities.NotificationLog.count({ notification_key: keys, status: "sent", opened_at: { $exists: true } }),
      ]);
      return { sent, opened };
    },
  });
  if (!data?.sent) return null;
  const rate = Math.round((data.opened / data.sent) * 100);
  return <Link to="/messages" className="rounded-xl border bg-card p-4 flex items-center justify-between gap-3 hover:border-primary">
    <div><h2 className="font-bold">מיילים לנרשמים</h2><p className="text-xs text-muted-foreground">אישורים ותזכורות · לחיצה לפירוט</p></div>
    <div className="flex gap-4 text-sm">
      <span className="inline-flex items-center gap-1"><Mail className="w-4 h-4" />{data.sent} נשלחו</span>
      <span className="inline-flex items-center gap-1 text-primary font-semibold"><MailOpen className="w-4 h-4" />{data.opened} נפתחו ({rate}%)</span>
    </div>
  </Link>;
}