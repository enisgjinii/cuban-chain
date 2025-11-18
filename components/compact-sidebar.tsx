"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { SheetClose } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Palette, Settings, Wrench, RotateCw, Bug, Circle, Save, Upload, Video, VideoOff, Camera } from "lucide-react"
import type { ChainConfig, SurfaceId, Material, SurfaceType, SurfaceConfig } from "@/lib/chain-config-types"
import { updateLinkMaterial, updateSurface, getMaterialColor, createDefaultGemstoneColors } from "@/lib/chain-helpers"

interface CompactSidebarProps {
  chainConfig: ChainConfig
  setChainConfig: (config: ChainConfig) => void
  selectedLinkIndex: number
  setSelectedLinkIndex: (index: number) => void
  selectedSurface: SurfaceId
  setSelectedSurface: (surface: SurfaceId) => void
  meshes: string[]
  nodes: string[]
  selectedMesh?: string | null
  hoveredMesh?: string | null
  onSelectMesh?: (mesh: string | null) => void
  onHoverMesh?: (mesh: string | null) => void
  setChainLength: (length: number) => void
  chainSpacing?: number
  setChainSpacing?: (value: number) => void
  onUndo?: () => void
  onSaveConfiguration?: () => void
  onLoadConfiguration?: (event: React.ChangeEvent<HTMLInputElement>) => void
  autoRotate?: boolean
  setAutoRotate?: (value: boolean) => void
  showDebug?: boolean
  setShowDebug?: (value: boolean) => void
  onCaptureImage?: () => void
  onStartRecording?: () => void
  isRecording?: boolean
  isInSheet?: boolean
}

const surfaceTypeOptions: Array<{ name: string; value: SurfaceType }> = [
  { name: "Empty", value: "empty" },
  { name: "Gems", value: "gemstones" },
  { name: "Moissanites", value: "moissanites" },
  { name: "Enamel", value: "enamel" },
  { name: "Engrave", value: "engraving" },
]

const enamelColors = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#ffffff" },
  { name: "Red", value: "#dc2626" },
  { name: "Green", value: "#16a34a" },
  { name: "Blue", value: "#2563eb" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#ea580c" },
]

