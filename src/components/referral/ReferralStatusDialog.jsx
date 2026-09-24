import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { REFERRAL_STATUSES, VOUCHER_PER_OFFICE } from "@/lib/referralConfig";
import { updateReferralStatus } from "@/lib/referralService";

export default function ReferralStatusDialog({ referral, user, onClose, onSaved }) {
  const [status, setStatus] = useState(referral.status || "new");
  const [note, setNote] = useState("");
  const [crm, setCrm] = useState(!!referral.crm_registered);
  const [offices, setOffices] = useState(referral.offices_count || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await updateReferralStatus(referral, { status, note, crm_registered: crm, offices_count: offices }, user);
      onSaved();
    } catch (err) {
      setError(err.message || "שגיאה בעדכון");
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent dir="rtl" className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>עדכון סטטוס — {referral.friend_name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>סטטוס</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(REFERRAL_STATUSES).map(([k, s]) => <SelectItem key={k} value={k}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={crm} onChange={e => setCrm(e.target.checked)} className="w-4 h-4" />
            ההמלצה והלקוח נרשמו במערכת ה-CRM
          </label>
          <div className="space-y-1.5">
            <Label>משרדים שנשכרו בפועל</Label>
            <Input type="number" min={0} value={offices} onChange={e => setOffices(e.target.value)} dir="ltr" />
            <p className="text-xs text-muted-foreground">שובר: {(Number(offices) || 0) * VOUCHER_PER_OFFICE} ₪ (500 ₪ לכל משרד מלא)</p>
          </div>
          <div className="space-y-1.5">
            <Label>הערה לעדכון</Label>
            <Textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="למשל: נקבע סיור ליום ראשון" />
          </div>
          {(referral.status_history || []).length > 0 && (
            <div className="space-y-1 border-t pt-2">
              <p className="text-xs font-semibold text-muted-foreground">היסטוריה</p>
              {[...referral.status_history].reverse().map((h, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  {new Date(h.date).toLocaleDateString("he-IL")} · {REFERRAL_STATUSES[h.status]?.label} · {h.user}{h.note ? ` — ${h.note}` : ""}
                </p>
              ))}
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>ביטול</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}שמירת סטטוס
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}