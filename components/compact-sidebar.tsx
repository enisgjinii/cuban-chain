"use client";

import React, { useState, useEffect, useCallback } from "react";
import * as THREE from "three";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Palette,
  Wrench,
  RotateCw,
  Circle,
  Save,
  Upload,
  Video,
  VideoOff,
  Camera,
  Eye,
  Download,
  Plus,
  Link,
  Trash2,
  Move3D,
  GripVertical,
} from "lucide-react";
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
} from "@/lib/chain-helpers";
import {
  type ChainLinkType,
  type ChainPattern,
  LINK_TYPE_TO_URL,
  CHAIN_PRESETS,
} from "@/lib/chain-manager";


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
  meshes,
  nodes,
}: CompactSidebarProps) {
  const currentLink = chainConfig.links[0];
  const currentSurfaceConfig = currentLink?.surfaces[selectedSurface];
  
  const [nodeVisibility, setNodeVisibility] = useState<Record<string, boolean>>({});
  const [selectedModelForMaterial, setSelectedModelForMaterial] = useState<string>("all");
  const [chainPattern, setChainPattern] = useState<ChainPattern>("linear");
  const [selectedLinkType, setSelectedLinkType] = useState<ChainLinkType>("part1");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [linkOffsets, setLinkOffsets] = useState<Record<number, { x: number; y: number; z: number }>>({});

  useEffect(() => {
    if (!sceneRef?.current) return;
    const visibility: Record<string, boolean> = {};
    sceneRef.current.traverse((child: THREE.Object3D) => {
      if (child.name) {
        child.visible = true;
        visibility[child.name] = true;
      }
    });
    setNodeVisibility(visibility);
  }, [meshes, nodes, sceneRef]);

  const handleAddLink = useCallback((linkType: ChainLinkType) => {
    const url = LINK_TYPE_TO_URL[linkType];
    if (!url || !setModelUrls) return;
    setModelUrls([...modelUrls, url]);
    window.dispatchEvent(new CustomEvent("addChainLink", { detail: { linkType } }));
  }, [modelUrls, setModelUrls]);

  const handleRemoveLink = useCallback((index: number) => {
    if (!setModelUrls || modelUrls.length <= 1) return;
    setModelUrls(modelUrls.filter((_, i) => i !== index));
    window.dispatchEvent(new CustomEvent("removeChainLink", { detail: { index } }));
  }, [modelUrls, setModelUrls]);

  const handleSpacingChange = useCallback((value: number) => {
    setChainSpacing?.(value);
    window.dispatchEvent(new CustomEvent("updateChainSpacing", { detail: { spacing: value } }));
  }, [setChainSpacing]);

  const handlePatternChange = useCallback((pattern: ChainPattern) => {
    setChainPattern(pattern);
    window.dispatchEvent(new CustomEvent("updateChainPattern", { detail: { pattern } }));
  }, []);

  const handleLinkOffsetChange = useCallback((index: number, axis: 'x' | 'y' | 'z', value: number) => {
    setLinkOffsets(prev => {
      const current = prev[index] || { x: 0, y: 0, z: 0 };
      const updated = { ...current, [axis]: value };
      window.dispatchEvent(new CustomEvent("updateLinkOffset", { detail: { index, offset: updated } }));
      return { ...prev, [index]: updated };
    });
  }, []);

  const handleLoadPreset = useCallback((presetName: string) => {
    const preset = CHAIN_PRESETS[presetName];
    if (!preset || !setModelUrls) return;
    setModelUrls(preset.map(type => LINK_TYPE_TO_URL[type]));
    setSelectedPreset(presetName);
  }, [setModelUrls]);

  const toggleDiamonds = useCallback(() => {
    if (!sceneRef?.current) return;
    const patterns = ['Diamond_Octagon', 'loc_diamonds', 'loc_diamond_side'];
    sceneRef.current.traverse((child: THREE.Object3D) => {
      if (child.name && patterns.some(p => child.name.includes(p))) {
        child.visible = !child.visible;
        setNodeVisibility(prev => ({ ...prev, [child.name]: child.visible }));
      }
    });
  }, [sceneRef]);

  const downloadSceneData = useCallback(() => {
    const data = { modelUrls, chainSpacing, chainPattern, linkOffsets, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chain-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [modelUrls, chainSpacing, chainPattern, linkOffsets]);

  const handleMaterialChange = (material: Material) => {
    setChainConfig(updateLinkMaterial(chainConfig, 0, material));
    let targetIndex = -1;
    if (selectedModelForMaterial !== "all") {
      const parts = selectedModelForMaterial.split("-");
      targetIndex = parseInt(parts[parts.length - 1]);
    }
    window.dispatchEvent(new CustomEvent("applyMaterialToModel", {
      detail: { material, targetModel: selectedModelForMaterial === "all" ? "all" : selectedModelForMaterial, targetIndex }
    }));
  };

  const handleSurfaceTypeChange = (type: SurfaceType) => {
    let config: SurfaceConfig = { type };
    if (type === "gemstones" || type === "moissanites") {
      config = { type, gemstoneColors: createDefaultGemstoneColors(selectedSurface) };
    } else if (type === "enamel") {
      config = { type, enamelColor: "#ffffff" };
    } else if (type === "engraving") {
      config = { type, engravingDesign: "pattern1" };
    }
    setChainConfig(updateSurface(chainConfig, 0, selectedSurface, config));
  };

  const handleGemstoneColorChange = (color: string) => {
    if (!currentSurfaceConfig?.gemstoneColors) return;
    const colors = { stone1: color, stone2: color, ...(currentSurfaceConfig.gemstoneColors.stone3 && { stone3: color }) };
    setChainConfig(updateSurface(chainConfig, 0, selectedSurface, { ...currentSurfaceConfig, gemstoneColors: colors }));
  };

  const handleEnamelColorChange = (color: string) => {
    setChainConfig(updateSurface(chainConfig, 0, selectedSurface, { ...currentSurfaceConfig, enamelColor: color }));
  };


  return (
    <Card className="w-80 h-full rounded-2xl border-r bg-card max-h-[90vh] overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-2">
              <Link className="w-3 h-3" />
              Chain Assembly
            </Label>
            
            <Select value={selectedPreset} onValueChange={handleLoadPreset}>
              <SelectTrigger className="w-full h-8">
                <SelectValue placeholder="Load preset..." />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CHAIN_PRESETS).map(preset => (
                  <SelectItem key={preset} value={preset}>
                    {preset.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={selectedLinkType} onValueChange={(v) => setSelectedLinkType(v as ChainLinkType)}>
                <SelectTrigger className="flex-1 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_LINK_TYPES.map(({ type, label }) => (
                    <SelectItem key={type} value={type}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => handleAddLink(selectedLinkType)} className="h-8 px-3">
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            <div className="space-y-1 max-h-40 overflow-y-auto">
              {modelUrls.map((url, index) => (
                <div key={`${url}-${index}`} className="flex items-center gap-2 p-1.5 bg-muted/50 rounded text-xs">
                  <GripVertical className="w-3 h-3 text-muted-foreground" />
                  <span className="flex-1 truncate">{url.split('/').pop()?.replace('.glb', '')}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveLink(index)} className="h-6 w-6 p-0" disabled={modelUrls.length <= 1}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <Select value={chainPattern} onValueChange={(v) => handlePatternChange(v as ChainPattern)}>
              <SelectTrigger className="w-full h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="alternating">Alternating</SelectItem>
                <SelectItem value="curved">Curved</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Spacing</span>
                <span>{chainSpacing.toFixed(3)}</span>
              </div>
              <Slider value={[chainSpacing]} onValueChange={([v]) => handleSpacingChange(v)} min={0} max={0.1} step={0.001} />
            </div>
          </div>

          <Separator />

          {chainPattern === 'custom' && modelUrls.length > 0 && (
            <>
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-2">
                  <Move3D className="w-3 h-3" />
                  Link Offsets
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {modelUrls.map((url, index) => {
                    const offset = linkOffsets[index] || { x: 0, y: 0, z: 0 };
                    return (
                      <div key={`offset-${index}`} className="space-y-1 p-2 bg-muted/30 rounded">
                        <span className="text-xs font-medium">{url.split('/').pop()?.replace('.glb', '')}</span>
                        {(['x', 'y', 'z'] as const).map(axis => (
                          <div key={axis} className="flex items-center gap-2">
                            <span className="text-xs w-4 uppercase text-muted-foreground">{axis}</span>
                            <Slider value={[offset[axis]]} onValueChange={([v]) => handleLinkOffsetChange(index, axis, v)} min={-0.1} max={0.1} step={0.001} className="flex-1" />
                            <span className="text-xs w-12 text-right">{offset[axis].toFixed(3)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
              <Separator />
            </>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-2">
              <Palette className="w-3 h-3" />
              Material
            </Label>
            <Select value={currentLink?.material || "silver"} onValueChange={(v) => handleMaterialChange(v as Material)}>
              <SelectTrigger className="w-full h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="silver"><div className="flex items-center gap-2"><Circle className="w-3 h-3 fill-gray-400" />Silver</div></SelectItem>
                <SelectItem value="gold"><div className="flex items-center gap-2"><Circle className="w-3 h-3 fill-yellow-500" />Gold</div></SelectItem>
                <SelectItem value="grey"><div className="flex items-center gap-2"><Circle className="w-3 h-3 fill-gray-600" />Grey</div></SelectItem>
                <SelectItem value="black"><div className="flex items-center gap-2"><Circle className="w-3 h-3 fill-black" />Black</div></SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedModelForMaterial} onValueChange={setSelectedModelForMaterial}>
              <SelectTrigger className="w-full h-8">
                <SelectValue placeholder="Apply to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {modelUrls.map((url, i) => (
                  <SelectItem key={`${url}-${i}`} value={`${url}-${i}`}>{url.split('/').pop()?.replace('.glb', '')} #{i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-2">
              <Wrench className="w-3 h-3" />
              Diamonds
            </Label>
            <Select value={currentSurfaceConfig?.type || "empty"} onValueChange={(v) => handleSurfaceTypeChange(v as SurfaceType)}>
              <SelectTrigger className="w-full h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemstones">Diamonds</SelectItem>
                <SelectItem value="moissanites">Moissanites</SelectItem>
                <SelectItem value="enamel">Enamel</SelectItem>
                <SelectItem value="engraving">Engraving</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={toggleDiamonds} className="w-full h-7 text-xs">
              <Eye className="w-3 h-3 mr-1" />
              Toggle Diamonds
            </Button>
          </div>

          {currentSurfaceConfig?.type === "gemstones" && (
            <Button variant="outline" size="sm" className="w-full h-6 text-xs" onClick={() => handleGemstoneColorChange("#ffffff")}>
              Colourless
            </Button>
          )}

          {currentSurfaceConfig?.type === "moissanites" && (
            <div className="grid grid-cols-3 gap-1">
              {["#ffffff", "#000000", "#16a34a", "#dc2626", "#2563eb", "#eab308"].map(c => (
                <Button key={c} variant="outline" size="sm" className="h-6" style={{ backgroundColor: c }} onClick={() => handleGemstoneColorChange(c)} />
              ))}
            </div>
          )}

          {currentSurfaceConfig?.type === "enamel" && (
            <div className="grid grid-cols-4 gap-1">
              {["#000000", "#ffffff", "#16a34a", "#dc2626", "#2563eb", "#eab308", "#ea580c", "#b8b8ff"].map(c => (
                <Button key={c} variant="outline" size="sm" className="h-6 p-0" style={{ backgroundColor: c }} onClick={() => handleEnamelColorChange(c)} />
              ))}
            </div>
          )}

          <Separator />

          <div className="flex gap-1">
            <Button onClick={onSaveConfiguration} className="flex-1 h-7 text-xs" size="sm">
              <Save className="w-3 h-3 mr-1" />Save
            </Button>
            <Button onClick={onLoadConfiguration} className="flex-1 h-7 text-xs" size="sm">
              <Upload className="w-3 h-3 mr-1" />Load
            </Button>
            <Button variant="outline" onClick={downloadSceneData} className="h-7 px-2" size="sm">
              <Download className="w-3 h-3" />
            </Button>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-2">
            <Button variant={autoRotate ? "default" : "outline"} size="sm" onClick={() => setAutoRotate?.(!autoRotate)} className="h-8">
              <RotateCw className="w-4 h-4 mr-1" />Rotate
            </Button>
            <Button variant="outline" size="sm" onClick={onCaptureImage} className="h-8" disabled={isRecording}>
              <Camera className="w-4 h-4 mr-1" />Capture
            </Button>
            <Button variant={isRecording ? "destructive" : "outline"} size="sm" onClick={onStartRecording} className={`h-8 col-span-2 ${isRecording ? "animate-pulse" : ""}`} disabled={isRecording}>
              {isRecording ? <><VideoOff className="w-4 h-4 mr-1" />Recording...</> : <><Video className="w-4 h-4 mr-1" />Record 5s</>}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
