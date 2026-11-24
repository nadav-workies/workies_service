import { QUESTIONS } from "@/lib/eventorGame";
import { ANSWER_STYLES } from "@/components/eventor-game/gameVisuals";

// The four coloured answer tiles on the projector.
export default function HostTiles({ qi, counts }) {
  const max = counts ? Math.max(...counts) : 0;
  return <div className={`eh-tiles${max > 0 ? " eh-tiles-revealed" : ""}`}>
    {QUESTIONS[qi].o.map((txt, i) => {
      const S = ANSWER_STYLES[i];
      const top = max > 0 && counts[i] === max;
      return <div key={i} className={`eh-tile ${S.cls}${top ? " eh-tile-top" : ""}`}>
        <S.icon className="eh-tile-icon" fill="currentColor" aria-hidden="true" />
        <span>{txt}</span>
      </div>;
    })}
  </div>;
}