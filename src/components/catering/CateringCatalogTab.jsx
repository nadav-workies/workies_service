import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ChevronDown, Loader2, EyeOff, RefreshCw } from "lucide-react";
import { money } from "@/lib/catering";

// Suppliers and menus as imported from AIO. The team controls what customers see and the texts shown to them.
export default function CateringCatalogTab({ canEdit }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [openId, setOpenId] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["catering-catalog"],
    queryFn: async () => {
      const [suppliers, menus, items] = await Promise.all([
        base44.entities.CateringSupplier.list("sort_order", 200),
        base44.entities.CateringMenu.list("sort_order", 1000),
        base44.entities.CateringMenuItem.filter({ is_active: true }, "sort_order", 5000),
      ]);
      return { suppliers, menus, items };
    },
  });

  const save = async (entity, id, patch) => {
    await base44.entities[entity].update(id, patch);
    qc.invalidateQueries({ queryKey: ["catering-catalog"] });
    toast({ title: "נשמר" });
  };

  if (isLoading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  const { suppliers = [], menus = [], items = [] } = data || {};
  const lastSync = suppliers.map((s) => s.synced_at).filter(Boolean).sort().pop();

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card p-3 text-sm flex items-start gap-2">
        <RefreshCw className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p>הספקים, התפריטים והמחירים נמשכים מ-AIO{lastSync ? ` · עדכון אחרון ${new Date(lastSync).toLocaleDateString("he-IL")}` : ""}. שינוי מחירים ומנות נעשה ב-AIO.</p>
          <p className="text-muted-foreground">כאן קובעים מה הלקוחות רואים, את סוג הכשרות ואת התיאור שמוצג להם.</p>
        </div>
      </div>

      {suppliers.map((s) => {
        const sMenus = menus.filter((m) => m.supplier_id === s.id);
        const open = openId === s.id;
        return (
          <div key={s.id} className={`rounded-xl border bg-card ${s.is_active ? "" : "opacity-70"}`}>
            <div className="p-3 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setOpenId(open ? null : s.id)} className="flex items-center gap-2 font-semibold min-w-[140px]" aria-expanded={open}>
                <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />{s.name}
                <span className="text-xs font-normal text-muted-foreground">{sMenus.filter((m) => m.is_active).length}/{sMenus.length} תפריטים</span>
              </button>
              <Input defaultValue={s.kashrut_label || ""} placeholder={s.is_kosher ? "סוג כשרות, לדוגמה: כשר רבנות באר שבע" : "לא כשר"} disabled={!canEdit}
                onBlur={(e) => e.target.value !== (s.kashrut_label || "") && save("CateringSupplier", s.id, { kashrut_label: e.target.value })} className="h-8 text-sm flex-1 min-w-[200px]" aria-label={`כשרות ${s.name}`} />
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={!!s.is_active} disabled={!canEdit} onCheckedChange={(v) => save("CateringSupplier", s.id, { is_active: v })} />מוצג ללקוחות
              </label>
            </div>
            {open && (
              <div className="border-t p-3 space-y-3">
                <Input defaultValue={s.description || ""} placeholder="תיאור קצר שמוצג ללקוח (לא חובה)" disabled={!canEdit}
                  onBlur={(e) => e.target.value !== (s.description || "") && save("CateringSupplier", s.id, { description: e.target.value })} className="h-8 text-sm" />
                {sMenus.map((m) => {
                  const mItems = items.filter((i) => i.menu_id === m.id);
                  return (
                    <div key={m.id} className={`rounded-lg border p-3 ${m.is_active ? "" : "bg-muted/40"}`}>
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <div>
                          <p className="font-medium text-sm flex items-center gap-1.5">{!m.is_active && <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}{m.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.pricing_model === "per_person" ? `${money(m.price_per_diner)} לסועד` : `${mItems.length} פריטים לפי יחידה`}
                            {m.offering_type === "PERSONAL_DISHES" ? " · מנות אישיות" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {m.pricing_model === "per_person" && (
                            <label className="flex items-center gap-1 text-xs">מינ׳ סועדים
                              <Input type="number" defaultValue={m.min_diners ?? ""} disabled={!canEdit} className="h-7 w-16 text-xs"
                                onBlur={(e) => String(m.min_diners ?? "") !== e.target.value && save("CateringMenu", m.id, { min_diners: e.target.value ? Number(e.target.value) : null })} />
                            </label>
                          )}
                          <label className="flex items-center gap-2 text-xs"><Switch checked={!!m.is_active} disabled={!canEdit} onCheckedChange={(v) => save("CateringMenu", m.id, { is_active: v })} />מוצג</label>
                        </div>
                      </div>
                      {mItems.length > 0 && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-primary">פריטים ({mItems.length})</summary>
                          <ul className="mt-1 space-y-0.5">
                            {mItems.map((i) => <li key={i.id} className="flex justify-between gap-2"><span>{i.name}</span>{m.pricing_model === "itemized" && <span className="shrink-0">{i.price > 0 ? money(i.price) : "ללא מחיר"}</span>}</li>)}
                          </ul>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {!canEdit && <p className="text-xs text-muted-foreground">עריכה זמינה למנהלים ולמנהל המכירות.</p>}
      {suppliers.length === 0 && <div className="text-center py-10 text-muted-foreground"><Button variant="outline" disabled>אין עדיין ספקים</Button></div>}
    </div>
  );
}
