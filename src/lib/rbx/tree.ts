import { defaultProps } from "./schema";
import type { RbxClass, RbxNode, UDim2 } from "./types";

export const uid = () => Math.random().toString(36).slice(2, 10);

export function createNode(
  className: RbxClass,
  name?: string,
  props: Record<string, unknown> = {},
  children: RbxNode[] = [],
): RbxNode {
  return {
    id: uid(),
    className,
    name: name ?? className,
    props: { ...defaultProps(className), ...props },
    children,
  };
}

export function cloneNode(node: RbxNode): RbxNode {
  return {
    ...node,
    id: uid(),
    props: JSON.parse(JSON.stringify(node.props)),
    children: node.children.map(cloneNode),
  };
}

export function findNode(root: RbxNode, id: string): RbxNode | null {
  if (root.id === id) return root;
  for (const c of root.children) {
    const f = findNode(c, id);
    if (f) return f;
  }
  return null;
}

export function findParent(root: RbxNode, id: string): RbxNode | null {
  for (const c of root.children) {
    if (c.id === id) return root;
    const f = findParent(c, id);
    if (f) return f;
  }
  return null;
}

export function pathOf(root: RbxNode, id: string): RbxNode[] {
  const out: RbxNode[] = [];
  const walk = (n: RbxNode, acc: RbxNode[]): boolean => {
    const next = [...acc, n];
    if (n.id === id) {
      out.push(...next);
      return true;
    }
    return n.children.some((c) => walk(c, next));
  };
  walk(root, []);
  return out;
}

export function mapTree(root: RbxNode, fn: (n: RbxNode) => RbxNode): RbxNode {
  const next = fn(root);
  return { ...next, children: next.children.map((c) => mapTree(c, fn)) };
}

export function updateNode(root: RbxNode, id: string, fn: (n: RbxNode) => RbxNode): RbxNode {
  if (root.id === id) return fn(root);
  return { ...root, children: root.children.map((c) => updateNode(c, id, fn)) };
}

export function removeNode(root: RbxNode, id: string): RbxNode {
  return {
    ...root,
    children: root.children.filter((c) => c.id !== id).map((c) => removeNode(c, id)),
  };
}

export function insertNode(
  root: RbxNode,
  parentId: string,
  node: RbxNode,
  index?: number,
): RbxNode {
  return updateNode(root, parentId, (p) => {
    const children = [...p.children];
    children.splice(index ?? children.length, 0, node);
    return { ...p, children };
  });
}

export function isDescendant(root: RbxNode, ancestorId: string, id: string): boolean {
  const a = findNode(root, ancestorId);
  if (!a) return false;
  return !!a.children.find((c) => c.id === id || isDescendant(c, c.id, id));
}

export function flatten(root: RbxNode): RbxNode[] {
  return [root, ...root.children.flatMap(flatten)];
}

export const udim2 = (xs: number, xo: number, ys: number, yo: number): UDim2 => ({
  xs,
  xo,
  ys,
  yo,
});

export function findByName(root: RbxNode, name: string): RbxNode | null {
  return flatten(root).find((n) => n.name === name) ?? null;
}
