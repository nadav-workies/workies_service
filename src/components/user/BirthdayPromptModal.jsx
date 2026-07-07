import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cake, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BirthdayPromptModal({ user, onSaved }) {
  const [birthdate, setBirthdate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!birthdate) {
      setError("נא לבחור תאריך לידה");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await base44.auth.updateMe({ birthdate });

      // Sync birthdate to matching RoomTenant records and log the change
      try {
        const tenants = await base44.entities.RoomTenant.filter({ email: user?.email });
        const now = new Date().toISOString();
        const roomNumber = user?.default_room_number || user?.room_code || "";
        for (const t of tenants) {
          const historyEntry = {
            date: now,
            action: "עדכון תאריך לידה",
            user: user?.email || user?.full_name || "משתמש",
            room_number: t.room_number || t.room_code || roomNumber || "",
            note: `תאריך לידה עודכן ל-${birthdate}`,
          };
          await base44.entities.RoomTenant.update(t.id, {
            birthdate,
            update_history: [...(t.update_history || []), historyEntry].filter(Boolean),
          });
        }
      } catch {}

      onSaved({ birthdate });
    } catch (err) {
      setError(err.message || "שגיאה בשמירת תאריך הלידה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Cake className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">מה תאריך הלידה שלך?</DialogTitle>
              <DialogDescription className="mt-1">
                נשמח לאחל לך יום הולדת שמח בתאריך המתאים 🎂
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="birthdate">תאריך לידה</Label>
            <Input
              id="birthdate"
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={saving || !birthdate}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "אישור וכניסה"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}