import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, MessageSquare, Lightbulb, Phone, Mail, MapPin, Briefcase, Pencil, Link2, Sparkles } from "lucide-react";
import AddConversationDialog from "@/components/community/AddConversationDialog";
import CustomerEditForm from "@/components/community/CustomerEditForm";
import ContentRecommendationsTab from "@/components/community/ContentRecommendationsTab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CONVERSATION_TYPE_LABELS, CONVERSATION_TYPE_COLORS,
  INSIGHT_TYPE_LABELS, INSIGHT_TYPE_COLORS, INSIGHT_STATUS_COLORS, INSIGHT_STATUS_LABELS,
  CONFIDENCE_COLORS, CONFIDENCE_LABELS, AI_ANALYSIS_STATUS_LABELS,
  CONNECTION_STATUS_LABELS, CONNECTION_STATUS_COLORS,
} from "@/lib/communityConfig";

export default function CustomerDrawer({ tenant, open, onClose, onNavigateToContent }) {
  const qc = useQueryClient();
  const [showAddConv, setShowAddConv] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deriving, setDeriving] = useState(false);
  const [editedTenant, setEditedTenant] = useState(null);

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
  const { data: connections = [], isLoading: loadingConn } = useQuery({
    queryKey: ["customer-connections", tenant?.id],
    queryFn: () => base44.entities.CommunityConnectionSuggestion.filter({ customer_a_id: tenant.id }, "-created_date", 50),
    enabled: !!tenant,
  });

  if (!tenant) return null;

  const currentTenant = editedTenant || tenant;

  const handleAnalyzed = () => {
    qc.invalidateQueries({ queryKey: ["customer-conversations", tenant.id] });
    qc.invalidateQueries({ queryKey: ["customer-insights", tenant.id] });
    qc.invalidateQueries({ queryKey: ["community-insights"] });
    qc.invalidateQueries({ queryKey: ["community-connections"] });
  };

  const handleEditSave = (form) => {
    setEditedTenant(form);
    setEditMode(false);
    qc.invalidateQueries({ queryKey: ["room-tenants"] });
    qc.invalidateQueries({ queryKey: ["customer-connections", tenant.id] });
  };

  const handleDeriveConnections = async () => {
    setDeriving(true);
    try {
      const res = await base44.functions.invoke("deriveCustomerConnections", { customer_id: tenant.id });
      const data = res.data || res;
      if (data.error) throw new Error(data.error);
      qc.invalidateQueries({ queryKey: ["customer-connections", tenant.id] });
      qc.invalidateQueries({ queryKey: ["community-connections"] });
    } catch (e) {
      console.error(e);
    } finally {
      setDeriving(false);
    }
  };

  const handleConnStatusChange = async (conn, newStatus) => {
    await base44.entities.CommunityConnectionSuggestion.update(conn.id, { status: newStatus });
    qc.invalidateQueries({ queryKey: ["customer-connections", tenant.id] });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-5xl overflow-y-auto" dir="rtl">
        <SheetHeader>
          <SheetTitle className="text-right flex items-center justify-between gap-2">
            <span>{currentTenant.customer_name}</span>
            {!editMode && (
              <Button size="sm" variant="ghost" onClick={() => setEditMode(true)} className="gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> עריכה
              </Button>
            )}
          </SheetTitle>
          <SheetDescription className="text-right">כרטיס לקוח — קהילה ותוכן</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="card" className="w-full mt-4">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="card">כרטיס לקוח</TabsTrigger>
            <TabsTrigger value="content">המלצות תוכן</TabsTrigger>
          </TabsList>
          <TabsContent value="card" className="space-y-4">
          {/* Edit form or read-only info */}
          {editMode ? (
            <CustomerEditForm
              tenant={currentTenant}
              onSave={handleEditSave}
            />
          ) : (
            <div className="space-y-2 text-sm">
              {currentTenant.contact_name && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>{currentTenant.contact_name}{currentTenant.contact_role ? ` · ${currentTenant.contact_role}` : ""}</span>
                </div>
              )}
              {(currentTenant.room_label || currentTenant.room_number) && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>{currentTenant.room_label || `חדר ${currentTenant.room_number}`}{currentTenant.room_area ? ` · ${currentTenant.room_area}` : ""}</span>
                </div>
              )}
              {currentTenant.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span dir="ltr">{currentTenant.phone}</span>
                </div>
              )}
              {currentTenant.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span dir="ltr" className="truncate">{currentTenant.email}</span>
                </div>
              )}
              {currentTenant.industry && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>{currentTenant.industry}</span>
                </div>
              )}
            </div>
          )}

          <Button className="w-full gap-2" onClick={() => setShowAddConv(true)}>
            <Plus className="w-4 h-4" /> הוסף סיכום שיחה
          </Button>

          {/* Connections (derived from card data) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold flex items-center gap-1.5">
                <Link2 className="w-4 h-4" /> חיבורים פוטנציאליים ({connections.length})
              </p>
              <Button size="sm" variant="outline" onClick={handleDeriveConnections} disabled={deriving} className="gap-1.5">
                {deriving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                גזור חיבורים
              </Button>
            </div>
            {loadingConn ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : connections.length === 0 ? (
              <p className="text-xs text-muted-foreground">אין חיבורים עדיין. לחצו "גזור חיבורים" להפקת חיבורים מכרטיס הלקוח.</p>
            ) : (
              <div className="space-y-1.5">
                {connections.map((c) => (
                  <div key={c.id} className="border rounded-lg p-2 text-xs space-y-1">
                    <p className="font-medium">{c.customer_b_name || "—"}</p>
                    <p className="text-muted-foreground">{c.reason}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${CONFIDENCE_COLORS[c.confidence] || "bg-gray-100"}`}>
                        {CONFIDENCE_LABELS[c.confidence] || c.confidence}
                      </span>
                      <select value={c.status}
                        onChange={(e) => handleConnStatusChange(c, e.target.value)}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border-0 ${CONNECTION_STATUS_COLORS[c.status] || "bg-gray-100"}`}>
                        {Object.entries(CONNECTION_STATUS_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                {insights.slice(0, 15).map((ins) => (
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
          </TabsContent>
          <TabsContent value="content">
            <ContentRecommendationsTab tenant={currentTenant} />
          </TabsContent>
        </Tabs>
      </SheetContent>

      {showAddConv && (
        <AddConversationDialog
          tenant={currentTenant}
          onClose={() => setShowAddConv(false)}
          onAnalyzed={handleAnalyzed}
        />
      )}
    </Sheet>
  );
}