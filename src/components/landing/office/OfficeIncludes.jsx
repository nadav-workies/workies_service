import { Check } from "lucide-react";
import { scrollToForm } from "@/lib/officeContact";

const ITEMS = ["משרד פרטי ומרוהט שנסגר בדלת", "גישה לחדרי הישיבות", "חשמל וארנונה", "ניקיון", "חניה בחינם, ויש הרבה מקום", "מטבח מאובזר", "אינטרנט מהיר"];

export default function OfficeIncludes() {
  return <section className="ot-dark">
    <div className="ot-wrap ot-dark-grid">
      <div>
        <h2>מה מקבלים <span>במשרד</span></h2>
        <p className="ot-dark-lead">הכל כלול במחיר החודשי:</p>
        <p className="ot-dark-note">בלי חוזה ל־5 שנים. משלמים חודש בחודשו, ואפשר לגדול, לצמצם או לעזוב לפי מה שהעסק צריך.</p>
        <button type="button" className="ot-btn ot-desktop-only" onClick={scrollToForm}>לתיאום סיור במתחם</button>
      </div>
      <ul className="ot-checks">
        {ITEMS.map(t => <li key={t}><Check className="w-5 h-5" aria-hidden="true" />{t}</li>)}
      </ul>
      <button type="button" className="ot-btn ot-btn--full ot-mobile-only" onClick={scrollToForm}>לתיאום סיור במתחם</button>
    </div>
  </section>;
}