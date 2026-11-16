import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SOURCES } from "@/lib/mailing";
import { Pill } from "@/components/mailing-mockup/shared";
import ContactForm from "./ContactForm";

export default function ContactSheet({ contact, onClose, onSaved }) {
  const isNew = contact && !contact.id;
  return <Sheet open={!!contact} onOpenChange={v => !v && onClose()}>
    <SheetContent side="left" dir="rtl" className="w-full sm:max-w-md overflow-y-auto">
      {contact && <>
        <SheetHeader><SheetTitle className="text-right">{isNew ? "איש קשר חדש" : contact.name || contact.email}</SheetTitle></SheetHeader>
        {!isNew && <div className="mt-3 flex flex-wrap gap-1">{(contact.sources || []).map(s => <Pill key={s} tone="blue">{SOURCES[s] || s}</Pill>)}</div>}
        <ContactForm key={contact.id || "new"} contact={contact} onSaved={() => { onSaved(); onClose(); }} />
      </>}
    </SheetContent>
  </Sheet>;
}