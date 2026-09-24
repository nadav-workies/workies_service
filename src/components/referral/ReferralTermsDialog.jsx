import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TERMS_IMAGE_URL } from "@/lib/referralConfig";

export default function ReferralTermsDialog({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-w-md max-h-[90vh] overflow-y-auto p-3">
        <DialogHeader>
          <DialogTitle className="text-base">תקנון המבצע — חבר מביא חבר</DialogTitle>
        </DialogHeader>
        <img src={TERMS_IMAGE_URL} alt="תקנון מבצע חבר מביא חבר" className="w-full rounded-lg" />
        <a href={TERMS_IMAGE_URL} target="_blank" rel="noreferrer" className="text-xs text-primary underline text-center block">
          פתיחת התקנון בחלון חדש
        </a>
      </DialogContent>
    </Dialog>
  );
}