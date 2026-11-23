import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, MonitorPlay } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import useEventorGame from "@/hooks/useEventorGame";
import { gameError } from "@/lib/eventorGame";

// Management: switch the lecture game on/off for the Eventor page only.
export default function EventorGameCard() {
  const { game, setGame } = useEventorGame({ live: true });
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const on = !!game?.enabled;
  const playUrl = `${window.location.origin}/eventor-game`;

  const toggle = async (value) => {
    setBusy(true);
    try {
      const { data } = await base44.functions.invoke("eventorGame", { action: "control", op: value ? "enable" : "disable" });
      setGame(data.game);
    } catch (e) { toast({ title: gameError(e), variant: "destructive" }); }
    setBusy(false);
  };
  const copy = () => navigator.clipboard.writeText(playUrl).then(() => toast({ title: "הקישור הועתק" }));

  return <section className="rounded-xl border bg-card p-4 sm:p-6 space-y-5">
    <div className="space-y-1">
      <h2 className="text-lg font-bold">משחק ההרצאה: לאן נעלם הזמן?</h2>
      <p className="text-sm text-muted-foreground">המתג שולט במשחק בלבד. הוא לא משנה דבר אחר בעמוד האירועים או באתר.</p>
    </div>
    <div className="flex items-center gap-4 rounded-xl bg-muted p-4">
      <Switch id="eventor-game-switch" checked={on} disabled={busy || game === undefined} onCheckedChange={toggle} />
      <label htmlFor="eventor-game-switch" className="space-y-0.5 cursor-pointer">
        <span className="block font-bold">{on ? "המשחק פעיל" : "המשחק כבוי"}</span>
        <span className="block text-sm text-muted-foreground">{on ? "כפתור המשחק מופיע בהירו של עמוד האירועים והמשתתפות יכולות להיכנס." : "הכפתור מוסתר. העמוד מציג רק את התוכן הרגיל של הסדנאות והאירועים."}</span>
      </label>
    </div>
    <div className="space-y-2">
      <span className="text-sm font-semibold">קישור למשתתפות</span>
      <div className="flex gap-2"><Input readOnly value={playUrl} dir="ltr" className="text-left" /><Button type="button" variant="outline" onClick={copy}><Copy />העתקה</Button></div>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <Button asChild><Link to="/eventor-game/host" target="_blank"><MonitorPlay />פתיחת מסך המנחה</Link></Button>
      <span className="text-sm text-muted-foreground">מסך המנחה נפתח רק למשתמשים מורשים בממשק הניהול. לא לפרסם.</span>
    </div>
    <div className="rounded-xl bg-[#1c1536] p-4 space-y-3" aria-label="תצוגה מקדימה של הירו עמוד האירועים">
      <span className="block text-xs font-bold text-[#E9E2FB]">תצוגה מקדימה: הירו עמוד האירועים</span>
      <span className="block text-white font-extrabold leading-tight">יש לכם רעיון. לנו יש את המקום שבו הוא <span className="text-[#F3C829]">קורה.</span></span>
      {on
        ? <span className="flex items-center justify-center gap-2 h-11 rounded-[14px] border-2 border-[#F3C829] text-[#F3C829] text-sm font-extrabold">משחקים עם נדב | לאן נעלם הזמן?<ArrowLeft className="w-4 h-4" /></span>
        : <span className="block text-sm text-[#DDD4F7]">כפתור המשחק מוסתר</span>}
    </div>
  </section>;
}