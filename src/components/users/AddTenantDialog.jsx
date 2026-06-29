import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus } from "lucide-react";

export default function AddTenantDialog({ room, onClose, onSaved }) {
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [isPrimary, setIsPrimary] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!contactName || !email) {
      setError("שם ומייל הם שדות חובה");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isPrimary) {
        await base44.entities.RoomTenant.updateMany(
          { room_number: room.room_number, is_primary_contact: true },
          { $set: { is_primary_contact: false } }
        );
      }

      await base44.entities.RoomTenant.create({
        room_code: room.room_number,
        room_number: room.room_number,
        room_label: room.room_label,
        room_area: room.room_area,
        customer_name: contactName,
        contact_name: contactName,
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        contact_role: role.trim(),
        is_primary_contact: isPrimary,
        customer_status: "active",
        matched_room: true,
        invite_sent: false,
        source_system: "manual_add",
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
            <UserPlus className="w-5 h-5 text-primary" />
            הוספת משתמש לחדר
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="bg-muted/50 rounded-lg p-2 text-sm">
            <span className="font-medium">{room.room_label}</span>
            {room.room_area && <span className="text-muted-foreground text-xs"> · {room.room_area}</span>}
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
          {isPrimary && (
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
            {saving ? "שומר..." : "שמור משתמש"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}