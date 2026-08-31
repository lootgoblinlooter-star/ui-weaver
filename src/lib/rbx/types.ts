export type UDim2 = { xs: number; xo: number; ys: number; yo: number };
export type Vector2 = { x: number; y: number };

export type RbxClass =
  | "ScreenGui"
  | "Frame"
  | "ScrollingFrame"
  | "CanvasGroup"
  | "ViewportFrame"
  | "TextLabel"
  | "TextButton"
  | "TextBox"
  | "ImageLabel"
  | "ImageButton"
  | "UICorner"
  | "UIStroke"
  | "UIGradient"
  | "UIPadding"
  | "UIListLayout"
  | "UIGridLayout"
  | "UIPageLayout"
  | "UIAspectRatioConstraint"
  | "UIScale"
  | "UISizeConstraint"
  | "UITextSizeConstraint";

export type RbxProps = Record<string, unknown>;

export interface RbxNode {
  id: string;
  className: RbxClass;
  name: string;
  props: RbxProps;
  children: RbxNode[];
  hidden?: boolean;
  locked?: boolean;
}

export interface Asset {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export interface UiComponent {
  id: string;
  name: string;
  node: RbxNode;
}

export interface VersionEntry {
  id: string;
  label: string;
  at: number;
  root: RbxNode;
}

export interface DeviceSpec {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const DEVICES: DeviceSpec[] = [
  { id: "pc", label: "PC — 1920×1080", width: 1920, height: 1080 },
  { id: "laptop", label: "Laptop — 1366×768", width: 1366, height: 768 },
  { id: "tablet", label: "Tablet — 1180×820", width: 1180, height: 820 },
  { id: "mobile", label: "Mobile — 844×390", width: 844, height: 390 },
  { id: "console", label: "Console — 1920×1080 (safe)", width: 1920, height: 1080 },
];

export const isGuiObject = (c: RbxClass) =>
  [
    "Frame",
    "ScrollingFrame",
    "CanvasGroup",
    "ViewportFrame",
    "TextLabel",
    "TextButton",
    "TextBox",
    "ImageLabel",
    "ImageButton",
  ].includes(c);

export const isModifier = (c: RbxClass) => c.startsWith("UI");
