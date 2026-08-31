import type { RbxClass, RbxProps } from "./types";

export type PropKind =
  | "string"
  | "number"
  | "boolean"
  | "color"
  | "udim2"
  | "vector2"
  | "enum"
  | "text";

export interface PropDef {
  name: string;
  kind: PropKind;
  category: "Appearance" | "Data" | "Layout" | "Behaviour" | "UI" | "Text" | "Image";
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export const FONTS = [
  "GothamMedium",
  "GothamBold",
  "GothamBlack",
  "Gotham",
  "SourceSans",
  "SourceSansBold",
  "Arcade",
  "Fantasy",
  "Code",
];

const BASE_GUI: PropDef[] = [
  { name: "BackgroundColor3", kind: "color", category: "Appearance" },
  { name: "BackgroundTransparency", kind: "number", category: "Appearance", min: 0, max: 1, step: 0.05 },
  { name: "BorderColor3", kind: "color", category: "Appearance" },
  { name: "BorderMode", kind: "enum", category: "Appearance", options: ["Outline", "Middle", "Inset"] },
  { name: "BorderSizePixel", kind: "number", category: "Appearance", min: 0, step: 1 },
  { name: "Visible", kind: "boolean", category: "Appearance" },
  { name: "AnchorPoint", kind: "vector2", category: "Layout" },
  { name: "Position", kind: "udim2", category: "Layout" },
  { name: "Size", kind: "udim2", category: "Layout" },
  { name: "Rotation", kind: "number", category: "Layout", step: 1 },
  { name: "ZIndex", kind: "number", category: "Layout", step: 1 },
  { name: "Active", kind: "boolean", category: "Behaviour" },
  { name: "Selectable", kind: "boolean", category: "Behaviour" },
  { name: "ClipsDescendants", kind: "boolean", category: "UI" },
  { name: "AutomaticSize", kind: "enum", category: "UI", options: ["None", "X", "Y", "XY"] },
];

const TEXT_PROPS: PropDef[] = [
  { name: "Text", kind: "text", category: "Text" },
  { name: "Font", kind: "enum", category: "Text", options: FONTS },
  { name: "TextSize", kind: "number", category: "Text", min: 1, step: 1 },
  { name: "TextColor3", kind: "color", category: "Text" },
  { name: "TextTransparency", kind: "number", category: "Text", min: 0, max: 1, step: 0.05 },
  { name: "TextStrokeColor3", kind: "color", category: "Text" },
  { name: "TextStrokeTransparency", kind: "number", category: "Text", min: 0, max: 1, step: 0.05 },
  { name: "TextWrapped", kind: "boolean", category: "Text" },
  { name: "TextScaled", kind: "boolean", category: "Text" },
  { name: "TextXAlignment", kind: "enum", category: "Text", options: ["Left", "Center", "Right"] },
  { name: "TextYAlignment", kind: "enum", category: "Text", options: ["Top", "Center", "Bottom"] },
  { name: "RichText", kind: "boolean", category: "Text" },
  { name: "LineHeight", kind: "number", category: "Text", min: 1, max: 3, step: 0.05 },
  { name: "MaxVisibleGraphemes", kind: "number", category: "Text", step: 1 },
];

const IMAGE_PROPS: PropDef[] = [
  { name: "Image", kind: "string", category: "Image" },
  { name: "ImageColor3", kind: "color", category: "Image" },
  { name: "ImageTransparency", kind: "number", category: "Image", min: 0, max: 1, step: 0.05 },
  {
    name: "ScaleType",
    kind: "enum",
    category: "Image",
    options: ["Stretch", "Slice", "Tile", "Fit", "Crop"],
  },
  { name: "SliceScale", kind: "number", category: "Image", step: 0.1 },
  { name: "ResampleMode", kind: "enum", category: "Image", options: ["Default", "Pixelated"] },
];

export const PROPERTY_SCHEMA: Record<string, PropDef[]> = {
  ScreenGui: [
    { name: "Enabled", kind: "boolean", category: "Appearance" },
    { name: "ResetOnSpawn", kind: "boolean", category: "Behaviour" },
    { name: "IgnoreGuiInset", kind: "boolean", category: "Behaviour" },
    {
      name: "ZIndexBehavior",
      kind: "enum",
      category: "Behaviour",
      options: ["Global", "Sibling"],
    },
    { name: "DisplayOrder", kind: "number", category: "Behaviour", step: 1 },
  ],
  Frame: BASE_GUI,
  CanvasGroup: [
    ...BASE_GUI,
    { name: "GroupTransparency", kind: "number", category: "Appearance", min: 0, max: 1, step: 0.05 },
  ],
  ViewportFrame: BASE_GUI,
  ScrollingFrame: [
    ...BASE_GUI,
    { name: "CanvasSize", kind: "udim2", category: "UI" },
    { name: "ScrollBarThickness", kind: "number", category: "UI", step: 1 },
  ],
  TextLabel: [...BASE_GUI, ...TEXT_PROPS],
  TextButton: [...BASE_GUI, ...TEXT_PROPS],
  TextBox: [...BASE_GUI, ...TEXT_PROPS],
  ImageLabel: [...BASE_GUI, ...IMAGE_PROPS],
  ImageButton: [...BASE_GUI, ...IMAGE_PROPS],
  UICorner: [{ name: "CornerRadius", kind: "udim2", category: "Appearance" }],
  UIStroke: [
    { name: "Color", kind: "color", category: "Appearance" },
    { name: "Thickness", kind: "number", category: "Appearance", min: 0, step: 0.5 },
    { name: "Transparency", kind: "number", category: "Appearance", min: 0, max: 1, step: 0.05 },
    {
      name: "ApplyStrokeMode",
      kind: "enum",
      category: "Appearance",
      options: ["Contextual", "Border"],
    },
    {
      name: "LineJoinMode",
      kind: "enum",
      category: "Appearance",
      options: ["Round", "Bevel", "Miter"],
    },
  ],
  UIGradient: [
    { name: "Color", kind: "color", category: "Appearance" },
    { name: "Color2", kind: "color", category: "Appearance" },
    { name: "Transparency", kind: "number", category: "Appearance", min: 0, max: 1, step: 0.05 },
    { name: "Rotation", kind: "number", category: "Appearance", step: 1 },
    { name: "Offset", kind: "vector2", category: "Appearance" },
  ],
  UIPadding: [
    { name: "PaddingTop", kind: "udim2", category: "Layout" },
    { name: "PaddingBottom", kind: "udim2", category: "Layout" },
    { name: "PaddingLeft", kind: "udim2", category: "Layout" },
    { name: "PaddingRight", kind: "udim2", category: "Layout" },
  ],
  UIListLayout: [
    {
      name: "FillDirection",
      kind: "enum",
      category: "Layout",
      options: ["Vertical", "Horizontal"],
    },
    {
      name: "HorizontalAlignment",
      kind: "enum",
      category: "Layout",
      options: ["Left", "Center", "Right"],
    },
    {
      name: "VerticalAlignment",
      kind: "enum",
      category: "Layout",
      options: ["Top", "Center", "Bottom"],
    },
    { name: "Padding", kind: "udim2", category: "Layout" },
    {
      name: "SortOrder",
      kind: "enum",
      category: "Layout",
      options: ["LayoutOrder", "Name"],
    },
  ],
  UIGridLayout: [
    { name: "CellSize", kind: "udim2", category: "Layout" },
    { name: "CellPadding", kind: "udim2", category: "Layout" },
    {
      name: "FillDirection",
      kind: "enum",
      category: "Layout",
      options: ["Horizontal", "Vertical"],
    },
  ],
  UIPageLayout: [
    { name: "Circular", kind: "boolean", category: "Layout" },
    { name: "TweenTime", kind: "number", category: "Layout", step: 0.05 },
  ],
  UIAspectRatioConstraint: [
    { name: "AspectRatio", kind: "number", category: "Layout", step: 0.01 },
    {
      name: "DominantAxis",
      kind: "enum",
      category: "Layout",
      options: ["Width", "Height"],
    },
  ],
  UIScale: [{ name: "Scale", kind: "number", category: "Layout", step: 0.05 }],
  UISizeConstraint: [
    { name: "MinSize", kind: "vector2", category: "Layout" },
    { name: "MaxSize", kind: "vector2", category: "Layout" },
  ],
  UITextSizeConstraint: [
    { name: "MinTextSize", kind: "number", category: "Text", step: 1 },
    { name: "MaxTextSize", kind: "number", category: "Text", step: 1 },
  ],
};

const guiDefaults = (): RbxProps => ({
  BackgroundColor3: "#2b2f38",
  BackgroundTransparency: 0,
  BorderColor3: "#000000",
  BorderMode: "Outline",
  BorderSizePixel: 0,
  Visible: true,
  AnchorPoint: { x: 0, y: 0 },
  Position: { xs: 0.1, xo: 0, ys: 0.1, yo: 0 },
  Size: { xs: 0.25, xo: 0, ys: 0.15, yo: 0 },
  Rotation: 0,
  ZIndex: 1,
  Active: false,
  Selectable: false,
  ClipsDescendants: false,
  AutomaticSize: "None",
});

const textDefaults = (text: string): RbxProps => ({
  Text: text,
  Font: "GothamBold",
  TextSize: 18,
  TextColor3: "#ffffff",
  TextTransparency: 0,
  TextStrokeColor3: "#000000",
  TextStrokeTransparency: 1,
  TextWrapped: true,
  TextScaled: true,
  TextXAlignment: "Center",
  TextYAlignment: "Center",
  RichText: false,
  LineHeight: 1,
  MaxVisibleGraphemes: -1,
});

const imageDefaults = (): RbxProps => ({
  Image: "",
  ImageColor3: "#ffffff",
  ImageTransparency: 0,
  ScaleType: "Fit",
  SliceScale: 1,
  ResampleMode: "Default",
  BackgroundTransparency: 1,
});

export function defaultProps(className: RbxClass): RbxProps {
  switch (className) {
    case "ScreenGui":
      return {
        Enabled: true,
        ResetOnSpawn: false,
        IgnoreGuiInset: true,
        ZIndexBehavior: "Sibling",
        DisplayOrder: 0,
      };
    case "Frame":
    case "ViewportFrame":
      return guiDefaults();
    case "CanvasGroup":
      return { ...guiDefaults(), GroupTransparency: 0 };
    case "ScrollingFrame":
      return { ...guiDefaults(), CanvasSize: { xs: 0, xo: 0, ys: 2, yo: 0 }, ScrollBarThickness: 6 };
    case "TextLabel":
      return { ...guiDefaults(), ...textDefaults("Label"), BackgroundTransparency: 1 };
    case "TextBox":
      return { ...guiDefaults(), ...textDefaults("Input") };
    case "TextButton":
      return {
        ...guiDefaults(),
        ...textDefaults("Button"),
        BackgroundColor3: "#3f8cff",
        Active: true,
        Selectable: true,
      };
    case "ImageLabel":
    case "ImageButton":
      return { ...guiDefaults(), ...imageDefaults() };
    case "UICorner":
      return { CornerRadius: { xs: 0, xo: 12, ys: 0, yo: 0 } };
    case "UIStroke":
      return {
        Color: "#000000",
        Thickness: 1,
        Transparency: 0,
        ApplyStrokeMode: "Contextual",
        LineJoinMode: "Round",
      };
    case "UIGradient":
      return {
        Color: "#ffffff",
        Color2: "#c8c8c8",
        Transparency: 0,
        Rotation: 90,
        Offset: { x: 0, y: 0 },
      };
    case "UIPadding":
      return {
        PaddingTop: { xs: 0, xo: 8, ys: 0, yo: 0 },
        PaddingBottom: { xs: 0, xo: 8, ys: 0, yo: 0 },
        PaddingLeft: { xs: 0, xo: 8, ys: 0, yo: 0 },
        PaddingRight: { xs: 0, xo: 8, ys: 0, yo: 0 },
      };
    case "UIListLayout":
      return {
        FillDirection: "Vertical",
        HorizontalAlignment: "Center",
        VerticalAlignment: "Top",
        Padding: { xs: 0, xo: 8, ys: 0, yo: 0 },
        SortOrder: "LayoutOrder",
      };
    case "UIGridLayout":
      return {
        CellSize: { xs: 0.3, xo: 0, ys: 0.3, yo: 0 },
        CellPadding: { xs: 0, xo: 8, ys: 0, yo: 8 },
        FillDirection: "Horizontal",
      };
    case "UIPageLayout":
      return { Circular: false, TweenTime: 0.25 };
    case "UIAspectRatioConstraint":
      return { AspectRatio: 1, DominantAxis: "Width" };
    case "UIScale":
      return { Scale: 1 };
    case "UISizeConstraint":
      return { MinSize: { x: 0, y: 0 }, MaxSize: { x: 9999, y: 9999 } };
    case "UITextSizeConstraint":
      return { MinTextSize: 8, MaxTextSize: 48 };
    default:
      return {};
  }
}
