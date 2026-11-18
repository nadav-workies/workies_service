import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { SOURCES } from "@/lib/mailing";

const C = base44.entities.MailContact, N = base44.entities.NotificationLog;

// Contact counts straight from the database: by consent status and by source.
export function useContactStats() {
  return useQuery({
    queryKey: ["mail", "stats", "contacts"],
    queryFn: async () => {
      const keys = Object.keys(SOURCES);
      const [consent, lists, ...counts] = await Promise.all([
        C.aggregate({ groupBy: "consent" }),
        base44.entities.MailList.count({}),
        ...keys.map(k => C.count({ sources: k })),
      ]);
      const by = Object.fromEntries(consent.rows.map(r => [r.consent, r.count]));
      const total = consent.rows.reduce((a, r) => a + r.count, 0);
      return { total, by, lists, sources: keys.map((k, i) => ({ key: k, label: SOURCES[k], count: counts[i] })) };
    },
  });
}

// Emails the system actually sent in the last `days` days, from the message log.
export function useEmailStats(days = 30) {
  return useQuery({
    queryKey: ["mail", "stats", "emails", days],
    queryFn: async () => {
      const q = { sent_at: { $gte: new Date(Date.now() - days * 864e5).toISOString() } };
      const [status, areas, tracked, opened, recent] = await Promise.all([
        N.aggregate({ query: q, groupBy: "status" }),
        N.aggregate({ query: { ...q, status: "sent" }, groupBy: "source" }),
        N.count({ ...q, status: "sent", tracking_id: { $gt: "" } }),
        N.count({ ...q, open_count: { $gt: 0 } }),
        N.filter({ open_count: { $gt: 0 } }, { sort: "-last_opened_at", limit: 6 }),
      ]);
      const by = Object.fromEntries(status.rows.map(r => [r.status, r.count]));
      return { sent: by.sent || 0, failed: by.failed || 0, tracked, opened, recent: recent.items, areas: areas.rows.sort((a, b) => b.count - a.count) };
    },
  });
}

// All-time sends and unique opens per designed email template.
export function useTemplateStats() {
  return useQuery({
    queryKey: ["mail", "stats", "templates"],
    queryFn: async () => {
      const named = { template_name: { $gt: "" } };
      const [sent, opened] = await Promise.all([
        N.aggregate({ query: { ...named, status: "sent" }, groupBy: "template_name" }),
        N.aggregate({ query: { ...named, open_count: { $gt: 0 } }, groupBy: "template_name" }),
      ]);
      const opens = Object.fromEntries(opened.rows.map(r => [r.template_name, r.count]));
      return Object.fromEntries(sent.rows.map(r => [r.template_name, { sent: r.count, opened: opens[r.template_name] || 0 }]));
    },
  });
}