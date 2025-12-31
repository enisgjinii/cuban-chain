"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";
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
import { Plus, Trash2, Link, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Camera, Video, Share2, Square } from "lucide-react";
import { ZoneSelector } from "@/components/zone-selector";
import { FavoritesPanel } from "@/components/favorites-panel";
import { StoneColorPicker } from "./stone-color-picker";
import { PriceCalculator } from "./price-calculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
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
  onChainLengthChange?: (length: number) => void;
  onReplayAnimation?: () => void;
  setShowScreenshotModal?: (show: boolean) => void;
  onLoadFavorite?: (config: ChainConfig, urls: string[]) => void;
  background?: string;
  setBackground?: (bg: string) => void;
}

// Material options with colors for visual display
const MATERIALS: Array<{ label: string; value: Material; color: string }> = [
  { label: "Silver", value: "silver", color: "#c0c0c0" },
  { label: "Gold", value: "gold", color: "#ffd700" },
  { label: "Grey", value: "grey", color: "#808080" },
  { label: "Black", value: "black", color: "#1a1a1a" },
  { label: "White", value: "white", color: "#f5f5f5" },
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
  setSelectedSurface,
  onSaveConfiguration,
  onLoadConfiguration,
  onUndo,
  onCaptureImage,
  onStartRecording,
  isRecording = false,
  modelUrls = [],
  setModelUrls,
  isMobile = false,
  onChainLengthChange,
  onReplayAnimation,
  setShowScreenshotModal,
  onLoadFavorite,
  autoRotate,
  setAutoRotate,
  showDebug,
  setShowDebug,
  background = "city",
  setBackground,
}: CustomizerPanelProps) {
  const [activeTab, setActiveTab] = useState("design");
  const [selectedLinkIndex, setSelectedLinkIndex] = useState(0);
  const [applyInserts, setApplyInserts] = useState(false);
  const [applyToSides, setApplyToSides] = useState(false);
  const [applyToAll, setApplyToAll] = useState(true);
  const [showChainAssembly, setShowChainAssembly] = useState(false);
  const [selectedLinkType, setSelectedLinkType] = useState<ChainLinkType>("part1");
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  // Use modelUrls length as the source of truth for link count
  const linkCount = modelUrls.length;
  const currentLink = chainConfig.links[selectedLinkIndex];
  const currentSurfaceConfig = currentLink?.surfaces[selectedSurface];
  const isTopSurface = selectedSurface === "top1" || selectedSurface === "top2";

  // Keep selected link index valid when link count changes
  useEffect(() => {
    if (selectedLinkIndex >= linkCount) {
      setSelectedLinkIndex(Math.max(0, linkCount - 1));
    }
  }, [linkCount, selectedLinkIndex]);

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

  // Handle material change for individual link or all
  const handleMaterialChange = (material: Material) => {
    if (applyToAll) {
      setChainConfig(applyMaterialToAllLinks(chainConfig, material));
      window.dispatchEvent(
        new CustomEvent("applyMaterialToModel", {
          detail: { material, targetModel: "all", targetIndex: -1 },
        })
      );
    } else {
      setChainConfig(updateLinkMaterial(chainConfig, selectedLinkIndex, material));
      window.dispatchEvent(
        new CustomEvent("applyMaterialToModel", {
          detail: { material, targetModel: "specific", targetIndex: selectedLinkIndex },
        })
      );
    }
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
  };

  // Navigate to previous link
  const goToPreviousLink = () => {
    if (selectedLinkIndex > 0) {
      setSelectedLinkIndex(selectedLinkIndex - 1);
    }
  };

  // Navigate to next link
  const goToNextLink = () => {
    if (selectedLinkIndex < linkCount - 1) {
      setSelectedLinkIndex(selectedLinkIndex + 1);
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

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "My Custom Cuban Chain",
          text: "Check out this Cuban chain I designed!",
          url: window.location.href,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    } else {
      // Fallback - copy link to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const colorOptions = getColorOptions();
  const showColorDropdown = applyInserts && currentSurfaceConfig?.type && currentSurfaceConfig.type !== "empty";

  // Get material color for display
  const getMaterialColor = (material: Material) => {
    return MATERIALS.find((m) => m.value === material)?.color || "#c0c0c0";
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800 ${isMobile ? "w-full" : "w-80 max-h-[calc(100vh-140px)]"}`}>
      <Tabs defaultValue="design" value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-2 bg-white dark:bg-gray-900 z-10">
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="design" className="text-xs">Design</TabsTrigger>
            <TabsTrigger value="assembly" className="text-xs">Assembly</TabsTrigger>
            <TabsTrigger value="saved" className="text-xs">Saved</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
          </TabsList>
        </div>

        {/* Price Calculator Header */}
        <div className="px-4 pb-2 bg-white dark:bg-gray-900 z-10">
          <PriceCalculator chainConfig={chainConfig} chainLength={linkCount} />
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 pt-0 space-y-6 pb-20">
            {/* Design Tab */}
            <TabsContent value="design" className="mt-0 space-y-6 focus-visible:outline-none data-[state=inactive]:hidden">
              {/* Link Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Selected Link
                  </Label>
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goToPreviousLink}>
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="text-xs font-medium w-12 text-center">
                      {selectedLinkIndex + 1} / {linkCount}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goToNextLink}>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="apply-all"
                    checked={applyToAll}
                    onCheckedChange={(checked) => setApplyToAll(checked as boolean)}
                  />
                  <Label htmlFor="apply-all" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                    Apply changes to all links
                  </Label>
                </div>
              </div>

              <Separator />

              {/* Surface Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Surface
                </Label>
                <ZoneSelector
                  selectedZone={selectedSurface}
                  onZoneSelect={setSelectedSurface}
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="apply-sides"
                    checked={applyToSides}
                    onCheckedChange={(checked) => setApplyToSides(checked as boolean)}
                  />
                  <Label htmlFor="apply-sides" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                    Apply to both sides
                  </Label>
                </div>
              </div>

              <Separator />

              {/* Material Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Base Material
                </Label>
                <div className="grid grid-cols-5 gap-2">
                  {MATERIALS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => handleMaterialChange(m.value)}
                      className={`w-full aspect-square rounded-full border-2 transition-all ${currentLink?.material === m.value
                        ? "border-blue-500 scale-110 shadow-md"
                        : "border-transparent hover:scale-105"
                        }`}
                      style={{ backgroundColor: m.color }}
                      title={m.label}
                    />
                  ))}
                </div>
                <div className="text-center text-xs text-gray-500 font-medium">
                  {MATERIALS.find(m => m.value === currentLink?.material)?.label || "Select Material"}
                </div>
              </div>

              <Separator />

              {/* Surface Design */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Surface Design
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="apply-inserts"
                      checked={applyInserts}
                      onCheckedChange={(checked) => setApplyInserts(checked as boolean)}
                    />
                    <label
                      htmlFor="apply-inserts"
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Enable
                    </label>
                  </div>
                </div>

                {applyInserts && (
                  <div className="space-y-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-3 gap-2">
                      {DIAMOND_TYPES.map((type) => {
                        const isSelected = currentSurfaceConfig?.type === type.value;
                        return (
                          <button
                            key={type.value}
                            onClick={() => handleDiamondTypeChange(type.value)}
                            className={`
                              flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200
                              ${isSelected
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm scale-[1.02]"
                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              }
                            `}
                          >
                            {/* Icon based on type */}
                            <div className={`p-2 rounded-full ${isSelected ? "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                              {type.value === "gemstones" && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z" /><path d="M11 3 8 9l4 13 4-13-3-6" /></svg>
                              )}
                              {type.value === "moissanites" && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z" /></svg>
                              )}
                              {type.value === "enamel" && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                              )}
                              {type.value === "engraving" && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z" /><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="m2 2 7.586 7.586" /><circle cx="11" cy="11" r="2" /></svg>
                              )}
                              {type.value === "empty" && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></svg>
                              )}
                            </div>
                            <span className={`text-[10px] font-medium ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-400"}`}>
                              {type.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {showColorDropdown && (
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500">
                          {currentSurfaceConfig?.type === "engraving" ? "Pattern" : "Color"}
                        </Label>

                        {currentSurfaceConfig?.type === "gemstones" || currentSurfaceConfig?.type === "moissanites" || currentSurfaceConfig?.type === "enamel" ? (
                          <div className="grid grid-cols-7 gap-1.5">
                            {/* White/Clear option */}
                            <button
                              onClick={() => handleColorChange("#ffffff")}
                              className={`w-full aspect-square rounded-full border shadow-sm transition-transform ${getCurrentColorValue() === "#ffffff" ? "ring-2 ring-blue-500 scale-110" : "hover:scale-105"
                                }`}
                              style={{ backgroundColor: "#ffffff" }}
                              title="White/Clear"
                            />
                            {/* Filter out white from map to avoid duplicate */}
                            {getColorOptions().filter(c => c.value !== "#ffffff").map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleColorChange(option.value)}
                                className={`w-full aspect-square rounded-full border shadow-sm transition-transform ${getCurrentColorValue() === option.value ? "ring-2 ring-blue-500 scale-110" : "hover:scale-105"
                                  }`}
                                style={{ backgroundColor: option.value }}
                                title={option.label}
                              />
                            ))}
                          </div>
                        ) : (
                          <Select
                            value={getCurrentColorValue()}
                            onValueChange={handleColorChange}
                          >
                            <SelectTrigger className="w-full h-8 bg-white dark:bg-gray-800">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getColorOptions().map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    {/* Individual Stone Color Picker for Surfaces with Gemstones */}
                    {(currentSurfaceConfig?.type === "gemstones" || currentSurfaceConfig?.type === "moissanites") && (
                      <StoneColorPicker
                        surfaceId={selectedSurface}
                        gemstoneColors={currentSurfaceConfig.gemstoneColors || { stone1: "#ffffff", stone2: "#ffffff" }}
                        onChange={(newColors) => {
                          const newConfig = { ...currentSurfaceConfig, gemstoneColors: newColors };
                          if (applyToSides) {
                            setChainConfig(applySurfaceToAllSideSurfaces(chainConfig, newConfig));
                          } else {
                            setChainConfig(updateSurface(chainConfig, selectedLinkIndex, selectedSurface, newConfig));
                          }
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Assembly Tab */}
            <TabsContent value="assembly" className="mt-0 space-y-6 focus-visible:outline-none data-[state=inactive]:hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Chain Length
                  </Label>
                  <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {linkCount} links
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChainLengthChange && handleChainLengthChange(Math.max(1, linkCount - 1))}
                    disabled={linkCount <= 1}
                    className="flex-1"
                  >
                    - Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChainLengthChange && handleChainLengthChange(linkCount + 1)}
                    className="flex-1"
                  >
                    + Link
                  </Button>
                </div>

                {setModelUrls && (
                  <div className="pt-2">
                    <Label className="text-xs text-gray-500 mb-2 block">Add Specific Link Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {AVAILABLE_LINK_TYPES.slice(0, 6).map((item) => (
                        <Button
                          key={item.type}
                          variant="outline"
                          size="sm"
                          className="h-20 flex flex-col gap-2 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all"
                          onClick={() => handleAddLink(item.type)}
                        >
                          {/* Visual representation based on type */}
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            {item.type.includes('part') ? (
                              <div className="w-4 h-4 rounded-sm border-2 border-gray-400" />
                            ) : item.type === 'enamel' ? (
                              <div className="w-4 h-4 rounded-full bg-blue-400" />
                            ) : (
                              <div className="w-4 h-4 rounded-sm border border-dashed border-gray-400" />
                            )}
                          </div>
                          <span className="text-xs font-medium">{item.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quick Presets
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(CHAIN_PRESETS).map((preset) => (
                    <Button
                      key={preset}
                      variant={selectedPreset === preset ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleLoadPreset(preset)}
                      className="text-xs justify-start"
                    >
                      <Link className="w-3 h-3 mr-2" />
                      {preset.charAt(0).toUpperCase() + preset.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Saved Tab (Favorites) */}
            <TabsContent value="saved" className="mt-0 space-y-4 focus-visible:outline-none data-[state=inactive]:hidden">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
                Save your designs to load them later. Designs are saved to your browser&apos;s local storage.
              </div>
              <FavoritesPanel
                chainConfig={chainConfig}
                modelUrls={modelUrls}
                onLoadFavorite={(config, urls) => {
                  if (onLoadFavorite) {
                    onLoadFavorite(config, urls);
                  }
                }}
                className="border-0 shadow-none bg-transparent p-0"
              />
              <Button variant="outline" size="sm" onClick={onSaveConfiguration} className="w-full">
                Save Configuration File (JSON)
              </Button>
              <label className="block w-full">
                <span className="sr-only">Load from JSON</span>
                <div className="flex items-center justify-center w-full h-9 px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800 cursor-pointer">
                  Load from JSON File
                </div>
                <input type="file" accept=".json" onChange={onLoadConfiguration} className="hidden" />
              </label>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-0 space-y-6 focus-visible:outline-none data-[state=inactive]:hidden">
              <div className="space-y-4">
                <Label className="text-sm font-medium">Export & Share</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowScreenshotModal?.(true)} // We need to add this prop
                    className="h-20 flex flex-col gap-2"
                  >
                    <Camera className="w-6 h-6 mb-1" />
                    Capture Image
                  </Button>
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={onStartRecording}
                    className={`h-20 flex flex-col gap-2 ${isRecording ? "animate-pulse" : ""}`}
                  >
                    {isRecording ? <Square className="w-6 h-6 mb-1" /> : <Video className="w-6 h-6 mb-1" />}
                    {isRecording ? "Stop Recording" : "Record Video"}
                  </Button>
                </div>
                <Button variant="secondary" className="w-full" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" /> Share Design
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-sm font-medium">View Settings</Label>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-rotate" className="text-xs">Auto Rotate</Label>
                  <Switch
                    id="auto-rotate"
                    checked={autoRotate}
                    onCheckedChange={setAutoRotate}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-debug" className="text-xs">Show Debug Info</Label>
                  <Switch
                    id="show-debug"
                    checked={showDebug}
                    onCheckedChange={setShowDebug}
                  />
                </div>
                {onReplayAnimation && (
                  <Button variant="outline" size="sm" onClick={onReplayAnimation} className="w-full mt-2">
                    Replay Entrance Animation
                  </Button>
                )}

                <Separator />

                <div className="space-y-4">
                  <Label className="text-sm font-medium">Environment</Label>
                  <Select value={background} onValueChange={setBackground}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Environment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="city">City (Default)</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="sunset">Sunset</SelectItem>
                      <SelectItem value="dawn">Dawn</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="forest">Forest</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="park">Park</SelectItem>
                      <SelectItem value="lobby">Lobby</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
