"use client";

import React, { useState, useEffect } from "react";
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
import { SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Palette,
  Settings,
  Wrench,
  RotateCw,
  Bug,
  Circle,
  Save,
  Upload,
  Video,
  VideoOff,
  Camera,
  Eye,
  EyeOff,
  Box,
  Download,
  Plus,
  Minus,
  Link,
  Copy,
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
  getMaterialColor,
  createDefaultGemstoneColors,
} from "@/lib/chain-helpers";
import {
  BASE_LINK_COUNT,
  MAX_CHAIN_LINKS,
} from "@/lib/chain-geometry";

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
  chainSpacing?: number;
  setChainSpacing?: (value: number) => void;
  onUndo?: () => void;
  onSaveConfiguration?: () => void;
  onLoadConfiguration?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  autoRotate?: boolean;
  setAutoRotate?: (value: boolean) => void;
  showDebug?: boolean;
  setShowDebug?: (value: boolean) => void;
  onCaptureImage?: () => void;
  onStartRecording?: () => void;
  isRecording?: boolean;
  isInSheet?: boolean;
  sceneRef?: any;
}

const surfaceTypeOptions: Array<{ name: string; value: SurfaceType }> = [
  { name: "Empty", value: "empty" },
  { name: "Gems", value: "gemstones" },
  { name: "Moissanites", value: "moissanites" },
  { name: "Enamel", value: "enamel" },
  { name: "Engrave", value: "engraving" },
];

const enamelColors = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#ffffff" },
  { name: "Red", value: "#dc2626" },
  { name: "Green", value: "#16a34a" },
  { name: "Blue", value: "#2563eb" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#ea580c" },
];

