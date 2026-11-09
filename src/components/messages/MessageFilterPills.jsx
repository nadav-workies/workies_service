import { STATUS_PILLS } from "@/components/messages/messageConfig";

export default function MessageFilterPills({ status, counts, onChange }) {
  return <div className="dt1-chips" role="group" aria-label="סינון לפי סטטוס">
    {STATUS_PILLS.map((p, i) => <button key={p.key} type="button" className="dt1-fcard" data-dt1-filter={p.key}
      aria-pressed={status === p.key} style={{ "--dt1-i": i, ...p.style }} onClick={() => onChange(p.key)}>
      <span className="dt1-fcard-dot" aria-hidden="true" />
      <span className="dt1-fcard-name">{p.label}</span>
      <span className="dt1-fcard-n">{counts[p.key] ?? 0}</span>
    </button>)}
  </div>;
}