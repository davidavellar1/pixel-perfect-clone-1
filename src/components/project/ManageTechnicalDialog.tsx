import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";

type Card = { title: string; description: string };
type MixItem = { source: string; share: string };
type Param = { parameter: string; value: string; benchmark: string };

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-display text-sm font-semibold text-foreground">{children}</h3>
);

/** Developer-side editor for the technology, energy mix and operating figures of one listing. */
const ManageTechnicalDialog = ({
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [mix, setMix] = useState<MixItem[]>([]);
  const [params, setParams] = useState<Param[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [cardsRes, mixRes, paramsRes] = await Promise.all([
      supabase.from("technology_card").select("title, description").eq("project_id", projectId).order("sort_order"),
      supabase.from("energy_mix_item").select("source, share_pct").eq("project_id", projectId).order("sort_order"),
      supabase
        .from("operating_parameter")
        .select("parameter, value, benchmark")
        .eq("project_id", projectId)
        .order("sort_order"),
    ]);
    setCards((cardsRes.data ?? []).map((row) => ({ title: row.title, description: row.description ?? "" })));
    setMix(
      (mixRes.data ?? []).map((row) => ({
        source: row.source,
        share: row.share_pct === null || row.share_pct === undefined ? "" : String(row.share_pct),
      })),
    );
    setParams(
      (paramsRes.data ?? []).map((row) => ({
        parameter: row.parameter,
        value: row.value ?? "",
        benchmark: row.benchmark ?? "",
      })),
    );
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const save = async () => {
    setSaving(true);

    const cleanCards = cards.filter((row) => row.title.trim());
    const cleanMix = mix.filter((row) => row.source.trim());
    const cleanParams = params.filter((row) => row.parameter.trim());

    const deletes = await Promise.all([
      supabase.from("technology_card").delete().eq("project_id", projectId),
      supabase.from("energy_mix_item").delete().eq("project_id", projectId),
      supabase.from("operating_parameter").delete().eq("project_id", projectId),
    ]);
    const deleteError = deletes.find((result) => result.error)?.error;
    if (deleteError) {
      setSaving(false);
      toast({ title: "Could not save", description: deleteError.message, variant: "destructive" });
      return;
    }

    const inserts: PromiseLike<{ error: { message: string } | null }>[] = [];
    if (cleanCards.length) {
      inserts.push(
        supabase.from("technology_card").insert(
          cleanCards.map((row, index) => ({
            project_id: projectId,
            title: row.title.trim(),
            description: row.description.trim() || null,
            sort_order: index,
          })),
        ),
      );
    }
    if (cleanMix.length) {
      inserts.push(
        supabase.from("energy_mix_item").insert(
          cleanMix.map((row, index) => ({
            project_id: projectId,
            source: row.source.trim(),
            share_pct: row.share.trim() === "" ? null : Number(row.share),
            sort_order: index,
          })),
        ),
      );
    }
    if (cleanParams.length) {
      inserts.push(
        supabase.from("operating_parameter").insert(
          cleanParams.map((row, index) => ({
            project_id: projectId,
            parameter: row.parameter.trim(),
            value: row.value.trim() || null,
            benchmark: row.benchmark.trim() || null,
            sort_order: index,
          })),
        ),
      );
    }

    const results = await Promise.all(inserts);
    const insertError = results.find((result) => result.error)?.error;
    setSaving(false);
    if (insertError) {
      toast({ title: "Could not save", description: insertError.message, variant: "destructive" });
      return;
    }
    toast({ title: "Technical detail saved", description: "The Technical tab now shows these figures." });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Technical detail</DialogTitle>
          <DialogDescription>
            Technology, energy mix and operating figures shown on the Technical tab of {projectTitle}.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
            <section className="space-y-3">
              <SectionTitle>Technology</SectionTitle>
              {cards.map((card, index) => (
                <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex gap-2">
                    <Input
                      value={card.title}
                      placeholder="Title, e.g. Deep geothermal extraction"
                      onChange={(event) =>
                        setCards((prev) => prev.map((row, i) => (i === index ? { ...row, title: event.target.value } : row)))
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCards((prev) => prev.filter((_, i) => i !== index))}
                      aria-label="Remove technology"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={card.description}
                    placeholder="Description"
                    rows={2}
                    onChange={(event) =>
                      setCards((prev) =>
                        prev.map((row, i) => (i === index ? { ...row, description: event.target.value } : row)),
                      )
                    }
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setCards((prev) => [...prev, { title: "", description: "" }])}>
                <Plus className="h-3.5 w-3.5" /> Add technology
              </Button>
            </section>

            <section className="space-y-3">
              <SectionTitle>Energy mix</SectionTitle>
              {mix.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item.source}
                    placeholder="Source, e.g. Industrial waste heat"
                    onChange={(event) =>
                      setMix((prev) => prev.map((row, i) => (i === index ? { ...row, source: event.target.value } : row)))
                    }
                  />
                  <Input
                    value={item.share}
                    placeholder="%"
                    inputMode="decimal"
                    className="w-24"
                    onChange={(event) =>
                      setMix((prev) => prev.map((row, i) => (i === index ? { ...row, share: event.target.value } : row)))
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMix((prev) => prev.filter((_, i) => i !== index))}
                    aria-label="Remove source"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setMix((prev) => [...prev, { source: "", share: "" }])}>
                <Plus className="h-3.5 w-3.5" /> Add source
              </Button>
            </section>

            <section className="space-y-3">
              <SectionTitle>Operating parameters</SectionTitle>
              {params.map((param, index) => (
                <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex gap-2">
                    <Input
                      value={param.parameter}
                      placeholder="Parameter, e.g. Supply temperature"
                      onChange={(event) =>
                        setParams((prev) =>
                          prev.map((row, i) => (i === index ? { ...row, parameter: event.target.value } : row)),
                        )
                      }
                    />
                    <Input
                      value={param.value}
                      placeholder="Value"
                      className="w-32"
                      onChange={(event) =>
                        setParams((prev) => prev.map((row, i) => (i === index ? { ...row, value: event.target.value } : row)))
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setParams((prev) => prev.filter((_, i) => i !== index))}
                      aria-label="Remove parameter"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={param.benchmark}
                    placeholder="Benchmark or context (optional)"
                    onChange={(event) =>
                      setParams((prev) =>
                        prev.map((row, i) => (i === index ? { ...row, benchmark: event.target.value } : row)),
                      )
                    }
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setParams((prev) => [...prev, { parameter: "", value: "", benchmark: "" }])}
              >
                <Plus className="h-3.5 w-3.5" /> Add parameter
              </Button>
            </section>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save technical detail
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageTechnicalDialog;
