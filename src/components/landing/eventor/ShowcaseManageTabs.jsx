import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LandingShareCard from "@/components/landing/LandingShareCard";
import CampaignValidityEditor from "@/components/landing/CampaignValidityEditor";
import ShowcaseStatsPanel from "@/components/landing/eventor/ShowcaseStatsPanel";
import EventorSettingsEditor from "@/components/landing/eventor/EventorSettingsEditor";
import LeadsReport from "@/pages/LeadsReport";
import EventorGameCard from "@/components/landing/eventor/EventorGameCard";
import campaigns from "@/components/landing/campaigns";

// Management for a showcase page: activity, form leads (when it has a form), settings.
export default function ShowcaseManageTabs({ campaign, isAdmin }) {
  const hasLeads = !!campaigns[campaign].entity;
  const hasGame = campaign === "eventor";
  const cols = ["grid-cols-2", "grid-cols-3", "grid-cols-4"][Number(hasLeads) + Number(hasGame)];
  return <Tabs defaultValue="activity" dir="rtl" className="min-w-0">
    <TabsList className={`grid ${cols} w-full h-11`}>
      <TabsTrigger value="activity" className="h-9">צפיות ופניות</TabsTrigger>
      {hasLeads && <TabsTrigger value="leads" className="h-9">לידים</TabsTrigger>}
      {hasGame && <TabsTrigger value="game" className="h-9">משחק</TabsTrigger>}
      <TabsTrigger value="settings" className="h-9">שיתוף והגדרות</TabsTrigger>
    </TabsList>
    <TabsContent value="activity" className="mt-4 min-w-0"><ShowcaseStatsPanel campaign={campaign} /></TabsContent>
    {hasLeads && <TabsContent value="leads" className="mt-4 min-w-0"><LeadsReport key={campaign} campaign={campaign} embedded /></TabsContent>}
    {hasGame && <TabsContent value="game" className="mt-4 min-w-0"><EventorGameCard /></TabsContent>}
    <TabsContent value="settings" className="space-y-4 mt-4 min-w-0">
      <LandingShareCard campaign={campaign} />
      {isAdmin && <EventorSettingsEditor />}
      {isAdmin && <CampaignValidityEditor campaign={campaign} />}
    </TabsContent>
  </Tabs>;
}