import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { GAME_KEY } from "@/lib/eventorGame";

// Reads the game state. live: keeps it updated (realtime + light polling).
export default function useEventorGame({ live = false } = {}) {
  const [game, setGame] = useState(undefined);
  useEffect(() => {
    let alive = true;
    const load = () => base44.entities.EventorGame.filter({ key: GAME_KEY }, { limit: 1 }).then((p) => alive && setGame(p.items[0] || null));
    load();
    if (!live) return () => { alive = false; };
    const unsubscribe = base44.entities.EventorGame.subscribe((ev) => { if (ev.data?.key === GAME_KEY) setGame(ev.data); });
    const timer = setInterval(load, 4000);
    return () => { alive = false; unsubscribe(); clearInterval(timer); };
  }, [live]);
  return { game, setGame };
}