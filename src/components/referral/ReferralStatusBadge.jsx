import { REFERRAL_STATUSES } from "@/lib/referralConfig";

export default function ReferralStatusBadge({ status }) {
  const s = REFERRAL_STATUSES[status] || REFERRAL_STATUSES.new;
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${s.color}`}>{s.label}</span>;
}