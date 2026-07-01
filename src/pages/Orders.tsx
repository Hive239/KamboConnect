import { useEffect, useState } from "react";
import { Order } from "@/entities/all";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { Package, Loader2 } from "@/lib/icons";
import { useSeo } from "@/lib/useSeo";

const STATUS_VARIANT: Record<string, any> = {
  paid: "verified", fulfilled: "verified", pending: "warning", cancelled: "destructive", refunded: "secondary",
};

/** My Orders — marketplace order history (upgrade #11). */
export default function Orders() {
  useSeo({ title: "My Orders — KamboConnect" });
  const { data: me } = useCurrentUser();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!me) { setLoading(false); return; }
      setOrders(await Order.filter({ user_id: me.id }, "-created_date"));
      setLoading(false);
    })();
  }, [me?.id]);

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="font-display text-2xl font-semibold">My Orders</h1>
      <p className="mb-6 text-muted-foreground">Your marketplace purchases.</p>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" weight="duotone" />
          No orders yet.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{o.created_date ? formatDate(o.created_date) : ""}</span>
                  <Badge variant={STATUS_VARIANT[o.status] || "secondary"} className="capitalize">{o.status || "paid"}</Badge>
                </div>
                <div className="space-y-1">
                  {(o.items || []).map((it: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="truncate">{it.quantity || 1}× {it.title || it.name || "Item"}</span>
                      <span className="text-muted-foreground">{formatCurrency((it.price || 0) * (it.quantity || 1), o.currency)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(o.total || 0, o.currency)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
