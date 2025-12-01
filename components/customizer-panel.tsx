"use client";

import type React from "react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  Upload,
  Palette,
  Gem,
  Circle,
  Link,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type {
  ChainConfig,
  SurfaceId,
  Material,
  SurfaceType,
  SurfaceConfig,
} from "@/lib/chain-config-types";
import {
  MATERIAL_OPTIONS,
  GEMSTONE_COLORS,
  ENAMEL_COLORS,
  ENGRAVING_DESIGNS,
} from "@/lib/chain-config-types";
import {
  updateLinkMaterial,
  updateSurface,
  createDefaultGemstoneColors,
  applyMaterialToAllLinks,
  applyMaterialToAlternatingLinks,
  applySurfaceToAllLinks,
  applySurfaceToAllTopSurfaces,
  applySurfaceToAllSideSurfaces,
  copyLinkToAll,
  setChainLength,
} from "@/lib/chain-helpers";

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
}

const SURFACE_OPTIONS: Array<{ name: string; value: SurfaceId; description: string }> = [
  { name: "Top 1", value: "top1", description: "First top surface (3 gemstones)" },
  { name: "Top 2", value: "top2", description: "Second top surface (3 gemstones)" },
  { name: "Side 1", value: "side1", description: "First side surface (2 gemstones)" },
  { name: "Side 2", value: "side2", description: "Second side surface (2 gemstones)" },
];

const SURFACE_TYPE_OPTIONS: Array<{ name: string; value: SurfaceType; icon: string }> = [
  { name: "Empty", value: "empty", icon: "○" },
  { name: "Gemstones", value: "gemstones", icon: "💎" },
  { name: "Moissanites", value: "moissanites", icon: "✨" },
  { name: "Enamel", value: "enamel", icon: "🎨" },
  { name: "Engraving", value: "engraving", icon: "✏️" },
];

