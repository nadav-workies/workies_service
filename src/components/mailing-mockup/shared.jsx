import { cn } from "@/lib/utils";

const TONES = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  yellow: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-rose-50 text-rose-700 border-rose-200",
  gray: "bg-zinc-100 text-zinc-600 border-zinc-200",
  blue: "bg-sky-50 text-sky-700 border-sky-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
};

export function Pill({ tone = "gray", children, className }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", TONES[tone], className)}>{children}</span>;
}

export function PageHeader({ title, subtitle, actions }) {
  return <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>;
}

export function Stat({ label, value, hint, tone }) {
  return <div className="rounded-xl border bg-card p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={cn("text-2xl font-bold mt-1 tabular-nums", tone === "orange" && "text-primary")}>{value}</p>
    {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
  </div>;
}

export function Panel({ title, actions, children, className }) {
  return <section className={cn("rounded-xl border bg-card", className)}>
    {(title || actions) && <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
      {title && <h3 className="font-semibold text-sm">{title}</h3>}
      {actions}
    </div>}
    <div className="p-4">{children}</div>
  </section>;
}

export function Table({ head, children }) {
  return <div className="overflow-x-auto rounded-xl border bg-card">
    <table className="w-full text-sm">
      <thead className="bg-muted/50 text-muted-foreground">
        <tr>{head.map((h, i) => <th key={i}className="text-right font-medium px-3 py-2.5 whitespace-nowrap">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y">{children}</tbody>
    </table>
  </div>;
}

export function Bar({ value, max = 100, tone = "primary" }) {
  const w = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
    <div className={cn("h-full rounded-full", tone === "primary" ? "bg-primary" : tone === "green" ? "bg-emerald-500" : "bg-zinc-400")} style={{ width: `${w}%` }} />
  </div>;
}
