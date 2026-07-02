import { useEffect, useState } from "react";
import { Course, User } from "@/entities/all";
import { getRole } from "@/lib/roles";
import { useSeo } from "@/lib/useSeo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookMarked, MapPin, Clock, ExternalLink, Plus, Trophy, Edit, Trash2, Eye, EyeOff } from "@/lib/icons";
import { toast } from "sonner";

const FORMATS = [
  { value: "all", label: "All formats" },
  { value: "online", label: "Online" },
  { value: "in_person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
];
const FORMAT_LABEL: Record<string, string> = { online: "Online", in_person: "In person", hybrid: "Hybrid" };
const EMPTY = { title: "", provider: "", description: "", url: "", location: "", format: "in_person", duration: "", price: "", lineage: "", image_url: "", is_featured: false };

export default function Courses() {
  useSeo({ title: "Practitioner Courses — KamboGuide", description: "Find reputable Kambo practitioner training programs." });
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setCourses((await Course.list("-is_featured")) as any[]); }
    catch { setCourses([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { User.me().then((u) => setIsAdmin(getRole(u) === "admin")).catch(() => setIsAdmin(false)); }, []);

  const visible = isAdmin ? courses : courses.filter((c) => c.status !== "draft");
  const shown = filter === "all" ? visible : visible.filter((c) => c.format === filter);

  const openCreate = () => { setEditingId(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({ title: c.title || "", provider: c.provider || "", description: c.description || "", url: c.url || "", location: c.location || "", format: c.format || "in_person", duration: c.duration || "", price: c.price ?? "", lineage: c.lineage || "", image_url: c.image_url || "", is_featured: !!c.is_featured });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    setSaving(true);
    try {
      const payload = { ...form, price: form.price ? Number(form.price) : null };
      if (editingId) { await Course.update(editingId, payload); toast.success("Course updated."); }
      else { await Course.create({ ...payload, status: "published" }); toast.success("Course added."); }
      setForm(EMPTY); setEditingId(null); setOpen(false); load();
    } catch { toast.error("Could not save course."); }
    finally { setSaving(false); }
  };

  const togglePublish = async (c: any) => {
    try { await Course.update(c.id, { status: c.status === "draft" ? "published" : "draft" }); load(); }
    catch { toast.error("Could not update status."); }
  };
  const remove = async (c: any) => {
    if (!window.confirm(`Delete "${c.title}"? This cannot be undone.`)) return;
    try { await Course.delete(c.id); toast.success("Course deleted."); load(); }
    catch { toast.error("Could not delete course."); }
  };

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
              <BookMarked className="h-7 w-7 text-primary" /> Practitioner Courses
            </h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Serving Kambo is a sacred responsibility that requires proper training. Explore reputable programs —
              look for lineage, safety, hands-on supervision, and ethics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{FORMATS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
            {isAdmin && <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Add course</Button>}
          </div>
        </div>

        {isAdmin && (
          <p className="mb-4 text-xs text-muted-foreground">
            Admin view — drafts are shown with a badge and are hidden from the public.
          </p>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading courses…</p>
        ) : shown.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">
            No courses listed yet{filter !== "all" ? " for this format" : ""}. {isAdmin ? "Add one to get started." : "Check back soon."}
          </CardContent></Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((c) => (
              <Card key={c.id} className="flex flex-col overflow-hidden">
                {c.image_url && <img src={c.image_url} alt={c.title} className="h-40 w-full object-cover" loading="lazy" />}
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{c.title}</h3>
                    <div className="flex shrink-0 gap-1">
                      {c.status === "draft" && <Badge variant="outline" className="border-amber-400 text-amber-700">Draft</Badge>}
                      {c.is_featured && <Badge className="gap-1 bg-amber-100 text-amber-800"><Trophy className="h-3 w-3" /> Featured</Badge>}
                    </div>
                  </div>
                  {c.provider && <p className="text-sm text-muted-foreground">{c.provider}</p>}
                  {c.description && <p className="line-clamp-3 text-sm text-muted-foreground">{c.description}</p>}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {c.format && <Badge variant="secondary">{FORMAT_LABEL[c.format] || c.format}</Badge>}
                    {c.lineage && <Badge variant="outline">{c.lineage}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {c.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.location}</span>}
                    {c.duration && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {c.duration}</span>}
                    {c.price ? <span>${Number(c.price).toLocaleString()}</span> : null}
                  </div>
                  <div className="mt-auto space-y-2 pt-2">
                    {c.url && (
                      <Button asChild variant="outline" size="sm" className="w-full gap-2">
                        <a href={c.url} target="_blank" rel="noopener noreferrer">Visit course <ExternalLink className="h-3.5 w-3.5" /></a>
                      </Button>
                    )}
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="flex-1 gap-1" onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5" /> Edit</Button>
                        <Button variant="ghost" size="sm" className="flex-1 gap-1" onClick={() => togglePublish(c)}>
                          {c.status === "draft" ? <><Eye className="h-3.5 w-3.5" /> Publish</> : <><EyeOff className="h-3.5 w-3.5" /> Unpublish</>}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-red-600" onClick={() => remove(c)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Listings are informational and not an endorsement. Verify each provider independently before enrolling.
        </p>
      </div>

      {/* Admin create/edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit course" : "Add a course"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Provider</Label><Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Format</Label>
                <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">In person</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Duration</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 9 days" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>Lineage</Label><Input value={form.lineage} onChange={(e) => setForm({ ...form, lineage: e.target.value })} placeholder="e.g. Matsés" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Price (USD)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Link</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" /></div>
            </div>
            <div><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
              Feature this course
            </label>
            <Button onClick={save} disabled={saving} className="w-full">{saving ? "Saving…" : editingId ? "Save changes" : "Add course"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
