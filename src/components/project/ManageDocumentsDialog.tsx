import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type DocumentRow = Tables<"document">;

/** Developer-side upload and removal of the files attached to one listing. */
const ManageDocumentsDialog = ({
  projectId,
  projectTitle,
  trigger,
}: {
  projectId: string;
  projectTitle: string;
  trigger: React.ReactNode;
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [accessLevel, setAccessLevel] = useState<"public" | "gated">("gated");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("document")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    setDocs(data ?? []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const path = `${projectId}/${Date.now()}-${safeName}`;
    const { error: storageError } = await supabase.storage
      .from("project-documents")
      .upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (storageError) {
      setUploading(false);
      toast({ title: "Upload failed", description: storageError.message, variant: "destructive" });
      return;
    }
    const { data: authData } = await supabase.auth.getUser();
    const { error: rowError } = await supabase.from("document").insert({
      project_id: projectId,
      name: file.name,
      category: category || null,
      file_type: file.name.split(".").pop()?.toLowerCase() || null,
      size_bytes: file.size,
      access_level: accessLevel,
      storage_path: path,
      uploaded_by: authData.user?.id ?? null,
    });
    setUploading(false);
    if (rowError) {
      await supabase.storage.from("project-documents").remove([path]);
      toast({ title: "Upload failed", description: rowError.message, variant: "destructive" });
      return;
    }
    setFile(null);
    setCategory("");
    toast({ title: "Document added", description: `${file.name} is now attached to this listing.` });
    load();
  };

  const remove = async (doc: DocumentRow) => {
    const { error } = await supabase.from("document").delete().eq("id", doc.id);
    if (error) {
      toast({ title: "Could not remove", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.storage.from("project-documents").remove([doc.storage_path]);
    toast({ title: "Document removed" });
    load();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Documents — {projectTitle}</DialogTitle>
          <DialogDescription>
            Open documents are visible to investors you have accepted. Data room files are released only to investors you
            accept in full.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-file">File</Label>
              <Input
                id="doc-file"
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-category">Category (optional)</Label>
              <Input
                id="doc-category"
                value={category}
                placeholder="e.g. Technical, Legal, Financial"
                onChange={(event) => setCategory(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <Select value={accessLevel} onValueChange={(value) => setAccessLevel(value as "public" | "gated")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Open document (accepted investors)</SelectItem>
                  <SelectItem value="gated">Data room (full acceptance only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={upload} disabled={!file || uploading} className="w-full">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading…" : "Upload document"}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && !docs.length && (
            <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
              No documents attached yet. Upload the teaser, the technical summary and the data room files here.
            </p>
          )}
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {doc.access_level === "public" ? "Open document" : "Data room"}
                    {doc.category ? ` · ${doc.category}` : ""}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove(doc)} aria-label={`Remove ${doc.name}`}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageDocumentsDialog;
