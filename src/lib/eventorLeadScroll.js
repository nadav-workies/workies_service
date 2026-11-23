// Smooth scroll to the lead form, then move focus to its first field.
export function scrollToLeadForm(e) {
  e?.preventDefault();
  const el = document.getElementById("lead-form");
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => el.querySelector("input")?.focus({ preventScroll: true }), 800);
}