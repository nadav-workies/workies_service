import { QUESTIONS, percentages } from "@/lib/eventorGame";
import HostSummary from "@/components/eventor-game/HostSummary";
import HostRoster from "@/components/eventor-game/HostRoster";
import HostTiles from "@/components/eventor-game/HostTiles";
import HostHistogram from "@/components/eventor-game/HostHistogram";
import HostTimer from "@/components/eventor-game/HostTimer";

export default function HostBoard({ game, counts, roster, voters = 0 }) {
  if (game.phase === "waiting") return <HostRoster roster={roster} />;

  if (game.phase === "ended") return <HostSummary counts={counts} voters={voters} />;

  const qi = game.question_index;
  const voted = percentages(counts[qi]).total;
  return <section className="eh-board" aria-live="polite">
    <div className="eh-meta"><span>שאלה {qi + 1} מתוך {QUESTIONS.length}</span><span><b>{voted}</b> מתוך {roster.length} הצביעו</span></div>
    <h1 className="eh-qcard">{QUESTIONS[qi].t}</h1>
    {game.phase === "revealed"
      ? <HostHistogram counts={counts[qi]} />
      : <div className="eh-live">
        <HostTimer key={`${game.round}-${qi}`} />
        <div className="eh-votes"><strong>{voted}</strong><span>תשובות התקבלו</span></div>
      </div>}
    <HostTiles qi={qi} counts={game.phase === "revealed" ? counts[qi] : null} />
  </section>;
}