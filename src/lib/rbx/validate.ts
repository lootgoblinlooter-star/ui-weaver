/* eslint-disable @typescript-eslint/no-explicit-any */
import { collectRects, type Rect } from "./render";
import { flatten } from "./tree";
import type { RbxNode } from "./types";
import { isGuiObject } from "./types";

export interface Issue {
  id: string;
  nodeId: string;
  nodeName: string;
  severity: "warning" | "error";
  message: string;
}

export function validate(root: RbxNode, viewport: Rect): Issue[] {
  const issues: Issue[] = [];
  const rects = collectRects(root, viewport);
  const nodes = flatten(root).filter((n) => isGuiObject(n.className));

  const push = (n: RbxNode, severity: Issue["severity"], message: string) =>
    issues.push({ id: `${n.id}-${message}`, nodeId: n.id, nodeName: n.name, severity, message });

  for (const n of nodes) {
    const p = n.props as any;
    const rect = rects.get(n.id);
    if (!rect) continue;

    const size = p.Size ?? {};
    const pos = p.Position ?? {};
    if ((size.xo ?? 0) !== 0 || (size.yo ?? 0) !== 0)
      push(n, "warning", "Uses fixed pixel offsets in Size — prefer Scale for responsiveness");
    if ((pos.xo ?? 0) !== 0 || (pos.yo ?? 0) !== 0)
      push(n, "warning", "Uses fixed pixel offsets in Position — prefer Scale");

    if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > viewport.w || rect.y + rect.h > viewport.h)
      push(n, "error", "Element extends outside the screen safe area");

    if (n.className.includes("Button") && (rect.h < viewport.h * 0.06 || rect.w < viewport.w * 0.05))
      push(n, "warning", "Touch target is too small for mobile");

    if (n.className.startsWith("Text")) {
      const effective = p.TextScaled ? rect.h * 0.55 : (p.TextSize ?? 14);
      if (effective < 14) push(n, "warning", "Text may be too small to read on mobile");
      if (!n.children.some((c) => c.className === "UITextSizeConstraint") && p.TextScaled)
        push(n, "warning", "TextScaled without a UITextSizeConstraint can render huge or tiny text");
    }

    if (n.className.startsWith("Image")) {
      const ratio = rect.w / Math.max(1, rect.h);
      const hasAspect = n.children.some((c) => c.className === "UIAspectRatioConstraint");
      if (!hasAspect && (ratio > 3 || ratio < 0.33))
        push(n, "warning", "Image may stretch — add a UIAspectRatioConstraint");
    }
  }

  // overlap detection between siblings
  const walk = (parent: RbxNode) => {
    const kids = parent.children.filter((c) => isGuiObject(c.className));
    for (let i = 0; i < kids.length; i++) {
      for (let j = i + 1; j < kids.length; j++) {
        const a = rects.get(kids[i]!.id);
        const c = rects.get(kids[j]!.id);
        if (!a || !c) continue;
        const overlapW = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x);
        const overlapH = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
        if (overlapW > 0 && overlapH > 0) {
          const area = overlapW * overlapH;
          if (area > 0.4 * Math.min(a.w * a.h, c.w * c.h))
            push(kids[j]!, "warning", `Overlaps sibling "${kids[i]!.name}"`);
        }
      }
    }
    parent.children.forEach(walk);
  };
  walk(root);

  return issues;
}
