import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Pencil, Trash2, Cake, Loader2 } from "lucide-react";

const EMPTY = { name: "", birthdate: "", email: "", phone: "", role: "" };

export default function TenantEmployeesSection({ tenant }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null | {id?, ...form}
  const [saving, setSaving] = useState(false);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["customer-employees", tenant.id],
    queryFn: () => base44.entities.CustomerEmployee.filter({ tenant_id: tenant.id }, "name", 200),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["customer-employees", tenant.id] });
    qc.invalidateQueries({ queryKey: ["customer-employees-all"] });
  };

  const save = async () => {
    if (!editing?.name?.trim()) return;
    setSaving(true);
    const payload = {
      tenant_id: tenant.id, customer_name: tenant.customer_name || "", room_number: String(tenant.room_number || ""),
      name: editing.name.trim(), birthdate: editing.birthdate || null,
      email: editing.email.trim().toLowerCase(), phone: editing.phone.trim(), role: editing.role.trim(),
    };
    if (editing.id) await base44.entities.CustomerEmployee.update(editing.id, payload);
    else await base44.entities.CustomerEmployee.create(payload);
    setSaving(false); setEditing(null); refresh();
  };

  const remove = async (e) => {
    if (!window.confirm(`למחוק את ${e.name}?`)) return;
    await base44.entities.CustomerEmployee.delete(e.id);
    refresh();
  };

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold flex items-center gap-1.5"><Users className="w-4 h-4" /> עובדים ({employees.length})</p>
        {!editing && <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setEditing({ ...EMPTY })}><Plus className="w-3.5 h-3.5" /> הוסף עובד</Button>}
      </div>

      {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" /> : employees.length === 0 && !editing ? (
        <p className="text-xs text-muted-foreground">אין עובדים רשומים לכרטיס זה.</p>
      ) : (
        <div className="space-y-1">
          {employees.map(e => (
            <div key={e.id} className="flex items-center justify-between gap-2 text-xs bg-muted/40 rounded-md px-2 py-1.5">
              <div className="min-w-0">
                <p className="font-medium truncate">{e.name}{e.role ? <span className="text-muted-foreground"> · {e.role}</span> : null}</p>
                <p className="text-muted-foreground truncate" dir="ltr">
                  {[e.birthdate && `🎂 ${new Date(e.birthdate + "T00:00:00").toLocaleDateString("he-IL")}`, e.email, e.phone].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setEditing({ ...EMPTY, ...e })} className="p-1 rounded hover:bg-muted" title="ערוך"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(e)} className="p-1 rounded hover:bg-muted text-red-600" title="מחק"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="space-y-2 border-t pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label className="text-xs">שם העובד *</Label><Input className="h-8" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs flex items-center gap-1"><Cake className="w-3 h-3" /> תאריך לידה</Label><Input className="h-8" type="date" value={editing.birthdate || ""} onChange={e => setEditing({ ...editing, birthdate: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">מייל</Label><Input className="h-8" type="email" dir="ltr" value={editing.email || ""} onChange={e => setEditing({ ...editing, email: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">טלפון</Label><Input className="h-8" dir="ltr" value={editing.phone || ""} onChange={e => setEditing({ ...editing, phone: e.target.value })} /></div>
            <div className="space-y-1 col-span-2"><Label className="text-xs">תפקיד</Label><Input className="h-8" value={editing.role || ""} onChange={e => setEditing({ ...editing, role: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(null)} disabled={saving}>ביטול</Button>
            <Button size="sm" className="h-7 text-xs gap-1" onClick={save} disabled={saving || !editing.name?.trim()}>
              {saving && <Loader2 className="w-3 h-3 animate-spin" />} {editing.id ? "עדכן עובד" : "שמור עובד"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}