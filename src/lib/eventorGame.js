// "Where did the time go?" lecture game: questions and shared helpers.
export const GAME_KEY = "time";
export const LETTERS = ["א", "ב", "ג", "ד"];
export const SUMMARY_QUESTIONS = [0, 2, 3, 5];

export const QUESTIONS = [
  { t: "נניח שה-AI חסך לך עכשיו 45 דקות. מה הכי היית רוצה לעשות בזמן שהתפנה?", o: ["לקדם פרויקט ארגוני שתמיד נדחה", "להקדיש יותר זמן לעובדים", "לעצור, לחשוב ולתכנן קדימה", "לנשום קצת בין המשימות"] },
  { t: "באיזו משימה היית הכי רוצה שה-AI יחסוך לך זמן?", o: ["הכנת דוחות וניתוח נתונים", "כתיבת הודעות ותקשורים לעובדים", "סיכומי פגישות ומעקב משימות", "תיאומים ותהליכי גיוס"] },
  { t: "כשאת מסיימת משימה הרבה יותר מהר מהצפוי, מה קורה בדרך כלל?", o: ["מגיעה בקשה חדשה ממנהל", "אני משלימה משימות שהצטברו", "אני מוסיפה עוד דברים לרשימת המשימות", "אני מצליחה לשמור את הזמן למה שתכננתי"] },
  { t: "כשהפך קל יותר להפיק דוחות, סיכומים ותכנים, מה קרה לציפיות ממך?", o: ["מבקשים יותר תוצרים", "מבקשים יותר גרסאות ודיוקים", "מצפים לתשובות מהירות יותר", "לא מרגישה שינוי משמעותי"] },
  { t: "איזה מהמשפטים הבאים הכי מזכיר לך משהו שקרה בעבודה?", o: ["״אם כבר הכנת דוח, תוסיפי עוד פילוח״", "״אם סיכמת את הישיבה, תוכלי גם לעקוב אחרי כולם?״", "״אם התקשור מוכן, נכין עוד כמה גרסאות״", "״דווקא הצלחתי לפנות זמן למשהו חשוב״"] },
  { t: "בסופו של יום שבו הצלחת לבצע משימות מהר יותר, מה בדרך כלל הרווחת?", o: ["יותר משימות שבוצעו, אבל לא פחות עומס", "יותר זמן לטפל במשימות שהצטברו", "זמן אמיתי לדברים החשובים שתכננתי", "קשה לי להרגיש לאן נעלם הזמן שנחסך"] },
];

// Whole-number percentages that always add up to 100 (largest remainder).
export function percentages(counts) {
  const total = counts.reduce((a, b) => a + b, 0);
  const raw = counts.map((n) => (total ? (n * 100) / total : 0));
  const pct = raw.map(Math.floor);
  let left = total ? 100 - pct.reduce((a, b) => a + b, 0) : 0;
  raw.map((v, i) => ({ i, f: v - Math.floor(v) })).sort((a, b) => b.f - a.f).forEach((x) => { if (left > 0) { pct[x.i]++; left--; } });
  return { total, pct };
}

export function finalMessage(lastCounts) {
  const r = percentages(lastCounts);
  if (r.total < 3) return "התשובות לא מאפשרות תמונה ברורה, אבל השאלה הניהולית נשארת: למי אנחנו נותנות את הזמן שהתפנה?";
  if (r.pct[2] > 50) return "כאן אנחנו רואות שאפשר לשמור על הזמן שנחסך. מה מאפשר לכן לעשות זאת?";
  return "גם כשאנחנו עובדות מהר יותר, לא תמיד הזמן שנחסך מגיע למה שהכי חשוב לנו. איך מנהלים אחרת את סדרי העדיפויות?";
}

const STORE = "eventor-game-player";
export const loadPlayer = () => { try { return JSON.parse(localStorage.getItem(STORE)) || null; } catch { return null; } };
export const savePlayer = (p) => { localStorage.setItem(STORE, JSON.stringify(p)); return p; };
export const gameError = (e) => e?.response?.data?.error || "משהו השתבש, נסו שוב";