import { useQuery } from "@tanstack/react-query";
import { getCampaignValidity, campaignActive } from "@/lib/campaignValidity";

export default function useCampaignValidity(campaign) {
  const query = useQuery({ queryKey: ["campaign-validity", campaign], queryFn: () => getCampaignValidity(campaign), refetchInterval: 30000 });
  return { ...query, active: campaignActive(query.data), enabled: query.data?.is_enabled !== false, endDate: query.data?.end_date };
}