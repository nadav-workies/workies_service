import { useState } from "react";
import { ChevronDown, Users, UtensilsCrossed } from "lucide-react";
import QtyStepper from "@/components/catering/QtyStepper";
import { CATEGORY_LABELS, DINER_GROUPS, lineKey, money } from "@/lib/catering";

// One supplier menu on the customer page: a per-diner package or a priced item list.
export default function MenuCard({ menu, cart, setQty, guests }) {
  const [open, setOpen] = useState(false);

  if (menu.pricing_model === "per_person") {
    const key = lineKey(menu.id);
    const qty = cart[key]?.quantity || 0;
    const groups = menu.diner_menu ? DINER_GROUPS.filter(([k]) => menu.diner_menu[k]?.options?.length) : [];
    const hasDetails = menu.items.length > 0 || groups.length > 0;
    return (
      <article className={`rounded-2xl border bg-card p-4 transition-shadow ${qty ? "border-primary shadow-md" : "hover:shadow-sm"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold leading-snug">{menu.name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="font-semibold text-foreground">{money(menu.price_per_diner)}</span> לסועד
              {menu.min_diners ? ` · מינימום ${menu.min_diners} סועדים` : ""}
            </p>
            {menu.description && <p className="text-sm text-muted-foreground mt-1">{menu.description}</p>}
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">
            <Users className="w-3 h-3" />{menu.offering_type === "PERSONAL_DISHES" ? "מנה אישית" : "חבילה לסועד"}
          </span>
        </div>

        {hasDetails && (
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
            className="mt-2 inline-flex items-center gap-1 text-sm text-primary font-medium">
            {open ? "הסתרת הפירוט" : "מה כלול?"}<ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        )}
        {open && (
          <div className="mt-2 rounded-xl bg-muted/60 p-3 text-sm space-y-2">
            {menu.items.length > 0 && (
              <ul className="space-y-1">{menu.items.map((i) => <li key={i.id} className="flex gap-2"><span className="text-primary">•</span>{i.name}</li>)}</ul>
            )}
            {groups.map(([k, label]) => (
              <div key={k}>
                <p className="font-semibold">{label}{menu.diner_menu[k].max > 1 ? ` (עד ${menu.diner_menu[k].max} לבחירה)` : " (אחד לבחירה)"}</p>
                <p className="text-muted-foreground">{menu.diner_menu[k].options.join(" · ")}</p>
              </div>
            ))}
            {menu.offering_type === "PERSONAL_DISHES" && <p className="text-xs text-muted-foreground">כל סועד בוחר את המנה שלו. את הבחירות האישיות נתאם איתכם לפני האירוע.</p>}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <QtyStepper value={qty} onChange={(n) => setQty(menu, null, n)} min={menu.min_diners || 0} label={`מספר סועדים: ${menu.name}`} addLabel="בחירת התפריט" />
            {qty > 0 && <span className="text-xs text-muted-foreground">סועדים</span>}
          </div>
          {guests > 0 && qty !== guests && (
            <button type="button" onClick={() => setQty(menu, null, guests)} className="text-xs text-primary underline underline-offset-2">
              לכל {guests} המשתתפים
            </button>
          )}
          {qty > 0 && <span className="text-sm font-bold">{money(qty * (menu.price_per_diner || 0))}</span>}
        </div>
      </article>
    );
  }

  // Itemized menu: list of priced items
  const byCat = {};
  for (const i of menu.items) (byCat[i.category_label || CATEGORY_LABELS[i.category] || ""] ||= []).push(i);
  const cats = Object.keys(byCat);
  return (
    <article className="rounded-2xl border bg-card p-4">
      <h3 className="font-bold flex items-center gap-2"><UtensilsCrossed className="w-4 h-4 text-primary" />{menu.name}</h3>
      {menu.description && <p className="text-sm text-muted-foreground mt-1">{menu.description}</p>}
      <div className="mt-2 divide-y">
        {cats.map((c) => (
          <div key={c} className="py-1">
            {cats.length > 1 && c && <p className="text-xs font-semibold text-muted-foreground pt-2">{c}</p>}
            {byCat[c].map((i) => {
              const qty = cart[lineKey(menu.id, i.id)]?.quantity || 0;
              return (
                <div key={i.id} className={`flex items-center justify-between gap-3 py-2.5 ${qty ? "font-medium" : ""}`}>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug">{i.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {i.price > 0 ? money(i.price) : "המחיר יתואם"}{i.min_quantity ? ` · מינימום ${i.min_quantity}` : ""}
                    </p>
                  </div>
                  <QtyStepper value={qty} onChange={(n) => setQty(menu, i, n)} min={i.min_quantity || 0} max={i.max_quantity || undefined} label={i.name} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </article>
  );
}
