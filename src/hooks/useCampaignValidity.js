import { useQuery } from "@tanstack/react-query";
import { getCampaignValidity, dateIsActive } from "@/lib/campaignValidity";

export default function useCampaignValidity(campaign) {
  const query = useQuery({ queryKey: ["campaign-validity", campaign], queryFn: () => getCampaignValidity(campaign), refetchInterval: 30000 });
  return { ...query, active: !!query.data && dateIsActive(query.data.end_date), endDate: query.data?.end_date };
}