"use client";

import React, { useState, useEffect, useCallback } from "react";
import * as THREE from "three";
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
import { RotateCw, Camera, Video, VideoOff, Save, Upload, Link, Plus, Trash2 } from "lucide-react";
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
} from "@/lib/chain-helpers";
import { type ChainLinkType, LINK_TYPE_TO_URL, CHAIN_PRESETS } from "@/lib/chain-manager";

interface CompactSidebarProps {
  chainConfig: ChainConfig;
  setChainConfig: (config: ChainConfig) => void;
  selectedSurface: SurfaceId;
  setSelectedSurface: (surface: SurfaceId) => void;
  meshes: string[];
  nodes: string[];
  selectedMesh?: string | null;
  hoveredMesh?: string | null;
  onSelectMesh?: (mesh: string | null) => void;
  onHoverMesh?: (mesh: string | null) => void;
  setChainLength: (length: number) => void;
  chainSpacing?: number;
  setChainSpacing?: (value: number) => void;
  onUndo?: () => void;
  onSaveConfiguration?: () => void;
  onLoadConfiguration?: () => void;
  autoRotate?: boolean;
  setAutoRotate?: (value: boolean) => void;
  showDebug?: boolean;
  setShowDebug?: (value: boolean) => void;
  onCaptureImage?: () => void;
  onStartRecording?: () => void;
  isRecording?: boolean;
  isInSheet?: boolean;
  sceneRef?: React.RefObject<THREE.Scene | null>;
  modelUrls?: string[];
  setModelUrls?: (urls: string[]) => void;
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

// Color options
const GEMSTONE_COLORS = [
  { label: "Colourless", value: "#ffffff" },
  { label: "Black", value: "#000000" },
  { label: "Green", value: "#16a34a" },
  { label: "Red", value: "#dc2626" },
  { label: "Blue", value: "#2563eb" },
  { label: "Yellow", value: "#eab308" },
  { label: "Orange", value: "#ea580c" },
];

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

const ENGRAVING_PATTERNS = [
  { label: "Pattern 1", value: "pattern1" },
  { label: "Pattern 2", value: "pattern2" },
];

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

export function CompactSidebar({
  chainConfig,
  setChainConfig,
  selectedSurface,
  setSelectedSurface,
  setChainLength,
  chainSpacing = 0.02,
  setChainSpacing,
  onSaveConfiguration,
  onLoadConfiguration,
  autoRotate,
  setAutoRotate,
  onCaptureImage,
  onStartRecording,
  isRecording,
  sceneRef,
  modelUrls = [],
  setModelUrls,
}: CompactSidebarProps) {
  const [selectedLinkIndex, setSelectedLinkIndex] = useState(0);
  const [applyInserts, setApplyInserts] = useState(false);
  const [applyToSides, setApplyToSides] = useState(false);
  const [applyMode, setApplyMode] = useState(false);
  const [selectedLinkType, setSelectedLinkType] = useState<ChainLinkType>("part1");
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const currentLink = chainConfig.links[selectedLinkIndex];
  const currentSurfaceConfig = currentLink?.surfaces[selectedSurface];
  const isTopSurface = selectedSurface === "top1" || selectedSurface === "top2";

  // Keep selected link index valid
  useEffect(() => {
    if (selectedLinkIndex >= chainConfig.chainLength) {
      setSelectedLinkIndex(Math.max(0, chainConfig.chainLength - 1));
    }
  }, [chainConfig.chainLength, selectedLinkIndex]);

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

  const handleDiamondTypeChange = (type: SurfaceType) => {
    if (!applyInserts) return;

    let newSurfaceConfig: SurfaceConfig = { type };
    if (type === "gemstones" || type === "moissanites") {
      newSurfaceConfig = { type, gemstoneColors: createDefaultGemstoneColors(selectedSurface) };
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

  const handleColorChange = (value: string) => {
    if (!currentSurfaceConfig || !applyInserts) return;

    let newSurfaceConfig: SurfaceConfig;
    if (currentSurfaceConfig.type === "gemstones" || currentSurfaceConfig.type === "moissanites") {
      const colors = { stone1: value, stone2: value, ...(isTopSurface && { stone3: value }) };
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

  const handleAddLink = useCallback(
    (linkType: ChainLinkType) => {
      const url = LINK_TYPE_TO_URL[linkType];
      if (!url || !setModelUrls) return;
      setModelUrls([...modelUrls, url]);
    },
    [modelUrls, setModelUrls]
  );

  const handleRemoveLink = useCallback(
    (index: number) => {
      if (!setModelUrls || modelUrls.length <= 1) return;
      setModelUrls(modelUrls.filter((_, i) => i !== index));
    },
    [modelUrls, setModelUrls]
  );

  const handleLoadPreset = useCallback(
    (presetName: string) => {
      const preset = CHAIN_PRESETS[presetName];
      if (!preset || !setModelUrls) return;
      setModelUrls(preset.map((type) => LINK_TYPE_TO_URL[type]));
      setSelectedPreset(presetName);
    },
    [setModelUrls]
  );

  const toggleDiamonds = useCallback(() => {
    window.dispatchEvent(new CustomEvent("toggleDiamonds", { detail: { visible: true } }));
  }, []);

  const colorOptions = getColorOptions();
  const showColorDropdown = applyInserts && currentSurfaceConfig?.type && currentSurfaceConfig.type !== "empty";

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-80 max-h-[90vh] overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Customizer</h2>

      {/* Chain Length */}
      <div className="mb-4">
        <Label className="text-sm text-gray-600 mb-2 block">
          Chain Length: {chainConfig.chainLength} links
        </Label>
        <Slider
          value={[chainConfig.chainLength]}
          onValueChange={([v]) => setChainLength(v)}
          min={1}
          max={20}
          step={1}
        />
      </div>

      <Separator className="my-4" />

      {/* Material Selection */}
      <div className="mb-4">
        <Select value={currentLink?.material || "silver"} onValueChange={(v) => handleMaterialChange(v as Material)}>
          <SelectTrigger className="w-full border-2 border-orange-400">
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

      {/* Apply Inserts */}
      <div className="flex items-center gap-2 mb-4">
        <Checkbox id="apply-inserts" checked={applyInserts} onCheckedChange={(c) => setApplyInserts(!!c)} />
        <Label htmlFor="apply-inserts" className="text-sm text-gray-600">
          Apply inserts
        </Label>
      </div>

      {/* Diamond Type */}
      <div className="mb-4">
        <Select
          value={currentSurfaceConfig?.type || "empty"}
          onValueChange={(v) => handleDiamondTypeChange(v as SurfaceType)}
          disabled={!applyInserts}
        >
          <SelectTrigger className={`w-full border-2 ${applyInserts ? "border-green-500" : "border-gray-300"}`}>
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
        <div className="mb-4">
          <Select value={getCurrentColorValue()} onValueChange={handleColorChange}>
            <SelectTrigger className="w-full border-2 border-blue-400">
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center gap-2">
                    {color.value.startsWith("#") && (
                      <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color.value }} />
                    )}
                    {color.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Apply to Sides */}
      <div className="flex items-center gap-2 mb-4">
        <Checkbox
          id="apply-sides"
          checked={applyToSides}
          onCheckedChange={(c) => setApplyToSides(!!c)}
          disabled={!applyInserts}
        />
        <Label htmlFor="apply-sides" className={`text-sm ${applyInserts ? "text-gray-600" : "text-gray-400"}`}>
          Apply to sides
        </Label>
      </div>

      {/* Apply to / Undo */}
      <div className="flex gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => setApplyMode(true)}>
          Apply to
        </Button>
        <Button variant="ghost" size="sm" onClick={() => {}}>
          Undo
        </Button>
      </div>

      {/* Done Button */}
      <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white mb-4">Done</Button>

      <Separator className="my-4" />

      {/* Chain Assembly */}
      <div className="mb-4">
        <Label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
          <Link className="w-4 h-4" />
          Chain Assembly
        </Label>
        <Select value={selectedPreset} onValueChange={handleLoadPreset}>
          <SelectTrigger className="w-full mb-2">
            <SelectValue placeholder="Load preset..." />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(CHAIN_PRESETS).map((preset) => (
              <SelectItem key={preset} value={preset}>
                {preset.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 mb-2">
          <Select value={selectedLinkType} onValueChange={(v) => setSelectedLinkType(v as ChainLinkType)}>
            <SelectTrigger className="flex-1">
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
          <Button variant="outline" size="sm" onClick={() => handleAddLink(selectedLinkType)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-1 max-h-32 overflow-y-auto">
          {modelUrls.map((url, index) => (
            <div key={`${url}-${index}`} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
              <span className="flex-1 truncate">{url.split("/").pop()?.replace(".glb", "")}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveLink(index)}
                className="h-6 w-6 p-0"
                disabled={modelUrls.length <= 1}
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-4" />

      {/* View Controls */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button
          variant={autoRotate ? "default" : "outline"}
          size="sm"
          onClick={() => setAutoRotate?.(!autoRotate)}
        >
          <RotateCw className="w-4 h-4 mr-1" />
          Rotate
        </Button>
        <Button variant="outline" size="sm" onClick={onCaptureImage} disabled={isRecording}>
          <Camera className="w-4 h-4 mr-1" />
          Capture
        </Button>
        <Button
          variant={isRecording ? "destructive" : "outline"}
          size="sm"
          onClick={onStartRecording}
          className="col-span-2"
          disabled={isRecording}
        >
          {isRecording ? (
            <>
              <VideoOff className="w-4 h-4 mr-1" />
              Recording...
            </>
          ) : (
            <>
              <Video className="w-4 h-4 mr-1" />
              Record 5s
            </>
          )}
        </Button>
      </div>

      {/* Save/Load */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onSaveConfiguration} className="flex-1">
          <Save className="w-4 h-4 mr-1" />
          Save
        </Button>
        <Button variant="outline" size="sm" onClick={onLoadConfiguration} className="flex-1">
          <Upload className="w-4 h-4 mr-1" />
          Load
        </Button>
      </div>
    </div>
  );
}
