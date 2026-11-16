import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function useStaticLists() {
  return useQuery({
    queryKey: ["mail", "staticLists"],
    queryFn: async () => (await base44.entities.MailList.filter({ type: "static" }, { sort: "name", limit: 200 })).items,
  });
}