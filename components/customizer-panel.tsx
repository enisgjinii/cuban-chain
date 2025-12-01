"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Link, ChevronDown, ChevronUp } from "lucide-react";
import type {
  ChainConfig,
  SurfaceId,
  Material,
  SurfaceType,
  SurfaceConfig,
} from "@/lib/chain-config-types";
import {
  updateLinkMaterial,
  updateSurface,
  createDefaultGemstoneColors,
  applyMaterialToAllLinks,
  applySurfaceToAllSideSurfaces,
  setChainLength,
} from "@/lib/chain-helpers";
import { type ChainLinkType, LINK_TYPE_TO_URL, CHAIN_PRESETS } from "@/lib/chain-manager";

interface CustomizerPanelProps {
  chainConfig: ChainConfig;
  setChainConfig: (config: ChainConfig) => void;
  selectedSurface: SurfaceId;
  setSelectedSurface: (surface: SurfaceId) => void;
  onSaveConfiguration: () => void;
  onLoadConfiguration: (event: React.ChangeEvent<HTMLInputElement>) => void;
  meshes: string[];
  nodes: string[];
  onSelectMesh: (mesh: string | null) => void;
  onHoverMesh: (mesh: string | null) => void;
  chainSpacing?: number;
  setChainSpacing?: (value: number) => void;
  onUndo?: () => void;
  autoRotate?: boolean;
  setAutoRotate?: (value: boolean) => void;
  showDebug?: boolean;
  setShowDebug?: (value: boolean) => void;
  onCaptureImage?: () => void;
  onStartRecording?: () => void;
  isRecording?: boolean;
  isInSheet?: boolean;
  onApplyToLink?: () => void;
  modelUrls?: string[];
  setModelUrls?: (urls: string[]) => void;
  isMobile?: boolean;
}

// Material options
const MATERIALS: Array<{ label: string; value: Material }> = [
  { label: "Silver", value: "silver" },
  { label: "Gold", value: "gold" },
  { label: "Grey", value: "grey" },
  { label: "Black", value: "black" },
  { label: "White", value: "white" },
];

// Diamond type options
const DIAMOND_TYPES: Array<{ label: string; value: SurfaceType }> = [
  { label: "Diamonds", value: "gemstones" },
  { label: "Moissanites", value: "moissanites" },
  { label: "Enamel", value: "enamel" },
  { label: "Engraving", value: "engraving" },
  { label: "Empty", value: "empty" },
];

// Color options for diamonds/moissanites
const GEMSTONE_COLORS = [
  { label: "Colourless", value: "#ffffff" },
  { label: "Black", value: "#000000" },
  { label: "Green", value: "#16a34a" },
  { label: "Red", value: "#dc2626" },
  { label: "Blue", value: "#2563eb" },
  { label: "Yellow", value: "#eab308" },
  { label: "Orange", value: "#ea580c" },
  { label: "Rainbow1", value: "rainbow1" },
  { label: "Rainbow2", value: "rainbow2" },
];

// Enamel colors
const ENAMEL_COLORS = [
  { label: "Black", value: "#000000" },
  { label: "White", value: "#ffffff" },
  { label: "Green", value: "#16a34a" },
  { label: "Red", value: "#dc2626" },
  { label: "Blue", value: "#2563eb" },
  { label: "Yellow", value: "#eab308" },
  { label: "Orange", value: "#ea580c" },
  { label: "Opal 1", value: "#b8b8ff" },
  { label: "Opal 2", value: "#ffb8d1" },
];

// Engraving patterns
const ENGRAVING_PATTERNS = [
  { label: "Pattern 1", value: "pattern1" },
  { label: "Pattern 2", value: "pattern2" },
];

