import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { QUESTIONS, gameError, savePlayer } from "@/lib/eventorGame";
import { ANSWER_STYLES } from "@/components/eventor-game/gameVisuals";

export default function GameQuestion({ qi, player, onPlayer }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const q = QUESTIONS[qi];

  const vote = async (option) => {
    setBusy(true); setError("");
    try {
      const { data } = await base44.functions.invoke("eventorGame", { action: "vote", voter_id: player.voter_id, question_index: qi, option });
      onPlayer(savePlayer({ ...player, answers: { ...player.answers, [qi]: data.option } }));
    } catch (err) {
      setError(gameError(err));
      setBusy(false);
    }
  };

  return <section className="eg-wrap" aria-labelledby="eg-q">
    <span className="eg-qnum">שאלה {qi + 1} מתוך {QUESTIONS.length}</span>
    <div className="eg-progress" aria-hidden="true">{QUESTIONS.map((_, i) => <span key={i} data-on={i <= qi} />)}</div>
    <h2 id="eg-q" className="eg-qcard">{q.t}</h2>
    <div className="eg-tiles">
      {q.o.map((txt, i) => {
        const S = ANSWER_STYLES[i];
        return <button key={i} type="button" className={`eg-tile ${S.cls}`} disabled={busy} onClick={() => vote(i)}>
          <S.icon className="eg-tile-icon" fill="currentColor" aria-hidden="true" />
          <span>{txt}</span>
        </button>;
      })}
    </div>
    {error && <span className="eg-err-dark" role="alert">{error}</span>}
  </section>;
}