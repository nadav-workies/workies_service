import ReferralLanding from "@/components/referral/ReferralLanding";
import ReferralShareCard from "@/components/referral/ReferralShareCard";

export default function ReferralPage() {
  return (
    <div className="max-w-xl mx-auto space-y-4" dir="rtl">
      <ReferralLanding className="rounded-2xl" />
      <ReferralShareCard />
    </div>
  );
}