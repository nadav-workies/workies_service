import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Gamepad2 } from "lucide-react";
import useEventorGame from "@/hooks/useEventorGame";

// Floating game orb: pops in 3s after load while the game is on, disappears when the game ends or is switched off.
export default function EventorGameButton() {
  const { game } = useEventorGame({ live: true });
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 3000); return () => clearTimeout(t); }, []);
  if (!ready || !game?.enabled || game.phase === "ended") return null;
  return createPortal(
    <Link to="/eventor-game" className="ev-game-orb" aria-label="משחקים עם נדב: לאן נעלם הזמן?">
      <Gamepad2 aria-hidden="true" />
      <span>משחקים<br />עם נדב</span>
    </Link>,
    document.body
  );
}