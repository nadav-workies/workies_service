import { avatarIcon } from "@/components/eventor-game/gameVisuals";

// Waiting screen: every participant appears as she joins.
export default function HostRoster({ roster }) {
  return <section className="eh-board eh-waiting" aria-live="polite">
    <div className="eh-waiting-head">
      <strong>{roster.length}</strong>
      <span>משתתפות הצטרפו. כשכולן בפנים, פותחים את השאלה הראשונה.</span>
    </div>
    {roster.length > 0 && <ul className="eh-roster">
      {roster.map((p) => {
        const Icon = avatarIcon(p.icon);
        return <li key={p.id} className="eh-chip"><Icon fill="currentColor" aria-hidden="true" />{p.name}</li>;
      })}
    </ul>}
  </section>;
}