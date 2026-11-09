const TITLE = "HR מחוץ לשגרה | מיטאפ Workies";
const LOCATION = "WORKIES, אליהו נאווי 24, באר שבע";
const DETAILS = "בוקר של קפה, קולגות ורעיונות חדשים. https://service.workies.co.il/hr-meetup";
const START = "20261124T070000Z";
const END = "20261124T100000Z";

const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(TITLE)}&dates=${START}/${END}&details=${encodeURIComponent(DETAILS)}&location=${encodeURIComponent(LOCATION)}`;

function downloadIcs() {
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Workies//HR Meetup//HE", "BEGIN:VEVENT", "UID:hr-meetup-20261124@workies",
    `DTSTAMP:${START}`, `DTSTART:${START}`, `DTEND:${END}`, `SUMMARY:${TITLE}`, `DESCRIPTION:${DETAILS}`, `LOCATION:${LOCATION.replace(/,/g, "\\,")}`,
    "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "hr-meetup-workies.ics" });
  a.click();
  URL.revokeObjectURL(url);
}

export default function HRCalendarButtons() {
  return <div className="hr-cal">
    <p className="hr-cal-title">שריון ביומן</p>
    <div className="hr-cal-row">
      <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="hr-cal-btn">Google Calendar</a>
      <button type="button" onClick={downloadIcs} className="hr-cal-btn">Apple / Outlook</button>
    </div>
  </div>;
}