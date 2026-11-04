import { useEffect, useRef, useState } from "react";
import CampaignValidityGate from "@/components/landing/CampaignValidityGate";
import WorkiesAIForm, { EVENT } from "@/components/landing/WorkiesAIForm";
import "@/components/landing/WorkiesAI.css";

const LOGO_URL = "https://media.base44.com/images/public/6a1d5a36316988d9f113f88e/35dda667c_wai-logo.webp";

const PHRASES = ["בנה לי עמוד נחיתה לסטודיו לפילאטיס", "בנה לי עמוד נחיתה למאפייה שלי", "בנה לי עמוד נחיתה לקליניקה שלי", "בנה לי עמוד נחיתה לעסק שלי"];
const BUSINESSES = ["סטודיו לפילאטיס", "קבלן שיפוצים", "משרד רואי חשבון", "מאפייה שכונתית", "מאמנת כושר אישית", "צלמת אירועים", "חנות פרחים", "מורה פרטית לאנגלית", "מוסך", "קליניקה לפיזיותרפיה", "יועצת משכנתאות", "מעצבת פנים", "סוכנות נדל\"ן", "גן אירועים", "חוג רובוטיקה לילדים", "מספרה"];
const STAGES = [["צורך", "מגדירים צורך עסקי ומאפיינים פתרון."], ["Base44", "מכירים את סביבת Base44."], ["Claude", "Claude מפתח את האפיון והתוכן."], ["גרסה ראשונה", "בונים גרסה ראשונית של העמוד."]];
const FAQ = [
  ["כמה זה עולה?", "ההשתתפות ללא עלות, במימון מלא של Workies."],
  ["למה צריך כרטיס אשראי?", "הכרטיס משמש כפיקדון להבטחת הגעה. הוא לא יחויב בגין השתתפות במפגש."],
  ["ומה אם לא אגיע?", "במקרה של אי הגעה למפגש שאליו נרשמתם, יחויב הכרטיס בסך 50 ש\"ח, בהתאם לתנאי ההרשמה."],
  ["צריך ידע בתכנות?", "לא. לא צריך ידע מוקדם ולא רקע טכנולוגי. רק להגיע עם העסק שלכם."],
  ["כמה מקומות יש?", "מספר המקומות מוגבל, וההרשמה מראש."],
];

function Spark({ className = "spark" }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" /></g></svg>;
}

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => { setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  return reduce;
}

function useInView(ref, threshold = 0.2) {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return inView;
}

function Cta({ children = "שריון מקום" }) {
  return <a className="cta" href="#register">{children} <span className="arr" aria-hidden="true">←</span></a>;
}

