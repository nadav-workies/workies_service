const ITEMS = [
  { title: "מנהל מערכת", text: "גישה מלאה, כולל הגדרות, הרשאות ומחיקות." },
  { title: "מנהל", text: "קריאות, לקוחות, עמודי נחיתה ולידים." },
  { title: "מנהל מכירות · תפעול · גבייה", text: "תפקיד פנימי שנותן גישה לעמודי הנחיתה וניהול לידים." },
  { title: "משתמש", text: "פתיחת קריאות ומעקב אישי בלבד." },
];

export default function RoleGuide() {
  return <section aria-label="מה כל הרשאה מאפשרת" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
    {ITEMS.map(i => <div key={i.title} className="rounded-xl border bg-card p-3">
      <p className="font-bold text-sm">{i.title}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{i.text}</p>
    </div>)}
  </section>;
}