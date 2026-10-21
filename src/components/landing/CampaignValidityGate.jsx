import useCampaignValidity from "@/hooks/useCampaignValidity";
import { formatEndDate } from "@/lib/campaignValidity";

export default function CampaignValidityGate({ campaign, children }) {
  const { isPending, isError, active, endDate } = useCampaignValidity(campaign);
  if (isPending) return <p role="status" className="text-center py-6">טוענים…</p>;
  if (isError) return <p role="alert" className="text-center py-6">לא ניתן לטעון את הטופס. נסו לרענן.</p>;
  if (!active) return <p role="status" className="text-center py-6">ההרשמה הסתיימה ב־{formatEndDate(endDate)}. תודה על ההתעניינות!</p>;
  return children;
}