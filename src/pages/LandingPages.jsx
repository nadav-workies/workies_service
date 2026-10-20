import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isManagerOrAdmin } from "@/lib/permissions";
import LandingShareCard from "@/components/landing/LandingShareCard";

export default function LandingPages() {
  const { data: user, isPending } = useQuery({ queryKey: ["landing-manager"], queryFn: () => base44.auth.me() });
  if (isPending) return <p role="status" className="py-12 text-center">טוענים…</p>;
  if (!isManagerOrAdmin(user)) return <Navigate to="/" replace />;
  return <div dir="rtl" className="max-w-3xl mx-auto space-y-5"><h1 className="text-2xl font-bold">עמודי נחיתה</h1><LandingShareCard /></div>;
}