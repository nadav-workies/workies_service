import { useState } from "react";
import { Check, Copy } from "lucide-react";

// Small icon button that copies a single value.
export default function CopyField({ value, label }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  async function copy() {
    await navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return <button type="button" onClick={copy} title={`העתקת ${label}`} aria-label={`העתקת ${label}`}
    className="inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
  </button>;
}