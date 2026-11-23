import useCampaignValidity from "@/hooks/useCampaignValidity";
import campaigns from "@/components/landing/campaigns";
import PageStatCard from "@/components/landing/PageStatCard";
import useShowcaseStats from "@/components/landing/eventor/useShowcaseStats";

const LABELS = { view: "צפיות", whatsapp: "וואטסאפ", phone: "טלפון" };

// Card for a showcase page: inquiries (WhatsApp + phone clicks) instead of leads.
export default function ShowcaseStatCard({ campaign, onSelect }) {
  const { active, isPending } = useCampaignValidity(campaign);
  const { data } = useShowcaseStats(campaign);
  const rows = ["view", "whatsapp", "phone"].map(status => ({ status, count: data?.[status] ?? 0 }));
  const title = `${campaigns[campaign].title}${!isPending && !active ? " · טיוטה" : ""}`;
  return <PageStatCard title={title} total={data?.total ?? 0} rows={rows} labels={LABELS} onSelect={() => onSelect(campaign)} />;
}