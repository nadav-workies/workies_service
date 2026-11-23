import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import useEventorGame from "@/hooks/useEventorGame";

// Hero entry to the lecture game. Shown only while the game is switched on in management.
export default function EventorGameButton() {
  const { game } = useEventorGame();
  if (!game?.enabled) return null;
  return <Link to="/eventor-game" className="ev-game-btn">
    משחקים עם נדב | לאן נעלם הזמן?
    <ArrowLeft className="w-5 h-5" aria-hidden="true" />
  </Link>;
}