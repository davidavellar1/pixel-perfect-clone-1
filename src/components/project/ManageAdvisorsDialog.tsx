import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type AdvisorRow = {
  id: string;
  name: string;
  label: string;
  category: string;
};

type LinkState = { checked: boolean; role: string };

/** Developer-side selection of the advisors shown on one listing. */
const ManageAdvisorsDialog = ({
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
  const [advisors, setAdvisors] = useState<AdvisorRow[]>([]);
  const [links, setLinks] = useState<Record<string, LinkState>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [listRes, linkedRes] = await Promise.all([
      supabase
        .from("advisor")
        .select("id, name, label, category")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase.from("project_advisor").select("advisor_id, role").eq("project_id", projectId),
    ]);
    setAdvisors(listRes.data ?? []);
    const state: Record<string, LinkState> = {};
    for (const row of linkedRes.data ?? []) {
      state[row.advisor_id] = { checked: true, role: row.role ?? "" };
    }
    setLinks(state);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const toggle = (id: string, checked: boolean) =>
    setLinks((prev) => ({ ...prev, [id]: { checked, role: prev[id]?.role ?? "" } }));

  const setRole = (id: string, role: string) =>
    setLinks((prev) => ({ ...prev, [id]: { checked: prev[id]?.checked ?? false, role } }));

  const save = async () => {
    setSaving(true);
    const keep = Object.entries(links).filter(([, value]) => value.checked);
    const keepIds = keep.map(([id]) => id);

    const remove = keepIds.length
      ? await supabase.from("project_advisor").delete().eq("project_id", projectId).not("advisor_id", "in", `(${keepIds.join(",")})`)
      : await supabase.from("project_advisor").delete().eq("project_id", projectId);

    if (remove.error) {
      setSaving(false);
      toast({ title: "Could not save", description: remove.error.message, variant: "destructive" });
      return;
    }

    if (keep.length) {
      const { error } = await supabase.from("project_advisor").upsert(
        keep.map(([advisor_id, value]) => ({
          project_id: projectId,
          advisor_id,
          role: value.role.trim() || null,
        })),
        { onConflict: "project_id,advisor_id" },
      );
      if (error) {
        setSaving(false);
        toast({ title: "Could not save", description: error.message, variant: "destructive" });
        return;
      }
    }

    setSaving(false);
    toast({ title: "Advisors updated", description: `${keep.length} advisor(s) shown on this listing.` });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Advisors on this project</DialogTitle>
          <DialogDescription>
            Choose the advisors working on {projectTitle}. They appear on the listing sidebar for investors.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading advisors…
          </div>
        ) : advisors.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No advisors are listed yet.</p>
        ) : (
          <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
            {advisors.map((advisor) => {
              const state = links[advisor.id];
              return (
                <div key={advisor.id} className="rounded-lg border border-border p-3">
                  <label className="flex items-start gap-3">
                    <Checkbox
                      checked={state?.checked ?? false}
                      onCheckedChange={(value) => toggle(advisor.id, value === true)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">{advisor.name}</span>
                      <span className="block text-xs text-muted-foreground">{advisor.label}</span>
                    </span>
                  </label>
                  {state?.checked && (
                    <Input
                      value={state.role}
                      onChange={(event) => setRole(advisor.id, event.target.value)}
                      placeholder="Role on this project (optional), e.g. Lead financial adviser"
                      className="mt-3"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save advisors
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageAdvisorsDialog;
