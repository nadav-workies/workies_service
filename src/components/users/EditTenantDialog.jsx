import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil, Cake } from "lucide-react";

export default function EditTenantDialog({ tenant, onClose, onSaved }) {
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tenant) {
      setContactName(tenant.contact_name || tenant.customer_name || "");
      setEmail(tenant.email || "");
      setPhone(tenant.phone || "");
      setRole(tenant.contact_role || "");
      setBirthdate(tenant.birthdate || "");
      setIsPrimary(tenant.is_primary_contact || false);
    }
  }, [tenant]);

  const handleSave = async () => {
    if (!contactName || !email) {
      setError("שם ומייל הם שדות חובה");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isPrimary && !tenant.is_primary_contact) {
        await base44.entities.RoomTenant.updateMany(
          { room_number: tenant.room_number, is_primary_contact: true },
          { $set: { is_primary_contact: false } }
        );
      }

      const currentUser = await base44.auth.me().catch(() => null);
      const userLabel = currentUser?.email || currentUser?.full_name || "משתמש";

      const updates = {
        contact_name: contactName,
        customer_name: contactName,
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        contact_role: role.trim(),
        is_primary_contact: isPrimary,
      };

      const historyEntries = [];
      if (birthdate !== (tenant.birthdate || "")) {
        updates.birthdate = birthdate || null;
        historyEntries.push({
          date: new Date().toISOString(),
          action: "עדכון תאריך לידה",
          user: userLabel,
          room_number: tenant.room_number || tenant.room_code || "",
          note: birthdate ? `תאריך לידה עודכן ל-${birthdate}` : "תאריך לידה נמחק",
        });

        // Sync birthdate to matching User entity by email
        if (birthdate) {
          try {
            const matchingUsers = await base44.entities.User.filter({ email: email.toLowerCase().trim() });
            if (matchingUsers.length > 0) {
              await base44.entities.User.update(matchingUsers[0].id, { birthdate });
            }
          } catch {}
        }
      }

      if (historyEntries.length > 0) {
        updates.update_history = [...(tenant.update_history || []), ...historyEntries].filter(Boolean);
      }

      await base44.entities.RoomTenant.update(tenant.id, updates);

      onSaved?.();
    } catch (err) {
      setError(err.message || "שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            עריכת פרטי דייר
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="bg-muted/50 rounded-lg p-2 text-sm">
            <span className="font-medium">{tenant?.room_label || `חדר ${tenant?.room_number}`}</span>
            {tenant?.room_area && <span className="text-muted-foreground text-xs"> · {tenant.room_area}</span>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">שם איש קשר *</Label>
            <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="שם מלא" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">מייל *</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">טלפון</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="050-0000000" dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><Cake className="w-3 h-3" />תאריך לידה</Label>
            <Input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} max={new Date().toISOString().split("T")[0]} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">תפקיד</Label>
            <Input value={role} onChange={e => setRole(e.target.value)} placeholder="למשל: מנהלת משרד" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={e => setIsPrimary(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">איש קשר מרכזי</span>
          </label>
          {isPrimary && !tenant?.is_primary_contact && (
            <p className="text-[11px] text-muted-foreground">
              סימון כאיש קשר מרכזי יעדכן את שאר אנשי הקשר בחדר זה כלא מרכזיים.
            </p>
          )}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>ביטול</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "שומר..." : "שמור שינויים"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}