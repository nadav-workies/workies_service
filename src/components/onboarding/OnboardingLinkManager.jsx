import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Link2, Copy, Check, Mail, MessageCircle, Ban, RefreshCw, Eye, ExternalLink } from "lucide-react";
import moment from "moment";

export default function OnboardingLinkManager({ track, onPreview }) {
  const [link, setLink] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState(null);

  const fetchLink = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("onboardingAccess", {
        action: "getStatus",
        onboarding_id: track.id,
      });
      if (res.data?.ok) setLink(res.data.link);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [track.id]);

  useEffect(() => {
    fetchLink();
  }, [fetchLink]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await base44.functions.invoke("onboardingAccess", {
        action: "create",
        onboarding_id: track.id,
        employee_id: track.employee_id,
        employee_name: track.employee_name,
      });
      if (res.data?.ok) {
        setToken(res.data.token);
        await fetchLink();
      }
    } catch {
      /* ignore */
    }
    setCreating(false);
  };

  const handleRevoke = async () => {
    if (!link) return;
    try {
      await base44.functions.invoke("onboardingAccess", {
        action: "revoke",
        link_id: link.id,
      });
      setToken(null);
      await fetchLink();
    } catch {
      /* ignore */
    }
  };

  const accessUrl = token
    ? `${window.location.origin}/onboarding/access/${token}`
    : null;

  const handleCopy = () => {
    if (!accessUrl) return;
    navigator.clipboard.writeText(accessUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    if (!accessUrl) return;
    if (!track.employee_email) {
      setEmailResult("אין כתובת מייל לעובדת");
      setTimeout(() => setEmailResult(null), 3000);
      return;
    }
    setSendingEmail(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: track.employee_email,
        subject: "מסלול החפיפה שלך ב־Workies",
        body: `שלום ${track.employee_name},<br><br>נפתח עבורך מסלול חפיפה אישי לתפקיד ${track.role_title}.<br><br>דרך הקישור ניתן לצפות בתוכנית היומית, ללמוד, לבצע משימות, להשלים מבדקים ולשלוח שאלות.<br><br><a href="${accessUrl}">לכניסה למסלול</a><br><br>ההתקדמות נשמרת ומסונכרנת ישירות עם מערכת Workies.<br><br>בהצלחה,<br>Workies`,
      });
      setEmailResult("המייל נשלח בהצלחה");
    } catch {
      setEmailResult("שליחת מייל נכשלה — ייתכן שהעובדת אינה רשומה. ניתן להעתיק את הקישור ולשלוח ידנית.");
    }
    setSendingEmail(false);
    setTimeout(() => setEmailResult(null), 5000);
  };

  const handleSendWhatsapp = () => {
    if (!accessUrl) return;
    const msg = `שלום ${track.employee_name},\nזה הקישור האישי למסלול החפיפה שלך ב־Workies:\n${accessUrl}\n\nההתקדמות נשמרת אוטומטית וניתן להמשיך בכל פעם מאותה נקודה.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) {
    return (
      <Card className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> טוען פרטי קישור...
      </Card>
    );
  }

  const isExpired = link?.expires_at && new Date(link.expires_at) < new Date();
  const isActive = link?.status === "active" && !isExpired;

  if (!link || !isActive) {
    return (
      <Card className="p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Link2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {link ? (isExpired ? "הקישור פג תוקף" : "הקישור בוטל") : "אין קישור פעיל לעובדת"}
          </span>
        </div>
        <Button size="sm" onClick={handleCreate} disabled={creating} className="gap-1">
          {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
          {link ? "צור קישור חדש" : "צור קישור לעובדת"}
        </Button>
      </Card>
    );
  }

  const statusLabel = isActive ? "פעיל" : isExpired ? "פג תוקף" : "בוטל";
  const statusColor = isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">קישור אישי לעובדת</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColor}`}>{statusLabel}</span>
        </div>
        <Button size="sm" variant="ghost" onClick={fetchLink} className="h-7 w-7 p-0">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {accessUrl ? (
        <>
          <div className="flex gap-1.5 flex-wrap">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleCopy}>
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              {copied ? "הועתק" : "העתק קישור"}
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleSendEmail} disabled={sendingEmail}>
              {sendingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
              שלח במייל
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleSendWhatsapp}>
              <MessageCircle className="w-3 h-3" /> וואטסאפ
            </Button>
            {onPreview && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onPreview}>
                <Eye className="w-3 h-3" /> צפה כמשתמש
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-red-600" onClick={handleRevoke}>
              <Ban className="w-3 h-3" /> בטל קישור
            </Button>
          </div>

          {emailResult && <p className="text-xs text-muted-foreground">{emailResult}</p>}
        </>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">הקישור פעיל. לקבלת כתובת הקישור, צרו קישור חדש.</p>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleCreate} disabled={creating}>
            {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
            צור קישור חדש
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t">
        <div>נוצר: {link.created_at ? moment(link.created_at).format("DD/MM/YYYY") : "—"}</div>
        <div>כניסה אחרונה: {link.last_access_at ? moment(link.last_access_at).format("DD/MM HH:mm") : "טרם נכנסה"}</div>
        <div>מספר כניסות: {link.access_count || 0}</div>
        <div>תוקף עד: {link.expires_at ? moment(link.expires_at).format("DD/MM/YYYY") : "ללא תפוגה"}</div>
      </div>
    </Card>
  );
}