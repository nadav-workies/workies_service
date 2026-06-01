import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ClientChart({ tickets }) {
  const clientData = {};
  tickets.forEach(t => {
    if (t.client_name) {
      clientData[t.client_name] = (clientData[t.client_name] || 0) + 1;
    }
  });

  const data = Object.entries(clientData)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">קריאות לפי לקוח</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">אין נתונים להצגה</p>
        ) : (
          <div className="space-y-3">
            {data.map((client, i) => {
              const maxCount = data[0].count;
              const pct = (client.count / maxCount) * 100;
              return (
                <div key={client.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{client.name}</span>
                    <span className="text-muted-foreground">{client.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}