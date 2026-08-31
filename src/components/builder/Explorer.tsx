/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Search,
  Square,
  Type,
  Image as ImageIcon,
  MousePointerClick,
  Layers,
  Wand2,
  Box,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { useBuilder } from "@/lib/rbx/store";
import type { RbxClass, RbxNode } from "@/lib/rbx/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ICONS: Record<string, any> = {
  ScreenGui: Layers,
  Frame: Square,
  ScrollingFrame: Square,
  CanvasGroup: Square,
  ViewportFrame: Box,
  TextLabel: Type,
  TextBox: Type,
  TextButton: MousePointerClick,
  ImageLabel: ImageIcon,
  ImageButton: MousePointerClick,
};

const INSERTABLE: RbxClass[] = [
  "Frame",
  "ScrollingFrame",
  "CanvasGroup",
  "TextLabel",
  "TextButton",
  "TextBox",
  "ImageLabel",
  "ImageButton",
  "ViewportFrame",
  "UICorner",
  "UIStroke",
  "UIGradient",
  "UIPadding",
  "UIListLayout",
  "UIGridLayout",
  "UIPageLayout",
  "UIAspectRatioConstraint",
  "UIScale",
  "UISizeConstraint",
  "UITextSizeConstraint",
];

export function Explorer({ onAsk }: { onAsk: (prompt: string) => void }) {
  const b = useBuilder();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [renaming, setRenaming] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<RbxNode | null>(null);
  const [styleClip, setStyleClip] = useState<Record<string, unknown> | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const matches = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    const set = new Set<string>();
    const walk = (n: RbxNode): boolean => {
      const hit = n.name.toLowerCase().includes(q) || n.className.toLowerCase().includes(q);
      const childHit = n.children.map(walk).some(Boolean);
      if (hit || childHit) set.add(n.id);
      return hit || childHit;
    };
    walk(b.root);
    return set;
  }, [query, b.root]);

  const row = (node: RbxNode, depth: number) => {
    if (matches && !matches.has(node.id)) return null;
    const Icon = ICONS[node.className] ?? Wand2;
    const selected = b.selection.includes(node.id);
    const hasChildren = node.children.length > 0;
    const open = !collapsed[node.id];

    return (
      <div key={node.id}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              draggable
              onDragStart={() => setDragId(node.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId && dragId !== node.id) b.reparent(dragId, node.id);
                setDragId(null);
              }}
              onClick={(e) => (e.shiftKey ? b.toggleSelect(node.id) : b.select([node.id]))}
              onDoubleClick={() => setRenaming(node.id)}
              style={{ paddingLeft: depth * 12 + 6 }}
              className={cn(
                "group flex h-[26px] cursor-default select-none items-center gap-1.5 rounded-sm pr-1.5 text-[13px]",
                selected ? "bg-primary/25 text-foreground" : "hover:bg-muted/60",
              )}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCollapsed((c) => ({ ...c, [node.id]: !c[node.id] }));
                }}
                className={cn("shrink-0 text-muted-foreground", !hasChildren && "invisible")}
              >
                {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
              <Icon size={13} className="shrink-0 text-primary" />
              {renaming === node.id ? (
                <input
                  autoFocus
                  defaultValue={node.name}
                  onBlur={(e) => {
                    b.renameNode(node.id, e.target.value || node.name);
                    setRenaming(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setRenaming(null);
                  }}
                  className="h-5 w-full rounded-sm bg-background px-1 text-[13px] outline-none ring-1 ring-primary"
                />
              ) : (
                <span className={cn("truncate", node.hidden && "text-muted-foreground line-through")}>
                  {node.name}
                </span>
              )}
              <span className="ml-auto hidden shrink-0 text-[10px] text-muted-foreground group-hover:inline">
                {node.className}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  b.toggleFlag(node.id, "hidden");
                }}
                className="shrink-0 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
              >
                {node.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  b.toggleFlag(node.id, "locked");
                }}
                className="shrink-0 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
              >
                {node.locked ? <Lock size={12} /> : <LockOpen size={12} />}
              </button>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-56">
            <ContextMenuItem onSelect={() => setRenaming(node.id)}>Rename</ContextMenuItem>
            <ContextMenuItem onSelect={() => b.duplicate(node.id)}>Duplicate</ContextMenuItem>
            <ContextMenuItem onSelect={() => setClipboard(node)}>Copy</ContextMenuItem>
            <ContextMenuItem
              disabled={!clipboard}
              onSelect={() => {
                if (!clipboard) return;
                b.reparent(clipboard.id, node.id);
              }}
            >
              Paste Into
            </ContextMenuItem>
            <ContextMenuItem className="text-destructive" onSelect={() => b.remove(node.id)}>
              Delete
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => b.group(b.selection.length ? b.selection : [node.id])}>
              Group
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => b.ungroup(node.id)}>Ungroup</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => b.reorder(node.id, "front")}>Move to Front</ContextMenuItem>
            <ContextMenuItem onSelect={() => b.reorder(node.id, 1)}>Move Forward</ContextMenuItem>
            <ContextMenuItem onSelect={() => b.reorder(node.id, -1)}>Move Backward</ContextMenuItem>
            <ContextMenuItem onSelect={() => b.reorder(node.id, "back")}>Move to Back</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => b.toggleFlag(node.id, "hidden")}>
              {node.hidden ? "Show" : "Hide"}
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => b.toggleFlag(node.id, "locked")}>
              {node.locked ? "Unlock" : "Lock"}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={() => {
                setStyleClip(JSON.parse(JSON.stringify(node.props)));
                toast.success("Style copied");
              }}
            >
              Copy Style
            </ContextMenuItem>
            <ContextMenuItem
              disabled={!styleClip}
              onSelect={() => {
                if (!styleClip) return;
                const { Position, Size, AnchorPoint, Text, ...rest } = styleClip as any;
                b.patchProps(node.id, rest);
              }}
            >
              Paste Style
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>Insert Object</ContextMenuSubTrigger>
              <ContextMenuSubContent className="max-h-80 overflow-y-auto">
                {INSERTABLE.map((c) => (
                  <ContextMenuItem key={c} onSelect={() => b.addChild(node.id, c)}>
                    {c}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuItem onSelect={() => b.saveComponent(node.id)}>
              Convert to Component
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={() => {
                b.select([node.id]);
                onAsk(`Rename the selected object (${node.name}) to a clearer, descriptive Roblox-style name.`);
              }}
            >
              Rename with AI
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => {
                b.select([node.id]);
                onAsk(`Explain what the selected object "${node.name}" does in this UI.`);
              }}
            >
              Explain with AI
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => {
                b.select([node.id]);
                onAsk(`Generate sensible child elements inside the selected object "${node.name}".`);
              }}
            >
              Generate Children
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        {open && node.children.map((c) => row(c, depth + 1))}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Explorer
        </span>
        <div className="relative ml-auto w-36">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="h-6 pl-6 text-xs"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-1">{row(b.root, 0)}</div>
    </div>
  );
}
