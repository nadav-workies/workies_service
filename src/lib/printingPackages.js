export const PRINTING_PACKAGES = [
  {
    id: "printing_50",
    credits: 50,
    title: "50 קרדיטים",
    payment_amount: 59,
    credit_value: 50,
    bw_pages: 200,
    color_pages: 71,
  },
  {
    id: "printing_100",
    credits: 100,
    title: "100 קרדיטים",
    payment_amount: 118,
    credit_value: 100,
    bw_pages: 400,
    color_pages: 142,
  },
  {
    id: "printing_200",
    credits: 200,
    title: "200 קרדיטים",
    payment_amount: 236,
    credit_value: 200,
    bw_pages: 800,
    color_pages: 285,
  },
  {
    id: "printing_500",
    credits: 500,
    title: "500 קרדיטים",
    payment_amount: 590,
    credit_value: 500,
    bw_pages: 2000,
    color_pages: 714,
  },
];

export function hasActiveOffice(user, tenant) {
  if (user?.default_room_number) return true;
  if (tenant?.matched_room === true && tenant?.room_number) return true;
  return false;
}