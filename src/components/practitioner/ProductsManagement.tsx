import { useEffect, useState } from "react";
import { Product } from "@/entities/all";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Storefront, Plus, Trash2, Loader2 } from "@/lib/icons";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

const CATEGORIES = ["Rapé", "Tepi", "Tools", "Apparel", "Books", "Digital", "Other"];
const EMPTY = { title: "", category: "Tools", price: "", stock: "", description: "" };
const STATUS_VARIANT: Record<string, any> = { active: "verified", sold_out: "secondary", draft: "warning" };

/** Practitioner shop: list/create/edit/delete products (connects Product writes → Market). */
export default function ProductsManagement({ practitioner }: { practitioner: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    if (!practitioner) return;
    setItems(await Product.filter({ seller_id: practitioner.id }, "-created_date"));
    setLoading(false);
  };
  useEffect(() => { load(); }, [practitioner?.id]);

  const add = async () => {
    if (!form.title.trim() || !form.price) { toast.error("Add a title and price."); return; }
    setBusy(true);
    try {
      let image_urls: string[] | undefined;
      if (file) { const { file_url } = await UploadFile({ file }); if (file_url) image_urls = [file_url]; }
      await Product.create({
        seller_id: practitioner.id, seller_name: practitioner.full_name,
        title: form.title, category: form.category, description: form.description,
        price: Number(form.price), currency: "USD", stock: form.stock ? Number(form.stock) : undefined,
        image_urls, status: "active",
      });
      setForm(EMPTY); setFile(null);
      toast.success("Product listed.");
      load();
    } finally { setBusy(false); }
  };

  const toggleStatus = async (p: any) => {
    await Product.update(p.id, { status: p.status === "active" ? "draft" : "active" });
    load();
  };
  const remove = async (id: string) => { if (confirm("Delete this product?")) { await Product.delete(id); load(); } };

  if (loading) return <div className="py-8 text-muted-foreground">Loading products…</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="flex items-center gap-2 font-semibold"><Storefront className="h-5 w-5 text-primary" weight="duotone" /> List a product</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Hapé blend" /></div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Price (USD)</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" /></div>
            <div><Label>Stock (optional)</Label><Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="e.g. 10" /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[70px]" /></div>
          <div><Label>Image</Label><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
          <div className="flex justify-end">
            <Button onClick={add} disabled={busy} className="gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" weight="bold" />} List product</Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 font-semibold">Your products ({items.length})</h2>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground">No products yet.</div>
        ) : (
          <Reveal stagger className="grid gap-3 sm:grid-cols-2">
            {items.map((p) => (
              <Reveal.Item key={p.id}>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  {p.image_urls?.[0]
                    ? <img loading="lazy" src={p.image_urls[0]} alt={p.title} className="h-14 w-14 rounded-lg object-cover" />
                    : <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted"><Storefront className="h-6 w-6 text-muted-foreground" /></div>}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{p.title}</span>
                      <Badge variant={STATUS_VARIANT[p.status] || "secondary"} className="capitalize">{p.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatCurrency(p.price || 0, p.currency)} · {p.category}</p>
                  </div>
                  <button onClick={() => toggleStatus(p)} className="text-xs text-primary hover:underline">{p.status === "active" ? "Unpublish" : "Publish"}</button>
                  <button onClick={() => remove(p.id)} aria-label="Delete product"><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button>
                </CardContent>
              </Card>
              </Reveal.Item>
            ))}
          </Reveal>
        )}
      </div>
    </div>
  );
}
