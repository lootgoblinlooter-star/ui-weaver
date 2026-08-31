import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Asset, RbxClass, RbxNode, UiComponent, VersionEntry } from "./types";
import {
  cloneNode,
  createNode,
  findNode,
  findParent,
  insertNode,
  removeNode,
  updateNode,
  uid,
  isDescendant,
} from "./tree";
import { starterProject } from "./starter";

interface State {
  root: RbxNode;
  selection: string[];
  assets: Asset[];
  components: UiComponent[];
  versions: VersionEntry[];
  device: string;
}

interface Ctx extends State {
  select: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  setRoot: (root: RbxNode, label?: string) => void;
  patchProps: (id: string, props: Record<string, unknown>, commit?: boolean) => void;
  renameNode: (id: string, name: string) => void;
  addChild: (parentId: string, className: RbxClass, name?: string) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  reparent: (id: string, parentId: string, index?: number) => void;
  reorder: (id: string, delta: number | "front" | "back") => void;
  toggleFlag: (id: string, flag: "hidden" | "locked") => void;
  group: (ids: string[]) => void;
  ungroup: (id: string) => void;
  addAsset: (a: Asset) => void;
  removeAsset: (id: string) => void;
  saveComponent: (id: string) => void;
  insertComponent: (componentId: string, parentId: string) => void;
  restoreVersion: (versionId: string) => void;
  snapshot: (label: string) => void;
  setDevice: (d: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const BuilderContext = createContext<Ctx | null>(null);

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [root, setRootState] = useState<RbxNode>(() => starterProject());
  const [selection, setSelection] = useState<string[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [components, setComponents] = useState<UiComponent[]>([]);
  const [device, setDevice] = useState("pc");
  const [versions, setVersions] = useState<VersionEntry[]>(() => []);
  const past = useRef<RbxNode[]>([]);
  const future = useRef<RbxNode[]>([]);
  const [, force] = useState(0);

  useEffect(() => {
    setVersions([{ id: uid(), label: "Initial UI", at: Date.now(), root }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = useCallback((next: RbxNode, label?: string) => {
    past.current = [...past.current.slice(-99), rootRef.current];
    future.current = [];
    rootRef.current = next;
    setRootState(next);
    if (label) {
      setVersions((v) => [...v, { id: uid(), label, at: Date.now(), root: next }].slice(-40));
    }
    force((n) => n + 1);
  }, []);

  const rootRef = useRef(root);
  rootRef.current = root;

  const api: Ctx = useMemo(() => {
    const withRoot = (fn: (r: RbxNode) => RbxNode, label?: string) =>
      commit(fn(rootRef.current), label);

    return {
      root,
      selection,
      assets,
      components,
      versions,
      device,
      setDevice,
      select: setSelection,
      toggleSelect: (id) =>
        setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
      setRoot: (next, label) => withRoot(() => next, label),
      patchProps: (id, props, doCommit = true) => {
        const next = updateNode(rootRef.current, id, (n) => ({
          ...n,
          props: { ...n.props, ...props },
        }));
        if (doCommit) commit(next);
        else {
          rootRef.current = next;
          setRootState(next);
        }
      },
      renameNode: (id, name) => withRoot((r) => updateNode(r, id, (n) => ({ ...n, name }))),
      addChild: (parentId, className, name) =>
        withRoot((r) => insertNode(r, parentId, createNode(className, name))),
      duplicate: (id) =>
        withRoot((r) => {
          const parent = findParent(r, id);
          const node = findNode(r, id);
          if (!parent || !node) return r;
          const copy = cloneNode(node);
          copy.name = `${node.name}Copy`;
          const idx = parent.children.findIndex((c) => c.id === id) + 1;
          return insertNode(r, parent.id, copy, idx);
        }),
      remove: (id) => {
        if (id === rootRef.current.id) return;
        setSelection((s) => s.filter((x) => x !== id));
        withRoot((r) => removeNode(r, id));
      },
      reparent: (id, parentId, index) =>
        withRoot((r) => {
          if (id === r.id || id === parentId) return r;
          if (isDescendant(r, id, parentId)) return r;
          const node = findNode(r, id);
          if (!node) return r;
          const stripped = removeNode(r, id);
          return insertNode(stripped, parentId, node, index);
        }),
      reorder: (id, delta) =>
        withRoot((r) => {
          const parent = findParent(r, id);
          if (!parent) return r;
          const idx = parent.children.findIndex((c) => c.id === id);
          const children = [...parent.children];
          const [node] = children.splice(idx, 1);
          if (!node) return r;
          const target =
            delta === "front"
              ? children.length
              : delta === "back"
                ? 0
                : Math.max(0, Math.min(children.length, idx + delta));
          children.splice(target, 0, node);
          return updateNode(r, parent.id, (p) => ({ ...p, children }));
        }),
      toggleFlag: (id, flag) =>
        withRoot((r) => updateNode(r, id, (n) => ({ ...n, [flag]: !n[flag] }))),
      group: (ids) =>
        withRoot((r) => {
          const first = ids[0];
          if (!first) return r;
          const parent = findParent(r, first);

          if (!parent) return r;
          const nodes = ids.map((i) => findNode(r, i)).filter(Boolean) as RbxNode[];
          let next = r;
          ids.forEach((i) => (next = removeNode(next, i)));
          const groupNode = createNode(
            "Frame",
            "Group",
            {
              BackgroundTransparency: 1,
              Position: { xs: 0, xo: 0, ys: 0, yo: 0 },
              Size: { xs: 1, xo: 0, ys: 1, yo: 0 },
            },
            nodes,
          );
          return insertNode(next, parent.id, groupNode);
        }),
      ungroup: (id) =>
        withRoot((r) => {
          const parent = findParent(r, id);
          const node = findNode(r, id);
          if (!parent || !node) return r;
          const idx = parent.children.findIndex((c) => c.id === id);
          let next = removeNode(r, id);
          node.children.forEach((c, i) => {
            next = insertNode(next, parent.id, c, idx + i);
          });
          return next;
        }),
      addAsset: (a) => setAssets((s) => [...s, a]),
      removeAsset: (id) => setAssets((s) => s.filter((a) => a.id !== id)),
      saveComponent: (id) => {
        const node = findNode(rootRef.current, id);
        if (!node) return;
        setComponents((c) => [...c, { id: uid(), name: node.name, node: cloneNode(node) }]);
      },
      insertComponent: (componentId, parentId) =>
        withRoot((r) => {
          const comp = components.find((c) => c.id === componentId);
          if (!comp) return r;
          return insertNode(r, parentId, cloneNode(comp.node));
        }),
      restoreVersion: (versionId) => {
        const v = versions.find((x) => x.id === versionId);
        if (v) commit(v.root);
      },
      snapshot: (label) =>
        setVersions((v) =>
          [...v, { id: uid(), label, at: Date.now(), root: rootRef.current }].slice(-40),
        ),
      undo: () => {
        const prev = past.current.pop();
        if (!prev) return;
        future.current = [rootRef.current, ...future.current];
        rootRef.current = prev;
        setRootState(prev);
        force((n) => n + 1);
      },
      redo: () => {
        const [next, ...rest] = future.current;
        if (!next) return;
        future.current = rest;
        past.current = [...past.current, rootRef.current];
        rootRef.current = next;
        setRootState(next);
        force((n) => n + 1);
      },
      canUndo: past.current.length > 0,
      canRedo: future.current.length > 0,
    };
  }, [root, selection, assets, components, versions, device, commit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && ["INPUT", "TEXTAREA"].includes(t.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) api.redo();
        else api.undo();
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selection[0]) {
        e.preventDefault();
        selection.forEach((id) => api.remove(id));
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d" && selection[0]) {
        e.preventDefault();
        api.duplicate(selection[0]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [api, selection]);

  return <BuilderContext.Provider value={api}>{children}</BuilderContext.Provider>;
}

export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used inside BuilderProvider");
  return ctx;
}
