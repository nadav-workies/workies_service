export default function PageStatCard({ title, total, rows, labels, onSelect }) {
  return <div className="rounded-xl border bg-card p-4 space-y-3">
    <button type="button" onClick={() => onSelect()} className="w-full text-right flex items-start justify-between gap-2 min-h-11 hover:text-primary">
      <span className="font-bold text-sm leading-snug">{title}</span>
      <span className="text-2xl font-bold text-primary shrink-0">{total}</span>
    </button>
    {rows.length ? <div className="flex flex-wrap gap-1.5">
      {rows.map(row => <button key={row.status} type="button" onClick={() => onSelect(row.status)} className="rounded-full bg-muted hover:bg-primary/10 hover:text-primary px-3 py-1.5 text-xs min-h-8">
        {labels[row.status] || row.status} · <b>{row.count}</b>
      </button>)}
    </div> : <p className="text-xs text-muted-foreground">עדיין אין פניות</p>}
  </div>;
}