import { base44 } from "@/api/base44Client";

export function dateIsActive(endDate, now = new Date()) {
  return !endDate || new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jerusalem" }).format(now) <= endDate;
}
export async function getCampaignValidity(campaign) {
  const { items } = await base44.entities.CampaignValidity.filter({ campaign }, { sort: "-created_date", limit: 1 });
  return items[0] || { campaign, end_date: campaign === "referral" ? "2026-10-15" : "" };
}
export function formatEndDate(value) {
  return value ? value.split("-").reverse().join(".") : "ללא הגבלת תוקף";
}