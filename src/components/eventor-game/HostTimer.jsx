import { useEffect, useState } from "react";

const DELAY = 5, DURATION = 20;

// 20s countdown on the projector, starts 5s after the question appears. Voting stays open until the host reveals.
export default function HostTimer() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 250);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.min(DURATION, DURATION - (elapsed - DELAY)));
  const done = left === 0;
  return <div className="eh-timer" data-done={done} role="timer" aria-live="off">
    <svg viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="19" className="eh-timer-bg" />
      <circle cx="22" cy="22" r="19" className="eh-timer-fg" style={{ strokeDashoffset: `${119.4 * (1 - left / DURATION)}` }} />
    </svg>
    <strong>{done ? "הזמן נגמר" : left}</strong>
  </div>;
}