// Available link types for adding
const AVAILABLE_LINK_TYPES: { type: ChainLinkType; label: string }[] = [
  { type: "part1", label: "Part 1" },
  { type: "part3", label: "Part 3" },
  { type: "part4", label: "Part 4" },
  { type: "part5", label: "Part 5" },
  { type: "part6", label: "Part 6" },
  { type: "part7", label: "Part 7" },
  { type: "enamel", label: "Enamel" },
  { type: "pattern1", label: "Pattern 1" },
  { type: "cuban-link", label: "Cuban Link" },
];

export function CustomizerPanel({
  chainConfig,
  setChainConfig,
  selectedSurface,
  onSaveConfiguration,
  onLoadConfiguration,
  onUndo,
  modelUrls = [],
  setModelUrls,
  isMobile = false,
}: CustomizerPanelProps) {
  const [selectedLinkIndex, setSelectedLinkIndex] = useState(0);
  const [applyInserts, setApplyInserts] = useState(false);
  const [applyToSides, setApplyToSides] = useState(false);
  const [applyMode, setApplyMode] = useState(false);
  const [showChainAssembly, setShowChainAssembly] = useState(false);
  const [selectedLinkType, setSelectedLinkType] = useState<ChainLinkType>("part1");
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const currentLink = chainConfig.links[selectedLinkIndex];
  const currentSurfaceConfig = currentLink?.surfaces[selectedSurface];
  const isTopSurface = selectedSurface === "top1" || selectedSurface === "top2";

  // Get color options based on surface type
  const getColorOptions = () => {
    if (!currentSurfaceConfig) return [];
    switch (currentSurfaceConfig.type) {
      case "gemstones":
        return [{ label: "Colourless", value: "#ffffff" }];
      case "moissanites":
        return GEMSTONE_COLORS;
      case "enamel":
        return ENAMEL_COLORS;
      case "engraving":
        return ENGRAVING_PATTERNS;
      default:
        return [];
    }
  };

  // Get current color value
  const getCurrentColorValue = () => {
    if (!currentSurfaceConfig) return "";
    switch (currentSurfaceConfig.type) {
      case "gemstones":
      case "moissanites":
        return currentSurfaceConfig.gemstoneColors?.stone1 || "#ffffff";
      case "enamel":
        return currentSurfaceConfig.enamelColor || "#ffffff";
      case "engraving":
        return currentSurfaceConfig.engravingDesign || "pattern1";
      default:
        return "";
    }
  };

  // Handle material change
  const handleMaterialChange = (material: Material) => {
    if (applyMode) {
      setChainConfig(updateLinkMaterial(chainConfig, selectedLinkIndex, material));
    } else {
      setChainConfig(applyMaterialToAllLinks(chainConfig, material));
    }
    window.dispatchEvent(
      new CustomEvent("applyMaterialToModel", {
        detail: { material, targetModel: applyMode ? "specific" : "all", targetIndex: selectedLinkIndex },
      })
    );
  };

  // Handle diamond type change
  const handleDiamondTypeChange = (type: SurfaceType) => {
    if (!applyInserts) return;

    let newSurfaceConfig: SurfaceConfig = { type };

    if (type === "gemstones" || type === "moissanites") {
      newSurfaceConfig = {
        type,
        gemstoneColors: createDefaultGemstoneColors(selectedSurface),
      };
    } else if (type === "enamel") {
      newSurfaceConfig = { type, enamelColor: "#ffffff" };
    } else if (type === "engraving") {
      newSurfaceConfig = { type, engravingDesign: "pattern1" };
    }

    if (applyToSides) {
      setChainConfig(applySurfaceToAllSideSurfaces(chainConfig, newSurfaceConfig));
    } else {
      setChainConfig(updateSurface(chainConfig, selectedLinkIndex, selectedSurface, newSurfaceConfig));
    }
  };

  // Handle color change
  const handleColorChange = (value: string) => {
    if (!currentSurfaceConfig || !applyInserts) return;

    let newSurfaceConfig: SurfaceConfig;

    if (currentSurfaceConfig.type === "gemstones" || currentSurfaceConfig.type === "moissanites") {
      const colors = {
        stone1: value,
        stone2: value,
        ...(isTopSurface && { stone3: value }),
      };
      newSurfaceConfig = { ...currentSurfaceConfig, gemstoneColors: colors };
    } else if (currentSurfaceConfig.type === "enamel") {
      newSurfaceConfig = { ...currentSurfaceConfig, enamelColor: value };
    } else if (currentSurfaceConfig.type === "engraving") {
      newSurfaceConfig = { ...currentSurfaceConfig, engravingDesign: value as "pattern1" | "pattern2" };
    } else {
      return;
    }

    if (applyToSides) {
      setChainConfig(applySurfaceToAllSideSurfaces(chainConfig, newSurfaceConfig));
    } else {
      setChainConfig(updateSurface(chainConfig, selectedLinkIndex, selectedSurface, newSurfaceConfig));
    }
  };

  // Handle chain length change
  const handleChainLengthChange = (length: number) => {
    setChainConfig(setChainLength(chainConfig, length));
    if (selectedLinkIndex >= length) {
      setSelectedLinkIndex(Math.max(0, length - 1));
    }
  };

  // Handle adding a new link
  const handleAddLink = useCallback(
    (linkType: ChainLinkType) => {
      const url = LINK_TYPE_TO_URL[linkType];
      if (!url || !setModelUrls) return;
      setModelUrls([...modelUrls, url]);
    },
    [modelUrls, setModelUrls]
  );

  // Handle removing a link
  const handleRemoveLink = useCallback(
    (index: number) => {
      if (!setModelUrls || modelUrls.length <= 1) return;
      setModelUrls(modelUrls.filter((_, i) => i !== index));
    },
    [modelUrls, setModelUrls]
  );

  // Handle loading a preset
  const handleLoadPreset = useCallback(
    (presetName: string) => {
      const preset = CHAIN_PRESETS[presetName];
      if (!preset || !setModelUrls) return;
      setModelUrls(preset.map((type) => LINK_TYPE_TO_URL[type]));
      setSelectedPreset(presetName);
    },
    [setModelUrls]
  );

  // Handle Apply to button
  const handleApplyTo = () => {
    setApplyMode(!applyMode);
  };

  // Handle Undo
  const handleUndo = () => {
    onUndo?.();
  };

  const colorOptions = getColorOptions();
  const showColorDropdown = applyInserts && currentSurfaceConfig?.type && currentSurfaceConfig.type !== "empty";

  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-y-auto ${
        isMobile ? "w-full max-h-[70vh] p-4" : "w-80 max-h-[85vh] p-5"
      }`}
    >
      <h2 className={`font-semibold text-gray-700 mb-4 ${isMobile ? "text-base" : "text-lg"}`}>
        Customizer
      </h2>

      {/* Material Selection */}
      <div className="mb-3">
        <Select
          value={currentLink?.material || "silver"}
          onValueChange={(v) => handleMaterialChange(v as Material)}
        >
          <SelectTrigger className="w-full border-2 border-orange-400 rounded-md h-10">
            <SelectValue placeholder="Select material" />
          </SelectTrigger>
          <SelectContent>
            {MATERIALS.map((mat) => (
              <SelectItem key={mat.value} value={mat.value}>
                {mat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Apply Inserts Checkbox */}
      <div className="flex items-center gap-2 mb-3">
        <Checkbox
          id="apply-inserts"
          checked={applyInserts}
          onCheckedChange={(checked) => setApplyInserts(!!checked)}
        />
        <Label htmlFor="apply-inserts" className="text-sm text-gray-600 cursor-pointer">
          Apply inserts
        </Label>
      </div>

      {/* Diamond Type Selection */}
      <div className="mb-3">
        <Select
          value={currentSurfaceConfig?.type || "empty"}
          onValueChange={(v) => handleDiamondTypeChange(v as SurfaceType)}
          disabled={!applyInserts}
        >
          <SelectTrigger
            className={`w-full border-2 rounded-md h-10 ${
              applyInserts ? "border-green-500" : "border-gray-300 opacity-60"
            }`}
          >
            <SelectValue placeholder="Diamonds" />
          </SelectTrigger>
          <SelectContent>
            {DIAMOND_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color Selection */}
      {showColorDropdown && (
        <div className="mb-3">
          <Select value={getCurrentColorValue()} onValueChange={handleColorChange}>
            <SelectTrigger className="w-full border-2 border-blue-400 rounded-md h-10">
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center gap-2">
                    {color.value.startsWith("#") && (
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.value }}
                      />
                    )}
                    {color.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Apply to Sides Checkbox */}
      <div className="flex items-center gap-2 mb-4">
        <Checkbox
          id="apply-sides"
          checked={applyToSides}
          onCheckedChange={(checked) => setApplyToSides(!!checked)}
          disabled={!applyInserts}
        />
        <Label
          htmlFor="apply-sides"
          className={`text-sm cursor-pointer ${applyInserts ? "text-gray-600" : "text-gray-400"}`}
        >
          Apply to sides
        </Label>
      </div>

      {/* Apply to / Undo buttons - Fixed styling */}
      <div className="flex gap-3 mb-4">
        <Button
          variant={applyMode ? "default" : "outline"}
          size="sm"
          onClick={handleApplyTo}
          className={`flex-1 h-9 ${
            applyMode
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Apply to
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUndo}
          className="flex-1 h-9 border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          Undo
        </Button>
      </div>

      <Separator className="my-4" />

      {/* Chain Assembly Section - Collapsible */}
      <div className="mb-4">
        <button
          onClick={() => setShowChainAssembly(!showChainAssembly)}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900 py-1"
        >
          <span className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            Chain Assembly
          </span>
          {showChainAssembly ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showChainAssembly && (
          <div className="mt-3 space-y-3">
            {/* Chain Length Slider */}
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">
                Chain Length: {chainConfig.chainLength} links
              </Label>
              <Slider
                value={[chainConfig.chainLength]}
                onValueChange={([v]) => handleChainLengthChange(v)}
                min={1}
                max={20}
                step={1}
              />
            </div>

            {/* Preset Selection */}
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Load Preset</Label>
              <Select value={selectedPreset} onValueChange={handleLoadPreset}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="Select preset..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(CHAIN_PRESETS).map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      {preset.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add New Link */}
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Add Link</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedLinkType}
                  onValueChange={(v) => setSelectedLinkType(v as ChainLinkType)}
                >
                  <SelectTrigger className="flex-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_LINK_TYPES.map(({ type, label }) => (
                      <SelectItem key={type} value={type}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddLink(selectedLinkType)}
                  className="h-9 px-3"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Current Links List */}
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">
                Current Links ({modelUrls.length})
              </Label>
              <div className="space-y-1 max-h-28 overflow-y-auto border rounded-md p-2 bg-gray-50">
                {modelUrls.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="flex items-center justify-between p-1.5 bg-white rounded text-xs border"
                  >
                    <span className="truncate flex-1">
                      {index + 1}. {url.split("/").pop()?.replace(".glb", "")}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLink(index)}
                      className="h-6 w-6 p-0 hover:bg-red-50"
                      disabled={modelUrls.length <= 1}
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator className="my-4" />

      {/* Save/Load Configuration */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSaveConfiguration}
          className="flex-1 h-9 text-gray-600 text-xs"
        >
          Save configuration
        </Button>
        <label className="flex-1">
          <Button variant="outline" size="sm" className="w-full h-9 text-gray-600 text-xs" asChild>
            <span>Load</span>
          </Button>
          <input type="file" accept=".json" onChange={onLoadConfiguration} className="hidden" />
        </label>
      </div>
    </div>
  );
}
