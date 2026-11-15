import EditableImage from "@/components/landing/EditableImage";

// Default photos are cut from the approved mockup sheet; admins replace any of them via ?edit=1.
const SHEET = "https://base44.app/api/apps/6a1d5a36316988d9f113f88e/files/mp/public/6a1d5a36316988d9f113f88e/05f35138d_office_2880x4074.jpg";
const W = 924, H = 1307;
const PHOTOS = [
  { slot: "single", label: "משרד ליחיד", x: 704 },
  { slot: "double", label: "משרד לשניים או שלושה", x: 548 },
  { slot: "meeting", label: "חדר ישיבות לפגישות עם לקוחות", x: 392 },
  { slot: "reception", label: "הקבלה" },
  { slot: "coffee", label: "פינת הקפה", x: 80 },
];

function sheetCrop(x) {
  const w = 140, h = 187, y = 490;
  return { backgroundImage: `url(${SHEET})`, backgroundSize: `${(W / w) * 100}% auto`, backgroundPosition: `${(x / (W - w)) * 100}% ${(y / (H - h)) * 100}%` };
}

export default function OfficeGallery({ editor }) {
  const list = PHOTOS.filter(p => p.x !== undefined || editor.images[p.slot] || editor.canEdit);
  return <section className="ot-gallery" aria-label="תמונות מהמתחם">
    <div className="ot-wrap"><ul className="ot-gallery-row">
      {list.map(p => <li key={p.slot} className="ot-photo">
        <EditableImage editor={editor} slot={p.slot} alt={p.label} className="ot-photo-box"
          placeholder={p.x !== undefined ? <span className="ot-crop" style={sheetCrop(p.x)} role="img" aria-label={p.label} /> : `[צילום ${p.label}]`} />
        <p>{p.label}</p>
      </li>)}
    </ul></div>
  </section>;
}