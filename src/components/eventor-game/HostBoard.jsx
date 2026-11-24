import { QUESTIONS, SUMMARY_QUESTIONS, finalMessage, percentages } from "@/lib/eventorGame";
import HostRows from "@/components/eventor-game/HostRows";
import HostRoster from "@/components/eventor-game/HostRoster";
import HostTiles from "@/components/eventor-game/HostTiles";
import HostHistogram from "@/components/eventor-game/HostHistogram";

export default function HostBoard({ game, counts, roster }) {
  if (game.phase === "waiting") return <HostRoster roster={roster} />;

  if (game.phase === "ended") return <section className="eh-board">
    <h2 className="eh-q">סיכום המשחק</h2>
    <div className="eh-summary">
      {SUMMARY_QUESTIONS.map((qi) => <div key={qi}>
        <h2>{qi + 1}. {QUESTIONS[qi].t}</h2>
        <HostRows qi={qi} counts={counts[qi]} />
      </div>)}
    </div>
    <p className="eh-final">{finalMessage(counts[5])}</p>
  </section>;

  const qi = game.question_index;
  const voted = percentages(counts[qi]).total;
  return <section className="eh-board" aria-live="polite">
    <div className="eh-meta"><span>שאלה {qi + 1} מתוך {QUESTIONS.length}</span><span><b>{voted}</b> מתוך {roster.length} הצביעו</span></div>
    <h1 className="eh-qcard">{QUESTIONS[qi].t}</h1>
    {game.phase === "revealed"
      ? <HostHistogram counts={counts[qi]} />
      : <div className="eh-votes"><strong>{voted}</strong><span>תשובות התקבלו</span></div>}
    <HostTiles qi={qi} />
  </section>;
}