import { percentages } from "@/lib/eventorGame";
import { ANSWER_STYLES } from "@/components/eventor-game/gameVisuals";

// Kahoot-style vertical bars per answer.
export default function HostHistogram({ counts }) {
  const { pct } = percentages(counts);
  const max = Math.max(1, ...counts);
  return <div className="eh-hist" role="img" aria-label={counts.map((n, i) => `${ANSWER_STYLES[i].label}: ${n}`).join(", ")}>
    {counts.map((n, i) => {
      const S = ANSWER_STYLES[i];
      return <div key={i} className="eh-hist-col">
        <span className="eh-hist-num">{n} <small>({pct[i]}%)</small></span>
        <div className="eh-hist-track"><span className={`eh-hist-bar ${S.cls}`} style={{ height: `${Math.max(n / max * 100, 3)}%` }} /></div>
        <span className={`eh-hist-icon ${S.cls}`}><S.icon fill="currentColor" aria-hidden="true" /></span>
      </div>;
    })}
  </div>;
}