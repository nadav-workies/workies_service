import { EV_IMAGES, FAQ } from "@/lib/eventorContent";

// Catering, sign banner, team and FAQ sections.
export default function EventorStory() {
  return <>
    <section className="ev-catering" aria-labelledby="ev-catering-title">
      <div className="ev-wrap"><div className="ev-catering-inner ev-stack">
        <span className="ev-label-soft">הסעדה ברמה אחרת</span>
        <h2 id="ev-catering-title" className="ev-h2">אנחנו מטפלים בתפריט. אתם נשארים פנויים לאורחים.</h2>
        <p className="ev-text">ארוחות בוקר, צהריים וערב בכשרות מלאה, מהספקים הטובים ביותר בשוק.</p>
        <div className="ev-meals">
          {["בוקר", "צהריים", "ערב"].map(m => <div key={m} className="ev-meal"><span>ארוחת</span><strong>{m}</strong></div>)}
        </div>
      </div></div>
    </section>
    <section className="ev-sign" aria-label="השלט של Eventor">
      <img src={EV_IMAGES.sign} alt="השלט EVENTOR BY WORKIES על זכוכית הכניסה" loading="lazy" />
      <div className="ev-sign-fade" aria-hidden="true" />
    </section>
    <section className="ev-team" aria-labelledby="ev-team-title">
      <div className="ev-wrap"><div className="ev-team-inner ev-stack">
        <span className="ev-label-soft">הסוד של Workies</span>
        <h2 id="ev-team-title" className="ev-h2">אתם מביאים את הרעיון<span className="ev-y">.</span><br />אנחנו דואגים לכל השאר<span className="ev-y">.</span></h2>
        <p className="ev-text">צוות Workies עומד לרשותכם בכל שלב, לכל רעיון, בקשה ואפילו גחמה. מהתכנון ועד שהאורח האחרון יוצא, אתם לא לבד.</p>
      </div></div>
    </section>
    <section aria-labelledby="ev-faq-title" className="ev-light ev-faq">
      <div className="ev-wrap">
        <h2 id="ev-faq-title" className="ev-h2">שאלות שחוזרות אלינו</h2>
        <div className="ev-faq-list">
          {FAQ.map(([q, a]) => <div key={q} className="ev-faq-item"><strong>{q}</strong><span>{a}</span></div>)}
        </div>
      </div>
    </section>
  </>;
}