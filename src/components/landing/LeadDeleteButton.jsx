import { useState } from "react";
import { Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Admin-only permanent delete of a lead, with confirmation.
export default function LeadDeleteButton({ lead, entity, onDeleted, onError }) {
  const [busy, setBusy] = useState(false);
  async function remove() {
    setBusy(true);
    try { await base44.entities[entity].delete(lead.id); await onDeleted(); }
    catch { onError("המחיקה נכשלה. נסו שוב."); setBusy(false); }
  }
  return <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="outline" className="h-10 gap-2 text-destructive hover:text-destructive" disabled={busy}><Trash2 className="w-4 h-4" />מחיקה</Button>
    </AlertDialogTrigger>
    <AlertDialogContent dir="rtl">
      <AlertDialogHeader className="text-right">
        <AlertDialogTitle>למחוק את הליד של {lead.name}?</AlertDialogTitle>
        <AlertDialogDescription>הליד יימחק מהרשימה ומהדוחות.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="gap-2 sm:gap-2">
        <AlertDialogCancel>ביטול</AlertDialogCancel>
        <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">מחיקה</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}