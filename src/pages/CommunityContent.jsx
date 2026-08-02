import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Users } from "lucide-react";
import CommunityDashboard from "@/components/community/CommunityDashboard";
import ConnectionsTable from "@/components/community/ConnectionsTable";
import WeeklyContentPlan from "@/components/community/WeeklyContentPlan";
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
      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">דשבורד קהילה</TabsTrigger>
          <TabsTrigger value="connections">חיבורים פוטנציאליים</TabsTrigger>
          <TabsTrigger value="content">תוכנית תוכן שבועית</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><CommunityDashboard /></TabsContent>
        <TabsContent value="connections"><ConnectionsTable /></TabsContent>
        <TabsContent value="content"><WeeklyContentPlan /></TabsContent>
      </Tabs>
    </div>
  );
}