import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2, Check } from "lucide-react";

const FIELDS = [
  { key: "contact_name", label: "איש קשר" },
  { key: "contact_role", label: "תפקיד איש קשר" },
  { key: "phone", label: "טלפון" },
  { key: "email", label: 'אימייל' },
  { key: "industry", label: "תחום עיסוק" },
  { key: "room_label", label: "שם חדר" },
  { key: "room_area", label: "אזור" },
  { key: "address", label: "כתובת" },
  { key: "birthdate", label: "תאריך לידה", type: "date" },
  { key: "desk_count", label: "מספר עמדות", type: "number" },
];

export default function CustomerEditForm({ tenant, onSave, onAutoComplete }) {
  const [form, setForm] = useState({ ...tenant });
  const [saving, setSaving] = useState(false);
  const [autoCompleting, setAutoCompleting] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const handleChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {};
      FIELDS.forEach(({ key, type }) => {
        let val = form[key];
        if (type === "number") val = val ? Number(val) : null;
        if (val !== tenant[key]) updates[key] = val;
      });
      if (Object.keys(updates).length > 0) {
        await base44.entities.RoomTenant.update(tenant.id, updates);
      }
      onSave?.(form);
    } finally {
      setSaving(false);
    }
  };

  const handleAutoComplete = async () => {
    setAutoCompleting(true);
    try {
      const res = await base44.functions.invoke("autoCompleteCustomerCard", { customer_id: tenant.id });
      const data = res.data || res;
      if (data.error) throw new Error(data.error);
      setSuggestions(data.suggestions);
      // Auto-fill empty fields
      setForm((p) => ({
        ...p,
        industry: p.industry || data.suggestions.industry || p.industry,
        contact_role: p.contact_role || data.suggestions.contact_role || p.contact_role,
      }));
      onAutoComplete?.(data.suggestions);
    } catch (e) {
      console.error(e);
    } finally {
      setAutoCompleting(false);
    }
  };

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">עריכת כרטיס לקוח</p>
        <Button size="sm" variant="outline" onClick={handleAutoComplete} disabled={autoCompleting} className="gap-1.5">
          {autoCompleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          השלם אוטומטית
        </Button>
      </div>

      {suggestions && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 text-xs space-y-1">
          <p className="font-semibold flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> השלמה אוטומטית</p>
          {suggestions.summary && <p className="text-muted-foreground">{suggestions.summary}</p>}
          {suggestions.suggested_tags?.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {suggestions.suggested_tags.map((t, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">#{t}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {FIELDS.map(({ key, label, type }) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs">{label}</Label>
            <Input
              type={type || "text"}
              value={form[key] || ""}
              onChange={(e) => handleChange(key, e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        שמור שינויים
      </Button>
    </div>
  );
}