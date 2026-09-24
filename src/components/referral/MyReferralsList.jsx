import ReferralStatusBadge from "@/components/referral/ReferralStatusBadge";

export default function MyReferralsList({ referrals }) {
  if (referrals.length === 0) return null;
  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-sm">ההמלצות שלי ({referrals.length})</h2>
      {referrals.map(r => (
        <div key={r.id} className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-card">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{r.friend_name}</p>
            <p className="text-xs text-muted-foreground">{new Date(r.created_date).toLocaleDateString("he-IL")} · קריאה {r.ticket_number}</p>
          </div>
          <ReferralStatusBadge status={r.status} />
        </div>
      ))}
    </div>
  );
}