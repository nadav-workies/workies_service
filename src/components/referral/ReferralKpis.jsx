import { TERMINAL_REFERRAL_STATUSES } from "@/lib/referralConfig";

export default function ReferralKpis({ referrals, active, onSelect }) {
  const count = (fn) => referrals.filter(fn).length;
  const vouchers = referrals.filter(r => r.status === "voucher_given").reduce((s, r) => s + (r.voucher_amount || 0), 0);
  const kpis = [
    { key: "all", label: "סה״כ המלצות", value: referrals.length },
    { key: "open", label: "פתוחות בטיפול", value: count(r => !TERMINAL_REFERRAL_STATUSES.includes(r.status)) },
    { key: "eligible", label: "זכאים לשובר", value: count(r => r.status === "eligible") },
    { key: "voucher_given", label: `שוברים נמסרו (${vouchers} ₪)`, value: count(r => r.status === "voucher_given") },
    { key: "closed_no", label: "לא הבשילו", value: count(r => ["not_relevant", "existing_lead", "duplicate"].includes(r.status)) },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {kpis.map(k => (
        <button key={k.key} onClick={() => onSelect(k.key)}
          className={`text-right p-3 rounded-xl border bg-card transition-all ${active === k.key ? "ring-2 ring-primary" : "hover:shadow-md"}`}>
          <p className="text-xl font-bold leading-none">{k.value}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{k.label}</p>
        </button>
      ))}
    </div>
  );
}