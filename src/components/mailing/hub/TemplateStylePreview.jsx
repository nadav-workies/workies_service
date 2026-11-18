import { MAIL_LOGO } from "@/lib/mailTemplates";

// In-app picture of a marketing email style. Colors mirror the email file of the same style.
export default function TemplateStylePreview({ s, firstName }) {
  const { c, sample: v } = s;
  const night = s.key === "event";
  const hero = night ? { background: c.band, color: c.bandInk } : { background: c.surface, color: c.ink };
  const image = s.image && <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${s.image})`, backgroundColor: c.band }} role="img" aria-label={s.name} />;
  return <div dir="rtl" className="overflow-hidden rounded-lg text-right" style={{ background: c.surface, color: c.ink, fontFamily: "'Rubik', Arial, sans-serif" }}>
    <div className="flex items-center gap-2 px-5 pt-4 pb-1" style={hero}>
      <img src={MAIL_LOGO} alt="Workies" className="h-7 w-7 object-contain" />
      <span className="text-[11px] font-bold tracking-widest" style={{ color: night ? c.bandMuted : c.accent }}>WORKIES</span>
    </div>
    {!night && image}
    <div className="px-5 pt-5 pb-4" style={hero}>
      <h4 className="text-2xl font-extrabold leading-tight">{v.headline}{night && <span style={{ color: c.highlight }}>.</span>}</h4>
      {s.key === "podcast" && <span className="mt-3 block h-0.5 w-12" style={{ background: c.accent }} />}
      <p className="mt-2 text-sm" style={{ color: night ? c.bandMuted : c.muted }}>{v.subheadline}</p>
    </div>
    {night && image}
    {v.event_date && <div className="grid grid-cols-2 gap-2 px-5 pt-4 text-xs font-bold">
      <div className="rounded-xl p-3" style={{ background: c.highlight }}>מתי<p className="mt-1 text-sm">{v.event_date}<br />{v.event_time}</p></div>
      <div className="rounded-xl p-3" style={{ background: c.soft }}><span style={{ color: c.accent }}>איפה</span><p className="mt-1 text-sm">{v.event_location}</p></div>
    </div>}
    <div className="px-5 pt-4 pb-6 text-sm leading-6">
      <p className="font-bold" style={{ color: s.key === "podcast" ? c.accent : c.ink }}>שלום {firstName},</p>
      <p style={{ color: night ? c.muted : c.ink }}>{v.body}</p>
      <span className="mt-4 inline-block px-6 py-2.5 text-sm font-extrabold" style={{ background: c.accent, color: c.accentInk, borderRadius: c.radius }}>{v.cta_label}</span>
    </div>
    <div className="px-5 py-4" style={{ background: c.band, color: c.bandInk }}>
      <p className="text-sm font-extrabold">Workies באר שבע</p>
      <p className="text-xs" style={{ color: c.bandMuted }}>אליהו נאווי 24, באר שבע</p>
    </div>
    <p className="px-5 py-3 text-center text-[11px]" style={{ background: c.page, color: c.muted }}>דיוור פרסומי מאת Workies. <span className="underline">להסרה מרשימת התפוצה</span></p>
  </div>;
}