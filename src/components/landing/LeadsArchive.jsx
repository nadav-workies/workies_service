import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DailyOfficeLeadRow from "@/components/landing/DailyOfficeLeadRow";

export default function LeadsArchive({ entity, category, onSaved }) {
  const [open, setOpen] = useState(false);
  const { data, isPending } = useQuery({
    queryKey: ["landing-leads", entity, "archive"],
    queryFn: () => base44.entities[entity].filter({ status: "not_relevant" }, { sort: "-created_date", limit: 100 }),
  });
  const items = data?.items || [];
  return <section className="rounded-xl border border-destructive/30 bg-destructive/5">
    <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="w-full flex items-center justify-between p-4 min-h-12 text-destructive font-bold">
      <span>ארכיון לא רלוונטי · {isPending ? "…" : items.length}</span>
      <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="space-y-3 p-3 pt-0">
      {items.length ? items.map(l => <DailyOfficeLeadRow key={l.id} lead={l} onSaved={onSaved} entity={entity} category={category} />) : <p className="text-sm text-muted-foreground text-center py-3">אין פניות בארכיון</p>}
    </div>}
  </section>;
}