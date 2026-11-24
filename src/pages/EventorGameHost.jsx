import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import "@/components/eventor-game/EventorGame.css";
import { base44 } from "@/api/base44Client";
import { canManageLeads } from "@/lib/permissions";
import { EV_IMAGES } from "@/lib/eventorContent";
import { gameError } from "@/lib/eventorGame";
import HostBoard from "@/components/eventor-game/HostBoard";
import HostControls from "@/components/eventor-game/HostControls";

const PHASES = { waiting: "ממתינים לפתיחת המשחק", open: "הצבעה פתוחה | מתעדכן בזמן אמת", revealed: "ההצבעה נסגרה | הצגת תוצאות", ended: "המשחק הסתיים" };

// Host / projector screen. Reachable only for page managers.
export default function EventorGameHost() {
  const { data: user, isPending } = useQuery({ queryKey: ["landing-manager"], queryFn: () => base44.auth.me() });
  const allowed = canManageLeads(user);
  const { data, refetch } = useQuery({
    queryKey: ["eventor-game-host"], enabled: allowed, refetchInterval: 1500,
    queryFn: () => base44.functions.invoke("eventorGame", { action: "host_state" }).then((r) => r.data),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Game returned by the last control action; wins over polled data until the poll catches up.
  const [ctrlGame, setCtrlGame] = useState(null);
  const polled = data?.game;
  const game = ctrlGame && (!polled || polled.id !== ctrlGame.id || polled.updated_date < ctrlGame.updated_date) ? ctrlGame : polled;

  if (isPending) return <main className="eh-page" dir="rtl"><p role="status">טוענים…</p></main>;
  if (!allowed) return <Navigate to="/" replace />;

  const control = async (op) => {
    setBusy(true); setError("");
    try {
      const r = await base44.functions.invoke("eventorGame", { action: "control", op });
      if (r.data?.game) setCtrlGame(r.data.game);
      setBusy(false);
      refetch();
    } catch (e) { setError(gameError(e)); setBusy(false); }
  };

  return <main className="eh-page" dir="rtl">
    <div className="eh-top">
      <img src={EV_IMAGES.logo} alt="Workies" style={{ height: 30 }} />
      <span className="eh-pill">לאן נעלם הזמן? | לוח המרצה</span>
      {data && <span className="eh-note">{data.players} משתתפות מחוברות</span>}
      {data && <span className="eh-phase">{PHASES[game.phase]}</span>}
    </div>
    {data ? <>
      <HostBoard game={game} counts={data.counts} roster={data.roster || []} voters={data.voters || 0} />
      <HostControls game={game} busy={busy} onControl={control} />
      {error && <p className="eh-status" role="alert">{error}</p>}
    </> : <p role="status">טוענים…</p>}
  </main>;
}