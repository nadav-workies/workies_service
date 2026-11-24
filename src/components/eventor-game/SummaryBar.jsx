// One full-width stacked bar; segments under 6% show only the number, their label goes to the legend.
export default function SummaryBar({ title, segments, delay = 0 }) {
  const shown = segments?.filter((s) => s.pct > 0) || [];
  const small = shown.filter((s) => s.pct < 6);
  return <div className="es-row">
    <span className="es-row-title">{title}</span>
    {shown.length ? <>
      <div className="es-bar" style={{ animationDelay: `${delay}s` }}
        aria-label={`${title}: ${shown.map((s) => `${s.label} ${s.pct}%`).join(", ")}`}>
        {shown.map((s) => <span key={s.key} className="es-seg" style={{ width: `${s.pct}%`, background: s.color }}>
          {s.pct >= 6 ? <>{s.label} <b>{s.pct}%</b></> : <b>{s.pct}%</b>}
        </span>)}
      </div>
      {small.length > 0 && <ul className="es-legend">
        {small.map((s) => <li key={s.key}><i style={{ background: s.color }} />{s.label} {s.pct}%</li>)}
      </ul>}
    </> : <div className="es-bar es-bar-empty">אין הצבעות</div>}
  </div>;
}