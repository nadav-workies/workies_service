import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Paperclip, Download, X, Image as ImageIcon, Video } from "lucide-react";

export default function ContentAttachments({ attachments = [], onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push({
        file_url,
        file_name: file.name,
        file_type: file.type.startsWith("video") ? "video" : "image",
        uploaded_at: new Date().toISOString(),
      });
    }
    onChange([...attachments, ...uploaded]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (idx) => onChange(attachments.filter((_, i) => i !== idx));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium flex items-center gap-1">
          <Paperclip className="w-3.5 h-3.5" /> קבצים מצורפים (תמונה / וידאו)
        </label>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
          disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Paperclip className="w-3 h-3" />} צרף קובץ
        </Button>
        <input ref={inputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} />
      </div>
      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map((att, idx) => (
            <div key={idx} className="flex items-center gap-2 border rounded-lg p-1.5 text-xs">
              {att.file_type === "video"
                ? <Video className="w-4 h-4 text-purple-600 shrink-0" />
                : <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />}
              <span className="flex-1 min-w-0 truncate">{att.file_name}</span>
              <a href={att.file_url} download={att.file_name} target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-0.5 shrink-0">
                <Download className="w-3.5 h-3.5" /> הורדה
              </a>
              <button onClick={() => remove(idx)} className="text-muted-foreground hover:text-red-600 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground">הקבצים נמחקים אוטומטית 30 יום אחרי מועד התוכן.</p>
    </div>
  );
}