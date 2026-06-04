import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Loader2, ImageIcon } from "lucide-react";

export default function AttachmentUploader({ attachments = [], onChange, label = "צרף קובץ / תמונה", helpText, disabled }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const newItem = {
      file_url,
      file_name: file.name,
      file_type: file.type,
      uploaded_at: new Date().toISOString(),
    };
    onChange([...attachments, newItem]);
    setUploading(false);
    e.target.value = "";
  };

  const remove = (idx) => onChange(attachments.filter((_, i) => i !== idx));

  const isImage = (type) => type?.startsWith("image/");

  return (
    <div className="space-y-2">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <div key={i} className="relative group">
              {isImage(att.file_type) ? (
                <img
                  src={att.file_url}
                  alt={att.file_name}
                  className="w-20 h-20 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-20 h-20 flex flex-col items-center justify-center rounded-lg border bg-muted gap-1">
                  <Paperclip className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground text-center px-1 truncate w-full">{att.file_name}</span>
                </div>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {!disabled && (
        <div>
          <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
          <Button type="button" variant="outline" size="sm" className="gap-2 text-xs h-8" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
            {label}
          </Button>
          {helpText && <p className="text-[11px] text-muted-foreground mt-1">{helpText}</p>}
        </div>
      )}
    </div>
  );
}