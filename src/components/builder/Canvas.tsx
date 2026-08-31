/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBuilder } from "@/lib/rbx/store";
import { collectRects, nodeStyle, textStyle, type Rect } from "@/lib/rbx/render";
import { DEVICES, isGuiObject, type RbxNode } from "@/lib/rbx/types";
import { findParent } from "@/lib/rbx/tree";
import { cn } from "@/lib/utils";

const HANDLES = [
  ["nw", 0, 0],
  ["n", 0.5, 0],
  ["ne", 1, 0],
  ["e", 1, 0.5],
  ["se", 1, 1],
  ["s", 0.5, 1],
  ["sw", 0, 1],
  ["w", 0, 0.5],
] as const;

export function Canvas({ preview }: { preview: boolean }) {
  const { root, selection, select, toggleSelect, patchProps, device } = useBuilder();
  const spec = DEVICES.find((d) => d.id === device) ?? DEVICES[0]!;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.5);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const panRef = useRef(pan);
  panRef.current = pan;

  const viewport: Rect = { x: 0, y: 0, w: spec.width, h: spec.height };
  const rects = useMemo(() => collectRects(root, viewport), [root, spec.width, spec.height]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaX) < 1) {
        const rect = el.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const next = Math.max(0.1, Math.min(2.5, zoomRef.current * Math.exp(-dy * 0.0015)));
        const k = next / zoomRef.current;
        setPan({
          x: px - (px - panRef.current.x) * k,
          y: py - (py - panRef.current.y) * k,
        });
        setZoom(next);
      } else {
        setPan({ x: panRef.current.x - e.deltaX, y: panRef.current.y - dy });
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const startDrag = useCallback(
    (e: React.PointerEvent, node: RbxNode, handle?: string) => {
      if (preview || node.locked) return;
      e.stopPropagation();
      const parent = findParent(root, node.id);
      const parentRect = parent ? (rects.get(parent.id) ?? viewport) : viewport;
      const startPos = { ...(node.props["Position"] as any) };
      const startSize = { ...(node.props["Size"] as any) };
      const sx = e.clientX;
      const sy = e.clientY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const move = (ev: PointerEvent) => {
        const dx = (ev.clientX - sx) / zoomRef.current;
        const dy = (ev.clientY - sy) / zoomRef.current;
        const fx = dx / parentRect.w;
        const fy = dy / parentRect.h;
        if (!handle) {
          patchProps(
            node.id,
            {
              Position: {
                ...startPos,
                xs: +(startPos.xs + fx).toFixed(4),
                ys: +(startPos.ys + fy).toFixed(4),
              },
            },
            false,
          );
        } else {
          const size = { ...startSize };
          const pos = { ...startPos };
          if (handle.includes("e")) size.xs = Math.max(0.01, +(startSize.xs + fx).toFixed(4));
          if (handle.includes("s")) size.ys = Math.max(0.01, +(startSize.ys + fy).toFixed(4));
          if (handle.includes("w")) {
            size.xs = Math.max(0.01, +(startSize.xs - fx).toFixed(4));
            pos.xs = +(startPos.xs + fx).toFixed(4);
          }
          if (handle.includes("n")) {
            size.ys = Math.max(0.01, +(startSize.ys - fy).toFixed(4));
            pos.ys = +(startPos.ys + fy).toFixed(4);
          }
          patchProps(node.id, { Size: size, Position: pos }, false);
        }
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        patchProps(node.id, {}, true);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [preview, root, rects, patchProps, viewport],
  );

  const renderNode = (node: RbxNode, parentRect: Rect): React.ReactNode => {
    if (!isGuiObject(node.className)) return null;
    const rect = rects.get(node.id) ?? parentRect;
    const local: Rect = { ...rect, x: rect.x - parentRect.x, y: rect.y - parentRect.y };
    const p = node.props as any;
    const isText = node.className.startsWith("Text");
    const isImage = node.className.startsWith("Image");
    const selected = selection.includes(node.id);

    return (
      <div
        key={node.id}
        style={nodeStyle(node, local)}
        onPointerDown={(e) => {
          if (preview) return;
          e.stopPropagation();
          if (e.shiftKey) toggleSelect(node.id);
          else if (!selection.includes(node.id)) select([node.id]);
          startDrag(e, node);
        }}
        className={cn(!preview && "cursor-move", node.hidden && "pointer-events-none")}
      >
        {isImage &&
          (p["Image"] ? (
            <img
              src={p["Image"]}
              alt={node.name}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: p["ScaleType"] === "Stretch" ? "fill" : p["ScaleType"] === "Crop" ? "cover" : "contain",
                opacity: 1 - (p["ImageTransparency"] ?? 0),
                pointerEvents: "none",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: `repeating-linear-gradient(45deg, ${p["ImageColor3"] ?? "#888"}22, ${p["ImageColor3"] ?? "#888"}22 8px, transparent 8px, transparent 16px)`,
                pointerEvents: "none",
              }}
            />
          ))}
        {isText && <div style={textStyle(node, local)}>{String(p["Text"] ?? "")}</div>}
        {node.children.map((c) => renderNode(c, rect))}
        {!preview && selected && (
          <>
            <div className="pointer-events-none absolute inset-0 outline-2 outline-[oklch(0.72_0.15_250)]" />
            {HANDLES.map(([h, hx, hy]) => (
              <div
                key={h}
                onPointerDown={(e) => startDrag(e, node, h)}
                style={{
                  left: `calc(${hx * 100}% - 5px)`,
                  top: `calc(${hy * 100}% - 5px)`,
                  cursor: `${h}-resize`,
                }}
                className="absolute h-[10px] w-[10px] rounded-[2px] border border-background bg-[oklch(0.72_0.15_250)]"
              />
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div
      ref={wrapRef}
      onPointerDown={() => !preview && select([])}
      className="relative h-full w-full overflow-hidden bg-[oklch(0.17_0.015_260)] [background-image:radial-gradient(oklch(0.28_0.02_260)_1px,transparent_1px)] [background-size:22px_22px]"
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: spec.width,
          height: spec.height,
        }}
        className="absolute left-16 top-16 shadow-2xl"
      >
        <div
          className="relative overflow-hidden bg-[#12151c]"
          style={{ width: spec.width, height: spec.height }}
        >
          {root.children.map((c) => renderNode(c, viewport))}
          {device === "console" && !preview && (
            <div className="pointer-events-none absolute inset-[5%] border-2 border-dashed border-[oklch(0.7_0.16_60)]/50" />
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-md border border-border bg-card/90 px-3 py-1.5 text-xs backdrop-blur">
        <button onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))} className="px-1 text-muted-foreground hover:text-foreground">
          −
        </button>
        <span className="w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))} className="px-1 text-muted-foreground hover:text-foreground">
          +
        </button>
        <button
          onClick={() => {
            setZoom(0.5);
            setPan({ x: 0, y: 0 });
          }}
          className="ml-2 text-muted-foreground hover:text-foreground"
        >
          Reset
        </button>
        <span className="ml-2 text-muted-foreground">
          {spec.width}×{spec.height}
        </span>
      </div>
    </div>
  );
}
