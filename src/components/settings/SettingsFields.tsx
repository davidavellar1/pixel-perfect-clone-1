import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return <div className="min-w-0 space-y-2"><Label htmlFor={id}>{label}</Label>{children}{hint && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}{error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>}</div>;
}
export function Chips<T extends string>({ id, label, options, value, onChange }: { id: string; label: string; options: Record<T, string>; value: T[]; onChange: (v: T[]) => void }) {
  return <fieldset id={id} className="min-w-0 space-y-3"><legend className="text-sm font-medium">{label}</legend><div className="flex flex-wrap gap-2">{(Object.entries(options) as [T, string][]).map(([key, text]) => <Button key={key} type="button" size="sm" variant="outline" aria-pressed={value.includes(key)} className={value.includes(key) ? "min-h-11 border-accent bg-accent/10 text-foreground hover:bg-accent/20" : "min-h-11"} onClick={() => onChange(value.includes(key) ? value.filter(v => v !== key) : [...value, key])}>{text}</Button>)}</div></fieldset>;
}
export function EnumSelect<T extends string>({ id, label, value, options, onChange, error }: { id: string; label: string; value: T | null; options: Record<T, string>; onChange: (v: T | null) => void; error?: string }) {
  return <Field id={id} label={label} error={error}><Select value={value ?? "empty"} onValueChange={v => onChange(!v || v === "empty" ? null : v as T)}><SelectTrigger id={id} className="h-11 w-full" aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="empty">Choose...</SelectItem>{Object.entries(options).map(([key, text]) => <SelectItem key={key} value={key}>{String(text)}</SelectItem>)}</SelectContent></Select></Field>;
}