export function CustomizerPanel({
  chainConfig,
  setChainConfig,
  selectedSurface,
  setSelectedSurface,
  onSaveConfiguration,
  onLoadConfiguration,
  isInSheet = false,
}: CustomizerPanelProps) {
  const [selectedLinkIndex, setSelectedLinkIndex] = useState(0);
  const [applyToAll, setApplyToAll] = useState(false);
  const [applyToSides, setApplyToSides] = useState(false);

  const currentLink = chainConfig.links[selectedLinkIndex];
  const currentSurfaceConfig = currentLink?.surfaces[selectedSurface];
  const isTopSurface = selectedSurface === "top1" || selectedSurface === "top2";
  const gemstoneCount = isTopSurface ? 3 : 2;

  // Navigation between links
  const goToPreviousLink = () => {
    if (selectedLinkIndex > 0) {
      setSelectedLinkIndex(selectedLinkIndex - 1);
    }
  };

  const goToNextLink = () => {
    if (selectedLinkIndex < chainConfig.links.length - 1) {
      setSelectedLinkIndex(selectedLinkIndex + 1);
    }
  };

  // Chain length handler
  const handleChainLengthChange = (length: number) => {
    setChainConfig(setChainLength(chainConfig, length));
    if (selectedLinkIndex >= length) {
      setSelectedLinkIndex(Math.max(0, length - 1));
    }
  };

  // Material handlers
  const handleMaterialChange = (material: Material) => {
    if (applyToAll) {
      setChainConfig(applyMaterialToAllLinks(chainConfig, material));
      // Dispatch event for all links
      window.dispatchEvent(new CustomEvent("applyMaterialToModel", {
        detail: { material, targetModel: "all", targetIndex: -1 }
      }));
    } else {
      setChainConfig(updateLinkMaterial(chainConfig, selectedLinkIndex, material));
      // Dispatch event for specific link
      window.dispatchEvent(new CustomEvent("applyMaterialToModel", {
        detail: { material, targetModel: "specific", targetIndex: selectedLinkIndex }
      }));
    }
  };

  const handleApplyMaterialAlternating = (material: Material) => {
    const newConfig = applyMaterialToAlternatingLinks(chainConfig, material, selectedLinkIndex % 2);
    setChainConfig(newConfig);
    // Dispatch events for alternating links
    newConfig.links.forEach((link, index) => {
      if (link.material === material) {
        window.dispatchEvent(new CustomEvent("applyMaterialToModel", {
          detail: { material, targetModel: "specific", targetIndex: index }
        }));
      }
    });
  };

  // Surface type handler
  const handleSurfaceTypeChange = (type: SurfaceType) => {
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

    if (applyToAll) {
      setChainConfig(applySurfaceToAllLinks(chainConfig, selectedSurface, newSurfaceConfig));
      // Dispatch events for all links
      chainConfig.links.forEach((_, index) => {
        window.dispatchEvent(new CustomEvent("applySurfaceConfig", {
          detail: { linkIndex: index, surfaceId: selectedSurface, surfaceConfig: newSurfaceConfig }
        }));
      });
    } else if (applyToSides && !isTopSurface) {
      setChainConfig(applySurfaceToAllSideSurfaces(chainConfig, newSurfaceConfig));
      // Dispatch events for all links (both side surfaces)
      chainConfig.links.forEach((_, index) => {
        window.dispatchEvent(new CustomEvent("applySurfaceConfig", {
          detail: { linkIndex: index, surfaceId: "side1", surfaceConfig: newSurfaceConfig }
        }));
        window.dispatchEvent(new CustomEvent("applySurfaceConfig", {
          detail: { linkIndex: index, surfaceId: "side2", surfaceConfig: newSurfaceConfig }
        }));
      });
    } else {
      setChainConfig(updateSurface(chainConfig, selectedLinkIndex, selectedSurface, newSurfaceConfig));
      // Dispatch event for specific link/surface
      window.dispatchEvent(new CustomEvent("applySurfaceConfig", {
        detail: { linkIndex: selectedLinkIndex, surfaceId: selectedSurface, surfaceConfig: newSurfaceConfig }
      }));
    }
  };

  // Individual gemstone color handler
  const handleGemstoneColorChange = (stoneKey: string, color: string) => {
    if (!currentSurfaceConfig?.gemstoneColors) return;

    let newGemstoneColors;
    if (stoneKey === "all") {
      newGemstoneColors = {
        stone1: color,
        stone2: color,
        ...(isTopSurface && { stone3: color }),
      };
    } else {
      newGemstoneColors = {
        ...currentSurfaceConfig.gemstoneColors,
        [stoneKey]: color,
      };
    }

    const newSurfaceConfig = {
      ...currentSurfaceConfig,
      gemstoneColors: newGemstoneColors,
    };

    if (applyToAll) {
      setChainConfig(applySurfaceToAllLinks(chainConfig, selectedSurface, newSurfaceConfig));
      // Dispatch events for all links
      chainConfig.links.forEach((_, index) => {
        window.dispatchEvent(new CustomEvent("applySurfaceConfig", {
          detail: { linkIndex: index, surfaceId: selectedSurface, surfaceConfig: newSurfaceConfig }
        }));
      });
    } else {
      setChainConfig(updateSurface(chainConfig, selectedLinkIndex, selectedSurface, newSurfaceConfig));
      // Dispatch event for specific link
      window.dispatchEvent(new CustomEvent("applySurfaceConfig", {
        detail: { linkIndex: selectedLinkIndex, surfaceId: selectedSurface, surfaceConfig: newSurfaceConfig }
      }));
    }
  };

  // Enamel color handler
  const handleEnamelColorChange = (color: string) => {
    const newSurfaceConfig = { ...currentSurfaceConfig, enamelColor: color };

    if (applyToAll) {
      setChainConfig(applySurfaceToAllLinks(chainConfig, selectedSurface, newSurfaceConfig));
      chainConfig.links.forEach((_, index) => {
        window.dispatchEvent(new CustomEvent("applySurfaceConfig", {
          detail: { linkIndex: index, surfaceId: selectedSurface, surfaceConfig: newSurfaceConfig }
        }));
      });
    } else {
      setChainConfig(updateSurface(chainConfig, selectedLinkIndex, selectedSurface, newSurfaceConfig));
      window.dispatchEvent(new CustomEvent("applySurfaceConfig", {
        detail: { linkIndex: selectedLinkIndex, surfaceId: selectedSurface, surfaceConfig: newSurfaceConfig }
      }));
    }
  };

  // Engraving design handler
  const handleEngravingDesignChange = (design: "pattern1" | "pattern2") => {
    const newSurfaceConfig = { ...currentSurfaceConfig, engravingDesign: design };

    if (applyToAll) {
      setChainConfig(applySurfaceToAllLinks(chainConfig, selectedSurface, newSurfaceConfig));
      chainConfig.links.forEach((_, index) => {
        window.dispatchEvent(new CustomEvent("applySurfaceConfig", {
          detail: { linkIndex: index, surfaceId: selectedSurface, surfaceConfig: newSurfaceConfig }
        }));
      });
    } else {
      setChainConfig(updateSurface(chainConfig, selectedLinkIndex, selectedSurface, newSurfaceConfig));
      window.dispatchEvent(new CustomEvent("applySurfaceConfig", {
        detail: { linkIndex: selectedLinkIndex, surfaceId: selectedSurface, surfaceConfig: newSurfaceConfig }
      }));
    }
  };

  // Copy current link to all
  const handleCopyToAll = () => {
    const newConfig = copyLinkToAll(chainConfig, selectedLinkIndex);
    setChainConfig(newConfig);
    // Dispatch events for all links to update 3D view
    const sourceLink = chainConfig.links[selectedLinkIndex];
    newConfig.links.forEach((_, index) => {
      window.dispatchEvent(new CustomEvent("applyMaterialToModel", {
        detail: { material: sourceLink.material, targetModel: "specific", targetIndex: index }
      }));
      (["top1", "top2", "side1", "side2"] as const).forEach(surfaceId => {
        window.dispatchEvent(new CustomEvent("applySurfaceConfig", {
          detail: { linkIndex: index, surfaceId, surfaceConfig: sourceLink.surfaces[surfaceId] }
        }));
      });
    });
  };

  return (
    <Card className="w-full lg:w-96 h-full rounded-none lg:rounded-r-2xl border-0 lg:border lg:border-l-0 bg-card/95 backdrop-blur-sm lg:shadow-2xl overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          
          {/* Chain Length Control */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Link className="w-3 h-3" />
              Chain Length: {chainConfig.chainLength} links
            </Label>
            <Slider
              value={[chainConfig.chainLength]}
              onValueChange={([v]) => handleChainLengthChange(v)}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
          </div>

          <Separator />

          {/* Link Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              Select Link ({selectedLinkIndex + 1} of {chainConfig.chainLength})
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousLink}
                disabled={selectedLinkIndex === 0}
                className="h-8 px-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1 flex gap-1 overflow-x-auto py-1">
                {chainConfig.links.map((link, index) => (
                  <Button
                    key={index}
                    variant={selectedLinkIndex === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLinkIndex(index)}
                    className="h-7 w-7 p-0 flex-shrink-0"
                    style={{
                      backgroundColor: selectedLinkIndex === index 
                        ? undefined 
                        : MATERIAL_OPTIONS.find(m => m.value === link.material)?.color,
                    }}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextLink}
                disabled={selectedLinkIndex === chainConfig.chainLength - 1}
                className="h-8 px-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Material Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Palette className="w-3 h-3" />
                Link Material
              </Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="apply-material-all"
                  checked={applyToAll}
                  onCheckedChange={(checked) => setApplyToAll(!!checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="apply-material-all" className="text-xs">Apply to all</Label>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {MATERIAL_OPTIONS.map((material) => (
                <Button
                  key={material.value}
                  variant={currentLink?.material === material.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMaterialChange(material.value)}
                  className="h-10 p-1 flex flex-col items-center gap-0.5"
                  title={material.name}
                >
                  <Circle
                    className="w-5 h-5"
                    style={{ fill: material.color, color: material.color }}
                  />
                  <span className="text-[10px]">{material.name}</span>
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleApplyMaterialAlternating(currentLink?.material || "silver")}
              className="w-full h-7 text-xs"
            >
              Apply to alternating links
            </Button>
          </div>

          <Separator />

          {/* Surface Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Gem className="w-3 h-3" />
              Surface Selection
            </Label>
            <Tabs value={selectedSurface} onValueChange={(v) => setSelectedSurface(v as SurfaceId)}>
              <TabsList className="grid grid-cols-4 h-8">
                {SURFACE_OPTIONS.map((surface) => (
                  <TabsTrigger
                    key={surface.value}
                    value={surface.value}
                    className="text-xs px-2"
                  >
                    {surface.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground">
              {SURFACE_OPTIONS.find(s => s.value === selectedSurface)?.description}
            </p>
          </div>

          {/* Surface Type Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Surface Type</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="apply-sides"
                  checked={applyToSides}
                  onCheckedChange={(checked) => setApplyToSides(!!checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="apply-sides" className="text-xs">
                  {isTopSurface ? "Apply to both tops" : "Apply to both sides"}
                </Label>
              </div>
            </div>
            <Select
              value={currentSurfaceConfig?.type || "empty"}
              onValueChange={(v) => handleSurfaceTypeChange(v as SurfaceType)}
            >
              <SelectTrigger className="w-full h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SURFACE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span>{option.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gemstone Options */}
          {(currentSurfaceConfig?.type === "gemstones" || currentSurfaceConfig?.type === "moissanites") && (
            <div className="space-y-2 p-2 bg-muted/30 rounded-lg">
              <Label className="text-xs font-semibold">
                {currentSurfaceConfig.type === "gemstones" ? "Diamond" : "Moissanite"} Colors
              </Label>
              
              {/* Quick color presets */}
              <div className="grid grid-cols-5 gap-1">
                {GEMSTONE_COLORS.slice(0, 5).map((color) => (
                  <Button
                    key={color.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleGemstoneColorChange("all", color.value)}
                    className="h-7 p-0"
                    style={{ backgroundColor: color.value }}
                    title={`All ${color.name}`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {GEMSTONE_COLORS.slice(5).map((color) => (
                  <Button
                    key={color.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleGemstoneColorChange("all", color.value)}
                    className="h-7 p-0"
                    style={{ backgroundColor: color.value }}
                    title={`All ${color.name}`}
                  />
                ))}
              </div>

              {/* Individual stone colors */}
              <Separator className="my-2" />
              <Label className="text-xs text-muted-foreground">Individual Stones</Label>
              <div className="space-y-2">
                {Array.from({ length: gemstoneCount }).map((_, i) => {
                  const stoneKey = `stone${i + 1}` as keyof typeof currentSurfaceConfig.gemstoneColors;
                  const currentColor = currentSurfaceConfig.gemstoneColors?.[stoneKey] || "#ffffff";
                  return (
                    <div key={stoneKey} className="flex items-center gap-2">
                      <span className="text-xs w-16">Stone {i + 1}:</span>
                      <div className="flex-1 flex gap-1">
                        {GEMSTONE_COLORS.slice(0, 6).map((color) => (
                          <Button
                            key={color.value}
                            variant={currentColor === color.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleGemstoneColorChange(stoneKey, color.value)}
                            className="h-6 w-6 p-0 flex-shrink-0"
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Enamel Options */}
          {currentSurfaceConfig?.type === "enamel" && (
            <div className="space-y-2 p-2 bg-muted/30 rounded-lg">
              <Label className="text-xs font-semibold">Enamel Color</Label>
              <div className="grid grid-cols-5 gap-1">
                {ENAMEL_COLORS.map((color) => (
                  <Button
                    key={color.value}
                    variant={currentSurfaceConfig.enamelColor === color.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleEnamelColorChange(color.value)}
                    className="h-8 p-0"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Engraving Options */}
          {currentSurfaceConfig?.type === "engraving" && (
            <div className="space-y-2 p-2 bg-muted/30 rounded-lg">
              <Label className="text-xs font-semibold">Engraving Design</Label>
              <div className="grid grid-cols-2 gap-2">
                {ENGRAVING_DESIGNS.map((design) => (
                  <Button
                    key={design.value}
                    variant={currentSurfaceConfig.engravingDesign === design.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleEngravingDesignChange(design.value)}
                    className="h-10"
                  >
                    {design.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Copy to All Links */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyToAll}
            className="w-full h-8"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Link {selectedLinkIndex + 1} to All Links
          </Button>

          <Separator />

          {/* Save/Load Configuration */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Configuration</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveConfiguration}
                className="flex-1 h-9"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <label htmlFor="load-config" className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9 cursor-pointer"
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Load
                  </span>
                </Button>
                <input
                  id="load-config"
                  type="file"
                  accept=".json"
                  onChange={onLoadConfiguration}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t bg-muted/20">
          {isInSheet ? (
            <SheetClose asChild>
              <Button size="sm" className="w-full">
                Done
              </Button>
            </SheetClose>
          ) : (
            <div className="text-xs text-center text-muted-foreground">
              Link {selectedLinkIndex + 1}: {currentLink?.material} | Surface: {selectedSurface}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
