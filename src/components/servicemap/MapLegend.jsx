import { ROOM_STATUS_COLORS } from '@/lib/roomServiceStatus';

const ITEMS = [
  { status: 'clear', label: 'ללא קריאות' },
  { status: 'open', label: 'קריאה פתוחה' },
  { status: 'urgent', label: 'דחוף / מתקרב ל-SLA' },
  { status: 'breached', label: 'קריטי / חריגת SLA' },
];

export default function MapLegend() {
  return (
    <div className="flex flex-wrap gap-3 items-center" dir="rtl">
      {ITEMS.map(item => {
        const c = ROOM_STATUS_COLORS[item.status];
        return (
          <div key={item.status} className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: c.bg, borderColor: c.border }}
            />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          <span className="bg-red-600 text-white text-[8px] font-bold px-1 rounded-full">2</span>
          <span className="bg-orange-500 text-white text-[8px] font-bold px-1 rounded-full">1</span>
          <span className="bg-blue-500 text-white text-[8px] font-bold px-1 rounded-full">3</span>
        </div>
        <span className="text-xs text-muted-foreground">מספר קריאות לפי סוג</span>
      </div>
    </div>
  );
}