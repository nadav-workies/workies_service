import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

// Image fills its container exactly (object-cover); admins click it to replace.
export default function EditableImage({ editor, slot, alt, placeholder, className = "" }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const src = editor.images[slot];
  async function change(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true); setError("");
    try { await editor.upload(slot, file); } catch { setError("ההעלאה נכשלה"); } finally { setBusy(false); }
  }
  const content = src ? <img src={src} alt={alt} data-slot={slot} className="hr-img" /> : <span className="hr-img-ph">{placeholder}</span>;
  if (!editor.canEdit) return <div className={`hr-img-box ${className}`}>{content}</div>;
  return <button type="button" onClick={() => input.current.click()} disabled={busy} aria-label={`החלפת תמונה: ${alt}`} className={`hr-img-box hr-img-edit ${className}`}>
    {content}
    <span className="hr-img-badge">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}{error || "החלפה"}</span>
    <input ref={input} type="file" accept="image/*" hidden onChange={change} />
  </button>;
}