import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Paperclip, Sparkles, X } from "lucide-react";

export default function ExtractTasksDialog({ open, onClose, onImport }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState("");

  const reset = () => { setFile(null); setFileUrl(""); setDrafts([]); setError(""); if (inputRef.current) inputRef.current.value = ""; };

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      setFileUrl(file_url);
    } catch (err) {
      setError("העלאת הקובץ נכשלה");
    }
  };

  const handleExtract = async () => {
    if (!fileUrl) return;
    setExtracting(true);
    setError("");
    try {
      const res = await base44.functions.invoke("extractMaintenanceTasks", { file_url: fileUrl });
      const tasks = res?.data?.tasks || [];
      setDrafts(tasks.map(t => ({
        title: t.title || "משימה",
        description: t.description || "",
        category: t.category || "general",
        priority: t.priority || "medium",
        location: t.location || "",
        planned_date: t.planned_date || "",
        start_time: t.start_time || "09:00",
        duration_minutes: t.duration_minutes || 60,
        assigned_maintenance_worker: "עטיה",
        status: "planned",
        recurring: "one_time",
      })));
    } catch (err) {
      setError("החילוץ נכשל: " + (err?.message || ""));
    }
    setExtracting(false);
  };

  const removeDraft = (i) => setDrafts(d => d.filter((_, idx) => idx !== i));
  const updateDraft = (i, field, value) => setDrafts(d => d.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  const importAll = () => { onImport(drafts); reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onClose(o); }}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> חילוץ משימות תחזוקה מקובץ</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">העלה תמונה / קובץ של רשימת משימות ידנית, ולחץ "חלץ משימות". המערכת תציג טיוטה לפני שמירה.</p>
          <div className="flex items-center gap-2">
            <input ref={inputRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt" className="hidden" onChange={handleFile} />
            <Button variant="outline" size="sm" className="gap-1" onClick={() => inputRef.current?.click()}>
              <Paperclip className="w-3.5 h-3.5" /> {file ? file.name : "בחר קובץ / תמונה"}
            </Button>
            <Button size="sm" className="gap-1" disabled={!fileUrl || extracting} onClick={handleExtract}>
              {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} חלץ משימות
            </Button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          {drafts.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-medium">נמצאו {drafts.length} משימות — בדוק/ערוך לפני הוספה:</p>
              {drafts.map((t, i) => (
                <div key={i} className="border rounded-lg p-2 space-y-1.5 text-xs relative">
                  <button onClick={() => removeDraft(i)} className="absolute top-1.5 left-1.5 text-muted-foreground hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                  <input className="w-full font-medium bg-transparent border-b pb-0.5 pr-5" value={t.title} onChange={e => updateDraft(i, "title", e.target.value)} />
                  <div className="grid grid-cols-2 gap-2 pr-0">
                    <input type="date" className="border rounded px-1.5 py-1" value={t.planned_date} onChange={e => updateDraft(i, "planned_date", e.target.value)} />
                    <input type="time" className="border rounded px-1.5 py-1" value={t.start_time} onChange={e => updateDraft(i, "start_time", e.target.value)} />
                  </div>
                  {t.description && <p className="text-muted-foreground pr-5">{t.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>ביטול</Button>
          <Button disabled={drafts.length === 0} onClick={importAll} className="gap-1">הוסף {drafts.length || ""} משימות ללוח</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}