import { QUESTIONS, SUMMARY_QUESTIONS, finalMessage, percentages } from "@/lib/eventorGame";
import HostRows from "@/components/eventor-game/HostRows";

export default function HostBoard({ game, counts, players }) {
  if (game.phase === "waiting") return <section className="eh-board eh-waiting" aria-live="polite">
    <strong>{players}</strong>
    <span>משתתפות מחוברות. כשכולן בפנים, פותחים את השאלה הראשונה.</span>
  </section>;

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
  return <section className="eh-board" aria-live="polite">
    <div className="eh-meta"><span>שאלה {qi + 1} מתוך {QUESTIONS.length}</span><span><b>{percentages(counts[qi]).total}</b> הצביעו בשאלה זו</span></div>
    <h1 className="eh-q">{QUESTIONS[qi].t}</h1>
    <HostRows qi={qi} counts={counts[qi]} />
  </section>;
}