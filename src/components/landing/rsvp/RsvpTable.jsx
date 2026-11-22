import { cn } from "@/lib/utils";
import { RSVP, RSVP_SOURCE, formatDateTime } from "@/lib/rsvp";

const TONE = { attending: "bg-emerald-50 text-emerald-700 border-emerald-200", not_attending: "bg-rose-50 text-rose-700 border-rose-200" };

export default function RsvpTable({ leads }) {
  return <div className="overflow-x-auto rounded-xl border bg-card">
    <table className="w-full text-sm">
      <thead className="bg-muted/50 text-muted-foreground">
        <tr>{["שם", "טלפון", "מייל", "ארגון / תפקיד", "אישור הגעה", "עודכן ע״י", "מועד"].map(h => <th key={h} className="text-right font-medium px-3 py-2.5 whitespace-nowrap">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y">
        {leads.map(l => <tr key={l.id} className="hover:bg-muted/30 transition-colors">
          <td className="px-3 py-2.5 font-medium whitespace-nowrap">{l.name}</td>
          <td className="px-3 py-2.5 whitespace-nowrap"><bdi dir="ltr">{l.phone}</bdi></td>
          <td className="px-3 py-2.5"><bdi dir="ltr" className="break-all">{l.email}</bdi></td>
          <td className="px-3 py-2.5 text-muted-foreground">{[l.organization || l.business_name, l.job_title].filter(Boolean).join(" · ")}</td>
          <td className="px-3 py-2.5"><span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", TONE[l.rsvp_status] || "bg-zinc-100 text-zinc-600 border-zinc-200")}>{RSVP[l.rsvp_status] || "טרם ענה/תה"}</span></td>
          <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{l.rsvp_source ? `${RSVP_SOURCE[l.rsvp_source]}${l.rsvp_by && l.rsvp_source !== "link" ? ` · ${l.rsvp_by}` : ""}` : ""}</td>
          <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{formatDateTime(l.rsvp_at)}</td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}