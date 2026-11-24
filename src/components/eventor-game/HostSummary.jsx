import { useEffect, useState } from "react";
import { buildSummary } from "@/lib/eventorSummary";
import SummaryBar from "@/components/eventor-game/SummaryBar";

function useCountUp(target, ms = 1200) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf; const start = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - start) / ms); setN(Math.round(target * (1 - (1 - p) ** 3))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

// Single weighted summary slide shown when the game ends.
export default function HostSummary({ counts, voters }) {
  const s = buildSummary(counts);
  const refilled = useCountUp(s.refilled);
  return <section className="es-slide" aria-live="polite">
    <h1 className="es-title">לאן נעלם הזמן? <span>התמונה של החדר</span></h1>
    <div className="es-bars">
      <SummaryBar title="מה רצינו" segments={s.wanted} />
      <SummaryBar title="מה קרה בפועל" segments={s.actual} delay={0.25} />
    </div>
    {s.actual && <div className="es-hero">
      <strong>{refilled}%</strong>
      <span className="es-hero-text">מהזמן שנחסך התמלא מחדש</span>
      <span className="es-hero-side">{s.saved}% נשמר לערך</span>
    </div>}
    <p className="es-msg">{s.message}</p>
    <p className="es-foot">{voters} משתתפות · תמונת מצב של החדר, לא מחקר מייצג</p>
  </section>;
}