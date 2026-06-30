import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil } from "lucide-react";

export default function EditTenantDialog({ tenant, onClose, onSaved }) {
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tenant) {
      setContactName(tenant.contact_name || tenant.customer_name || "");
      setEmail(tenant.email || "");
      setPhone(tenant.phone || "");
      setRole(tenant.contact_role || "");
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

      await base44.entities.RoomTenant.update(tenant.id, {
        contact_name: contactName,
        customer_name: contactName,
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        contact_role: role.trim(),
        is_primary_contact: isPrimary,
      });

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