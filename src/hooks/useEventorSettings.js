import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { EVENTOR_DEFAULTS } from "@/lib/eventorContent";

const filled = obj => Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== null && v !== undefined && v !== ""));

export default function useEventorSettings() {
  return useQuery({
    queryKey: ["eventor-settings"],
    queryFn: async () => {
      const { items } = await base44.entities.EventorSettings.list({ sort: "-created_date", limit: 1 });
      return { ...EVENTOR_DEFAULTS, ...filled(items[0]) };
    },
  });
}