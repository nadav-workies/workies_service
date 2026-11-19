import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Personal sidebar order, saved on the user. Items not in the saved order keep their default place at the end.
export default function useNavOrder(user, items) {
  const [order, setOrder] = useState([]);
  useEffect(() => { if (Array.isArray(user?.nav_order)) setOrder(user.nav_order); }, [user]);

  const rank = (p) => { const i = order.indexOf(p); return i === -1 ? order.length + items.findIndex((x) => x.path === p) : i; };
  const sorted = [...items].sort((a, b) => rank(a.path) - rank(b.path));

  const move = (path, dir) => {
    const paths = sorted.map((x) => x.path);
    const i = paths.indexOf(path), j = i + dir;
    if (j < 0 || j >= paths.length) return;
    [paths[i], paths[j]] = [paths[j], paths[i]];
    const next = [...paths, ...order.filter((p) => !paths.includes(p))];
    setOrder(next);
    base44.auth.updateMe({ nav_order: next });
  };
  const reset = () => { setOrder([]); base44.auth.updateMe({ nav_order: [] }); };
  return { sorted, move, reset };
}