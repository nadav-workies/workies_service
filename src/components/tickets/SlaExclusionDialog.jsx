import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

/**
 * SlaExclusionDialog — רק Admin יכול להחריג קריאה ממדידת SLA.
 * חובה להזין סיבה.
 */
export default function SlaExclusionDialog({ ticket, user, open, onClose, onSaved }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!reason.trim()) return;
    setSaving(true);
    await base44.entities.ServiceTicket.update(ticket.id, {
      sla_excluded: true,
      sla_exclusion_reason: reason.trim(),
      sla_excluded_by: user?.full_name || user?.email || "Admin",
      sla_excluded_at: new Date().toISOString(),
    });
    setSaving(false);
    setReason("");
    onSaved?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>החרגת קריאה ממדידת SLA</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            קריאה שתוחרג לא תיכנס לחישוב עמידה ב-SLA ולא לחישוב זמן טיפול ממוצע.
            פעולה זו גלויה בדוח SLA ורשומה לתמיד.
          </p>
          <div className="space-y-1.5">
            <Label>סיבת החרגה *</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="פרט את הסיבה להחרגת הקריאה מהמדידה..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSave} disabled={!reason.trim() || saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin ml-1" />}
            אשר החרגה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}