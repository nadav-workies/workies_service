import { useQueries } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getCampaignValidity, campaignActive } from "@/lib/campaignValidity";
import { REFERRAL_STATUSES } from "@/lib/referralConfig";
import { STATUSES } from "@/components/landing/DailyOfficeLeadRow";
import campaigns from "@/components/landing/campaigns";
import PageStatCard from "@/components/landing/PageStatCard";

const REFERRAL_LABELS = Object.fromEntries(Object.entries(REFERRAL_STATUSES).map(([k, v]) => [k, v.label]));
const keys = Object.keys(campaigns);

export default function LandingDashboard({ onSelect }) {
  const validity = useQueries({ queries: keys.map(key => ({ queryKey: ["campaign-validity", key], queryFn: () => getCampaignValidity(key) })) });
  const openKeys = keys.filter((key, i) => campaignActive(validity[i].data));
  const stats = useQueries({ queries: openKeys.map(key => ({
    queryKey: ["landing-stats", key],
    queryFn: () => base44.entities[campaigns[key].entity].aggregate({ query: {}, groupBy: "status" }),
    refetchInterval: 30000,
  })) });
  if (validity.some(q => q.isPending) || stats.some(q => q.isPending)) return <p role="status" className="py-6 text-center">טוענים נתונים…</p>;
  const pages = openKeys.map((key, i) => {
    const rows = (stats[i].data?.rows || []).filter(r => r.count > 0).sort((a, b) => b.count - a.count);
    return { key, rows, total: rows.reduce((s, r) => s + r.count, 0) };
  });
  const total = pages.reduce((s, p) => s + p.total, 0);
  if (!pages.length) return <p className="rounded-xl border border-dashed p-5 text-center text-muted-foreground">אין כרגע עמודי נחיתה פעילים.</p>;
  return <section aria-label="דשבורד לידים" className="space-y-3">
    <div className="rounded-xl bg-primary text-primary-foreground p-4 flex items-center justify-between">
      <span className="font-bold">סה״כ לידים בעמודים פעילים</span><span className="text-3xl font-bold">{total}</span>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {pages.map(p => <PageStatCard key={p.key} title={campaigns[p.key].title} total={p.total} rows={p.rows}
        labels={p.key === "referral" ? REFERRAL_LABELS : STATUSES} onSelect={status => onSelect(p.key, status)} />)}
    </div>
  </section>;
}