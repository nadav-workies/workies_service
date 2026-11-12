import { useEffect, useRef } from "react";
import { readCtmSid } from "@/lib/ctmSid";

// Hidden "sid" field: polls CTM every 300 ms for up to 10 s; submit re-checks via getLeadSid().
export default function CallboxSidField() {
  const ref = useRef(null);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      const sid = readCtmSid();
      if (sid && ref.current) ref.current.value = sid;
      if (sid || Date.now() - started > 10000) clearInterval(timer);
    }, 300);
    return () => clearInterval(timer);
  }, []);
  return <input ref={ref} type="hidden" name="sid" />;
}