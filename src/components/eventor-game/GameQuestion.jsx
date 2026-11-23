import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { LETTERS, QUESTIONS, gameError, savePlayer } from "@/lib/eventorGame";

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
    <h2 id="eg-q" className="eg-q">{q.t}</h2>
    <div className="eg-options">
      {q.o.map((txt, i) => <button key={i} type="button" className="eg-option" disabled={busy} onClick={() => vote(i)}>{LETTERS[i]}. {txt}</button>)}
    </div>
    {error && <span className="eg-err-dark" role="alert">{error}</span>}
  </section>;
}