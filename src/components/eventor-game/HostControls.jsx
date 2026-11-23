export default function HostControls({ game, busy, onControl }) {
  const { phase, question_index: qi } = game;
  const reset = () => { if (window.confirm("לאפס את המשחק? כל ההצבעות והשמות יימחקו.")) onControl("reset"); };
  return <div className="eh-controls">
    {phase === "waiting" && <button type="button" className="eh-btn" disabled={busy} onClick={() => onControl("open")}>פתיחת השאלה הראשונה</button>}
    {(phase === "open" || phase === "revealed") && <>
      <button type="button" className="eh-btn" disabled={busy || phase !== "open"} onClick={() => onControl("reveal")}>סגירת הצבעה וחשיפת תוצאות</button>
      <button type="button" className="eh-btn eh-btn-alt" disabled={busy || phase !== "revealed"} onClick={() => onControl("next")}>{qi >= 5 ? "סיום והצגת הסיכום" : "מעבר לשאלה הבאה"}</button>
    </>}
    <button type="button" className="eh-btn eh-btn-danger" disabled={busy} onClick={reset}>איפוס משחק</button>
    {!game.enabled && <span className="eh-status">המשחק כבוי: הכפתור מוסתר והצבעות חדשות לא נקלטות.</span>}
  </div>;
}