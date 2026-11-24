import { QUESTIONS } from "@/lib/eventorGame";
import { ANSWER_STYLES } from "@/components/eventor-game/gameVisuals";

// The four coloured answer tiles on the projector.
export default function HostTiles({ qi }) {
  return <div className="eh-tiles">
    {QUESTIONS[qi].o.map((txt, i) => {
      const S = ANSWER_STYLES[i];
      return <div key={i} className={`eh-tile ${S.cls}`}>
        <S.icon className="eh-tile-icon" fill="currentColor" aria-hidden="true" />
        <span>{txt}</span>
      </div>;
    })}
  </div>;
}