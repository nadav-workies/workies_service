import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Megaphone } from "lucide-react";
import { INTERNAL_ROLES, LEAD_INTERNAL_ROLES } from "@/lib/internalRoles";

const ALERTS = [["can_receive_service_alerts", "שירות"], ["can_receive_collections_alerts", "גבייה"], ["can_receive_operations_alerts", "תפעול"]];

export default function PermissionUserRow({ user: u, isLastAdmin, canEditInternal, onSaved }) {
  const [role, setRole] = useState(u.role);
  const [internal, setInternal] = useState(u.internal_role || "");
  const [alerts, setAlerts] = useState(Object.fromEntries(ALERTS.map(([k]) => [k, !!u[k]])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const roleChanged = role !== u.role;
  const internalChanged = internal !== (u.internal_role || "");
  const alertsChanged = ALERTS.some(([k]) => alerts[k] !== !!u[k]);
  const dirty = roleChanged || internalChanged || alertsChanged;
  const leadsAccess = ["admin", "manager"].includes(role) || LEAD_INTERNAL_ROLES.includes(internal);

  function reset() { setRole(u.role); setInternal(u.internal_role || ""); setAlerts(Object.fromEntries(ALERTS.map(([k]) => [k, !!u[k]]))); setError(""); }
  async function save() {
    setSaving(true); setError("");
    const res = await base44.functions.invoke("updateUserRole", {
      target_user_id: u.id,
      ...(roleChanged ? { new_role: role } : {}),
      ...(internalChanged ? { internal_role: internal } : {}),
      ...(alertsChanged ? { alert_flags: alerts } : {}),
    }).catch(e => ({ data: { error: e.response?.data?.error || e.message } }));
    setSaving(false);
    if (!res.data?.ok) return setError(res.data?.error || "השמירה נכשלה");
    onSaved();
  }

  return <article className={`rounded-xl border bg-card p-4 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))_auto] lg:items-center ${dirty ? "border-primary ring-1 ring-primary/30" : ""}`}>
    <div className="flex items-center gap-3 min-w-0">
      <span className="w-10 h-10 shrink-0 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">{(u.full_name || u.email || "?").trim()[0]}</span>
      <div className="min-w-0">
        <p className="font-semibold truncate">{u.full_name || "—"}</p>
        <p className="text-xs text-muted-foreground truncate" dir="ltr">{u.email}</p>
        {leadsAccess && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-[11px]"><Megaphone className="w-3 h-3" />גישה ללידים</span>}
      </div>
    </div>
    <label className="space-y-1 text-xs font-medium">הרשאת מערכת
      <Select value={role} onValueChange={setRole} disabled={isLastAdmin}><SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="admin">מנהל מערכת</SelectItem><SelectItem value="manager">מנהל</SelectItem><SelectItem value="user">משתמש</SelectItem></SelectContent></Select>
      {isLastAdmin && <span className="block text-[11px] text-amber-600">אדמין יחיד, לא ניתן לשנות</span>}
    </label>
    <label className="space-y-1 text-xs font-medium">תפקיד פנימי
      <Select value={internal || "none"} onValueChange={v => setInternal(v === "none" ? "" : v)} disabled={!canEditInternal}><SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="none">ללא</SelectItem>{INTERNAL_ROLES.map(r => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}</SelectContent></Select>
    </label>
    <fieldset className="space-y-1 text-xs font-medium" disabled={!canEditInternal}>
      <legend>קבלת התראות</legend>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {ALERTS.map(([k, label]) => <button key={k} type="button" aria-pressed={alerts[k]} onClick={() => setAlerts(a => ({ ...a, [k]: !a[k] }))}
          className={`rounded-full border px-3 min-h-8 ${alerts[k] ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>{label}</button>)}
      </div>
    </fieldset>
    <div className="flex gap-2 lg:flex-col lg:w-28">
      {dirty ? <>
        <Button size="sm" onClick={save} disabled={saving} className="gap-1 flex-1">{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}שמירה</Button>
        <Button size="sm" variant="outline" onClick={reset} disabled={saving} className="flex-1">ביטול</Button>
      </> : <span className="text-xs text-muted-foreground">ללא שינויים</span>}
    </div>
    {error && <p role="alert" className="text-sm text-destructive lg:col-span-5">{error}</p>}
  </article>;
}