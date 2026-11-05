import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { isManagerOrAdmin } from "@/lib/permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LandingShareCard from "@/components/landing/LandingShareCard";
import CampaignValidityEditor from "@/components/landing/CampaignValidityEditor";
import CampaignStatusToggle from "@/components/landing/CampaignStatusToggle";
import PageDashboard from "@/components/landing/PageDashboard";
import LeadsReport from "@/pages/LeadsReport";
import ReferralsReport from "@/pages/ReferralsReport";
import campaigns from "@/components/landing/campaigns";

export default function LandingPageManage() {
  const { campaign } = useParams();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "";
  const setStatus = s => setParams(s ? { status: s } : {}, { replace: true });
  const { data: user, isPending } = useQuery({ queryKey: ["landing-manager"], queryFn: () => base44.auth.me() });
  if (!Object.hasOwn(campaigns, campaign)) return <Navigate to="/landing-pages" replace />;
  if (isPending) return <p role="status" className="py-12 text-center">טוענים…</p>;
  if (!isManagerOrAdmin(user)) return <Navigate to="/" replace />;
  return <div dir="rtl" className="w-full min-w-0 max-w-3xl mx-auto space-y-4">
    <div>
      <Link to="/landing-pages" className="inline-flex items-center gap-1 min-h-10 text-sm text-primary"><ArrowRight className="w-4 h-4" />כל עמודי הנחיתה</Link>
      <h1 className="text-xl sm:text-2xl font-bold break-words leading-snug">{campaigns[campaign].title}</h1>
    </div>
    <CampaignStatusToggle campaign={campaign} canEdit={user.role === "admin"} />
    <Tabs defaultValue="leads" dir="rtl" className="min-w-0">
      <TabsList className="grid grid-cols-2 w-full h-11">
        <TabsTrigger value="leads" className="h-9">לידים</TabsTrigger>
        <TabsTrigger value="settings" className="h-9">שיתוף והגדרות</TabsTrigger>
      </TabsList>
      <TabsContent value="leads" className="space-y-4 mt-4 min-w-0">
        <PageDashboard campaign={campaign} status={status} onSelect={setStatus} />
        {campaign === "referral" ? <ReferralsReport embedded status={status} /> : <LeadsReport key={campaign} campaign={campaign} embedded status={status} onClearStatus={() => setStatus("")} />}
      </TabsContent>
      <TabsContent value="settings" className="space-y-4 mt-4 min-w-0">
        <LandingShareCard campaign={campaign} />
        {user.role === "admin" && <CampaignValidityEditor campaign={campaign} />}
      </TabsContent>
    </Tabs>
  </div>;
}