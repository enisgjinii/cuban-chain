"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { SheetClose } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Upload, Settings, Palette, Wrench, RotateCw, Bug, Circle } from "lucide-react"
import type { ChainConfig, SurfaceId, Material, SurfaceType, SurfaceConfig } from "@/lib/chain-config-types"
import { updateLinkMaterial, updateSurface, getMaterialColor, createDefaultGemstoneColors } from "@/lib/chain-helpers"

interface CustomizerPanelProps {
  chainConfig: ChainConfig
  setChainConfig: (config: ChainConfig) => void
  selectedLinkIndex: number
  setSelectedLinkIndex: (index: number) => void
  selectedSurface: SurfaceId
  setSelectedSurface: (surface: SurfaceId) => void
  onSaveConfiguration: () => void
  onLoadConfiguration: (event: React.ChangeEvent<HTMLInputElement>) => void
  meshes: string[]
  nodes: string[]
  onSelectMesh: (mesh: string | null) => void
  onHoverMesh: (mesh: string | null) => void
  setChainLength: (length: number) => void
  chainSpacing?: number
  setChainSpacing?: (value: number) => void
  onUndo?: () => void
  autoRotate?: boolean
  setAutoRotate?: (value: boolean) => void
  showDebug?: boolean
  setShowDebug?: (value: boolean) => void
  isInSheet?: boolean
}

