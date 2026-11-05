import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { REFERRAL_STATUSES } from "@/lib/referralConfig";
import { STATUSES } from "@/components/landing/DailyOfficeLeadRow";
import campaigns from "@/components/landing/campaigns";

const REFERRAL_LABELS = Object.fromEntries(Object.entries(REFERRAL_STATUSES).map(([k, v]) => [k, v.label]));
const daysAgo = n => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - n); return d.toISOString(); };

export default function PageDashboard({ campaign, status, onSelect }) {
  const entity = base44.entities[campaigns[campaign].entity];
  const labels = campaign === "referral" ? REFERRAL_LABELS : STATUSES;
  const { data, isPending } = useQuery({
    queryKey: ["landing-stats", campaign, "page"], refetchInterval: 30000,
    queryFn: async () => {
      const [agg, today, week] = await Promise.all([
        entity.aggregate({ query: {}, groupBy: "status" }),
        entity.count({ created_date: { $gte: daysAgo(0) } }),
        entity.count({ created_date: { $gte: daysAgo(6) } }),
      ]);
      return { rows: (agg.rows || []).filter(r => r.count > 0).sort((a, b) => b.count - a.count), today, week };
    },
  });
  if (isPending) return <p role="status" className="py-4 text-center text-sm">טוענים נתונים…</p>;
  const total = data.rows.reduce((s, r) => s + r.count, 0);
  const tiles = [{ label: "סה״כ לידים", value: total, onClick: () => onSelect(""), active: !status }, { label: "היום", value: data.today }, { label: "7 ימים אחרונים", value: data.week }];
  return <section aria-label="דשבורד העמוד" className="space-y-3 min-w-0">
    <div className="grid grid-cols-3 gap-2">
      {tiles.map(t => { const Tag = t.onClick ? "button" : "div"; return <Tag key={t.label} type={t.onClick ? "button" : undefined} onClick={t.onClick}
        className={`rounded-xl p-3 text-center ${t.onClick ? (t.active ? "bg-primary text-primary-foreground" : "bg-card border hover:border-primary") : "bg-card border"}`}>
        <div className="text-2xl font-bold">{t.value}</div><div className="text-xs mt-0.5 opacity-80">{t.label}</div>
      </Tag>; })}
    </div>
    {!!data.rows.length && <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {data.rows.map(r => <button key={r.status} type="button" onClick={() => onSelect(status === r.status ? "" : r.status)}
        className={`shrink-0 rounded-full border px-3 min-h-10 text-sm ${status === r.status ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary"}`}>
        {labels[r.status] || r.status} · <b>{r.count}</b>
      </button>)}
    </div>}
  </section>;
}