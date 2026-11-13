import { useId, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function WizardSelect({ value, onChange, children, id, "aria-describedby": describedBy, "aria-labelledby": labelledBy, "aria-invalid": invalid }: { value?: string; onChange?: (event: { target: { value: string } }) => void; children: ReactNode; id?: string; "aria-describedby"?: string; "aria-labelledby"?: string; "aria-invalid"?: boolean }) {
  const generated = useId();
  return <Select value={value || undefined} onValueChange={v => onChange?.({ target: { value: v } })}><SelectTrigger id={id ?? generated} aria-describedby={describedBy} aria-labelledby={labelledBy} aria-invalid={invalid}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{children}</SelectContent></Select>;
}
export function WizardOption({ value, children }: { value?: string; children: ReactNode }) {
  return value === "" ? null : <SelectItem value={value ?? String(children)}>{children}</SelectItem>;
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

/** Controlled list of editable rows, used for anything the developer can add/remove freely. */
export type RowColumn = { key: string; placeholder: string; type?: string };

export function RowsEditor({
  columns,
  rows,
  onChange,
  addLabel,
  minRows = 0,
}: {
  columns: RowColumn[];
  rows: Record<string, string>[];
  onChange: (rows: Record<string, string>[]) => void;
  addLabel: string;
  minRows?: number;
}) {
  const update = (i: number, key: string, value: string) => {
    const next = rows.slice();
    next[i] = { ...next[i], [key]: value };
    onChange(next);
  };
  const add = () => onChange([...rows, Object.fromEntries(columns.map((c) => [c.key, ""]))]);
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="mb-2 flex gap-2" aria-hidden="true">{columns.map(c => <span key={c.key} className="min-w-0 flex-1 text-xs font-semibold text-muted-foreground">{c.placeholder}</span>)}<span className="w-16" /></div>
      {rows.map((r, i) => (
        <div key={i} className="mb-2 flex flex-wrap items-center gap-2">
          {columns.map((c) => (
            <Input
              key={c.key}
              type={c.type || "text"}
              placeholder={c.placeholder}
              aria-label={`${c.placeholder}, row ${i + 1}`}
              value={r[c.key] || ""}
              onChange={(e) => update(i, c.key, e.target.value)}
              className="h-10 flex-1 text-sm"
            />
          ))}
          {rows.length > minRows && (
            <Button
              type="button"
              onClick={() => remove(i)}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Remove
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        onClick={add}
        className="mt-1 rounded-lg border border-dashed border-border px-3.5 py-2 text-xs font-medium text-accent hover:bg-accent/5"
      >
        + {addLabel}
      </Button>
    </div>
  );
}

export function MultiSelect({
  options,
  selected,
  onToggle,
  label = "Selections",
}: {
  label?: string;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <fieldset className="grid gap-2 sm:grid-cols-2"><legend className="mb-2 text-sm font-semibold">{label}</legend>
      {options.map((o) => (
        <label
          key={o}
          className={cn(
            "flex cursor-pointer items-start gap-2 rounded-lg border border-border p-2.5 text-xs leading-relaxed",
            selected.includes(o) && "border-accent bg-accent/5",
          )}
        >
          <Checkbox aria-label={o} checked={selected.includes(o)} onCheckedChange={() => onToggle(o)} className="mt-0.5" />
          <span>{o}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function ErrorNote({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-destructive">{message}</p>;
}
