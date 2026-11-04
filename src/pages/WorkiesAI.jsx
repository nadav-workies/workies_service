import { useEffect, useRef, useState } from "react";
import CampaignValidityGate from "@/components/landing/CampaignValidityGate";
import WorkiesAIForm, { EVENT } from "@/components/landing/WorkiesAIForm";
import "@/components/landing/WorkiesAI.css";

const LOGO_URL = "https://media.base44.com/images/public/6a1d5a36316988d9f113f88e/35dda667c_wai-logo.webp";
const PROMPT = "בנה לי עמוד נחיתה לסטודיו לפילאטיס, עם טופס להשארת פרטים";

function Spark({ className = "spark" }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" /></g></svg>;
}

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => { setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  return reduce;
}

function BuildDemo() {
  const reduce = useReducedMotion();
  const [t, setT] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setT(v => (v + 80) % 10400), 80);
    return () => clearInterval(id);
  }, [reduce]);
  const time = reduce ? 99999 : t;
  const typed = PROMPT.slice(0, Math.min(PROMPT.length, Math.floor((time / 2600) * PROMPT.length)));
  const thinking = time >= 2600 && time < 3600;
  const built = time < 3600 ? 0 : Math.min(5, Math.floor((time - 3600) / 550) + 1);
  const pct = Math.round((built / 5) * 100);
  const done = built >= 5;
  return (
    <div className="demo" aria-label="הדגמה: Claude בונה עמוד נחיתה מתוך בקשה אחת">
      <div className="demo-bar">
        <span className="dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="demo-title"><Spark />Claude</span>
        <span className="demo-status">{done ? "מוכן" : thinking ? "חושב…" : built ? `בונה ${pct}%` : "מקליד…"}</span>
      </div>
      <div className="demo-body">
        <div className="bubble user"><span className="who">אתם</span><p>{typed}{!thinking && !built && <i className="caret" />}</p></div>
        {(thinking || built > 0) && <div className="bubble ai"><Spark /><p>{thinking ? <span className="typing"><i /><i /><i /></span> : done ? "העמוד מוכן. אפשר לערוך, לשתף ולקבל פניות." : "בונה את העמוד…"}</p></div>}
        <div className={`site ${built ? "on" : ""}`}>
          <div className="site-url"><span>העמוד-שלכם</span><b>{pct}%</b></div>
          <div className="site-page">
            <div className={`blk nav ${built >= 1 ? "on" : ""}`}><span /><span /></div>
            <div className={`blk h ${built >= 2 ? "on" : ""}`} />
            <div className={`blk p ${built >= 2 ? "on" : ""}`} />
            <div className={`blk cta ${built >= 3 ? "on" : ""}`} />
            <div className={`blk form ${built >= 4 ? "on" : ""}`}><span /><span /><b /></div>
            <div className={`blk cards ${built >= 5 ? "on" : ""}`}><span /><span /><span /></div>
          </div>
          <div className="progress"><i style={{ width: `${pct}%` }} /></div>
        </div>
        <p className="demo-note">דוגמה להמחשה</p>
      </div>
    </div>
  );
}

function Countdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const diff = EVENT.start.getTime() - now;
  if (diff <= 0) return <p className="count-done">המפגש כבר התחיל. מפגשים נוספים יפורסמו בהמשך.</p>;
  const units = [["ימים", Math.floor(diff / 864e5)], ["שעות", Math.floor(diff / 36e5) % 24], ["דקות", Math.floor(diff / 6e4) % 60], ["שניות", Math.floor(diff / 1e3) % 60]];
  return <div className="count" aria-label="הזמן שנותר עד המפגש">{units.map(([label, v]) => <div key={label}><b>{String(v).padStart(2, "0")}</b><span>{label}</span></div>)}</div>;
}

const STEPS = [
  ["נגדיר צורך עסקי ונאפיין פתרון.", "צורך"],
  ["נכיר את סביבת Base44.", "Base44"],
  ["נשתמש ב-Claude לפיתוח האפיון והתוכן.", "Claude"],
  ["נבנה גרסה ראשונית של פתרון דיגיטלי.", "תצוגה"],
];

const IDEAS = [
  ["עמוד נחיתה לשירות", "עמוד שמציג שירות אחד ואוסף פניות."],
  ["עמוד הרשמה לאירוע או סדנה", "פרטי האירוע, מועד וטופס הרשמה."],
  ["דף מוצר עם טופס הזמנה", "תמונה, מחיר ותיאור, וכפתור להזמנה."],
  ["אתר תדמית קצר", "מי אתם, מה אתם עושים ואיך יוצרים קשר."],
];