export function CompactSidebar({
  chainConfig,
  setChainConfig,
  selectedLinkIndex,
  setSelectedLinkIndex,
  selectedSurface,
  setSelectedSurface,
  meshes,
  nodes,
  selectedMesh,
  hoveredMesh,
  onSelectMesh,
  onHoverMesh,
  setChainLength,
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
}: CompactSidebarProps) {
  const currentLink = chainConfig.links[selectedLinkIndex]
  const currentSurfaceConfig = currentLink?.surfaces[selectedSurface]

  const handleMaterialChange = (material: Material) => {
    setChainConfig(updateLinkMaterial(chainConfig, selectedLinkIndex, material))
  }

  const handleSurfaceTypeChange = (type: SurfaceType) => {
    let newSurfaceConfig: SurfaceConfig = { type }

    // Add default properties based on type
    if (type === 'gemstones' || type === 'moissanites') {
      newSurfaceConfig = {
        type,
        gemstoneColors: createDefaultGemstoneColors(selectedSurface),
      }
    } else if (type === 'enamel') {
      newSurfaceConfig = {
        type,
        enamelColor: '#ffffff',
      }
    } else if (type === 'engraving') {
      newSurfaceConfig = {
        type,
        engravingDesign: 'pattern1' as const,
      }
    }

    setChainConfig(updateSurface(chainConfig, selectedLinkIndex, selectedSurface, newSurfaceConfig))
  }

  const handleGemstoneColorChange = (stoneKey: string, color: string) => {
    if (!currentSurfaceConfig?.gemstoneColors) return

    let newGemstoneColors
    if (stoneKey === 'all') {
      // Set all gemstone colors to the same color
      newGemstoneColors = {
        stone1: color,
        stone2: color,
        ...(currentSurfaceConfig.gemstoneColors.stone3 && { stone3: color }),
      }
    } else {
      // Set specific gemstone color
      newGemstoneColors = {
        ...currentSurfaceConfig.gemstoneColors,
        [stoneKey]: color,
      }
    }

    const newSurfaceConfig = {
      ...currentSurfaceConfig,
      gemstoneColors: newGemstoneColors,
    }

    setChainConfig(updateSurface(chainConfig, selectedLinkIndex, selectedSurface, newSurfaceConfig))
  }

  const handleEnamelColorChange = (color: string) => {
    const newSurfaceConfig = {
      ...currentSurfaceConfig,
      enamelColor: color,
    }

    setChainConfig(updateSurface(chainConfig, selectedLinkIndex, selectedSurface, newSurfaceConfig))
  }

  const handleEngravingDesignChange = (design: 'pattern1' | 'pattern2') => {
    const newSurfaceConfig = {
      ...currentSurfaceConfig,
      engravingDesign: design,
    }

    setChainConfig(updateSurface(chainConfig, selectedLinkIndex, selectedSurface, newSurfaceConfig))
  }

  const isTopSurface = selectedSurface === 'top1' || selectedSurface === 'top2'

  return (
    <Card className="w-80 h-full rounded-2xl border-r bg-card">
      <div className="h-full flex flex-col">
        {/* Single Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
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

          <Separator />

          {/* Material Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-2">
              <Palette className="w-3 h-3" />
              Material
            </Label>
            <Select value={currentLink?.material || "silver"} onValueChange={(value) => handleMaterialChange(value as Material)}>
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
            <Label htmlFor="apply-inserts" className="text-xs font-medium">Apply inserts</Label>
          </div>

          <Separator />

          {/* Diamonds Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-2">
              <Wrench className="w-3 h-3" />
              Diamonds
            </Label>
            <Select value={currentSurfaceConfig?.type || "empty"} onValueChange={(value) => handleSurfaceTypeChange(value as SurfaceType)}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Choose option..." />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="gemstones" className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 fill-blue-400 text-blue-400" />
                    Diamonds
                  </div>
                </SelectItem>
                <SelectItem value="moissanites" className="flex items-center gap-2">
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
                <SelectItem value="engraving" className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 fill-orange-400 text-orange-400" />
                    Engraving
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Options Based on Selection */}
          {currentSurfaceConfig?.type === 'gemstones' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Diamond Options</Label>
              <div className="grid grid-cols-1 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs justify-start"
                  onClick={() => handleGemstoneColorChange('all', '#ffffff')}
                >
                  Colourless
                </Button>
              </div>
            </div>
          )}

          {currentSurfaceConfig?.type === 'moissanites' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Moissanite Options</Label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { name: 'Colourless', color: '#ffffff' },
                  { name: 'Black', color: '#000000' },
                  { name: 'Green', color: '#16a34a' },
                  { name: 'Red', color: '#dc2626' },
                  { name: 'Blue', color: '#2563eb' },
                  { name: 'Yellow', color: '#eab308' },
                  { name: 'Orange', color: '#ea580c' },
                  { name: 'Rainbow1', color: 'linear-gradient(45deg, #ff0000, #ffa500, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)' },
                  { name: 'Rainbow2', color: 'linear-gradient(45deg, #ff1493, #00bfff, #32cd32, #ffd700, #ff4500)' },
                ].map((option) => (
                  <Button
                    key={option.name}
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => handleGemstoneColorChange('all', option.color)}
                    style={option.name.includes('Rainbow') ? { background: option.color } : {}}
                  >
                    {option.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {currentSurfaceConfig?.type === 'enamel' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Enamel Options</Label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { name: 'Black', color: '#000000' },
                  { name: 'White', color: '#ffffff' },
                  { name: 'Green', color: '#16a34a' },
                  { name: 'Red', color: '#dc2626' },
                  { name: 'Blue', color: '#2563eb' },
                  { name: 'Yellow', color: '#eab308' },
                  { name: 'Orange', color: '#ea580c' },
                  { name: 'Opal 1', color: '#b8b8ff' },
                  { name: 'Opal 2', color: '#ffb8d1' },
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

          {currentSurfaceConfig?.type === 'engraving' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Engraving Options</Label>
              <div className="grid grid-cols-2 gap-1">
                {['Pattern 1', 'Pattern 2'].map((pattern) => (
                  <Button
                    key={pattern}
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => handleEngravingDesignChange(pattern.toLowerCase().replace(' ', '') as 'pattern1' | 'pattern2')}
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
            <Label htmlFor="apply-sides" className="text-xs font-medium">Apply to sides</Label>
          </div>

          <Separator />

          {/* Save/Load Configuration */}
          <div className="flex gap-1">
            <Button onClick={onSaveConfiguration} className="flex-1 h-7 text-xs" size="sm">
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
              <input type="file" accept=".json" onChange={onLoadConfiguration} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </Card>
  )
}
