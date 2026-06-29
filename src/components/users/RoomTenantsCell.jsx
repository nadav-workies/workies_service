import { useState } from "react";
import { Mail, Phone, Star, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RoomTenantsCell({ tenants, roomUsers, invitingId, onInvite }) {
  const [expanded, setExpanded] = useState(false);

  if (!tenants || tenants.length === 0) {
    if (roomUsers && roomUsers.length > 0) {
      return (
        <div className="space-y-1">
          {roomUsers.map(u => (
            <div key={u.id} className="text-xs">
              <span className="font-medium">{u.full_name || "—"}</span>
              {u.email && <span className="text-muted-foreground block" dir="ltr">{u.email}</span>}
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-muted-foreground">—</span>;
  }

  const sorted = [...tenants].sort((a, b) => {
    if (a.is_primary_contact && !b.is_primary_contact) return -1;
    if (!a.is_primary_contact && b.is_primary_contact) return 1;
    return 0;
  });

  const primary = sorted[0];
  const others = sorted.slice(1);
  const shown = expanded ? sorted : [primary];
  const customerName = tenants[0]?.customer_name;

  return (
    <div className="space-y-1">
      {customerName && (
        <div className="text-xs font-semibold">{customerName}</div>
      )}
      {shown.map(t => (
        <div key={t.id} className="text-xs space-y-0.5">
          <div className="flex items-center gap-1 flex-wrap">
            {t.is_primary_contact && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
            <span className="font-medium">{t.contact_name || t.customer_name || "—"}</span>
            {t.is_primary_contact && <span className="text-[10px] text-amber-600 font-medium">מרכזי</span>}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {t.phone && (
              <a href={`tel:${t.phone}`} className="text-muted-foreground hover:text-primary inline-flex items-center gap-0.5" dir="ltr" title="חייג">
                <Phone className="w-3 h-3" />
                {t.phone}
              </a>
            )}
            {t.email && (
              <a href={`mailto:${t.email}`} className="text-muted-foreground hover:text-primary inline-flex items-center gap-0.5" dir="ltr" title="שלח מייל">
                <Mail className="w-3 h-3" />
                {t.email}
              </a>
            )}
          </div>
          <div className="flex items-center gap-1">
            {t.email && !t.invite_sent && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 px-1.5 text-[10px] gap-0.5"
                onClick={() => onInvite(t)}
                disabled={invitingId === t.id}
              >
                {invitingId === t.id
                  ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  : <Mail className="w-2.5 h-2.5" />}
                הזמן
              </Button>
            )}
            {t.invite_sent && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                <CheckCircle className="w-2.5 h-2.5" />
                הוזמן
              </span>
            )}
          </div>
        </div>
      ))}
      {others.length > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-[10px] text-primary hover:underline"
        >
          + {others.length} משתמשים נוספים
        </button>
      )}
      {expanded && others.length > 0 && (
        <button
          onClick={() => setExpanded(false)}
          className="text-[10px] text-muted-foreground hover:underline"
        >
          הסתר
        </button>
      )}
    </div>
  );
}