export function CompactSidebar({
  chainConfig,
  setChainConfig,
  selectedSurface,
  setSelectedSurface,
  meshes,
  nodes,
  selectedMesh,
  hoveredMesh,
  onSelectMesh,
  onHoverMesh,
  chainSpacing,
  setChainSpacing,
  onUndo,
  onSaveConfiguration,
  onLoadConfiguration,
  autoRotate,
  setAutoRotate,
  showDebug,
  setShowDebug,
  onCaptureImage,
  onStartRecording,
  isRecording,
  isInSheet = false,
  sceneRef,
  
}: CompactSidebarProps) {
  const currentLink = chainConfig.links[0];
  const currentSurfaceConfig = currentLink?.surfaces[selectedSurface];
  
  const [nodeVisibility, setNodeVisibility] = useState<Record<string, boolean>>({});
  const [meshGroups, setMeshGroups] = useState<Array<{ linkIndex: number; meshes: string[] }>>([]);
  const [groupVisibility, setGroupVisibility] = useState<Record<number, boolean>>({});
  const extraLinkCount = Math.max(chainConfig.chainLength - BASE_LINK_COUNT, 0);
  const [activeExtraLink, setActiveExtraLink] = useState<number>(
    BASE_LINK_COUNT + 1,
  );

  useEffect(() => {
    if (extraLinkCount === 0) return;
    const minLink = BASE_LINK_COUNT + 1;
    const maxLink = BASE_LINK_COUNT + extraLinkCount;
    if (activeExtraLink < minLink || activeExtraLink > maxLink) {
      setActiveExtraLink(minLink);
    }
  }, [extraLinkCount, activeExtraLink]);

  // Additional link offset controls removed

  // Auto-group meshes by spatial position
  useEffect(() => {
    if (!sceneRef?.current || meshes.length === 0) return;

    // Collect mesh data with positions
    const meshData: Array<{ name: string; x: number }> = [];
    sceneRef.current.traverse((child: any) => {
      if (child.isMesh && child.name && child.name !== "Plane") {
        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);
        if (meshes.includes(child.name)) {
          meshData.push({ name: child.name, x: worldPos.x });
        }
      }
    });

    // Sort by X position
    meshData.sort((a, b) => a.x - b.x);

    // Divide into 7 groups
    const totalMeshes = meshData.length;
    const meshesPerGroup = Math.ceil(totalMeshes / 7);
    const groups: Array<{ linkIndex: number; meshes: string[] }> = [];
    
    for (let i = 0; i < 7; i++) {
      const startIdx = i * meshesPerGroup;
      const endIdx = Math.min(startIdx + meshesPerGroup, totalMeshes);
      const groupMeshes = meshData.slice(startIdx, endIdx).map(m => m.name);
      if (groupMeshes.length > 0) {
        groups.push({ linkIndex: i, meshes: groupMeshes });
      }
    }

    setMeshGroups(groups);
    
    // Initialize group visibility
    const groupVis: Record<number, boolean> = {};
    groups.forEach((g) => {
      groupVis[g.linkIndex] = true;
    });
    setGroupVisibility(groupVis);
  }, [sceneRef, meshes]);

  // Initialize visibility state for all meshes and nodes
  useEffect(() => {
    if (!sceneRef?.current) return;
    const visibility: Record<string, boolean> = {};
    sceneRef.current.traverse((child: any) => {
      if (child.name) {
        visibility[child.name] = child.visible;
      }
    });
    setNodeVisibility(visibility);
  }, [meshes, nodes, sceneRef]);

  const toggleNodeVisibility = (nodeName: string) => {
    if (!sceneRef?.current) return;
    sceneRef.current.traverse((child: any) => {
      if (child.name === nodeName) {
        child.visible = !child.visible;
        setNodeVisibility(prev => ({ ...prev, [nodeName]: child.visible }));
      }
    });
  };

  const toggleGroupVisibility = (linkIndex: number) => {
    if (!sceneRef?.current) return;
    const group = meshGroups.find(g => g.linkIndex === linkIndex);
    if (!group) return;

    const newVisibility = !groupVisibility[linkIndex];
    
    // Toggle all meshes in the group
    sceneRef.current.traverse((child: any) => {
      if (group.meshes.includes(child.name)) {
        child.visible = newVisibility;
        setNodeVisibility(prev => ({ ...prev, [child.name]: newVisibility }));
      }
    });

    setGroupVisibility(prev => ({ ...prev, [linkIndex]: newVisibility }));
  };

  const toggleDiamonds = () => {
    if (!sceneRef?.current) return;
    
    // Find all diamond-related meshes and nodes
    const diamondPatterns = ['Diamond_Octagon', 'loc_diamonds', 'loc_diamond_side'];
    
    sceneRef.current.traverse((child: any) => {
      if (child.name) {
        const isDiamond = diamondPatterns.some(pattern => 
          child.name.includes(pattern)
        );
        
        if (isDiamond) {
          child.visible = !child.visible;
          setNodeVisibility(prev => ({ ...prev, [child.name]: child.visible }));
        }
      }
    });
  };

  const addDiamonds = () => {
    if (!sceneRef?.current) {
      console.log('No scene reference available');
      return;
    }
    
    console.log('Adding diamonds...');
    // Find all diamond-related meshes and nodes and make them visible
    const diamondPatterns = ['Diamond_Octagon', 'loc_diamonds', 'loc_diamond_side'];
    let count = 0;
    
    sceneRef.current.traverse((child: any) => {
      if (child.name) {
        const isDiamond = diamondPatterns.some(pattern => 
          child.name.includes(pattern)
        );
        
        if (isDiamond) {
          console.log(`Making ${child.name} visible`);
          child.visible = true;
          setNodeVisibility(prev => ({ ...prev, [child.name]: true }));
          count++;
        }
      }
    });
    
    console.log(`Made ${count} diamond elements visible`);
  };

  const downloadSceneData = () => {
    const sceneData = {
      meshes: meshes.map((name, idx) => ({
        index: idx,
        name,
        visible: nodeVisibility[name] !== false,
        type: 'mesh'
      })),
      nodes: nodes.map((name, idx) => ({
        index: idx,
        name,
        visible: nodeVisibility[name] !== false,
        type: 'node'
      })),
      metadata: {
        totalMeshes: meshes.length,
        totalNodes: nodes.length,
        exportedAt: new Date().toISOString(),
      }
    };

    const blob = new Blob([JSON.stringify(sceneData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scene-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleMaterialChange = (material: Material) => {
    setChainConfig(
      updateLinkMaterial(chainConfig, 0, material),
    );
  };

  const handleSurfaceTypeChange = (type: SurfaceType) => {
    let newSurfaceConfig: SurfaceConfig = { type };

    // Add default properties based on type
    if (type === "gemstones" || type === "moissanites") {
      newSurfaceConfig = {
        type,
        gemstoneColors: createDefaultGemstoneColors(selectedSurface),
      };
    } else if (type === "enamel") {
      newSurfaceConfig = {
        type,
        enamelColor: "#ffffff",
      };
    } else if (type === "engraving") {
      newSurfaceConfig = {
        type,
        engravingDesign: "pattern1" as const,
      };
    }

    setChainConfig(
      updateSurface(
        chainConfig,
        0,
        selectedSurface,
        newSurfaceConfig,
      ),
    );
  };

  const handleGemstoneColorChange = (stoneKey: string, color: string) => {
    if (!currentSurfaceConfig?.gemstoneColors) return;

    let newGemstoneColors;
    if (stoneKey === "all") {
      // Set all gemstone colors to the same color
      newGemstoneColors = {
        stone1: color,
        stone2: color,
        ...(currentSurfaceConfig.gemstoneColors.stone3 && { stone3: color }),
      };
    } else {
      // Set specific gemstone color
      newGemstoneColors = {
        ...currentSurfaceConfig.gemstoneColors,
        [stoneKey]: color,
      };
    }

    const newSurfaceConfig = {
      ...currentSurfaceConfig,
      gemstoneColors: newGemstoneColors,
    };

    setChainConfig(
      updateSurface(
        chainConfig,
        0,
        selectedSurface,
        newSurfaceConfig,
      ),
    );
  };

  const handleEnamelColorChange = (color: string) => {
    const newSurfaceConfig = {
      ...currentSurfaceConfig,
      enamelColor: color,
    };

    setChainConfig(
      updateSurface(
        chainConfig,
        0,
        selectedSurface,
        newSurfaceConfig,
      ),
    );
  };

  const handleEngravingDesignChange = (design: "pattern1" | "pattern2") => {
    const newSurfaceConfig = {
      ...currentSurfaceConfig,
      engravingDesign: design,
    };

    setChainConfig(
      updateSurface(
        chainConfig,
        0,
        selectedSurface,
        newSurfaceConfig,
      ),
    );
  };

  const isTopSurface = selectedSurface === "top1" || selectedSurface === "top2";

  return (
    <Card className="w-80 h-full rounded-2xl border-r bg-card">
      <div className="h-full flex flex-col">
        {/* Single Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Material Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-2">
              <Palette className="w-3 h-3" />
              Material
            </Label>
            <Select
              value={currentLink?.material || "silver"}
              onValueChange={(value) => handleMaterialChange(value as Material)}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Select material..." />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="silver" className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 fill-gray-400 text-gray-400" />
                    Silver
                  </div>
                </SelectItem>
                <SelectItem value="gold" className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    Gold
                  </div>
                </SelectItem>
                <SelectItem value="grey" className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 fill-gray-600 text-gray-600" />
                    Grey
                  </div>
                </SelectItem>
                <SelectItem value="black" className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 fill-black text-black" />
                    Black
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Apply Inserts Checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox id="apply-inserts" className="w-4 h-4" />
            <Label htmlFor="apply-inserts" className="text-xs font-medium">
              Apply inserts
            </Label>
          </div>

          <Separator />

          {/* Diamonds Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-2">
              <Wrench className="w-3 h-3" />
              Diamonds
            </Label>
            <Select
              value={currentSurfaceConfig?.type || "empty"}
              onValueChange={(value) =>
                handleSurfaceTypeChange(value as SurfaceType)
              }
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Choose option..." />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem
                  value="gemstones"
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 fill-blue-400 text-blue-400" />
                    Diamonds
                  </div>
                </SelectItem>
                <SelectItem
                  value="moissanites"
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 fill-purple-400 text-purple-400" />
                    Moissanites
                  </div>
                </SelectItem>
                <SelectItem value="enamel" className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 fill-red-400 text-red-400" />
                    Enamel
                  </div>
                </SelectItem>
                <SelectItem
                  value="engraving"
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 fill-orange-400 text-orange-400" />
                    Engraving
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Test Buttons for Diamonds */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={addDiamonds}
                className="h-8 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Diamonds
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDiamonds}
                className="h-8 text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                Toggle
              </Button>
            </div>
          </div>

          {/* Conditional Options Based on Selection */}
          {currentSurfaceConfig?.type === "gemstones" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Diamond Options</Label>
              <div className="grid grid-cols-1 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs justify-start"
                  onClick={() => handleGemstoneColorChange("all", "#ffffff")}
                >
                  Colourless
                </Button>
              </div>
            </div>
          )}

          {currentSurfaceConfig?.type === "moissanites" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Moissanite Options</Label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { name: "Colourless", color: "#ffffff" },
                  { name: "Black", color: "#000000" },
                  { name: "Green", color: "#16a34a" },
                  { name: "Red", color: "#dc2626" },
                  { name: "Blue", color: "#2563eb" },
                  { name: "Yellow", color: "#eab308" },
                  { name: "Orange", color: "#ea580c" },
                  {
                    name: "Rainbow1",
                    color:
                      "linear-gradient(45deg, #ff0000, #ffa500, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)",
                  },
                  {
                    name: "Rainbow2",
                    color:
                      "linear-gradient(45deg, #ff1493, #00bfff, #32cd32, #ffd700, #ff4500)",
                  },
                ].map((option) => (
                  <Button
                    key={option.name}
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() =>
                      handleGemstoneColorChange("all", option.color)
                    }
                    style={
                      option.name.includes("Rainbow")
                        ? { background: option.color }
                        : {}
                    }
                  >
                    {option.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {currentSurfaceConfig?.type === "enamel" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Enamel Options</Label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { name: "Black", color: "#000000" },
                  { name: "White", color: "#ffffff" },
                  { name: "Green", color: "#16a34a" },
                  { name: "Red", color: "#dc2626" },
                  { name: "Blue", color: "#2563eb" },
                  { name: "Yellow", color: "#eab308" },
                  { name: "Orange", color: "#ea580c" },
                  { name: "Opal 1", color: "#b8b8ff" },
                  { name: "Opal 2", color: "#ffb8d1" },
                ].map((option) => (
                  <Button
                    key={option.name}
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs p-0"
                    style={{ backgroundColor: option.color }}
                    onClick={() => handleEnamelColorChange(option.color)}
                  />
                ))}
              </div>
            </div>
          )}

          {currentSurfaceConfig?.type === "engraving" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Engraving Options</Label>
              <div className="grid grid-cols-2 gap-1">
                {["Pattern 1", "Pattern 2"].map((pattern) => (
                  <Button
                    key={pattern}
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() =>
                      handleEngravingDesignChange(
                        pattern.toLowerCase().replace(" ", "") as
                          | "pattern1"
                          | "pattern2",
                      )
                    }
                  >
                    {pattern}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Apply to Sides Checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox id="apply-sides" className="w-4 h-4" />
            <Label htmlFor="apply-sides" className="text-xs font-medium">
              Apply to sides
            </Label>
          </div>

          <Separator />

          {/* Save/Load Configuration */}
          <div className="flex gap-1">
            <Button
              onClick={onSaveConfiguration}
              className="flex-1 h-7 text-xs"
              size="sm"
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
            <label className="flex-1">
              <Button className="w-full h-7 text-xs" size="sm" asChild>
                <span>
                  <Upload className="w-3 h-3 mr-1" />
                  Load
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={onLoadConfiguration}
                className="hidden"
              />
            </label>
          </div>

          <Separator />

          {/* Controls */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={autoRotate ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRotate?.(!autoRotate)}
                className="flex-1"
              >
                <RotateCw className="w-4 h-4 mr-1" />
                Rotate
              </Button>

              <Button
                variant={showDebug ? "default" : "outline"}
                size="sm"
                onClick={() => setShowDebug?.(!showDebug)}
                className="flex-1"
              >
                <Bug className="w-4 h-4 mr-1" />
                Debug
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCaptureImage}
                className="flex-1"
                disabled={isRecording}
              >
                <Camera className="w-4 h-4 mr-1" />
                Capture
              </Button>

              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={onStartRecording}
                className={`flex-1 ${isRecording ? "bg-red-500 hover:bg-red-600 text-white border-red-500 animate-pulse" : ""}`}
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
                    Record
                  </>
                )}
              </Button>
            </div>
          </div>

          {showDebug && (
            <>
              <Separator />
              
              {/* Scene Nodes/Meshes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <Box className="w-3 h-3" />
                    Scene Nodes ({meshes.length} meshes, {nodes.length} nodes)
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={downloadSceneData}
                    className="h-6 px-2"
                    title="Download scene data as JSON"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>

                {/* Auto-Grouped Mesh Links */}
                {meshGroups.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-1">
                      Auto-Grouped Links
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1 rounded border border-border/50 bg-muted/30 p-2">
                      {meshGroups.map((group) => {
                        const isGroupVisible = groupVisibility[group.linkIndex] !== false;
                        return (
                          <div key={`group-${group.linkIndex}`} className="space-y-1">
                            {/* Group Header */}
                            <div className="flex items-center justify-between rounded bg-primary/10 px-2 py-1.5 text-xs font-medium">
                              <span>
                                Link {group.linkIndex} ({group.meshes.length} meshes)
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleGroupVisibility(group.linkIndex)}
                                className="hover:bg-accent rounded p-1"
                                title={isGroupVisible ? "Hide all" : "Show all"}
                              >
                                {isGroupVisible ? (
                                  <Eye className="h-3 w-3 text-primary" />
                                ) : (
                                  <EyeOff className="h-3 w-3 text-muted-foreground/50" />
                                )}
                              </button>
                            </div>
                            {/* Individual Meshes in Group */}
                            {group.meshes.map((mesh, idx) => {
                              const isVisible = nodeVisibility[mesh] !== false;
                              return (
                                <div
                                  key={`group-${group.linkIndex}-mesh-${idx}`}
                                  className="flex items-center justify-between rounded bg-background/50 px-2 py-1 text-[11px] hover:bg-background/80 ml-2"
                                >
                                  <span className="truncate" title={mesh}>{mesh}</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleNodeVisibility(mesh)}
                                    className="hover:bg-accent rounded p-1"
                                    title={isVisible ? "Hide" : "Show"}
                                  >
                                    {isVisible ? (
                                      <Eye className="h-3 w-3 text-muted-foreground" />
                                    ) : (
                                      <EyeOff className="h-3 w-3 text-muted-foreground/50" />
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All Meshes (Flat View) */}
                <div className="max-h-64 overflow-y-auto space-y-1 rounded border border-border/50 bg-muted/30 p-2">
                  {meshes.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-1">All Meshes</div>
                      {meshes.map((mesh, idx) => {
                        const isVisible = nodeVisibility[mesh] !== false;
                        return (
                          <div
                            key={`mesh-${idx}`}
                            className="flex items-center justify-between rounded bg-background/50 px-2 py-1 text-xs hover:bg-background/80"
                          >
                            <span className="truncate" title={mesh}>{mesh}</span>
                            <button
                              type="button"
                              onClick={() => toggleNodeVisibility(mesh)}
                              className="hover:bg-accent rounded p-1"
                              title={isVisible ? "Hide" : "Show"}
                            >
                              {isVisible ? (
                                <Eye className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <EyeOff className="h-3 w-3 text-muted-foreground/50" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {nodes.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-1">Nodes</div>
                      {nodes.map((node, idx) => {
                        const isVisible = nodeVisibility[node] !== false;
                        return (
                          <div
                            key={`node-${idx}`}
                            className="flex items-center justify-between rounded bg-background/30 px-2 py-1 text-xs hover:bg-background/60"
                          >
                            <span className="truncate" title={node}>{node}</span>
                            <button
                              type="button"
                              onClick={() => toggleNodeVisibility(node)}
                              className="hover:bg-accent rounded p-1"
                              title={isVisible ? "Hide" : "Show"}
                            >
                              {isVisible ? (
                                <Eye className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <EyeOff className="h-3 w-3 text-muted-foreground/50" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
