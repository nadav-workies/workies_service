import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { initOnboardingTrack } from "@/lib/onboardingUtils";
import { ONBOARDING_TEMPLATE } from "@/lib/onboardingTemplate";

export default function CreateOnboardingDialog({ open, onClose, onCreated, user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (open) {
      base44.entities.User.list()
        .then((data) => setUsers(data.filter((u) => u.role === "manager")))
        .catch(() => {});
    }
  }, [open]);

  const handleCreate = async () => {
    if (!selectedUserId || !startDate) return;
    setLoading(true);
    try {
      const employee = users.find((u) => u.id === selectedUserId);
      await initOnboardingTrack(employee, startDate, user);
      onCreated?.();
      onClose();
      setSelectedUserId("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> יצירת מסלול חפיפה חדש
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>תבנית חפיפה</Label>
            <p className="text-sm text-muted-foreground mt-0.5">{ONBOARDING_TEMPLATE.name}</p>
          </div>
          <div>
            <Label>עובדת *</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger><SelectValue placeholder="בחר עובדת..." /></SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>תאריך תחילה *</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 space-y-0.5">
            <p>משך חפיפה: שבועיים (10 ימי עבודה)</p>
            <p>מנהל נוכחי: {ONBOARDING_TEMPLATE.current_manager_name}</p>
            <p>מנהל עתידי: {ONBOARDING_TEMPLATE.future_manager_name}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleCreate} disabled={loading || !selectedUserId} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            צור מסלול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}