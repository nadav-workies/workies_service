import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function LogoRow({ logo, dragHandleProps, onToggle, onEdit, onDelete }) {
  return <div className="flex items-center gap-3 p-3 bg-card">
    <span {...dragHandleProps} className="text-muted-foreground cursor-grab p-1" aria-label="גרירה לשינוי סדר"><GripVertical className="w-5 h-5" /></span>
    <div className="w-24 h-12 shrink-0 rounded-md border bg-white flex items-center justify-center p-1">
      <img src={logo.logo_image} alt={logo.name} className="max-w-full max-h-full object-contain" />
    </div>
    <span className="flex-1 min-w-0 truncate font-medium">{logo.name}</span>
    <Switch checked={logo.is_active !== false} onCheckedChange={onToggle} aria-label={`הצגת ${logo.name}`} />
    <Button variant="ghost" size="icon" onClick={onEdit} aria-label="עריכה"><Pencil /></Button>
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" aria-label="מחיקה"><Trash2 className="text-destructive" /></Button></AlertDialogTrigger>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader><AlertDialogTitle>למחוק את הלוגו של {logo.name}?</AlertDialogTitle><AlertDialogDescription>הלוגו יוסר מכל העמודים שהוא מוצג בהם.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>ביטול</AlertDialogCancel><AlertDialogAction onClick={onDelete}>מחיקה</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}