function HeroPrompt() {
  const reduce = useReducedMotion();
  const [text, setText] = useState(PHRASES[0]);
  const [sent, setSent] = useState(true);
  const [built, setBuilt] = useState(5);
  useEffect(() => {
    if (reduce) return;
    let alive = true;
    const timers = [];
    const wait = (ms) => new Promise((r) => timers.push(setTimeout(r, ms)));
    (async () => {
      let i = 0;
      while (alive) {
        const t = PHRASES[i % PHRASES.length];
        setSent(false); setBuilt(0);
        for (let c = 1; c <= t.length && alive; c++) { setText(t.slice(0, c)); await wait(55); }
        await wait(450); if (!alive) break;
        setSent(true);
        for (let b = 1; b <= 5 && alive; b++) { await wait(380); setBuilt(b); }
        await wait(2600);
        i++;
      }
    })();
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, [reduce]);
  return (
    <>
      <div className="bigprompt" aria-label="בקשה לדוגמה ל-Claude">
        <Spark />
        <div className="ptext"><span>{text}</span>{!sent && <i className="caret" />}</div>
        <div className={`send ${sent ? "go" : ""}`} aria-hidden="true">←</div>
      </div>
      <div className="persp" aria-hidden="true">
        <div className="page3d">
          <div className={`b nav ${built >= 1 ? "on" : ""}`} />
          <div className={`b hero ${built >= 2 ? "on" : ""}`}><i /></div>
          <div className={`b line ${built >= 3 ? "on" : ""}`} />
          <div className={`b btn ${built >= 4 ? "on" : ""}`} />
          <div className={`b grid ${built >= 5 ? "on" : ""}`}><span /><span /><span /></div>
          <span className={`built ${built >= 5 ? "on" : ""}`}><Spark />העמוד מוכן</span>
        </div>
      </div>
    </>
  );
}

function Ticket() {
  const ref = useRef(null);
  const [tilt, setTilt] = useState("rotateY(-8deg) rotateX(4deg)");
  const onMove = (e) => {
    if (!window.matchMedia("(hover:hover)").matches) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    setTilt(`rotateY(${x * 14}deg) rotateX(${-y * 10}deg)`);
  };
  return (
    <div className="tscene" ref={ref} onMouseMove={onMove} onMouseLeave={() => setTilt("rotateY(-8deg) rotateX(4deg)")}>
      <div className="ticket" style={{ transform: tilt }}>
        <div className="t-main">
          <div className="t-top"><img src={LOGO_URL} alt="Workies" width="72" height="24" /><span className="t-code">AI-01</span></div>
          <div className="route">
            <div><small>מ</small><b>רעיון</b></div>
            <span className="plane" aria-hidden="true">→</span>
            <div className="to"><small>אל</small><b>עמוד נחיתה</b></div>
          </div>
          <div className="fields">
            <div><small>תאריך</small><b>10.11</b></div>
            <div><small>המראה</small><b>13:30</b></div>
            <div><small>שער</small><b>Workies באר שבע</b></div>
            <div><small>מחיר</small><b>ללא עלות</b></div>
          </div>
          <div className="barcode" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function Ring() {
  const reduce = useReducedMotion();
  const box = useRef(null);
  const visible = useInView(box, 0.3);
  const [min, setMin] = useState(60);
  useEffect(() => {
    if (reduce || !visible) return;
    let raf, start = performance.now();
    const loop = (now) => {
      const t = Math.max(0, (now - start) / 1000) % 11;
      setMin(Math.max(0, Math.min(60, (t / 9) * 60)));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduce, visible]);
  const R = 150, C = 2 * Math.PI * 128;
  const st = Math.max(0, Math.min(3, Math.floor(min / 15)));
  const pt = (a, r) => [Math.sin(a) * r, -Math.cos(a) * r];
  const m = Math.floor(min), s = Math.floor((min - m) * 60);
  return (
    <div className="ringbox" ref={box}>
      <svg viewBox="-200 -200 400 400" aria-hidden="true">
        <circle className="track" r={R} />
        {STAGES.map((stage, i) => {
          const a0 = (i * Math.PI) / 2 + 0.04, a1 = ((i + 1) * Math.PI) / 2 - 0.04;
          const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R);
          const [tx, ty] = pt(((i + 0.5) * Math.PI) / 2, 186);
          return (
            <g key={stage[0]}>
              <path className={`seg ${i < st || (i === st && min > 0) ? "on" : ""}`} d={`M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1}`} />
              <text className={`tick ${i === st ? "on" : ""}`} x={tx} y={ty + 5} textAnchor="middle">{stage[0]}</text>
            </g>
          );
        })}
        <circle className="prog" r="128" transform="rotate(-90)" strokeDasharray={C} strokeDashoffset={C * (1 - min / 60)} />
      </svg>
      <div className="mid">
        <div className="clock">{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</div>
        <div className="stagename">{STAGES[st][0]}</div>
        <div className="stagetext">{STAGES[st][1]}</div>
      </div>
    </div>
  );
}

function Wall() {
  const [value, setValue] = useState("");
  const [shown, setShown] = useState("סטודיו לפילאטיס");
  const [thinking, setThinking] = useState(false);
  useEffect(() => {
    setThinking(true);
    const t = setTimeout(() => { setShown(value.trim() || "סטודיו לפילאטיס"); setThinking(false); }, 450);
    return () => clearTimeout(t);
  }, [value]);
  const rows = [0, 1, 2, 3].map((r) => BUSINESSES.slice(r * 4).concat(BUSINESSES.slice(0, r * 4)));
  return (
    <div className="wallframe">
      <div className="wall" aria-hidden="true">
        {rows.map((items, r) => (
          <div className={`row r${r + 1}`} key={r}>
            {[...items, ...items].map((b, k) => <span className="chip" key={k}><Spark />בנה לי עמוד נחיתה ל{b}</span>)}
          </div>
        ))}
      </div>
      <div className="center">
        <h2>מה <em>Claude</em> יבנה לעסק שלכם?</h2>
        <div className="ask">
          <label htmlFor="biz-try">העסק שלי:</label>
          <input id="biz-try" type="text" maxLength={40} placeholder="למשל: סטודיו לפילאטיס" autoComplete="off" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="reply"><Spark /><span>{thinking ? "חושב…" : `בונה עמוד נחיתה ל${shown}…`}</span></div>
        <div className="mini" aria-hidden="true">
          <div className="mh">{shown}<small>עמוד נחיתה ראשון · נבנה במפגש</small></div>
          <div className="mr"><i /><i /><b>השאירו פרטים</b></div>
        </div>
        <Cta>לבנות אותו באמת · שריון מקום</Cta>
      </div>
    </div>
  );
}

function Sketch() {
  return (
    <div className="board" aria-hidden="true">
      <div className="layer sketch">
        <svg viewBox="0 0 520 400">
          <path className="sk" d="M20 22 C140 18 380 26 500 20 L502 380 C380 384 140 378 18 382 Z" />
          <path className="sk d2" d="M44 50 L150 52 M380 50 L476 52" />
          <path className="sk d3" d="M44 84 C180 80 330 88 476 84 L478 220 C330 224 180 216 42 222 Z" />
          <path className="sk d4" d="M70 180 L200 182 L198 206 L72 204 Z" />
          <path className="sk d5" d="M44 250 L176 250 L176 340 L44 340 Z M194 250 L326 250 L326 340 L194 340 Z M344 250 L476 250 L476 340 L344 340 Z" />
          <text className="hand" x="300" y="150">כותרת גדולה</text>
          <text className="hand" x="215" y="200">← כפתור!</text>
          <text className="hand" x="390" y="305">שירות</text>
          <text className="hand" x="240" y="305">המלצה</text>
          <text className="hand" x="95" y="305">טופס</text>
        </svg>
      </div>
      <div className="layer final">
        <div className="f-nav"><b>העסק שלכם</b><span><i /><i /></span></div>
        <div className="f-hero"><b>הכותרת שתציג את העסק שלכם</b><span>השאירו פרטים</span></div>
        <div className="f-row"><i /><i /><i /></div>
      </div>
      <div className="scan" />
    </div>
  );
}

function Countdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const diff = EVENT.start.getTime() - now;
  if (diff <= 0) return null;
  const units = [["ימים", Math.floor(diff / 864e5)], ["שעות", Math.floor(diff / 36e5) % 24], ["דקות", Math.floor(diff / 6e4) % 60], ["שניות", Math.floor(diff / 1e3) % 60]];
  return <div className="count" aria-label="הזמן שנותר עד המפגש">{units.map(([label, v]) => <div key={label}><b>{String(v).padStart(2, "0")}</b><span>{label}</span></div>)}</div>;
}

export default function WorkiesAI() {
  const [registered, setRegistered] = useState(false);
  const regRef = useRef(null);
  const heroRef = useRef(null);
  const regVisible = useInView(regRef, 0.1);
  const heroVisible = useInView(heroRef, 0.1);

  useEffect(() => {
    const prevTitle = document.title;
    const root = document.documentElement;
    const prevScroll = root.style.scrollBehavior;
    document.title = "Workies AI | בונים עמוד נחיתה עם Claude · 10.11";
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) root.style.scrollBehavior = "smooth";
    return () => { document.title = prevTitle; root.style.scrollBehavior = prevScroll; };
  }, []);

  return (
    <div className="wai" dir="rtl" lang="he">
      <header className="top band">
        <div className="wrap top-in">
          <img src={LOGO_URL} alt="Workies" width="84" height="28" />
          <a className="btn-sm" href="#register">שריון מקום</a>
        </div>
      </header>

      <section className="hero band" ref={heroRef}>
        <div className="wrap">
          <HeroPrompt />
          <div className="hero-copy">
            <p className="kick"><span className="live-dot" aria-hidden="true" />ההרשמה פתוחה · מספר המקומות מוגבל</p>
            <h1>משפט אחד ל-<em>Claude</em>.<br />עמוד נחיתה אחד לעסק.</h1>
            <p className="meta"><span>יום שלישי 10.11</span><span>13:30</span><span>Workies באר שבע</span><span>ללא עלות</span></p>
            <Cta />
          </div>
        </div>
      </section>

      <section className="register band" id="register" ref={regRef}>
        <div className="wrap reg-grid">
          <div className="reg-side">
            <p className="eyebrow"><Spark />מפגש 01 · 60 דקות</p>
            <h2>יוצאים עם רעיון.<br />נוחתים עם <em>עמוד נחיתה</em>.</h2>
            <Ticket />
          </div>
          <div className="reg-form">
            <CampaignValidityGate campaign="workies_ai"><WorkiesAIForm onDone={() => setRegistered(true)} /></CampaignValidityGate>
          </div>
        </div>
      </section>

      <section className="ring band">
        <div className="wrap ring-grid">
          <div className="ring-copy">
            <p className="eyebrow"><Spark />מה קורה בתוך השעה</p>
            <h2><em>60 דקות</em>.<br />רעיון נכנס. עמוד נחיתה יוצא.</h2>
            <ol className="steps">
              {STAGES.map(([name, text], i) => <li key={name}><b>0{i + 1}</b><span>{text}</span></li>)}
            </ol>
            <Cta />
          </div>
          <Ring />
        </div>
      </section>

      <section className="try band">
        <div className="wrap"><Wall /></div>
      </section>

      <section className="sketchsec band">
        <div className="wrap sketch-grid">
          <div className="sketch-copy">
            <p className="eyebrow"><Spark />התוצר</p>
            <h2>מגיעים עם <span className="scribble">סקיצה</span>.<br />יוצאים עם <em>אבטיפוס ראשוני</em>.</h2>
            <p className="sub">של עמוד נחיתה, אתר או אפליקציה לעסק, גם בלי ידע בתכנות.</p>
            <Cta />
          </div>
          <Sketch />
        </div>
      </section>

      <section className="faq band">
        <div className="wrap faq-grid">
          <div>
            <p className="eyebrow"><Spark />לפני שנרשמים</p>
            <h2>שאלות קצרות, תשובות קצרות</h2>
          </div>
          <div>{FAQ.map(([q, a]) => <details className="qa" key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
        </div>
      </section>

      <section className="final band">
        <div className="wrap">
          <p className="eyebrow dark"><Spark />עד המפגש</p>
          <Countdown />
          <h2>יום שלישי 10.11 · 13:30 · {EVENT.place}</h2>
          {registered ? <p className="final-done">נרשמתם. נתראה במפגש.</p> : <a className="cta dark" href="#register">שריון מקום למפגש <span className="arr" aria-hidden="true">←</span></a>}
        </div>
      </section>

      <footer className="foot band">
        <div className="wrap foot-in">
          <img src={LOGO_URL} alt="Workies" width="72" height="24" />
          <span>WORK • MEET • GROW</span>
        </div>
      </footer>

      {!registered && !regVisible && !heroVisible && (
        <a className="float-cta" href="#register"><span><b>שריון מקום</b> · יום שלישי 10.11 · 13:30</span><span aria-hidden="true">←</span></a>
      )}
    </div>
  );
}
