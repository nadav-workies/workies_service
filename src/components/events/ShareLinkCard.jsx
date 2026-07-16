import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Copy, Check, ExternalLink } from "lucide-react";

export default function ShareLinkCard() {
  const url = `${window.location.origin}/event-registration`;
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="w-4 h-4 text-primary" />
          קישור ציבורי להרשמה
        </div>
        <p className="text-xs text-muted-foreground">
          שתף את הקישור עם דיירים ואורחים. העמוד ייסגר אוטומטית אחרי תאריך האירוע.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 min-w-0">
          <Input value={url} readOnly className="bg-background font-mono text-xs truncate min-w-0 w-full" dir="ltr" />
          <div className="flex gap-2 shrink-0">
            <Button size="sm" onClick={copy} className="gap-1.5 flex-1 sm:flex-initial">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "הועתק" : "העתק"}
            </Button>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 px-2.5">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}