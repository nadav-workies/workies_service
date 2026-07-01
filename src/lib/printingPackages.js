export const PRINTING_PACKAGES = [
  {
    id: "print_50",
    name: "חבילת ₪50",
    payment_amount: 50,
    credit_value: 42.7,
    bw_pages: 100,
    color_pages: 0,
  },
  {
    id: "print_100",
    name: "חבילת ₪100",
    payment_amount: 100,
    credit_value: 85.5,
    bw_pages: 200,
    color_pages: 10,
  },
  {
    id: "print_200",
    name: "חבילת ₪200",
    payment_amount: 200,
    credit_value: 170.9,
    bw_pages: 400,
    color_pages: 30,
  },
  {
    id: "print_500",
    name: "חבילת ₪500",
    payment_amount: 500,
    credit_value: 427.4,
    bw_pages: 1000,
    color_pages: 100,
  },
];

export function hasActiveOffice(user, tenant) {
  if (user?.default_room_number) return true;
  if (tenant?.matched_room === true && tenant?.room_number) return true;
  return false;
}