const FAQ = [
  ["כמה זה עולה?", "ההשתתפות ללא עלות, במימון מלא של Workies."],
  ["למה צריך כרטיס אשראי?", "הכרטיס משמש כפיקדון להבטחת הגעה. הוא לא יחויב בגין השתתפות במפגש."],
  ["ומה אם לא אגיע?", "במקרה של אי הגעה למפגש שאליו נרשמתם, יחויב הכרטיס בסך 50 ש\"ח, בהתאם לתנאי ההרשמה."],
  ["צריך ידע בתכנות?", "לא. לא צריך ידע מוקדם ולא רקע טכנולוגי. רק להגיע עם העסק שלכם."],
  ["כמה מקומות יש?", "מספר המקומות מוגבל, וההרשמה מראש."],
];

export default function WorkiesAI() {
  const [registered, setRegistered] = useState(false);
  const [formVisible, setFormVisible] = useState(true);
  const formWrap = useRef(null);

  useEffect(() => {
    const prevTitle = document.title;
    const root = document.documentElement;
    const prevScroll = root.style.scrollBehavior;
    document.title = "Workies AI | בונים עמוד נחיתה עם Claude · 10.11";
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) root.style.scrollBehavior = "smooth";
    return () => { document.title = prevTitle; root.style.scrollBehavior = prevScroll; };
  }, []);

  useEffect(() => {
    const el = formWrap.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setFormVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="wai" dir="rtl" lang="he">
      <header className="top band">
        <div className="wrap top-in">
          <img src={LOGO_URL} alt="Workies" width="96" height="32" />
          <span className="top-date"><span className="live-dot" aria-hidden="true" />{EVENT.dayLabel} · 13:30</span>
          <a className="btn btn-primary btn-sm" href="#register-form">שריון מקום</a>
        </div>
      </header>

      <section className="hero band">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="chip"><span className="live-dot" aria-hidden="true" />ההרשמה פתוחה · מספר המקומות מוגבל</p>
            <h1>מתארים.<br /><em>Claude</em> בונה.<br />יוצאים עם עמוד נחיתה.</h1>
            <p className="lead">מפגש מעשי של 60 דקות לבעלי עסקים. בונים עם Claude ו-Base44 עמוד נחיתה ראשון לעסק שלכם, גם בלי ידע בתכנות.</p>
            <dl className="ticket">
              <div><dt>מתי</dt><dd>{EVENT.dayLabel}</dd></div>
              <div><dt>שעה</dt><dd>{EVENT.timeLabel}</dd></div>
              <div><dt>איפה</dt><dd>{EVENT.place}</dd></div>
              <div><dt>עלות</dt><dd>ללא עלות</dd></div>
            </dl>
          </div>
          <div className="hero-form" ref={formWrap}>
            <CampaignValidityGate campaign="workies_ai"><WorkiesAIForm onDone={() => setRegistered(true)} /></CampaignValidityGate>
          </div>
          <div className="hero-demo"><BuildDemo /></div>
        </div>
      </section>

      <section className="flow band">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow"><Spark />60:00 דקות. בקשה אחת. עמוד אחד.</p>
            <h2>מה קורה בתוך השעה</h2>
          </div>
          <ol className="steps">
            {STEPS.map(([text, tag], i) => (
              <li key={tag}><span className="step-n">0{i + 1}</span><span className="step-tag">{tag}</span><p>{text}</p></li>
            ))}
          </ol>
          <div className="output">
            <Spark />
            <div><b>יוצאים עם</b><p>אבטיפוס ראשוני של עמוד נחיתה, אתר או אפליקציה.</p></div>
          </div>
        </div>
      </section>

      <section className="ideas band">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow"><Spark />רעיונות לדוגמה</p>
            <h2>מה תבנו אצלכם?</h2>
            <p>כל עסק מגיע עם צורך אחר. אלה כמה כיוונים שאפשר להתחיל מהם במפגש.</p>
          </div>
          <div className="idea-grid">
            {IDEAS.map(([title, text]) => (
              <article className="idea" key={title}>
                <div className="idea-prompt"><Spark /><span>{`בנה לי ${title}`}</span></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="faq band">
        <div className="wrap faq-grid">
          <div className="sec-head">
            <p className="eyebrow"><Spark />לפני שנרשמים</p>
            <h2>שאלות קצרות, תשובות קצרות</h2>
          </div>
          <div>
            {FAQ.map(([q, a]) => (
              <details className="qa" key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className="final band">
        <div className="wrap">
          <p className="eyebrow dark"><Spark />עד המפגש</p>
          <Countdown />
          <h2>{EVENT.dayLabel} · 13:30 · {EVENT.place}</h2>
          {registered ? <p className="final-done">נרשמתם. נתראה במפגש.</p> : <a className="btn btn-dark" href="#register-form">שריון מקום למפגש</a>}
        </div>
      </section>

      <footer className="foot band">
        <div className="wrap foot-in">
          <img src={LOGO_URL} alt="Workies" width="78" height="26" />
          <span>WORK • MEET • GROW</span>
        </div>
      </footer>

      {!registered && !formVisible && (
        <a className="float-cta" href="#register-form"><span><b>שריון מקום</b> · {EVENT.dayLabel} · 13:30</span><span aria-hidden="true">←</span></a>
      )}
    </div>
  );
}
