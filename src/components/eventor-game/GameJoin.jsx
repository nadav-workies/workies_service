import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { gameError, loadPlayer, savePlayer } from "@/lib/eventorGame";
import IconPicker from "@/components/eventor-game/IconPicker";

export default function GameJoin({ onJoined }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("star");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const clean = name.trim();
  const valid = clean.length >= 2 && clean.length <= 30;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setError("");
    const voter_id = loadPlayer()?.voter_id || crypto.randomUUID();
    try {
      const { data } = await base44.functions.invoke("eventorGame", { action: "join", voter_id, name: clean, icon });
      onJoined(savePlayer({ voter_id, name: clean, icon, round: data.round, answers: {} }));
    } catch (err) {
      setError(gameError(err));
      setBusy(false);
    }
  };

  return <form className="eg-card" onSubmit={submit} noValidate>
    <p>שש שאלות קצרות על הזמן שנחסך בעבודה.<br />בלי ניקוד, בלי תחרות ובלי תשובה נכונה.</p>
    <label htmlFor="eg-name" className="eg-label">איך קוראים לך?</label>
    <input id="eg-name" className="eg-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="השם שלך" maxLength={30} autoComplete="given-name" required aria-describedby={error ? "eg-join-err" : undefined} />
    <span id="eg-icon-label" className="eg-label">בחרו אייקון</span>
    <IconPicker value={icon} onChange={setIcon} />
    {error && <span id="eg-join-err" className="eg-err" role="alert">{error}</span>}
    <button type="submit" className="eg-btn" disabled={!valid || busy}>{busy ? "נכנסים…" : "כניסה למשחק"}</button>
  </form>;
}