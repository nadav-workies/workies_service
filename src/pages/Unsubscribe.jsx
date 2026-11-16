import { useState } from "react";
import { Button } from "@/components/ui/button";

// עמוד הסרה ציבורי (מוקאפ). במערכת האמיתית: טוקן חתום בקישור, עדכון consent_status דרך פונקציית backend.
export default function Unsubscribe() {
  const [done, setDone] = useState(false);
  return <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-4">
    <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center space-y-4">
      <p className="text-lg font-black tracking-wide" style={{ color: "#0f5c63" }}>WORKIES</p>
      {!done ? <>
        <h1 className="text-xl font-bold">הסרה מרשימת התפוצה</h1>
        <p className="text-sm text-muted-foreground">הכתובת <b dir="ltr">michal.a@example.co.il</b> לא תקבל יותר דיוור שיווקי מוורקיז.</p>
        <Button className="w-full" onClick={() => setDone(true)}>הסירו אותי</Button>
        <p className="text-xs text-muted-foreground">מיילים הקשורים לשירות שאתם מקבלים מאיתנו (אישורי הרשמה, תזכורות) ימשיכו להגיע.</p>
      </> : <>
        <h1 className="text-xl font-bold">הוסרת בהצלחה</h1>
        <p className="text-sm text-muted-foreground">לא תקבל יותר דיוור שיווקי. אם זו טעות, אפשר להירשם שוב בכל אחד מעמודי וורקיז.</p>
      </>}
      <p className="text-[11px] text-amber-700">מוקאפ · שום שינוי לא נשמר</p>
    </div>
  </div>;
}
