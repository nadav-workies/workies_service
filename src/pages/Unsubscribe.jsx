import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const isPreview = () => window.self !== window.top || /^preview(-sandbox)?--/.test(window.location.hostname);

export default function Unsubscribe() {
  const [state, setState] = useState("loading");
  const token = new URLSearchParams(window.location.hash.slice(1)).get("token");

  async function unsubscribe() {
    setState("loading");
    try {
      const res = await fetch("/api/app-emails/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      setState(res.ok ? "done" : res.status === 400 ? "invalid" : "error");
    } catch { setState("error"); }
  }
  useEffect(() => {
    document.title = "הסרה מרשימת התפוצה | Workies";
    if (token) unsubscribe();
    else setState(isPreview() ? "preview" : "invalid");
  }, []);

  return <main dir="rtl" lang="he" className="min-h-screen flex items-center justify-center bg-background p-4 font-body">
    <section className="w-full max-w-md rounded-2xl border bg-card p-8 text-center space-y-4">
      <p className="text-lg font-black tracking-wide text-primary">WORKIES</p>
      {state === "loading" && <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" aria-label="מעבד" />}
      {(state === "done" || state === "preview") && <>
        {state === "preview" && <span className="inline-block rounded-full border px-2 py-0.5 text-xs text-muted-foreground">תצוגה מקדימה</span>}
        <h1 className="text-xl font-bold">הוסרת מרשימת התפוצה</h1>
        <p className="text-sm text-muted-foreground">לא תקבלו יותר דיוור שיווקי מוורקיז.</p>
        <p className="text-xs text-muted-foreground">מיילים הקשורים לשירות שאתם מקבלים מאיתנו, כמו אישורי הרשמה ותזכורות, ימשיכו להגיע.</p>
      </>}
      {state === "invalid" && <>
        <h1 className="text-xl font-bold">הקישור אינו תקין</h1>
        <p className="text-sm text-muted-foreground">ייתכן שהקישור פג תוקף או הועתק באופן חלקי. אפשר להשתמש בקישור ההסרה שבתחתית כל מייל.</p>
      </>}
      {state === "error" && <>
        <h1 className="text-xl font-bold">משהו השתבש</h1>
        <p className="text-sm text-muted-foreground">לא הצלחנו להשלים את ההסרה.</p>
        <Button className="w-full" onClick={unsubscribe}>לנסות שוב</Button>
      </>}
    </section>
  </main>;
}