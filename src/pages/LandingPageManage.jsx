import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { isManagerOrAdmin } from "@/lib/permissions";
import LandingShareCard from "@/components/landing/LandingShareCard";
import CampaignValidityEditor from "@/components/landing/CampaignValidityEditor";
import CampaignStatusToggle from "@/components/landing/CampaignStatusToggle";
import LeadsReport from "@/pages/LeadsReport";
import ReferralsReport from "@/pages/ReferralsReport";
import campaigns from "@/components/landing/campaigns";

export default function LandingPageManage() {
  const { campaign } = useParams();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "";
  const { data: user, isPending } = useQuery({ queryKey: ["landing-manager"], queryFn: () => base44.auth.me() });
  if (!Object.hasOwn(campaigns, campaign)) return <Navigate to="/landing-pages" replace />;
  if (isPending) return <p role="status" className="py-12 text-center">טוענים…</p>;
  if (!isManagerOrAdmin(user)) return <Navigate to="/" replace />;
  return <div dir="rtl" className="w-full min-w-0 max-w-3xl mx-auto space-y-5">
    <Link to="/landing-pages" className="inline-flex items-center gap-1 min-h-11 text-primary"><ArrowRight className="w-4 h-4" />חזרה לדשבורד עמודי הנחיתה</Link>
    <h1 className="text-2xl font-bold break-words">{campaigns[campaign].title}</h1>
    <CampaignStatusToggle campaign={campaign} canEdit={user.role === "admin"} />
    <LandingShareCard campaign={campaign} />
    {user.role === "admin" && <CampaignValidityEditor campaign={campaign} />}
    <section id="registrations" aria-label="פניות" className="scroll-mt-5 min-w-0">
      {campaign === "referral" ? <ReferralsReport embedded status={status} /> : <LeadsReport key={campaign} campaign={campaign} embedded status={status} onClearStatus={() => setParams({})} />}
    </section>
  </div>;
}