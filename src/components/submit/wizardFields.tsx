import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const sel =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground";

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
      {rows.map((r, i) => (
        <div key={i} className="mb-2 flex flex-wrap items-center gap-2">
          {columns.map((c) => (
            <Input
              key={c.key}
              type={c.type || "text"}
              placeholder={c.placeholder}
              value={r[c.key] || ""}
              onChange={(e) => update(i, c.key, e.target.value)}
              className="h-10 flex-1 text-sm"
            />
          ))}
          {rows.length > minRows && (
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="mt-1 rounded-lg border border-dashed border-border px-3.5 py-2 text-xs font-medium text-accent hover:bg-accent/5"
      >
        + {addLabel}
      </button>
    </div>
  );
}

export function MultiSelect({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <label
          key={o}
          className={cn(
            "flex cursor-pointer items-start gap-2 rounded-lg border border-border p-2.5 text-xs leading-relaxed",
            selected.includes(o) && "border-accent bg-accent/5",
          )}
        >
          <Checkbox checked={selected.includes(o)} onCheckedChange={() => onToggle(o)} className="mt-0.5" />
          <span>{o}</span>
        </label>
      ))}
    </div>
  );
}

export function ErrorNote({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-destructive">{message}</p>;
}
