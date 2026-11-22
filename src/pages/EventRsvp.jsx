import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, CalendarDays, Clock, MapPin } from "lucide-react";
import { RSVP } from "@/lib/rsvp";

// Public RSVP page opened from the personal link a representative copied or emailed.
export default function EventRsvp() {
  const params = new URLSearchParams(window.location.search);
  const campaign = params.get("c");
  const token = params.get("t");
  const [info, setInfo] = useState(null);
  const [state, setState] = useState("loading");
  const [saving, setSaving] = useState("");

  useEffect(() => {
    document.title = "אישור הגעה | Workies";
    base44.functions.invoke("eventRsvp", { action: "get", campaign, token })
      .then(({ data }) => { setInfo(data); setState("ready"); })
      .catch(() => setState("invalid"));
  }, []);

  async function answer(choice) {
    setSaving(choice);
    try {
      await base44.functions.invoke("eventRsvp", { action: "respond", campaign, token, choice });
      setInfo(i => ({ ...i, rsvp_status: choice }));
    } catch { setState("error"); }
    finally { setSaving(""); }
  }

  return <main dir="rtl" lang="he" className="min-h-screen flex items-center justify-center bg-background p-4 font-body">
    <section className="w-full max-w-md rounded-2xl border bg-card p-8 space-y-6 shadow-sm">
      <p className="text-lg font-black tracking-wide text-primary text-center">WORKIES</p>
      {state === "loading" && <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" aria-label="טוענים" />}
      {state === "invalid" && <div className="text-center space-y-2"><h1 className="text-xl font-bold">הקישור אינו תקין</h1><p className="text-sm text-muted-foreground">ייתכן שהקישור הועתק באופן חלקי. אפשר לפנות אלינו ונשמח לעזור.</p></div>}
      {state === "error" && <div className="text-center space-y-3"><h1 className="text-xl font-bold">התשובה לא נשמרה</h1><Button className="w-full" onClick={() => setState("ready")}>לנסות שוב</Button></div>}
      {state === "ready" && info && <>
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">{info.first_name ? `${info.first_name}, מגיעים?` : "מגיעים?"}</h1>
          <p className="text-muted-foreground">{info.event_name}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-4 space-y-2 text-sm">
          {info.event_date && <p className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" />{info.event_date}</p>}
          {info.event_time && <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />{info.event_time}</p>}
          {info.event_location && <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />{info.event_location}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => answer("attending")} disabled={!!saving} variant={info.rsvp_status === "attending" ? "default" : "outline"} className="h-12 gap-2 text-base">{saving === "attending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{RSVP.attending}</Button>
          <Button onClick={() => answer("not_attending")} disabled={!!saving} variant={info.rsvp_status === "not_attending" ? "secondary" : "outline"} className="h-12 gap-2 text-base">{saving === "not_attending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}{RSVP.not_attending}</Button>
        </div>
        {info.rsvp_status && <p role="status" className="text-center text-sm">{info.rsvp_status === "attending" ? "תודה! רשמנו שמגיעים. מחכים לראות אותך." : "תודה שעדכנת. נשמח לראות אותך באירוע הבא."}<br /><span className="text-muted-foreground">אפשר לשנות את התשובה בכל עת.</span></p>}
      </>}
    </section>
  </main>;
}