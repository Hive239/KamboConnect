import { useEffect, useState } from "react";
import { Product } from "@/entities/all";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/StatCard";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Storefront, Plus, Trash2, Loader2, Edit, Package, DollarSign } from "@/lib/icons";
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
  const [preview, setPreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    if (!practitioner) return;
    setItems(await Product.filter({ seller_id: practitioner.id }, "-created_date"));
    setLoading(false);
  };
  useEffect(() => { load(); }, [practitioner?.id]);

  const onFile = (f: File | null) => { setFile(f); setPreview(f ? URL.createObjectURL(f) : preview); };
  const resetForm = () => { setForm(EMPTY); setFile(null); setPreview(null); setEditingId(null); };

  const save = async () => {
    if (!form.title.trim() || !form.price) { toast.error("Add a title and price."); return; }
    setBusy(true);
    try {
      let image_urls: string[] | undefined;
      if (file) { const { file_url } = await UploadFile({ file }); if (file_url) image_urls = [file_url]; }
      const payload: any = {
        seller_id: practitioner.id, seller_name: practitioner.full_name,
        title: form.title, category: form.category, description: form.description,
        price: Number(form.price), currency: "USD",
        stock: form.stock !== "" ? Number(form.stock) : undefined,
        ...(image_urls ? { image_urls } : {}),
      };
      if (editingId) { await Product.update(editingId, payload); toast.success("Product updated."); }
      else { await Product.create({ ...payload, status: "active" }); toast.success("Product listed."); }
      resetForm();
      load();
    } catch { toast.error("Couldn't save product."); }
    finally { setBusy(false); }
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({ title: p.title || "", category: p.category || "Tools", price: p.price ?? "", stock: p.stock ?? "", description: p.description || "" });
    setPreview(p.image_urls?.[0] || null);
    setFile(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleStatus = async (p: any) => { await Product.update(p.id, { status: p.status === "active" ? "draft" : "active" }); load(); };
  const remove = async (id: string) => { if (confirm("Delete this product?")) { await Product.delete(id); if (editingId === id) resetForm(); load(); } };

  const activeCount = items.filter((p) => p.status === "active").length;
  const soldOut = items.filter((p) => p.status === "sold_out" || p.stock === 0).length;
  const inventoryValue = items.reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.stock) || 0), 0);

  if (loading) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Storefront} label="Products" value={items.length} color="primary" />
        <StatCard icon={Package} label="Active" value={activeCount} color="success" />
        <StatCard icon={Trash2} label="Sold out" value={soldOut} color="warning" sub={soldOut > 0 ? "Restock soon" : "In stock"} />
        <StatCard icon={DollarSign} label="Inventory value" value={inventoryValue} prefix="$" color="info" />
      </div>

      {/* Create / edit form */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <Storefront className="h-5 w-5 text-primary" weight="duotone" /> {editingId ? "Edit product" : "List a product"}
            </h2>
            {editingId && <Button variant="ghost" size="sm" onClick={resetForm}>Cancel edit</Button>}
          </div>
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
          <div className="flex items-end gap-3">
            {preview && <img src={preview} alt="preview" className="h-16 w-16 shrink-0 rounded-lg border border-border object-cover" />}
            <div className="flex-1"><Label>Image</Label><Input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] || null)} /></div>
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" weight="bold" />}
              {editingId ? "Save changes" : "List product"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product list */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><Package className="h-5 w-5 text-primary" weight="duotone" /> Your products ({items.length})</h2>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
            <Storefront className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" weight="duotone" />
            No products yet — list your first one above.
          </div>
        ) : (
          <Reveal stagger className="grid gap-3 sm:grid-cols-2">
            {items.map((p) => {
              const out = p.status === "sold_out" || p.stock === 0;
              const low = typeof p.stock === "number" && p.stock > 0 && p.stock < 5;
              return (
                <Reveal.Item key={p.id}>
                  <Card className="group overflow-hidden transition-shadow hover:shadow-md">
                    <CardContent className="flex gap-3 p-3">
                      {p.image_urls?.[0] ? (
                        <img loading="lazy" src={p.image_urls[0]} alt={p.title} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-muted"><Storefront className="h-7 w-7 text-muted-foreground" weight="duotone" /></div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate font-medium">{p.title}</span>
                          <Badge variant={STATUS_VARIANT[p.status] || "secondary"} className="shrink-0 capitalize">{(p.status || "active").replace("_", " ")}</Badge>
                        </div>
                        <p className="mt-0.5 font-display text-lg font-semibold text-primary">{formatCurrency(p.price || 0, p.currency)}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <span>{p.category}</span>
                          {typeof p.stock === "number" && (
                            <><span>·</span><span className={out ? "font-medium text-destructive" : low ? "font-medium text-warning" : ""}>{out ? "Sold out" : `${p.stock} in stock`}</span></>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <button onClick={() => openEdit(p)} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Edit className="h-3.5 w-3.5" /> Edit</button>
                          <button onClick={() => toggleStatus(p)} className="text-xs text-muted-foreground hover:text-foreground">{p.status === "active" ? "Unpublish" : "Publish"}</button>
                          <button onClick={() => remove(p.id)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Reveal.Item>
              );
            })}
          </Reveal>
        )}
      </div>
    </div>
  );
}
