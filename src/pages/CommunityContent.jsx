import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Users, FileText, Link2, CalendarCheck } from "lucide-react";
import CustomersTab from "@/components/community/CustomersTab";
import WeeklyContentPlan from "@/components/community/WeeklyContentPlan";
import ConnectionsTable from "@/components/community/ConnectionsTable";
import ContentInterviewTab from "@/components/community/ContentInterviewTab";
import { isManagerOrAdmin } from "@/lib/permissions";

export default function CommunityContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setLoading(false);
      if (!u || !isManagerOrAdmin(u)) navigate("/");
    }).catch(() => { setLoading(false); navigate("/"); });
  }, []);

  if (loading || !user) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4" dir="rtl">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Users className="w-5 h-5" /> קהילה ותוכן
      </h1>
      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers" className="gap-1.5"><Users className="w-4 h-4" /> לקוחות</TabsTrigger>
          <TabsTrigger value="content" className="gap-1.5"><FileText className="w-4 h-4" /> תובנות תוכן</TabsTrigger>
          <TabsTrigger value="connections" className="gap-1.5"><Link2 className="w-4 h-4" /> ניהול קהילה</TabsTrigger>
          <TabsTrigger value="interview" className="gap-1.5"><CalendarCheck className="w-4 h-4" /> ראיון מנהל תוכן</TabsTrigger>
        </TabsList>
        <TabsContent value="customers"><CustomersTab /></TabsContent>
        <TabsContent value="content"><WeeklyContentPlan /></TabsContent>
        <TabsContent value="connections"><ConnectionsTable /></TabsContent>
        <TabsContent value="interview"><ContentInterviewTab /></TabsContent>
      </Tabs>
    </div>
  );
}