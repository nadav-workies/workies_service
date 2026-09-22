// Canonical Workies room map + room/phone normalization helpers.
// Shared by importActiveCustomers and syncActiveCustomers.

export const ROOMS: { n: string; l: string; a: string }[] = [
  { n: "1", l: "V - O1", a: "משרדים" }, { n: "2", l: "IV - O2", a: "משרדים" },
  { n: "3", l: "IV - O3", a: "משרדים" }, { n: "4", l: "IV - O4", a: "משרדים" },
  { n: "5", l: "IV - O5", a: "משרדים" }, { n: "6", l: "VI + VIEW - O6 - בקר", a: "משרדים" },
  { n: "7", l: "V+ - O7", a: "משרדים" }, { n: "8", l: "CONFERENCE - O8", a: "חדרי ישיבות" },
  { n: "9", l: "I - O9", a: "משרדים" }, { n: "10", l: "II - O10", a: "משרדים" },
  { n: "11", l: "II - O11", a: "משרדים" }, { n: "12", l: "II - O12", a: "משרדים" },
  { n: "13", l: "I - O13", a: "משרדים" }, { n: "14", l: "II - O14 - בקר", a: "משרדים" },
  { n: "15", l: "II - O15", a: "משרדים" }, { n: "16", l: "II - O16", a: "משרדים" },
  { n: "17", l: "II - O17 - בקר", a: "משרדים" }, { n: "18", l: "II - O18", a: "משרדים" },
  { n: "19", l: "II - O19", a: "משרדים" }, { n: "20", l: "II - O20", a: "משרדים" },
  { n: "21", l: "I - O21", a: "משרדים" }, { n: "22", l: "22 II מורחב", a: "משרדים" },
  { n: "23", l: "23 II מורחב", a: "משרדים" }, { n: "24", l: "24 II מורחב", a: "משרדים" },
  { n: "25", l: "25 II מורחב", a: "משרדים" }, { n: "26", l: "26 CONFERENCE - בקר", a: "חדרי ישיבות" },
  { n: "27", l: "27 II מורחב - בקר", a: "משרדים" }, { n: "28", l: "28 CONFERENCE", a: "חדרי ישיבות" },
  { n: "29", l: "29 II מורחב", a: "משרדים" }, { n: "30", l: "30 II מורחב", a: "משרדים" },
  { n: "31", l: "31 VI + VIEW", a: "משרדים" }, { n: "32", l: "32 I", a: "משרדים" },
  { n: "33", l: "בקר - 33 IV +", a: "משרדים" }, { n: "34", l: "34 I - בקר", a: "משרדים" },
  { n: "35", l: "35 IV +", a: "משרדים" }, { n: "36", l: "36 VI + VIEW", a: "משרדים" },
  { n: "37", l: "37 I", a: "משרדים" }, { n: "38", l: "38 III - בקר", a: "משרדים" },
  { n: "39", l: "39 I", a: "משרדים" }, { n: "40", l: "40 I", a: "משרדים" },
  { n: "41", l: "41 I", a: "משרדים" }, { n: "42", l: "42 I", a: "משרדים" },
  { n: "43", l: "43 I - בקר", a: "משרדים" }, { n: "44", l: "44 I", a: "משרדים" },
  { n: "45", l: "45 I", a: "משרדים" }, { n: "46", l: "46 III", a: "משרדים" },
  { n: "47", l: "47 III", a: "משרדים" }, { n: "48", l: "48 III", a: "משרדים" },
  { n: "49", l: "49 I", a: "משרדים" }, { n: "50", l: "50 CHILL - בקר", a: "חללים משותפים" },
  { n: "51", l: "51 I", a: "משרדים" }, { n: "52", l: "52 II", a: "משרדים" },
  { n: "53", l: "53 II", a: "משרדים" }, { n: "54", l: "54 V", a: "משרדים" },
  { n: "55", l: "55 III בקר", a: "משרדים" }, { n: "56", l: "56 III", a: "משרדים" },
  { n: "57", l: "57 II", a: "משרדים" }, { n: "58", l: "II 58 בקר", a: "משרדים" },
  { n: "59", l: "59 II", a: "משרדים" }, { n: "60", l: "60 II", a: "משרדים" },
  { n: "61", l: "61 III", a: "משרדים" }, { n: "62", l: "62 III", a: "משרדים" },
  { n: "63", l: "63 III", a: "משרדים" }, { n: "64", l: "64 III", a: "משרדים" },
  { n: "65", l: "65 II", a: "משרדים" }, { n: "66", l: "66 II", a: "משרדים" },
  { n: "67", l: "67 II", a: "משרדים" }, { n: "68", l: "68 II", a: "משרדים" },
  { n: "69", l: "69 IV", a: "משרדים" }, { n: "70", l: "70 CONFERENCE", a: "חדרי ישיבות" },
  { n: "71", l: "71 III", a: "משרדים" }, { n: "72", l: "72 III", a: "משרדים" },
  { n: "73", l: "מס' 73 - III", a: "משרדים" }, { n: "74", l: "מס' 74 - בקר", a: "משרדים" },
  { n: "75", l: "מס' 75 - IV", a: "משרדים" }, { n: "76", l: "מס' 76 - I+", a: "משרדים" },
  { n: "77", l: "מס' 77 - II+", a: "משרדים" }, { n: "78", l: "מס' 78 II", a: "משרדים" },
  { n: "79", l: "מס' 79 - II+ - בקר", a: "משרדים" }, { n: "80", l: "מס' 80 II - בקר", a: "משרדים" },
  { n: "81", l: "מס' 81 I+", a: "משרדים" }, { n: "82", l: "מס' 82 - II", a: "משרדים" },
  { n: "83", l: "מס' 83 - III", a: "משרדים" }, { n: "84", l: "מס' 84 - I+", a: "משרדים" },
  { n: "85", l: "מס' 85 +IV - בקר", a: "משרדים" }, { n: "101", l: "101 III", a: "משרדים" },
  { n: "102", l: "102 III", a: "משרדים" }, { n: "103", l: "103 II", a: "משרדים" },
  { n: "104", l: "104 II - בקר", a: "משרדים" }, { n: "105", l: "105 II", a: "משרדים" },
];

export const roomsByNumber = new Map(
  ROOMS.map(r => [r.n, { room_label: r.l, room_area: r.a }])
);

// Non-room spaces that appear in the active-customers report instead of an office.
export function isRoomlessSpace(label: string): boolean {
  return /אקווריום|free\s*-?\s*pass|עמדה חופשית/i.test(String(label || ""));
}

// "Office 48" -> "48", "משרד 101" -> "101", "Office 31A 🤝 (82.35%)" -> "31"
export function extractRoomNumber(label: string): string {
  if (isRoomlessSpace(label)) return "";
  const m = String(label || "").match(/\d+/);
  if (!m) return "";
  return String(parseInt(m[0], 10));
}

export function normalizePhone(value: any): string {
  if (value === null || value === undefined) return "";
  let raw = String(value).trim();
  if (/e\+/i.test(raw)) {
    const num = Number(raw);
    if (Number.isFinite(num)) raw = String(Math.trunc(num));
  }
  raw = raw.replace(/[^\d+]/g, "");
  if (raw.startsWith("972")) raw = "+" + raw;
  if (raw.length === 9 && raw.startsWith("5")) raw = "+972" + raw;
  if (raw.length === 10 && raw.startsWith("0")) raw = "+972" + raw.slice(1);
  return raw;
}