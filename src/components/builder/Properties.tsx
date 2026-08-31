/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useBuilder } from "@/lib/rbx/store";
import { PROPERTY_SCHEMA, type PropDef } from "@/lib/rbx/schema";
import { findNode, pathOf } from "@/lib/rbx/tree";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

function NumberField({ value, onChange, step }: { value: number; onChange: (n: number) => void; step?: number | undefined }) {
  return (
    <input
      type="number"
      step={step ?? 1}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="h-6 w-full rounded-sm border border-input bg-background px-1.5 text-xs tabular-nums outline-none focus:ring-1 focus:ring-ring"
    />
  );
}

function Field({ def, value, onChange }: { def: PropDef; value: any; onChange: (v: any) => void }) {
  switch (def.kind) {
    case "boolean":
      return <Switch checked={!!value} onCheckedChange={onChange} className="scale-75 origin-left" />;
    case "number":
      return <NumberField value={value} onChange={onChange} step={def.step} />;
    case "color":
      return (
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={typeof value === "string" ? value : "#ffffff"}
            onChange={(e) => onChange(e.target.value)}
            className="h-6 w-7 cursor-pointer rounded-sm border border-input bg-background"
          />
          <input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="h-6 w-full rounded-sm border border-input bg-background px-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      );
    case "enum":
      return (
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-full rounded-sm border border-input bg-background px-1 text-xs outline-none focus:ring-1 focus:ring-ring"
        >
          {(def.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "udim2": {
      const v = value ?? { xs: 0, xo: 0, ys: 0, yo: 0 };
      return (
        <div className="grid grid-cols-4 gap-1">
          {(["xs", "xo", "ys", "yo"] as const).map((k) => (
            <NumberField
              key={k}
              step={k.endsWith("s") ? 0.01 : 1}
              value={v[k] ?? 0}
              onChange={(n) => onChange({ ...v, [k]: n })}
            />
          ))}
        </div>
      );
    }
    case "vector2": {
      const v = value ?? { x: 0, y: 0 };
      return (
        <div className="grid grid-cols-2 gap-1">
          {(["x", "y"] as const).map((k) => (
            <NumberField key={k} step={0.05} value={v[k] ?? 0} onChange={(n) => onChange({ ...v, [k]: n })} />
          ))}
        </div>
      );
    }
    default:
      return (
        <input
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-full rounded-sm border border-input bg-background px-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
        />
      );
  }
}

export function Properties() {
  const b = useBuilder();
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const id = b.selection[0];
  const node = useMemo(() => (id ? findNode(b.root, id) : null), [id, b.root]);

  if (!node) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Properties
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-muted-foreground">
          Select an object in the Explorer or on the canvas to edit its properties.
        </div>
      </div>
    );
  }


  const defs = PROPERTY_SCHEMA[node.className] ?? [];
  const parentPath = pathOf(b.root, node.id)
    .slice(0, -1)
    .map((n) => n.name)
    .join(".");
  const categories = ["Data", "Appearance", "Text", "Image", "Layout", "Behaviour", "UI"] as const;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Properties
        </span>
        <span className="ml-auto truncate text-[11px] text-primary">
          {node.name} · {node.className}
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        {categories.map((cat) => {
          const items = defs.filter((d) => d.category === cat);
          const isData = cat === "Data";
          if (!items.length && !isData) return null;
          const open = !closed[cat];
          return (
            <div key={cat}>
              <button
                onClick={() => setClosed((c) => ({ ...c, [cat]: !c[cat] }))}
                className="flex w-full items-center gap-1 bg-muted/50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted"
              >
                {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {cat}
              </button>
              {open && (
                <div className="divide-y divide-border/50">
                  {isData && (
                    <>
                      <Row label="Name">
                        <input
                          value={node.name}
                          onChange={(e) => b.renameNode(node.id, e.target.value)}
                          className="h-6 w-full rounded-sm border border-input bg-background px-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                        />
                      </Row>
                      <Row label="Parent">
                        <span className="truncate text-xs text-muted-foreground">{parentPath || "—"}</span>
                      </Row>
                      <Row label="ClassName">
                        <span className="text-xs text-muted-foreground">{node.className}</span>
                      </Row>
                    </>
                  )}
                  {items.map((def) => (
                    <Row key={def.name} label={def.name}>
                      <Field
                        def={def}
                        value={(node.props as any)[def.name]}
                        onChange={(v) => b.patchProps(node.id, { [def.name]: v })}
                      />
                    </Row>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={cn("grid grid-cols-[minmax(90px,44%)_1fr] items-center gap-2 px-2 py-1")}>
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
