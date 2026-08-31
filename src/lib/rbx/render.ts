import type { CSSProperties } from "react";
import type { RbxNode, UDim2, Vector2 } from "./types";
import { isGuiObject } from "./types";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const u = (v: unknown): UDim2 =>
  (v as UDim2) ?? { xs: 0, xo: 0, ys: 0, yo: 0 };
const v2 = (v: unknown): Vector2 => (v as Vector2) ?? { x: 0, y: 0 };

export function computeRect(node: RbxNode, parent: Rect): Rect {
  const np = node.props as Record<string, unknown>;
  const size = u(np["Size"]);
  const pos = u(np["Position"]);
  const anchor = v2(np["AnchorPoint"]);
  const w = size.xs * parent.w + size.xo;
  const h = size.ys * parent.h + size.yo;
  const x = parent.x + pos.xs * parent.w + pos.xo - anchor.x * w;
  const y = parent.y + pos.ys * parent.h + pos.yo - anchor.y * h;
  return { x, y, w, h };
}

export function childModifier(node: RbxNode, className: string): RbxNode | undefined {
  return node.children.find((c) => c.className === className);
}

export function nodeStyle(node: RbxNode, rect: Rect): CSSProperties {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = node.props as any;
  const corner = childModifier(node, "UICorner");
  const stroke = childModifier(node, "UIStroke");
  const gradient = childModifier(node, "UIGradient");
  const scale = childModifier(node, "UIScale");
  const radius = corner ? u((corner.props as any)["CornerRadius"]) : null;

  const bgAlpha = 1 - (p.BackgroundTransparency ?? 0);
  const style: CSSProperties = {
    position: "absolute",
    left: rect.x,
    top: rect.y,
    width: rect.w,
    height: rect.h,
    background: gradient
      ? `linear-gradient(${(gradient.props as any).Rotation ?? 0}deg, ${(gradient.props as any).Color}, ${(gradient.props as any).Color2 ?? (gradient.props as any).Color})`
      : hexAlpha(p.BackgroundColor3 ?? "#ffffff", bgAlpha),
    borderRadius: radius ? `${radius.xo + radius.xs * rect.w}px` : undefined,
    opacity:
      (node.hidden ? 0.25 : 1) *
      (p.Visible === false ? 0 : 1) *
      (1 - ((p.GroupTransparency as number) ?? 0)),
    transform: `rotate(${p.Rotation ?? 0}deg) scale(${scale ? ((scale.props as any).Scale ?? 1) : 1})`,
    overflow: p.ClipsDescendants ? "hidden" : "visible",
    zIndex: (p.ZIndex as number) ?? 1,
    boxSizing: "border-box",
  };

  if (stroke) {
    const sp = stroke.props as any;
    style.outline = `${sp.Thickness ?? 1}px solid ${hexAlpha(sp.Color ?? "#000", 1 - (sp.Transparency ?? 0))}`;
    style.outlineOffset = "0px";
  }
  if ((p.BorderSizePixel ?? 0) > 0) {
    style.border = `${p.BorderSizePixel}px solid ${p.BorderColor3 ?? "#000"}`;
  }
  return style;
}

export function textStyle(node: RbxNode, rect: Rect): CSSProperties {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = node.props as any;
  const padding = childModifier(node, "UIPadding");
  const pad = padding
    ? {
        paddingTop: u((padding.props as any)["PaddingTop"]).xo,
        paddingBottom: u((padding.props as any)["PaddingBottom"]).xo,
        paddingLeft: u((padding.props as any)["PaddingLeft"]).xo,
        paddingRight: u((padding.props as any)["PaddingRight"]).xo,
      }
    : {};
  const size = p.TextScaled ? Math.max(8, rect.h * 0.55) : (p.TextSize ?? 14);
  return {
    display: "flex",
    width: "100%",
    height: "100%",
    alignItems:
      p.TextYAlignment === "Top" ? "flex-start" : p.TextYAlignment === "Bottom" ? "flex-end" : "center",
    justifyContent:
      p.TextXAlignment === "Left" ? "flex-start" : p.TextXAlignment === "Right" ? "flex-end" : "center",
    color: hexAlpha(p.TextColor3 ?? "#fff", 1 - (p.TextTransparency ?? 0)),
    fontSize: size,
    fontWeight: String(p.Font ?? "").includes("Bold") || String(p.Font ?? "").includes("Black") ? 800 : 500,
    fontFamily:
      String(p.Font ?? "").includes("Code") ? "ui-monospace, monospace" : "Inter, system-ui, sans-serif",
    lineHeight: p.LineHeight ?? 1.1,
    whiteSpace: p.TextWrapped ? "normal" : "nowrap",
    textShadow:
      (p.TextStrokeTransparency ?? 1) < 1
        ? `0 0 2px ${p.TextStrokeColor3 ?? "#000"}, 0 1px 2px ${p.TextStrokeColor3 ?? "#000"}`
        : undefined,
    pointerEvents: "none",
    overflow: "hidden",
    ...pad,
  };
}

export function hexAlpha(hex: string, alpha: number) {
  const h = (hex || "#000000").replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

export function collectRects(root: RbxNode, viewport: Rect): Map<string, Rect> {
  const map = new Map<string, Rect>();
  const walk = (node: RbxNode, parentRect: Rect) => {
    const rect = isGuiObject(node.className) ? computeRect(node, parentRect) : parentRect;
    map.set(node.id, rect);
    node.children.forEach((c) => walk(c, rect));
  };
  map.set(root.id, viewport);
  root.children.forEach((c) => walk(c, viewport));
  return map;
}
