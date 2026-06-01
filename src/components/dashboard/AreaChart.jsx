import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const AREA_COLORS = [
  '#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#6366f1', '#84cc16', '#64748b'
];

export default function AreaChart({ tickets }) {
  const areaData = {};
  tickets.forEach(t => {
    if (t.fault_area) {
      areaData[t.fault_area] = (areaData[t.fault_area] || 0) + 1;
    }
  });

  const data = Object.entries(areaData)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">קריאות לפי אזור</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">אין נתונים להצגה</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, 'קריאות']} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                {data.map((_, i) => (
                  <Cell key={i} fill={AREA_COLORS[i % AREA_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}