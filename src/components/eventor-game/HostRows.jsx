import { QUESTIONS, percentages } from "@/lib/eventorGame";
import { ANSWER_STYLES } from "@/components/eventor-game/gameVisuals";

// Compact answer rows with coloured bars (used in the final summary).
export default function HostRows({ qi, counts }) {
  const { pct } = percentages(counts);
  return <ul className="eh-rows">
    {QUESTIONS[qi].o.map((txt, i) => {
      const S = ANSWER_STYLES[i];
      return <li key={i}>
        <div className="eh-row-head">
          <span className="eh-row-label"><span className={`eh-mini ${S.cls}`}><S.icon fill="currentColor" aria-hidden="true" /></span>{txt}</span>
          <b>{pct[i]}% ({counts[i]})</b>
        </div>
        <div className="eh-bar" aria-hidden="true"><span className={S.cls} style={{ width: `${pct[i]}%` }} /></div>
      </li>;
    })}
  </ul>;
}