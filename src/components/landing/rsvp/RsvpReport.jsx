import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RSVP_FILTERS, downloadRsvpCsv } from "@/lib/rsvp";
import RsvpTable from "@/components/landing/rsvp/RsvpTable";

// Dedicated RSVP report for an event landing page. Default view: the final list of confirmed attendees.
export default function RsvpReport({ entity, title }) {
  const [filter, setFilter] = useState("attending");
  const [exporting, setExporting] = useState(false);
  const db = base44.entities[entity];
  const { data: counts } = useQuery({
    queryKey: ["rsvp-counts", entity],
    queryFn: async () => Object.fromEntries(await Promise.all(Object.entries(RSVP_FILTERS).map(async ([k, f]) => [k, await db.count(f.query)]))),
  });
  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["rsvp-report", entity, filter], initialPageParam: null,
    queryFn: ({ pageParam }) => db.filter(RSVP_FILTERS[filter].query, { sort: "-rsvp_at", limit: 50, ...(pageParam ? { cursor: pageParam } : {}) }),
    getNextPageParam: p => p.has_more ? p.next_cursor : undefined,
  });
  const leads = data?.pages.flatMap(p => p.items) || [];
  async function exportCsv() {
    setExporting(true);
    const all = [];
    let cursor = null;
    do {
      const page = await db.filter(RSVP_FILTERS[filter].query, { sort: "-rsvp_at", limit: 200, ...(cursor ? { cursor } : {}) });
      all.push(...page.items);
      cursor = page.has_more ? page.next_cursor : null;
    } while (cursor);
    downloadRsvpCsv(all, `${title} - ${RSVP_FILTERS[filter].label}`);
    setExporting(false);
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-xl font-bold">דוח אישורי הגעה</h2><p className="text-sm text-muted-foreground">הרשימה הסופית של מי שאישר/ה הגעה, כולל מי עדכן ומתי</p></div>
      <Button variant="outline" onClick={exportCsv} disabled={exporting || !leads.length} className="h-10 gap-2">{exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}ייצוא לאקסל</Button>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {Object.entries(RSVP_FILTERS).map(([k, f]) => <button key={k} type="button" onClick={() => setFilter(k)} aria-pressed={filter === k}
        className={cn("rounded-xl border p-3 text-right transition-all", filter === k ? "border-primary bg-primary/10 shadow-sm" : "bg-card hover:border-primary/40")}>
        <p className={cn("text-2xl font-bold tabular-nums", k === "attending" && "text-emerald-600", k === "not_attending" && "text-destructive")}>{counts?.[k] ?? "–"}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{f.label}</p>
      </button>)}
    </div>
    {isPending ? <p role="status" className="py-10 text-center text-muted-foreground">טוענים…</p>
      : leads.length ? <RsvpTable leads={leads} />
      : <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">אין נרשמים בקטגוריה הזו עדיין.</div>}
    {hasNextPage && <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="h-10 w-full">{isFetchingNextPage ? "טוענים…" : "טעינת נוספים"}</Button>}
  </div>;
}