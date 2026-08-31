import type { RbxNode } from "./types";

/** Payload the Roblox Studio plugin consumes to build real Instances. */
export interface SyncPayload {
  version: 1;
  projectId: string;
  name: string;
  tree: RbxNode;
}

export function buildPayload(root: RbxNode, projectId: string, name = "AI UI"): SyncPayload {
  return { version: 1, projectId, name, tree: strip(root) };
}

function strip(n: RbxNode): RbxNode {
  return {
    id: n.id,
    className: n.className,
    name: n.name,
    props: n.props,
    children: n.children.map(strip),
    ...(n.hidden ? { hidden: true } : {}),
    ...(n.locked ? { locked: true } : {}),
  };
}

export const PLUGIN_SOURCE = String.raw`--[[
  Roblox UI Builder — Studio Bridge Plugin
  Paste into a Script inside a plugin folder, or save as a .lua plugin file.
  Enable: Game Settings > Security > Allow HTTP Requests, and Plugin HTTP access.
]]

local HttpService = game:GetService("HttpService")
local StarterGui = game:GetService("StarterGui")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

local ENDPOINT = "%ENDPOINT%" -- /api/public/sync

local toolbar = plugin:CreateToolbar("UI Builder")
local button = toolbar:CreateButton("Sync UI", "Pull the latest UI from the wrapper", "rbxassetid://4458901886")

local widget = plugin:CreateDockWidgetPluginGui(
  "UIBuilderBridge",
  DockWidgetPluginGuiInfo.new(Enum.InitialDockState.Right, true, false, 280, 160, 240, 140)
)
widget.Title = "UI Builder Bridge"

local frame = Instance.new("Frame", widget)
frame.Size = UDim2.fromScale(1, 1)
frame.BackgroundColor3 = Color3.fromRGB(20, 22, 28)

local box = Instance.new("TextBox", frame)
box.Size = UDim2.new(1, -20, 0, 32)
box.Position = UDim2.new(0, 10, 0, 12)
box.PlaceholderText = "Session code"
box.Text = ""
box.BackgroundColor3 = Color3.fromRGB(32, 36, 46)
box.TextColor3 = Color3.new(1, 1, 1)

local status = Instance.new("TextLabel", frame)
status.Size = UDim2.new(1, -20, 0, 40)
status.Position = UDim2.new(0, 10, 0, 100)
status.BackgroundTransparency = 1
status.TextColor3 = Color3.fromRGB(180, 190, 210)
status.TextWrapped = true
status.Text = "Enter your session code and press Sync."

local sync = Instance.new("TextButton", frame)
sync.Size = UDim2.new(1, -20, 0, 34)
sync.Position = UDim2.new(0, 10, 0, 56)
sync.Text = "Sync from Wrapper"
sync.BackgroundColor3 = Color3.fromRGB(63, 140, 255)
sync.TextColor3 = Color3.new(1, 1, 1)

local function color(hex)
  hex = (hex or "#ffffff"):gsub("#", "")
  return Color3.fromRGB(tonumber(hex:sub(1, 2), 16), tonumber(hex:sub(3, 4), 16), tonumber(hex:sub(5, 6), 16))
end

local function udim2(v)
  if typeof(v) ~= "table" then return UDim2.new() end
  return UDim2.new(v.xs or 0, v.xo or 0, v.ys or 0, v.yo or 0)
end

local UDIM2_PROPS = { Position = true, Size = true, CanvasSize = true, CellSize = true, CellPadding = true }
local UDIM_PROPS = { CornerRadius = true, Padding = true, PaddingTop = true, PaddingBottom = true, PaddingLeft = true, PaddingRight = true }
local COLOR_PROPS = { BackgroundColor3 = true, BorderColor3 = true, TextColor3 = true, TextStrokeColor3 = true, ImageColor3 = true, Color = true }
local VECTOR_PROPS = { AnchorPoint = true, Offset = true, MinSize = true, MaxSize = true }

local function applyProps(inst, props)
  for key, value in pairs(props) do
    local ok = pcall(function()
      if key == "Color2" then return end
      if UDIM2_PROPS[key] then
        inst[key] = udim2(value)
      elseif UDIM_PROPS[key] then
        inst[key] = UDim.new(value.xs or 0, value.xo or 0)
      elseif COLOR_PROPS[key] then
        if inst:IsA("UIGradient") and key == "Color" then
          inst.Color = ColorSequence.new(color(value), color(props.Color2 or value))
        else
          inst[key] = color(value)
        end
      elseif VECTOR_PROPS[key] then
        inst[key] = Vector2.new(value.x or 0, value.y or 0)
      elseif key == "Font" then
        inst.Font = Enum.Font[value] or Enum.Font.GothamBold
      elseif typeof(value) == "string" and key ~= "Text" and key ~= "Image" and key ~= "Name" and key ~= "PlaceholderText" then
        local enumName = key
        if key == "AutomaticSize" then enumName = "AutomaticSize" end
        local enumType = Enum[enumName]
        if enumType then inst[key] = enumType[value] else inst[key] = value end
      else
        inst[key] = value
      end
    end)
    if not ok then end
  end
end

local function build(nodeData, parent)
  local inst = Instance.new(nodeData.className)
  inst.Name = nodeData.name
  applyProps(inst, nodeData.props or {})
  inst:SetAttribute("UIBuilderId", nodeData.id)
  inst.Parent = parent
  for _, child in ipairs(nodeData.children or {}) do
    build(child, inst)
  end
  return inst
end

local function findExisting(projectId)
  for _, child in ipairs(StarterGui:GetChildren()) do
    if child:GetAttribute("UIBuilderProject") == projectId then
      return child
    end
  end
  return nil
end

local function doSync()
  local code = box.Text
  if code == "" then status.Text = "Enter a session code first." return end
  local ok, res = pcall(function()
    return HttpService:GetAsync(ENDPOINT .. "?code=" .. code)
  end)
  if not ok then status.Text = "Request failed: " .. tostring(res) return end
  local data = HttpService:JSONDecode(res)
  if not data or not data.tree then status.Text = "No UI found for that code." return end

  local recording = ChangeHistoryService:TryBeginRecording("UI Builder Sync")
  local existing = findExisting(data.projectId)
  if existing then existing:Destroy() end
  local screenGui = build(data.tree, StarterGui)
  screenGui:SetAttribute("UIBuilderProject", data.projectId)
  if recording then ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Commit) end
  status.Text = (existing and "Updated " or "Created ") .. screenGui.Name .. " in StarterGui."
end

sync.MouseButton1Click:Connect(doSync)
button.Click:Connect(function() widget.Enabled = not widget.Enabled end)
`;
