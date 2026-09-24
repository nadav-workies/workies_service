import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, AlertTriangle, ExternalLink } from "lucide-react";
import ReferralStatusBadge from "@/components/referral/ReferralStatusBadge";

export default function ReferralReportCard({ referral: r, isDuplicate, onEdit }) {
  return (
    <div className="p-3 rounded-lg border bg-card space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm">{r.friend_name}</p>
          <a href={`tel:${r.friend_phone}`} className="text-xs text-primary inline-flex items-center gap-1" dir="ltr">
            <Phone className="w-3 h-3" />{r.friend_phone}
          </a>
        </div>
        <ReferralStatusBadge status={r.status} />
      </div>
      <p className="text-xs text-muted-foreground">
        ממליץ/ה: <b className="text-foreground">{r.referrer_name || r.referrer_email}</b>{r.referrer_room ? ` · ${r.referrer_room}` : ""} · {new Date(r.created_date).toLocaleDateString("he-IL")}
      </p>
      {r.details && <p className="text-xs bg-muted/50 rounded p-2 whitespace-pre-wrap">{r.details}</p>}
      {r.status_note && <p className="text-xs text-muted-foreground">הערה אחרונה: {r.status_note}</p>}
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        {isDuplicate && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" />טלפון הומלץ קודם</span>}
        <span className={`px-2 py-0.5 rounded-full ${r.crm_registered ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{r.crm_registered ? "רשום ב-CRM" : "לא רשום ב-CRM"}</span>
        {r.voucher_amount > 0 && <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">שובר {r.voucher_amount} ₪</span>}
      </div>
      <div className="flex items-center justify-between pt-1">
        {r.ticket_id ? (
          <Link to={`/tickets/${r.ticket_id}`} className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-primary">
            <ExternalLink className="w-3 h-3" />קריאה {r.ticket_number}
          </Link>
        ) : <span />}
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onEdit}>עדכון סטטוס</Button>
      </div>
    </div>
  );
}