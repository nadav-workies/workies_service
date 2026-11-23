import { useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resizeImage } from "@/lib/resizeImage";

// Add (logo = null) or edit a client logo.
export default function LogoFormDialog({ open, onOpenChange, logo, nextOrder, onSaved }) {
  const [name, setName] = useState(logo?.name || "");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async e => {
    e.preventDefault();
    if (!name.trim()) return setError("נא למלא שם");
    if (!logo && !file) return setError("נא לבחור קובץ לוגו");
    setSaving(true); setError("");
    try {
      const data = { name: name.trim() };
      if (file) data.logo_image = (await base44.integrations.Core.UploadPublicFile({ file: await resizeImage(file) })).file_url;
      if (logo) await base44.entities.ClientLogo.update(logo.id, data);
      else await base44.entities.ClientLogo.create({ ...data, sort_order: nextOrder, is_active: true, show_on: ["workies-events"] });
      onSaved(); onOpenChange(false);
    } catch (err) { setError(err.message || "השמירה נכשלה"); }
    setSaving(false);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent dir="rtl">
      <DialogHeader><DialogTitle>{logo ? "עריכת לוגו" : "הוספת לוגו"}</DialogTitle></DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="logo-name">שם הארגון (טקסט חלופי)</Label><Input id="logo-name" value={name} onChange={e => setName(e.target.value)} maxLength={150} /></div>
        <div className="space-y-1.5"><Label htmlFor="logo-file">{logo ? "החלפת קובץ (לא חובה)" : "קובץ לוגו"}</Label>
          <Input id="logo-file" type="file" accept="image/png,image/svg+xml,image/webp" onChange={e => setFile(e.target.files?.[0] || null)} />
          <p className="text-xs text-muted-foreground">PNG, SVG או WebP, רצוי רקע שקוף. קבצים רחבים מוקטנים אוטומטית ל־480 פיקסלים.</p>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter><Button type="submit" disabled={saving}>{saving && <Loader2 className="animate-spin" />}שמירה</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}