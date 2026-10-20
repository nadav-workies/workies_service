import { useQuery } from "@tanstack/react-query";
import { Navigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isManagerOrAdmin } from "@/lib/permissions";
import LandingShareCard from "@/components/landing/LandingShareCard";
import LeadsReport from "@/pages/LeadsReport";
import ReferralsReport from "@/pages/ReferralsReport";
import campaigns from "@/components/landing/campaigns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function LandingPages() {
  const [params, setParams] = useSearchParams();
  const selected = Object.hasOwn(campaigns, params.get("campaign")) ? params.get("campaign") : "office";
  const { data: user, isPending } = useQuery({ queryKey: ["landing-manager"], queryFn: () => base44.auth.me() });
  if (isPending) return <p role="status" className="py-12 text-center">טוענים…</p>;
  if (!isManagerOrAdmin(user)) return <Navigate to="/" replace />;
  return <div dir="rtl" className="max-w-5xl mx-auto space-y-5">
    <div><h1 className="text-2xl font-bold">עמודי נחיתה</h1><p className="text-muted-foreground mt-1">כל הקמפיינים במקום אחד. לכל עמוד קישור ורשימת נרשמים נפרדת.</p></div>
    <Tabs value={selected} onValueChange={campaign => setParams({ campaign })} dir="rtl">
      <TabsList className="h-auto w-full grid grid-cols-3 gap-1 p-1">
        {Object.entries(campaigns).map(([key, config]) => <TabsTrigger key={key} value={key} className="min-h-12 whitespace-normal text-xs sm:text-sm px-2">{config.title}</TabsTrigger>)}
      </TabsList>
      {Object.entries(campaigns).map(([key]) => <TabsContent key={key} value={key} className="space-y-6 mt-5">
        <LandingShareCard key={key} campaign={key} />
        <section id={selected === key ? "registrations" : undefined} aria-label={`פניות: ${campaigns[key].title}`} className="scroll-mt-5">
          {key === "referral" ? <ReferralsReport embedded /> : <LeadsReport key={key} campaign={key} embedded />}
        </section>
      </TabsContent>)}
    </Tabs>
  </div>;
}