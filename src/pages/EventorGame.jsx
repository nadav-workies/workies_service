import { useEffect, useState } from "react";
import "@/components/eventor-game/EventorGame.css";
import useEventorGame from "@/hooks/useEventorGame";
import { loadPlayer } from "@/lib/eventorGame";
import GameHeader from "@/components/eventor-game/GameHeader";
import GameMessage from "@/components/eventor-game/GameMessage";
import GameJoin from "@/components/eventor-game/GameJoin";
import GamePlay from "@/components/eventor-game/GamePlay";

// Participant screen for the lecture game (public).
export default function EventorGame() {
  const { game } = useEventorGame({ live: true });
  const [player, setPlayer] = useState(loadPlayer);
  useEffect(() => { document.title = "לאן נעלם הזמן? | Workies"; }, []);

  const joined = player && game && player.round === game.round;
  let body;
  if (game === undefined) body = <GameMessage>טוענים…</GameMessage>;
  else if (!game?.enabled) body = <GameMessage title="המשחק אינו פעיל כעת">נתראה במפגש הבא.</GameMessage>;
  else if (!joined) body = <GameJoin onJoined={setPlayer} />;
  else body = <GamePlay game={game} player={player} onPlayer={setPlayer} />;

  return <main dir="rtl" className="eg-page">
    <div className="eg-wrap">
      <GameHeader tag={game?.enabled && !joined ? "משחק פתיחה למיטינג הבוקר" : null} />
      {body}
    </div>
  </main>;
}