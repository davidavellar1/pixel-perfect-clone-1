import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, FileSpreadsheet, Lock, Clock, Download, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type DataRoomStatus = "none" | "pending" | "approved";

type DocumentRow = Tables<"document">;

function sizeLabel(bytes: number | null) {
  if (!bytes) return null;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

function metaLine(doc: DocumentRow) {
  return [
    (doc.file_type || doc.name.split(".").pop() || "file").toUpperCase(),
    doc.page_count ? `${doc.page_count} pages` : null,
    sizeLabel(doc.size_bytes),
    doc.category,
    new Date(doc.created_at).toLocaleDateString(),
  ]
    .filter(Boolean)
    .join(" · ");
}

function DocumentRowItem({
  doc,
  onDownload,
  busy,
}: {
  doc: DocumentRow;
  onDownload: (doc: DocumentRow) => void;
  busy: boolean;
}) {
  const Icon = /xls|csv/i.test(doc.file_type || doc.name) ? FileSpreadsheet : FileText;
  return (
    <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{doc.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{metaLine(doc)}</p>
        </div>
      </div>
      <Button
        size="sm"
        disabled={busy}
        onClick={() => onDownload(doc)}
        className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 ml-3"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
        {busy ? "" : "Download"}
      </Button>
    </div>
  );
}

/** Live documents for a listing. Reads only what the viewer is allowed to see. */
const ProjectDocuments = ({
  projectId,
  dataRoomStatus = "none",
}: {
  projectId: string;
  dataRoomStatus?: DataRoomStatus;
}) => {
  const { toast } = useToast();
  const [docs, setDocs] = useState<DocumentRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("document")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setDocs(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const download = useCallback(
    async (doc: DocumentRow) => {
      setBusyId(doc.id);
      const { data, error } = await supabase.storage
        .from("project-documents")
        .createSignedUrl(doc.storage_path, 120, { download: doc.name });
      setBusyId(null);
      if (error || !data?.signedUrl) {
        toast({
          title: "Download unavailable",
          description: error?.message || "The developer has not released this file to you yet.",
          variant: "destructive",
        });
        return;
      }
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    },
    [toast],
  );

  if (docs === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading documents…
      </div>
    );
  }

  const open = docs.filter((d) => d.access_level === "public");
  const gated = docs.filter((d) => d.access_level === "gated");
  const approved = dataRoomStatus === "approved";

  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Open documents</h2>
      <div className="border-t border-border mb-6" />
      {open.length ? (
        <div className="space-y-3">
          {open.map((doc) => (
            <DocumentRowItem key={doc.id} doc={doc} onDownload={download} busy={busyId === doc.id} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          The developer has not published any open documents for this project yet.
        </p>
      )}

      <div className="mt-8 rounded-xl border border-dashed border-primary/30 bg-muted/30 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Lock className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Confidential data room</h3>
          <span className="ml-auto rounded-full bg-primary/10 text-primary px-3 py-0.5 text-xs font-semibold">
            Developer-approved
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Data room files are released only when the developer accepts your request in full.
        </p>

        {approved && gated.length ? (
          <div className="space-y-3">
            {gated.map((doc) => (
              <DocumentRowItem key={doc.id} doc={doc} onDownload={download} busy={busyId === doc.id} />
            ))}
          </div>
        ) : approved ? (
          <p className="text-sm text-muted-foreground">
            The data room is open to you. The developer has not uploaded any confidential files yet.
          </p>
        ) : dataRoomStatus === "pending" ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-500">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Your access request is with the developer. Nothing is released until they decide.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0" />
            <span>The data room opens only when the developer accepts your request in full.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDocuments;
