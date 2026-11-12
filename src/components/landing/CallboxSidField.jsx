import { useEffect, useRef } from "react";
import { getCallboxSid } from "@/lib/callboxSid";

// Hidden form field carrying the CallBox session id (SID).
export default function CallboxSidField() {
  const ref = useRef(null);
  useEffect(() => {
    const fill = () => { if (ref.current) ref.current.value = getCallboxSid(); };
    fill();
    const timer = setInterval(fill, 2000);
    return () => clearInterval(timer);
  }, []);
  return <input ref={ref} type="hidden" name="session_id" />;
}