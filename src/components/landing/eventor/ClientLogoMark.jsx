import { useState } from "react";

// Same visual weight for every logo: fixed area (3264px²), capped at 100×46.
function sizeFor(ratio) {
  const h = Math.sqrt(3264 / ratio);
  const w = ratio * h;
  const s = Math.min(1, 100 / w, 46 / h);
  return { width: Math.round(w * s), height: Math.round(h * s) };
}

export default function ClientLogoMark({ src, alt }) {
  const [ratio, setRatio] = useState(null);
  return <li className="ev-logo-cell">
    <img
      src={src} alt={alt} loading="lazy" decoding="async"
      onLoad={e => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight || 1)}
      style={ratio ? sizeFor(ratio) : { width: 57, height: 46, opacity: 0 }}
    />
  </li>;
}