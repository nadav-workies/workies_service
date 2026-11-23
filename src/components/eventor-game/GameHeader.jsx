import { EV_IMAGES } from "@/lib/eventorContent";

export default function GameHeader({ tag }) {
  return <>
    <div className="eg-top">
      <img className="eg-logo" src={EV_IMAGES.logo} alt="Workies" />
      <span className="eg-brand" dir="ltr">EVENTOR BY WORKIES</span>
    </div>
    {tag && <span className="eg-tag">{tag}</span>}
    <h1 className="eg-title">לאן נעלם <span className="eg-y">הזמן?</span></h1>
  </>;
}