const surfaceTypeOptions: Array<{ name: string; value: SurfaceType }> = [
  { name: "Empty", value: "empty" },
  { name: "Gemstones", value: "gemstones" },
  { name: "Moissanites", value: "moissanites" },
  { name: "Enamel", value: "enamel" },
  { name: "Engraving", value: "engraving" },
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

export function CustomizerPanel({
  chainConfig,
  setChainConfig,
  selectedLinkIndex,
  setSelectedLinkIndex,
  selectedSurface,
  setSelectedSurface,
  onSaveConfiguration,
  onLoadConfiguration,
  meshes,
  nodes,
  onSelectMesh,
  onHoverMesh,
  setChainLength,
  chainSpacing,
  setChainSpacing,
  onUndo,
  autoRotate,
  setAutoRotate,
  showDebug,
  setShowDebug,
  isInSheet = false,
}: CustomizerPanelProps) {
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
    <Card className="w-full lg:w-96 h-full rounded-none lg:rounded-r-2xl border-0 lg:border lg:border-l-0 bg-card/95 backdrop-blur-sm lg:shadow-2xl overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Tabs Content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="customize" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
              <TabsTrigger value="customize" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">
                <Palette className="w-4 h-4 mr-2" />
                Customize
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="advanced" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">
                <Wrench className="w-4 h-4 mr-2" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customize" className="p-4 sm:p-6 space-y-4 sm:space-y-6 mt-0">
              {/* Controls */}
              <div className="flex gap-2">
                <Button
                  variant={autoRotate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRotate?.(!autoRotate)}
                  className="flex-1"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                
                <Button
                  variant={showDebug ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowDebug?.(!showDebug)}
                  className="flex-1"
                >
                  <Bug className="w-4 h-4" />
                </Button>
              </div>

              <Separator />

              {/* Material Selection */}
              <div className="space-y-3">
                <Label htmlFor="material-select" className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Select Material
                </Label>
                <Select value={currentLink?.material || "silver"} onValueChange={(value) => handleMaterialChange(value as Material)}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Choose material..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="silver" className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 fill-gray-400 text-gray-400" />
                        Silver
                      </div>
                    </SelectItem>
                    <SelectItem value="gold" className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        Gold
                      </div>
                    </SelectItem>
                    <SelectItem value="grey" className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 fill-gray-600 text-gray-600" />
                        Grey
                      </div>
                    </SelectItem>
                    <SelectItem value="black" className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 fill-black text-black" />
                        Black
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Apply Inserts Checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox id="apply-inserts" className="w-5 h-5" />
                <Label htmlFor="apply-inserts" className="text-sm font-medium">Apply inserts</Label>
              </div>

              <Separator />

              {/* Diamonds Selection */}
              <div className="space-y-3">
                <Label htmlFor="diamonds-select" className="text-sm font-semibold flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Diamonds
                </Label>
                <Select value={currentSurfaceConfig?.type || "empty"} onValueChange={(value) => handleSurfaceTypeChange(value as SurfaceType)}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Choose option..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="gemstones" className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 fill-blue-400 text-blue-400" />
                        Diamonds
                      </div>
                    </SelectItem>
                    <SelectItem value="moissanites" className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 fill-purple-400 text-purple-400" />
                        Moissanites
                      </div>
                    </SelectItem>
                    <SelectItem value="enamel" className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 fill-red-400 text-red-400" />
                        Enamel
                      </div>
                    </SelectItem>
                    <SelectItem value="engraving" className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 fill-orange-400 text-orange-400" />
                        Engraving
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Options Based on Selection */}
              {currentSurfaceConfig?.type === 'gemstones' && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Diamond Options</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 justify-start"
                      onClick={() => handleGemstoneColorChange('all', '#ffffff')}
                    >
                      Colourless
                    </Button>
                  </div>
                </div>
              )}

              {currentSurfaceConfig?.type === 'moissanites' && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Moissanite Options</Label>
                  <div className="grid grid-cols-3 gap-2">
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
                        className="h-8 text-xs"
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
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Enamel Options</Label>
                  <div className="grid grid-cols-3 gap-2">
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
                        className="h-8 p-0"
                        style={{ backgroundColor: option.color }}
                        onClick={() => handleEnamelColorChange(option.color)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {currentSurfaceConfig?.type === 'engraving' && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Engraving Options</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Pattern 1', 'Pattern 2'].map((pattern) => (
                      <Button
                        key={pattern}
                        variant="outline"
                        size="sm"
                        className="h-8"
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
                <Checkbox id="apply-sides" className="w-5 h-5" />
                <Label htmlFor="apply-sides" className="text-sm font-medium">Apply to sides</Label>
              </div>

              <Separator />

              {/* Save/Load Configuration */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Configuration</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={onSaveConfiguration} className="flex-1 h-9">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <label htmlFor="load-config" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full h-9 cursor-pointer" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Load
                      </span>
                    </Button>
                    <input id="load-config" type="file" accept=".json" onChange={onLoadConfiguration} className="hidden" />
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="p-4 sm:p-6 space-y-4 sm:space-y-6 mt-0">
              <div className="space-y-4">
                              </div>

              <Separator />

              {chainSpacing !== undefined && setChainSpacing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="chain-spacing" className="text-sm font-semibold">Link Spacing</Label>
                    <span className="text-xs sm:text-sm font-medium text-primary">{Math.round(chainSpacing * 100)}%</span>
                  </div>
                  <Slider
                    id="chain-spacing"
                    min={0.5}
                    max={1.5}
                    step={0.01}
                    value={[chainSpacing]}
                    onValueChange={(value) => setChainSpacing(value[0])}
                    className="w-full"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="p-4 sm:p-6 space-y-4 sm:space-y-6 mt-0">
              {meshes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Model Components</Label>
                    <span className="text-xs text-muted-foreground">{meshes.length + nodes.length} items</span>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-2 bg-muted/20">
                    {meshes.slice(0, 20).map((mesh, idx) => (
                      <div
                        key={`${mesh}-${idx}`}
                        className="text-xs text-muted-foreground cursor-pointer hover:text-foreground hover:bg-accent p-2 rounded transition-colors"
                        onClick={() => onSelectMesh(mesh)}
                        onMouseEnter={() => onHoverMesh(mesh)}
                        onMouseLeave={() => onHoverMesh(null)}
                      >
                        {mesh}
                      </div>
                    ))}
                    {meshes.length > 20 && (
                      <p className="text-xs text-muted-foreground italic p-2">... and {meshes.length - 20} more</p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/20">
          {isInSheet ? (
            <SheetClose asChild>
              <Button size="sm" className="w-full">Done</Button>
            </SheetClose>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              Customize each link's material and surfaces
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
