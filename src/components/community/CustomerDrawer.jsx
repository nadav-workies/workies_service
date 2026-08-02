import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, MessageSquare, Lightbulb, Phone, Mail, MapPin, Briefcase } from "lucide-react";
import AddConversationDialog from "@/components/community/AddConversationDialog";
import {
  CONVERSATION_TYPE_LABELS, CONVERSATION_TYPE_COLORS,
  INSIGHT_TYPE_LABELS, INSIGHT_TYPE_COLORS, INSIGHT_STATUS_COLORS, INSIGHT_STATUS_LABELS,
  CONFIDENCE_COLORS, CONFIDENCE_LABELS, AI_ANALYSIS_STATUS_LABELS,
} from "@/lib/communityConfig";

export default function CustomerDrawer({ tenant, open, onClose }) {
  const qc = useQueryClient();
  const [showAddConv, setShowAddConv] = useState(false);

  const { data: conversations = [], isLoading: loadingConv } = useQuery({
    queryKey: ["customer-conversations", tenant?.id],
    queryFn: () => base44.entities.CustomerConversation.filter({ tenant_id: tenant.id }, "-conversation_date", 50),
    enabled: !!tenant,
  });

  const { data: insights = [], isLoading: loadingInsights } = useQuery({
    queryKey: ["customer-insights", tenant?.id],
    queryFn: () => base44.entities.CustomerInsight.filter({ tenant_id: tenant.id }, "-created_date", 50),
    enabled: !!tenant,
  });

  if (!tenant) return null;

  const handleAnalyzed = () => {
    qc.invalidateQueries({ queryKey: ["customer-conversations", tenant.id] });
    qc.invalidateQueries({ queryKey: ["customer-insights", tenant.id] });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-lg overflow-y-auto" dir="rtl">
        <SheetHeader>
          <SheetTitle className="text-right">{tenant.customer_name}</SheetTitle>
          <SheetDescription className="text-right">כרטיס לקוח — קהילה ותוכן</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Customer info */}
          <div className="space-y-2 text-sm">
            {tenant.contact_name && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>{tenant.contact_name}{tenant.contact_role ? ` · ${tenant.contact_role}` : ""}</span>
              </div>
            )}
            {tenant.room_label || tenant.room_number ? (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>{tenant.room_label || `חדר ${tenant.room_number}`}{tenant.room_area ? ` · ${tenant.room_area}` : ""}</span>
              </div>
            ) : null}
            {tenant.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span dir="ltr">{tenant.phone}</span>
              </div>
            )}
            {tenant.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span dir="ltr" className="truncate">{tenant.email}</span>
              </div>
            )}
            {tenant.industry && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>{tenant.industry}</span>
              </div>
            )}
          </div>

          <Button className="w-full gap-2" onClick={() => setShowAddConv(true)}>
            <Plus className="w-4 h-4" /> הוסף סיכום שיחה
          </Button>

          {/* Conversations */}
          <div>
            <p className="text-sm font-bold flex items-center gap-1.5 mb-2">
              <MessageSquare className="w-4 h-4" /> סיכומי שיחות ({conversations.length})
            </p>
            {loadingConv ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground">אין עדיין שיחות מתועדות</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((c) => (
                  <div key={c.id} className="border rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{c.conversation_title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CONVERSATION_TYPE_COLORS[c.conversation_type] || "bg-gray-100"}`}>
                        {CONVERSATION_TYPE_LABELS[c.conversation_type] || c.conversation_type}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        c.ai_analysis_status === "analyzed" ? "bg-green-100 text-green-700" :
                        c.ai_analysis_status === "failed" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {AI_ANALYSIS_STATUS_LABELS[c.ai_analysis_status] || c.ai_analysis_status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.conversation_date}</p>
                    {c.ai_summary && (
                      <p className="text-xs bg-muted/40 rounded p-1.5 mt-1">{c.ai_summary}</p>
                    )}
                    {c.ai_suggested_tags?.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {c.ai_suggested_tags.map((tag, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insights */}
          <div>
            <p className="text-sm font-bold flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-4 h-4" /> תובנות ({insights.length})
            </p>
            {loadingInsights ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : insights.length === 0 ? (
              <p className="text-xs text-muted-foreground">אין עדיין תובנות</p>
            ) : (
              <div className="space-y-1.5">
                {insights.slice(0, 10).map((ins) => (
                  <div key={ins.id} className="border rounded-lg p-2 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${INSIGHT_TYPE_COLORS[ins.insight_type] || "bg-gray-100"}`}>
                        {INSIGHT_TYPE_LABELS[ins.insight_type] || ins.insight_type}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${CONFIDENCE_COLORS[ins.confidence] || "bg-gray-100"}`}>
                        {CONFIDENCE_LABELS[ins.confidence] || ins.confidence}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${INSIGHT_STATUS_COLORS[ins.status] || "bg-gray-100"}`}>
                        {INSIGHT_STATUS_LABELS[ins.status] || ins.status}
                      </span>
                    </div>
                    <p className="font-medium mt-1">{ins.title}</p>
                    {ins.content && ins.content !== ins.title && <p className="text-muted-foreground mt-0.5">{ins.content}</p>}
                    {ins.source_quote && <p className="text-muted-foreground italic mt-0.5">"{ins.source_quote}"</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>

      {showAddConv && (
        <AddConversationDialog
          tenant={tenant}
          onClose={() => setShowAddConv(false)}
          onAnalyzed={handleAnalyzed}
        />
      )}
    </Sheet>
  );
}