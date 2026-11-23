import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Views and clicks for a showcase page, counted on the server.
export default function useShowcaseStats(page) {
  return useQuery({
    queryKey: ["showcase-stats", page],
    refetchInterval: 30000,
    queryFn: async () => {
      const { rows } = await base44.entities.LandingPageEvent.aggregate({ query: { landing_page_id: page }, groupBy: "event_type" });
      const by = Object.fromEntries(rows.map(r => [r.event_type, r.count]));
      const view = by.view || 0, whatsapp = by.whatsapp_click || 0, phone = by.phone_click || 0, waze = by.waze_click || 0;
      return { view, whatsapp, phone, waze, total: whatsapp + phone };
    },
  });
}