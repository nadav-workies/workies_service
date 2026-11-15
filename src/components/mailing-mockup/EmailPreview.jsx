// תצוגה מקדימה של מייל RTL, כפי שהנמען יראה אותו. משמשת בעורך הטמפלטים ובאשף הקמפיין.
const fill = (text, vars) => String(text || "").replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);

export const DEFAULT_BLOCKS = [
  { id: "b1", type: "heading", text: "{{first_name}}, שמרנו לך מקום" },
  { id: "b2", type: "text", text: "ב-1 בדצמבר נפתח את Workies AI Open Stage: שלושה בעלי עסקים מראים איך הם עובדים עם בינה מלאכותית בשגרה, ומה זה חסך להם בפועל." },
  { id: "b3", type: "image", text: "תמונת אירוע" },
  { id: "b4", type: "text", text: "18:30 · אולם Eventor, וורקיז באר שבע · מספר המקומות מוגבל." },
  { id: "b5", type: "button", text: "אני רוצה להגיע", url: "https://service.workies.co.il/workies-ai" },
  { id: "b6", type: "divider" },
  { id: "b7", type: "signature", text: "נדב בנג'ו\nמנכ\"ל וורקיז" },
];

export default function EmailPreview({ subject, preheader, blocks, vars = { first_name: "מיכל", company: "סטודיו אבן" }, compact }) {
  return <div className="rounded-xl border bg-zinc-100 p-3">
    <div className="rounded-lg bg-white shadow-sm overflow-hidden" dir="rtl">
      <div className="border-b px-4 py-2.5 text-xs text-zinc-500">
        <p><b className="text-zinc-800">Workies</b> &lt;news@news.workies.co.il&gt;</p>
        <p className="text-zinc-800 font-medium mt-0.5">{fill(subject, vars)}</p>
        {preheader && <p className="truncate">{fill(preheader, vars)}</p>}
      </div>
      <div className={compact ? "px-4 py-4 space-y-3" : "px-6 py-6 space-y-4"} style={{ fontFamily: "Arial, sans-serif" }}>
        <div className="flex justify-center"><span className="text-lg font-black tracking-wide" style={{ color: "#0f5c63" }}>WORKIES</span></div>
        {blocks.map(b => {
          if (b.type === "heading") return <h3 key={b.id} className="text-xl font-bold text-zinc-900">{fill(b.text, vars)}</h3>;
          if (b.type === "text") return <p key={b.id} className="text-sm leading-6 text-zinc-700">{fill(b.text, vars)}</p>;
          if (b.type === "image") return <div key={b.id} className="h-32 rounded-md bg-gradient-to-br from-teal-100 to-zinc-200 flex items-center justify-center text-xs text-zinc-500">{b.text}</div>;
          if (b.type === "button") return <div key={b.id} className="flex"><span className="rounded-md px-5 py-2.5 text-sm font-bold text-white" style={{ background: "#0f5c63" }}>{fill(b.text, vars)}</span></div>;
          if (b.type === "divider") return <hr key={b.id} className="border-zinc-200" />;
          if (b.type === "signature") return <p key={b.id} className="text-sm whitespace-pre-line text-zinc-800">{b.text}</p>;
          return null;
        })}
      </div>
      <div className="bg-zinc-50 border-t px-6 py-4 text-[11px] leading-5 text-zinc-500 text-center">
        <p>דיוור פרסומי מאת וורקיז · אליהו נאווי 24, באר שבע</p>
        <p>קיבלת את המייל כי נרשמת באחד מעמודי וורקיז. <span className="underline">להסרה מרשימת התפוצה</span></p>
      </div>
    </div>
  </div>;
}
