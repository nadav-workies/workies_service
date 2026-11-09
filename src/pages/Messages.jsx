import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail } from "lucide-react";
import { isManagerOrAdmin } from "@/lib/permissions";
import MessagesTable from "@/components/messages/MessagesTable";
import NotificationSettings from "@/pages/NotificationSettings";

export default function Messages() {
  const [user, setUser] = useState(undefined);
  useEffect(() => { base44.auth.me().then(setUser).catch(() => setUser(null)); }, []);
  if (user === undefined) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!isManagerOrAdmin(user)) return <div className="text-center py-20 text-muted-foreground">אין הרשאה לצפות בדף זה</div>;
  const admin = user.role === "admin";
  return <div dir="rtl" className="space-y-5 max-w-6xl mx-auto">
    <div>
      <h1 className="text-xl font-bold flex items-center gap-2"><Mail className="w-5 h-5" />הודעות</h1>
      <p className="text-muted-foreground text-sm mt-1">תיעוד כל ההודעות שנשלחות אוטומטית מהמערכת, ועריכת הנוסחים שלהן</p>
    </div>
    <Tabs defaultValue="log" dir="rtl">
      <TabsList>
        <TabsTrigger value="log">מעקב הודעות</TabsTrigger>
        {admin && <TabsTrigger value="templates">עריכת נוסחים</TabsTrigger>}
      </TabsList>
      <TabsContent value="log" className="mt-4"><MessagesTable /></TabsContent>
      {admin && <TabsContent value="templates" className="mt-4"><NotificationSettings /></TabsContent>}
    </Tabs>
  </div>;
}