import { useEffect } from "react";
import useLandingImages from "@/hooks/useLandingImages";
import OfficeHero from "@/components/landing/office/OfficeHero";
import OfficeGallery from "@/components/landing/office/OfficeGallery";
import OfficeIncludes from "@/components/landing/office/OfficeIncludes";
import OfficeTour from "@/components/landing/office/OfficeTour";
import OfficeStickyBar from "@/components/landing/office/OfficeStickyBar";
import "@/components/landing/office/OfficeTour.css";

export default function DailyOffice() {
  const editor = useLandingImages("office");
  useEffect(() => { document.title = "משרד פרטי בבאר שבע | Workies"; }, []);
  return <main dir="rtl" lang="he" className="ot-page">
    {editor.needsLogin && <div className="ot-admin-bar">עריכת תמונות זמינה למנהלים בלבד. <button type="button" onClick={editor.login}>התחברות</button></div>}
    <OfficeHero />
    <OfficeGallery editor={editor} />
    <OfficeIncludes />
    <OfficeTour />
    <OfficeStickyBar />
  </main>;
}