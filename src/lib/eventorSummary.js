// Weighted summary slide: maps every answer to the time/value traffic-light model.
export const CATS = {
  focus: { label: "מיקוד מלא", color: "#B83A2E" },
  leisure: { label: "פנאי והתפתחות", color: "#1E7F52" },
  saved: { label: "נשמר לערך", color: "#B83A2E" },
  routine: { label: "שגרה שוטפת", color: "#6E6A80" },
  flex: { label: "זמינות גמישה", color: "#E8913A" },
  vanished: { label: "נעלם בלי שהרגשנו", color: "#4A3D73" },
};

const WANTED = ["focus", "leisure"];
const ACTUAL = ["saved", "routine", "flex", "vanished"];
const WANTED_MAP = ["focus", "focus", "focus", "leisure"]; // question 1
// Questions 3-6 (index 2-5). null = not counted in that question's denominator.
const ACTUAL_MAP = {
  2: ["flex", "routine", "routine", "saved"],
  3: ["routine", "routine", "flex", null],
  4: ["routine", "flex", "routine", "saved"],
  5: ["routine", "routine", "saved", "vanished"],
};

// Largest-remainder rounding of shares (any positive scale) to whole numbers summing to 100.
function round100(values) {
  const sum = values.reduce((a, b) => a + b, 0);
  if (!sum) return null;
  const raw = values.map((v) => (v * 100) / sum);
  const pct = raw.map(Math.floor);
  let left = 100 - pct.reduce((a, b) => a + b, 0);
  raw.map((v, i) => ({ i, f: v - Math.floor(v) })).sort((a, b) => b.f - a.f).forEach((x) => { if (left > 0) { pct[x.i]++; left--; } });
  return pct;
}

// Shares of each category within one question, over its valid votes only.
function shares(row, map, keys) {
  const byCat = Object.fromEntries(keys.map((k) => [k, 0]));
  row.forEach((n, i) => { if (map[i]) byCat[map[i]] += n; });
  const total = keys.reduce((a, k) => a + byCat[k], 0);
  return { total, byCat };
}

const toSegments = (keys, pct) => keys.map((k, i) => ({ key: k, ...CATS[k], pct: pct[i] }));

export function buildSummary(counts) {
  const w = shares(counts[0], WANTED_MAP, WANTED);
  const wPct = w.total ? round100(WANTED.map((k) => w.byCat[k])) : null;

  // Equal weight per question: average each question's percentages, skipping empty questions.
  const avg = Object.fromEntries(ACTUAL.map((k) => [k, 0]));
  let used = 0;
  Object.entries(ACTUAL_MAP).forEach(([qi, map]) => {
    const s = shares(counts[qi], map, ACTUAL);
    if (!s.total) return;
    used++;
    ACTUAL.forEach((k) => { avg[k] += (s.byCat[k] * 100) / s.total; });
  });
  const aPct = used ? round100(ACTUAL.map((k) => avg[k])) : null;
  const q6Valid = shares(counts[5], ACTUAL_MAP[5], ACTUAL).total;

  const saved = aPct ? aPct[0] : 0;
  return {
    wanted: wPct && toSegments(WANTED, wPct),
    actual: aPct && toSegments(ACTUAL, aPct),
    saved,
    refilled: aPct ? 100 - saved : 0,
    message: conclusion(aPct, q6Valid),
  };
}

function conclusion(aPct, q6Valid) {
  if (!aPct || q6Valid < 5) return "התשובות לא מאפשרות תמונה ברורה, אבל השאלה הניהולית נשארת: למי אנחנו נותנות את הזמן שהתפנה?";
  const [saved, routine, flex, vanished] = aPct;
  if (saved >= 50) return "החדר מצליח לשמור את רוב הזמן שנחסך. מה מאפשר לכן לעשות את זה?";
  const top = Math.max(routine, flex, vanished);
  if (routine === top) return "רוב הזמן שנחסך נבלע בשוטף. בלי החלטה מראש, כל זמן שמתפנה מתמלא.";
  if (flex === top) return "רוב הזמן שנחסך הלך לזמינות ולתגובה לאחרים. הזמן שהתפנה צריך בעלים.";
  return "רוב הזמן שנחסך פשוט נעלם. זה בדיוק פרדוקס הפריון.";
}