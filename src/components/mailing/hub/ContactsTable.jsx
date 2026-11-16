import { CONSENT, SOURCES } from "@/lib/mailing";
import { Pill, Table } from "@/components/mailing-mockup/shared";

export default function ContactsTable({ rows, selected, setSelected, onOpen }) {
  const toggle = id => setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  const allOn = rows.length > 0 && rows.every(r => selected.includes(r.id));
  return <Table head={[
    <input key="all" type="checkbox" aria-label="בחירת הכל" checked={allOn} onChange={() => setSelected(allOn ? [] : rows.map(r => r.id))} />,
    "שם", "מייל", "מקורות", "תגיות", "הסכמה", "עודכן"]}>
    {rows.map(c => <tr key={c.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => onOpen(c)}>
      <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}><input type="checkbox" aria-label={`בחירת ${c.name || c.email}`} checked={selected.includes(c.id)} onChange={() => toggle(c.id)} /></td>
      <td className="px-3 py-2.5 font-medium whitespace-nowrap">{c.name || "—"}<div className="text-xs text-muted-foreground font-normal">{c.company}</div></td>
      <td className="px-3 py-2.5 text-muted-foreground text-right" dir="ltr">{c.email}</td>
      <td className="px-3 py-2.5"><div className="flex flex-wrap gap-1">{(c.sources || []).map(s => <Pill key={s} tone="blue">{SOURCES[s] || s}</Pill>)}</div></td>
      <td className="px-3 py-2.5"><div className="flex flex-wrap gap-1">{(c.tags || []).map(t => <Pill key={t}>{t}</Pill>)}</div></td>
      <td className="px-3 py-2.5"><Pill tone={CONSENT[c.consent]?.tone}>{CONSENT[c.consent]?.label || c.consent}</Pill></td>
      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{new Date(c.updated_date).toLocaleDateString("he-IL")}</td>
    </tr>)}
    {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">אין אנשי קשר שמתאימים לסינון. אפשר לסנכרן מהלידים או לייבא קובץ.</td></tr>}
  </Table>;
}