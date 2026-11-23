import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LandingShareCard from "@/components/landing/LandingShareCard";
import CampaignValidityEditor from "@/components/landing/CampaignValidityEditor";
import ShowcaseStatsPanel from "@/components/landing/eventor/ShowcaseStatsPanel";
import EventorSettingsEditor from "@/components/landing/eventor/EventorSettingsEditor";

// Management for a showcase page: activity instead of leads, no RSVP or lead emails.
export default function ShowcaseManageTabs({ campaign, isAdmin }) {
  return <Tabs defaultValue="activity" dir="rtl" className="min-w-0">
    <TabsList className="grid grid-cols-2 w-full h-11">
      <TabsTrigger value="activity" className="h-9">צפיות ופניות</TabsTrigger>
      <TabsTrigger value="settings" className="h-9">שיתוף והגדרות</TabsTrigger>
    </TabsList>
    <TabsContent value="activity" className="mt-4 min-w-0"><ShowcaseStatsPanel campaign={campaign} /></TabsContent>
    <TabsContent value="settings" className="space-y-4 mt-4 min-w-0">
      <LandingShareCard campaign={campaign} />
      {isAdmin && <EventorSettingsEditor />}
      {isAdmin && <CampaignValidityEditor campaign={campaign} />}
    </TabsContent>
  </Tabs>;
}