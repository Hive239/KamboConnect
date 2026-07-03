import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Order, Product } from "@/entities/all";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useCart } from "@/lib/cart";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { Package, Loader2, ShoppingCart } from "@/lib/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { useSeo } from "@/lib/useSeo";
import { toast } from "sonner";

const STATUS_VARIANT: Record<string, any> = {
  paid: "verified", fulfilled: "verified", pending: "warning", cancelled: "destructive", refunded: "secondary",
};

/** My Orders — marketplace order history (upgrade #11). */
export default function Orders() {
  useSeo({ title: "My Orders — KamboGuide" });
  const { data: me } = useCurrentUser();
  const navigate = useNavigate();
  const cart = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [productsById, setProductsById] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!me) { setLoading(false); return; }
      setOrders(await Order.filter({ user_id: me.id }, "-created_date"));
      try {
        const all = await Product.list();
        setProductsById(Object.fromEntries(all.map((p: any) => [p.id, p])));
      } catch { /* buy-again falls back to the historical item */ }
      setLoading(false);
    })();
  }, [me?.id]);

  const buyAgain = (order: any) => {
    let added = 0, missing = 0;
    (order.items || []).forEach((it: any) => {
      const p = productsById[it.product_id];
      if (p && p.status !== "sold_out" && p.stock !== 0) { cart.add(p, it.quantity || 1); added++; }
      else missing++;
    });
    if (added) {
      toast.success(`Added ${added} item${added > 1 ? "s" : ""} to your cart`);
      navigate(createPageUrl("Market"));
    } else {
      toast.error(missing ? "Those items are no longer available." : "Nothing to add.");
    }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <PageHeader icon={Package} kicker="Marketplace" title="My Orders" subtitle="Your marketplace purchases." className="-mx-4 -mt-4 mb-6 sm:-mx-6 sm:-mt-6" />

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" weight="duotone" />
          No orders yet.
        </div>
      ) : (
        <Reveal stagger className="space-y-4">
          {orders.map((o) => (
            <Reveal.Item key={o.id}>
            <Card>
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
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-semibold">Total {formatCurrency(o.total || 0, o.currency)}</span>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => buyAgain(o)}>
                    <ShoppingCart className="h-4 w-4" weight="duotone" /> Buy again
                  </Button>
                </div>
              </CardContent>
            </Card>
            </Reveal.Item>
          ))}
        </Reveal>
      )}
    </div>
  );
}
