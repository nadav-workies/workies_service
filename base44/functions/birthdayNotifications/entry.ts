import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all users with birthdate
    const users = await base44.asServiceRole.entities.User.list('-created_date', 500);

    // Current date in Israel timezone
    const now = new Date();
    const israelStr = now.toLocaleString("en-US", { timeZone: "Asia/Jerusalem" });
    const israelDate = new Date(israelStr);
    const todayMonth = israelDate.getMonth() + 1;
    const todayDay = israelDate.getDate();

    // Tomorrow
    const tomorrow = new Date(israelDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowMonth = tomorrow.getMonth() + 1;
    const tomorrowDay = tomorrow.getDate();

    const birthdaysToday = users.filter(u => {
      if (!u.birthdate) return false;
      const bd = new Date(u.birthdate + "T00:00:00");
      return (bd.getMonth() + 1) === todayMonth && bd.getDate() === todayDay;
    });

    const birthdaysTomorrow = users.filter(u => {
      if (!u.birthdate) return false;
      const bd = new Date(u.birthdate + "T00:00:00");
      return (bd.getMonth() + 1) === tomorrowMonth && bd.getDate() === tomorrowDay;
    });

    const results = { greetingsSent: 0, managerAlertsSent: 0, birthdaysToday: birthdaysToday.length, birthdaysTomorrow: birthdaysTomorrow.length, errors: [] };

    // Send birthday greetings to users whose birthday is today
    for (const user of birthdaysToday) {
      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: "🎉 יום הולדת שמח!",
          body: `<div dir="rtl" style="font-family: Heebo, Arial, sans-serif; text-align: center; padding: 40px; background: #fef3f2; border-radius: 12px;">
            <h1 style="color: #f97316; margin-bottom: 20px;">🎉 יום הולדת שמח, ${user.full_name || ''}!</h1>
            <p style="font-size: 18px; color: #333; line-height: 1.6;">כל צוות Workies מאחל לך שנה מוצלחת, גדושה בבריאות, אושר והצלחה! 🎂🎁</p>
            <p style="color: #666; margin-top: 30px;">שלכם תמיד,<br><strong>צוות Workies</strong></p>
          </div>`
        });
        results.greetingsSent++;
      } catch (e) {
        results.errors.push(`greeting ${user.email}: ${e.message}`);
      }
    }

    // Send manager alerts for tomorrow's birthdays
    if (birthdaysTomorrow.length > 0) {
      const managers = users.filter(u => (u.role === 'admin' || u.role === 'manager') && u.email);
      const managerEmails = [...new Set(managers.map(m => m.email))];

      const birthdayList = birthdaysTomorrow.map(u => {
        const bd = new Date(u.birthdate + "T00:00:00");
        return `• <strong>${u.full_name || u.email}</strong> — יום הולדת מחר (${bd.getDate()}/${bd.getMonth() + 1})`;
      }).join('<br>');

      for (const email of managerEmails) {
        try {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: "🎂 תזכורת: ימי הולדת מחר",
            body: `<div dir="rtl" style="font-family: Heebo, Arial, sans-serif; padding: 30px; background: #fff7ed; border-radius: 12px;">
              <h2 style="color: #f97316;">🎂 תזכורת ימי הולדת</h2>
              <p>המשתמשים הבאים חוגגים יום הולדת <strong>מחר</strong>:</p>
              <div style="background: #ffffff; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #fed7aa;">
                ${birthdayList}
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">זוהי הודעה אוטומטית ממערכת Workies</p>
            </div>`
          });
          results.managerAlertsSent++;
        } catch (e) {
          results.errors.push(`manager alert ${email}: ${e.message}`);
        }
      }
    }

    return Response.json({ ok: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});