import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Product, Order, Payment, User, Notification } from "@/entities/all";
import { startCheckout } from "@/integrations/Payments";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { useSeo } from "@/lib/useSeo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Reveal } from "@/components/ui/Reveal";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductCard from "@/components/market/ProductCard";
import { ShoppingCart, Plus, Minus, X, CheckCircle, Package, Loader2, Storefront, Search } from "@/lib/icons";

const CATEGORIES = ["All", "Rapé", "Tepi", "Tools", "Apparel", "Books", "Digital", "Other"];

export default function Market() {
  useSeo({ title: "Marketplace — KamboGuide", description: "Ethically sourced ceremonial tools, rapé, and integration resources." });
  const cart = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [placed, setPlaced] = useState<any>(null);

  useEffect(() => { Product.list("-created_date").then((p) => { setProducts(p); setLoading(false); }); }, []);

  const shown = useMemo(() => {
    let list = products.filter((p) =>
      (category === "All" || p.category === category) &&
      (!search || `${p.title} ${p.description || ""} ${(p.tags || []).join(" ")}`.toLowerCase().includes(search.toLowerCase())),
    );
    if (sort === "price_asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, category, search, sort]);

  const checkout = async () => {
    setCheckingOut(true);
    try {
      const me = await User.me().catch(() => null);
      // Require login — a "guest" order is owned by no one (invisible in /Orders)
      // and can't satisfy per-user ownership once strict RLS is enabled.
      if (!me) {
        toast.error("Please sign in to complete your purchase.");
        await User.login();
        return;
      }
      // Create the order up front (pending until payment confirms) so a real
      // Stripe redirect + webhook can reconcile it by id.
      const orderId = "ord_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const order = await Order.create({
        id: orderId,
        user_id: me.id,
        items: cart.items.map((i) => ({ product_id: i.product_id, title: i.title, quantity: i.quantity, price: i.price })),
        total: cart.total, currency: "USD", status: "pending",
      });
      const result = await startCheckout({
        amount: cart.total, currency: "USD", description: `${cart.count} item(s)`,
        metadata: { kind: "order", order_id: orderId, user_id: me.id },
        successPath: "/Orders?paid=1", cancelPath: "/Market?canceled=1",
      });
      if (result.mode === "redirect") { window.location.href = result.url; return; } // webhook finalizes
      // Mock path — no Stripe keys: finalize immediately.
      await Order.update(orderId, { status: "paid", payment_id: result.charge.id });
      await Payment.create({ user_id: me.id, amount: cart.total, currency: "USD", payment_type: "product", payment_status: "completed", stripe_payment_id: result.charge.id, payment_date: new Date().toISOString() });
      await Notification.create({ user_id: me.id, title: "Order confirmed", message: `Your order of ${cart.count} item(s) is confirmed.`, type: "system", priority: "normal", related_id: order.id, action_url: "/Orders" });
      cart.clear();
      setPlaced({ ...order, status: "paid" });
      setCartOpen(false);
    } finally { setCheckingOut(false); }
  };

  return (
    <div>
      {/* Hero */}
      <div className="grain relative flex h-56 items-center justify-center overflow-hidden bg-background text-center">
        <GradientMesh intensity="vivid" />
        <div className="relative z-10 px-6">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shadow-glow"><Storefront className="h-6 w-6 text-primary" weight="duotone" /></span>
          <h1 className="font-display text-display font-semibold tracking-tight">The Market</h1>
          <p className="mt-1 text-muted-foreground">Ethically sourced tools, medicine, and integration resources.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        {/* Search + sort + cart */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the market…" className="h-10 rounded-full pl-9" />
          </div>
          <div className="sm:w-52">
            <SegmentedControl value={sort} onChange={setSort} options={[{ value: "newest", label: "Newest" }, { value: "price_asc", label: "$ ↑" }, { value: "price_desc", label: "$ ↓" }]} />
          </div>
          <Button variant="outline" className="shrink-0 gap-2" onClick={() => setCartOpen(true)}>
            <ShoppingCart className="h-4 w-4" weight="duotone" /> Cart
            {cart.count > 0 && <Badge variant="verified" className="ml-1">{cart.count}</Badge>}
          </Button>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <SegmentedControl value={category} onChange={setCategory} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}</div>
        ) : shown.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground"><Package className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" weight="duotone" />No products in this category yet.</div>
        ) : (
          <Reveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {shown.map((p) => (
              <Reveal.Item key={p.id}>
                <ProductCard product={p} onAdd={() => { cart.add(p); setCartOpen(true); }} onOpen={() => setDetail(p)} />
              </Reveal.Item>
            ))}
          </Reveal>
        )}
      </div>

      {/* Product detail */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg">
          {detail && (
            <>
              <DialogHeader><DialogTitle>{detail.title}</DialogTitle></DialogHeader>
              {detail.image_urls?.[0] && <img loading="lazy" src={detail.image_urls[0]} alt={detail.title} className="h-56 w-full rounded-lg object-cover" />}
              <p className="text-sm text-muted-foreground">{detail.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-display text-2xl font-semibold text-primary">{formatCurrency(detail.price, detail.currency)}</span>
                <span className="text-sm text-muted-foreground">
                  by{" "}
                  {detail.seller_id ? (
                    <Link to={`${createPageUrl("PractitionerProfile")}?id=${detail.seller_id}`} onClick={() => setDetail(null)} className="text-primary hover:underline">
                      {detail.seller_name}
                    </Link>
                  ) : (
                    detail.seller_name
                  )}
                </span>
              </div>
              <Button className="w-full gap-2" disabled={detail.status === "sold_out"} onClick={() => { cart.add(detail); setDetail(null); setCartOpen(true); }}>
                <Plus className="h-4 w-4" weight="bold" /> Add to cart
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart drawer */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader><SheetTitle>Your cart ({cart.count})</SheetTitle></SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto py-4">
            {cart.items.length === 0 && <p className="py-10 text-center text-muted-foreground">Your cart is empty.</p>}
            {cart.items.map((i) => (
              <div key={i.product_id} className="flex gap-3 rounded-lg border border-border p-3">
                {i.image_url && <img loading="lazy" src={i.image_url} alt={i.title} className="h-16 w-16 rounded-md object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.title}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(i.price)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-7 w-7" aria-label="Decrease" onClick={() => cart.setQty(i.product_id, i.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                    <span className="w-6 text-center text-sm">{i.quantity}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" aria-label="Increase" onClick={() => cart.setQty(i.product_id, i.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="ml-auto h-7 w-7 text-destructive" aria-label="Remove" onClick={() => cart.remove(i.product_id)}><X className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {cart.items.length > 0 && (
            <SheetFooter className="flex-col gap-3 border-t pt-4">
              <div className="flex w-full items-center justify-between text-lg font-semibold"><span>Total</span><span className="text-primary">{formatCurrency(cart.total)}</span></div>
              <Button className="w-full gap-2" disabled={checkingOut} onClick={checkout}>
                {checkingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" weight="fill" />}
                {checkingOut ? "Processing…" : "Checkout"}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Order confirmation */}
      <Dialog open={!!placed} onOpenChange={() => setPlaced(null)}>
        <DialogContent className="max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10"><CheckCircle className="h-8 w-8 text-success" weight="fill" /></div>
          <DialogHeader><DialogTitle className="text-center">Order confirmed!</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Thank you. Your order total was {placed && formatCurrency(placed.total, placed.currency)}. A confirmation is in your notifications.</p>
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link to={createPageUrl("Orders")} onClick={() => setPlaced(null)}>View your order</Link>
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setPlaced(null)}>Continue shopping</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
