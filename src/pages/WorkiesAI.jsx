import { useEffect } from "react";
import CampaignValidityGate from "@/components/landing/CampaignValidityGate";
import WorkiesAIForm from "@/components/landing/WorkiesAIForm";
import { TOP_HTML, FOOT_HTML } from "@/components/landing/workiesAIContent";
import "@/components/landing/WorkiesAI.css";

export default function WorkiesAI() {
  useEffect(() => {
    const prevTitle = document.title;
    const root = document.documentElement;
    const prevScroll = root.style.scrollBehavior;
    document.title = "Workies AI | מפגשי בינה מלאכותית לעסקים";
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) root.style.scrollBehavior = "smooth";
    return () => { document.title = prevTitle; root.style.scrollBehavior = prevScroll; };
  }, []);

  return (
    <div className="wai" dir="rtl" lang="he">
      <div dangerouslySetInnerHTML={{ __html: TOP_HTML }} />
      <section className="start band" id="start">
        <div className="wrap">
          <div className="sec-head">
            <h2>אז איך מתחילים?</h2>
            <p>Workies AI | המקום שבו עסקים לומדים לעשות יותר.</p>
          </div>
          <ol className="steps">
            <li><h3>בוחרים מפגש</h3><p>אחד מששת הנושאים. כל מפגש עצמאי.</p></li>
            <li><h3>נרשמים מראש</h3><p>משאירים פרטי כרטיס אשראי כפיקדון. הכרטיס לא יחויב על השתתפות.</p></li>
            <li><h3>מגיעים עם העסק</h3><p>60 דקות של הסבר, הדגמה והתנסות, ויוצאים עם תוצר ראשוני.</p></li>
          </ol>
          <CampaignValidityGate campaign="workies_ai"><WorkiesAIForm /></CampaignValidityGate>
          <p className="motto">מספר המקומות מוגבל.</p>
        </div>
      </section>
      <div dangerouslySetInnerHTML={{ __html: FOOT_HTML }} />
    </div>
  );
}
