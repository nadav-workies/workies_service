import { ArrowLeft } from "lucide-react";
import { scrollToLeadForm } from "@/lib/eventorLeadScroll";

// Text link with an arrow at the end of a section. Default target: the lead form.
export default function EventorSoftCta({ children, light, href, onClick }) {
  const external = !!href;
  return <a
    href={href || "#lead-form"}
    {...(external ? { target: "_blank", rel: "noopener", onClick } : { onClick: scrollToLeadForm })}
    className={`ev-soft${light ? " ev-soft-light" : ""}`}
  >{children}<ArrowLeft className="w-[18px] h-[18px]" aria-hidden="true" /></a>;
}