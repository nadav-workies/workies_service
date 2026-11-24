import { AVATARS } from "@/components/eventor-game/gameVisuals";

export default function IconPicker({ value, onChange }) {
  return <div role="radiogroup" aria-labelledby="eg-icon-label" className="eg-icons">
    {Object.entries(AVATARS).map(([key, { icon: Icon, label }]) => <button
      key={key} type="button" role="radio" aria-checked={value === key} aria-label={label}
      className="eg-icon" onClick={() => onChange(key)}
    ><Icon aria-hidden="true" /></button>)}
  </div>;
}