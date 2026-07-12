/**
 * eventExport.js — ייצוא רשימת נרשמים לאירוע לקובץ CSV (נפתח באקסל).
 */

const STATUS_LABELS = {
  registered: 'נרשם',
  approved: 'אושר',
  pending_approval: 'ממתין לאישור',
  cancelled: 'בוטל',
  attended: 'הגיע',
  no_show: 'לא הגיע',
  waitlist: 'רשימת המתנה',
};

export function exportRegistrationsToCSV(registrations, eventName = 'event') {
  const headers = [
    'שם', 'טלפון', 'מייל', 'משתתפים', 'ילדים',
    'דייר פעיל', 'חברה', 'חדר', 'סטטוס', 'תאריך הרשמה', 'הערות',
  ];

  const rows = registrations.map(r => [
    r.full_name || '',
    r.phone || '',
    r.email || '',
    r.participants_count || 0,
    r.children_count || 0,
    r.is_active_tenant ? 'כן' : 'לא',
    r.company_name || '',
    r.room_number || '',
    STATUS_LABELS[r.registration_status] || r.registration_status,
    r.registered_at ? new Date(r.registered_at).toLocaleString('he-IL') : '',
    (r.notes || '').replace(/"/g, '""'),
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell)}"`).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `registrations-${eventName}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { STATUS_LABELS };