import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function useLandingImages(campaign) {
  const client = useQueryClient();
  const key = ["landing-assets", campaign];
  const { data: items = [] } = useQuery({ queryKey: key, queryFn: () => base44.entities.LandingPageAsset.filter({ campaign }) });
  const { data: canEdit = false } = useQuery({
    queryKey: ["landing-image-editor"],
    queryFn: async () => (await base44.auth.isAuthenticated()) && (await base44.auth.me()).role === "admin",
  });
  const images = Object.fromEntries(items.map(i => [i.slot, i.image_url]));
  async function upload(slot, file) {
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    const existing = items.find(i => i.slot === slot);
    if (existing) await base44.entities.LandingPageAsset.update(existing.id, { image_url: file_url });
    else await base44.entities.LandingPageAsset.create({ campaign, slot, image_url: file_url });
    await client.invalidateQueries({ queryKey: key });
  }
  return { images, canEdit, upload };
}