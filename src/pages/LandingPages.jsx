import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { canManageLeads } from "@/lib/permissions";
import LandingDashboard from "@/components/landing/LandingDashboard";

export default function LandingPages() {
  const navigate = useNavigate();
  const { data: user, isPending } = useQuery({ queryKey: ["landing-manager"], queryFn: () => base44.auth.me() });
  if (isPending) return <p role="status" className="py-12 text-center">טוענים…</p>;
  if (!canManageLeads(user)) return <Navigate to="/" replace />;
  return <div dir="rtl" className="w-full min-w-0 max-w-5xl mx-auto space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold">עמודי נחיתה</h1><p className="text-muted-foreground mt-1">לחיצה על עמוד פותחת את אזור הניהול שלו.</p></div>
      <Button asChild variant="outline" className="min-h-11 gap-2"><Link to="/mailing-lists"><Users className="w-4 h-4" />רשימות תפוצה</Link></Button>
    </div>
    <LandingDashboard onSelect={(campaign, status) => navigate(`/landing-pages/${campaign}${status ? `?status=${status}` : ""}`)} />
  </div>;
}