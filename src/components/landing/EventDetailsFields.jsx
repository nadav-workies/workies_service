export default function EventDetailsFields({ form, set, Input, Textarea }) {
  const field = (key, label, props = {}) => <label className="block space-y-1 text-sm"><span>{label}</span>
    <Input value={form[key]} onChange={e => set(key, e.target.value)} {...props} /></label>;
  return <div className="space-y-3 border-t pt-3">
    {field("event_name", "שם האירוע במיילים", { maxLength: 150 })}
    <div className="grid sm:grid-cols-2 gap-3">
      {field("event_date", "תאריך האירוע", { type: "date" })}
      {field("event_time", "שעות", { maxLength: 50, placeholder: "09:00–12:00" })}
    </div>
    {field("event_location", "מיקום", { maxLength: 200 })}
    <label className="block space-y-1 text-sm"><span>התוכנית (נשלחת בתזכורת 3 ימים לפני, שורה לכל פריט)</span>
      <Textarea rows={5} maxLength={3000} value={form.event_program} onChange={e => set("event_program", e.target.value)} placeholder="09:00–10:00 · ארוחת בוקר ונטוורקינג" /></label>
    {!form.event_date && <p className="text-xs text-destructive">בלי תאריך אירוע לא יישלחו תזכורות.</p>}
  </div>;
}