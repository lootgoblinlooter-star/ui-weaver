import { createNode, udim2 } from "./tree";
import type { RbxNode } from "./types";

export function starterProject(): RbxNode {
  const corner = (r: number) => createNode("UICorner", "UICorner", { CornerRadius: udim2(0, r, 0, 0) });
  const stroke = (c: string, t = 1.5) =>
    createNode("UIStroke", "UIStroke", { Color: c, Thickness: t, Transparency: 0.3 });

  const currency = createNode(
    "Frame",
    "Currency",
    {
      BackgroundColor3: "#161a22",
      Position: udim2(0.02, 0, 0.5, 0),
      Size: udim2(0.22, 0, 0.62, 0),
      AnchorPoint: { x: 0, y: 0.5 },
    },
    [
      corner(10),
      stroke("#3f8cff"),
      createNode("ImageLabel", "Icon", {
        BackgroundTransparency: 1,
        Position: udim2(0.06, 0, 0.5, 0),
        AnchorPoint: { x: 0, y: 0.5 },
        Size: udim2(0.22, 0, 0.62, 0),
        ImageColor3: "#ffd166",
      }),
      createNode("TextLabel", "Amount", {
        BackgroundTransparency: 1,
        Position: udim2(0.34, 0, 0.5, 0),
        AnchorPoint: { x: 0, y: 0.5 },
        Size: udim2(0.6, 0, 0.6, 0),
        Text: "12,480",
        TextXAlignment: "Left",
        TextColor3: "#ffd166",
      }),
    ],
  );

  const topBar = createNode(
    "Frame",
    "TopBar",
    {
      BackgroundColor3: "#10131a",
      BackgroundTransparency: 0.15,
      Position: udim2(0.5, 0, 0.03, 0),
      AnchorPoint: { x: 0.5, y: 0 },
      Size: udim2(0.9, 0, 0.1, 0),
    },
    [
      corner(14),
      currency,
      createNode(
        "ImageButton",
        "SettingsButton",
        {
          BackgroundColor3: "#1c2130",
          BackgroundTransparency: 0,
          Position: udim2(0.98, 0, 0.5, 0),
          AnchorPoint: { x: 1, y: 0.5 },
          Size: udim2(0.07, 0, 0.7, 0),
        },
        [corner(10), createNode("UIAspectRatioConstraint", "UIAspectRatioConstraint")],
      ),
    ],
  );

  const playButton = createNode(
    "TextButton",
    "PlayButton",
    {
      Text: "PLAY",
      BackgroundColor3: "#3f8cff",
      Position: udim2(0.5, 0, 0.5, 0),
      AnchorPoint: { x: 0.5, y: 0.5 },
      Size: udim2(0.28, 0, 0.16, 0),
      TextSize: 42,
    },
    [
      corner(18),
      stroke("#ffffff", 2),
      createNode("UIGradient", "UIGradient", { Color: "#5ea2ff", Color2: "#2f6fe0", Rotation: 90 }),
      createNode("UIAspectRatioConstraint", "UIAspectRatioConstraint", { AspectRatio: 2.4 }),
    ],
  );

  const bottomButton = (name: string, xs: number, text: string, color: string) =>
    createNode(
      "TextButton",
      name,
      {
        Text: text,
        BackgroundColor3: color,
        Position: udim2(xs, 0, 0.9, 0),
        AnchorPoint: { x: 0.5, y: 0.5 },
        Size: udim2(0.18, 0, 0.11, 0),
        TextSize: 24,
      },
      [corner(14), stroke("#ffffff", 1.5)],
    );

  return createNode("ScreenGui", "ScreenGui", {}, [
    createNode(
      "Frame",
      "MainFrame",
      {
        BackgroundColor3: "#0b0e14",
        BackgroundTransparency: 1,
        Position: udim2(0, 0, 0, 0),
        Size: udim2(1, 0, 1, 0),
      },
      [
        topBar,
        playButton,
        bottomButton("ShopButton", 0.36, "SHOP", "#2ec27e"),
        bottomButton("InventoryButton", 0.64, "INVENTORY", "#f4a259"),
      ],
    ),
  ]);
}
