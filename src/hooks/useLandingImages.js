import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function useLandingImages(campaign) {
  const client = useQueryClient();
  const key = ["landing-assets", campaign];
  const { data: items = [] } = useQuery({ queryKey: key, queryFn: () => base44.entities.LandingPageAsset.filter({ campaign }) });
  // Editing is opt-in via ?edit=1 so the live link never shows edit mode, even for logged-in admins.
  const editRequested = new URLSearchParams(window.location.search).get("edit") === "1";
  const { data: canEdit = false, isFetched } = useQuery({
    queryKey: ["landing-image-editor"],
    queryFn: async () => (await base44.auth.isAuthenticated()) && (await base44.auth.me()).role === "admin",
    enabled: editRequested,
  });
  const needsLogin = editRequested && isFetched && !canEdit;
  const login = () => base44.auth.redirectToLogin(window.location.href);
  const DEFAULTS = campaign === "hr_meetup" ? { speaker_liron: "https://base44.app/api/apps/6a1d5a36316988d9f113f88e/files/mp/public/6a1d5a36316988d9f113f88e/f630af83b_hozrim-lamaslul.png" } : {};
  const images = { ...DEFAULTS, ...Object.fromEntries(items.map(i => [i.slot, i.image_url])) };
  async function upload(slot, file) {
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    const existing = items.find(i => i.slot === slot);
    if (existing) await base44.entities.LandingPageAsset.update(existing.id, { image_url: file_url });
    else await base44.entities.LandingPageAsset.create({ campaign, slot, image_url: file_url });
    await client.invalidateQueries({ queryKey: key });
  }
  return { images, canEdit, upload, needsLogin, login };
}