import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

// Copies the lead's details as clean lines, ready to paste into AIO / WhatsApp.
export default function LeadCopyButton({ fields, size = "default", className = "" }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const text = fields.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return <Button type="button" variant="outline" size={size} onClick={copy} className={`gap-2 ${className}`} aria-live="polite">
    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}{copied ? "הועתק" : "העתקת פרטים"}
  </Button>;
}