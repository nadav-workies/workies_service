/**
 * icsGenerator.js — יוצר קובץ ICS להורדה ופותח אותו.
 */

function formatICSDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function generateICSContent(event) {
  const arrivalTime = event.arrival_time || '10:00';
  const startDateTime = new Date(`${event.event_date}T${arrivalTime}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);
  const location = `${event.location_name}, ${event.location_address}`;
  const uid = `workies-event-${event.id || Date.now()}@workies`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Workies//Event//HE',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startDateTime)}`,
    `DTEND:${formatICSDate(endDateTime)}`,
    `SUMMARY:${event.event_name}`,
    `DESCRIPTION:${(event.event_description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(event) {
  const ics = generateICSContent(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.event_name || 'workies-event'}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildGoogleCalendarLink(event) {
  const arrivalTime = event.arrival_time || '10:00';
  const startDateTime = new Date(`${event.event_date}T${arrivalTime}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);
  const location = `${event.location_name}, ${event.location_address}`;
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.event_name)}&dates=${fmt(startDateTime)}/${fmt(endDateTime)}&details=${encodeURIComponent(event.event_description || '')}&location=${encodeURIComponent(location)}`;
}