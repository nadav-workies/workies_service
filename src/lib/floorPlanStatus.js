import { getRoomServiceStatus } from '@/lib/roomServiceStatus';
import { ROOM_AREA_ALIASES } from '@/components/servicemap/floorPlanLayout';

// Keep existing room and public-area ticket identifiers; show their shared physical location.
export function getFloorPlanRoomStatus(number, tickets = []) {
  const roomTickets = tickets.map(ticket => ROOM_AREA_ALIASES[ticket.public_area_key] === String(number)
    ? { ...ticket, room_number: String(number) } : ticket);
  return getRoomServiceStatus(number, roomTickets);
}