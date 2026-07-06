import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreVertical, Archive, RotateCcw, Trash2, AlertTriangle, Loader2 } from "lucide-react";

const ARCHIVE_REASONS_TICKET = ["נתון בדיקה", "טסט מערכת", "קריאה כפולה", "נפתחה בטעות", "שגיאת מערכת", "אחר"];
const ARCHIVE_REASONS_SURVEY = ["נתון בדיקה", "טסט מערכת", "דירוג כפול", "שגיאת משתמש", "אחר"];

export default function RecordActionsMenu({
  entityName,
  record,
  recordType = "ticket",
  user,
  queryKeys = [],
  onDeleted,
}) {
  const queryClient = useQueryClient();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const reasons = recordType === "survey" ? ARCHIVE_REASONS_SURVEY : ARCHIVE_REASONS_TICKET;
  const entityLabel = recordType === "survey" ? "דירוג" : "קריאה";
  const finalReason = reason === "אחר" ? customReason.trim() : reason;
  const isArchived = record?.archived === true;

  const invalidateAll = () => {
    queryKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
  };

  const buildHistoryEntry = (action, note = "") => ({
    date: new Date().toISOString(),
    action,
    user: user?.email || user?.full_name || "מערכת",
    note,
  });

  const handleArchive = async () => {
    if (!finalReason) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const userEmail = user?.email || user?.full_name || "מערכת";
      const updates = {
        archived: true,
        exclude_from_metrics: true,
        archived_at: now,
        archived_by: userEmail,
        archive_reason: finalReason,
      };
      if (entityName === "ServiceTicket" && record?.update_history) {
        updates.update_history = [...record.update_history, buildHistoryEntry("קריאה הועברה לארכיון", finalReason)];
      }
      await base44.entities[entityName].update(record.id, updates);
      invalidateAll();
      setArchiveOpen(false);
      setReason("");
      setCustomReason("");
    } catch (e) {
      console.error("Archive error:", e);
    }
    setLoading(false);
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const updates = {
        archived: false,
        exclude_from_metrics: false,
        archived_at: null,
        archived_by: null,
      };
      if (entityName === "ServiceTicket" && record?.update_history) {
        updates.update_history = [...record.update_history, buildHistoryEntry("קריאה שוחזרה מארכיון")];
      }
      await base44.entities[entityName].update(record.id, updates);
      invalidateAll();
    } catch (e) {
      console.error("Restore error:", e);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirmed) return;
    setLoading(true);
    try {
      await base44.entities[entityName].delete(record.id);
      invalidateAll();
      setDeleteOpen(false);
      setConfirmed(false);
      if (onDeleted) onDeleted();
    } catch (e) {
      console.error("Delete error:", e);
    }
    setLoading(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
          {!isArchived ? (
            <DropdownMenuItem onClick={() => setArchiveOpen(true)}>
              <Archive className="w-3.5 h-3.5 ml-2" />
              העבר לארכיון / נטרל ממדידה
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleRestore} disabled={loading}>
              {loading ? <Loader2 className="w-3.5 h-3.5 ml-2 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 ml-2" />}
              שחזר למדידה
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-3.5 h-3.5 ml-2" />
            מחק לצמיתות
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Archive Dialog */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>נטרול {entityLabel} ממדידה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ה{entityLabel} תישאר במערכת ובהיסטוריה, אך לא תשפיע על דשבורד, KPI, SLA וממוצעים.
            </p>
            <div className="space-y-1.5">
              <Label>סיבה</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue placeholder="בחר סיבה" /></SelectTrigger>
                <SelectContent>
                  {reasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {reason === "אחר" && (
              <Input value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="פרט סיבה" />
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setArchiveOpen(false)}>ביטול</Button>
            <Button onClick={handleArchive} disabled={!finalReason || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
              העבר לארכיון
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>מחיקה מלאה של {entityLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2 items-start p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-medium">
                  הפעולה תמחק את ה{entityLabel} לצמיתות ולא ניתן יהיה לשחזר {recordType === "survey" ? "אותו" : "אותה"}.
                </p>
                <p className="text-xs text-red-600 mt-1">
                  מומלץ להשתמש בארכוב אם מדובר בנתון בדיקה.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={confirmed} onCheckedChange={setConfirmed} />
              <span className="text-sm">אני מבין שהמחיקה לצמיתות</span>
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>ביטול</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!confirmed || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              מחק לצמיתות
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}