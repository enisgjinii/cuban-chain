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
import { Save, Upload } from "lucide-react"
import type { ChainConfig, SurfaceId, Material, SurfaceType } from "@/lib/chain-config-types"
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
  applyMode?: boolean
  setApplyMode?: (value: boolean) => void
  onUndo?: () => void
  autoFitModel: boolean
  setAutoFitModel: (value: boolean) => void
  isInSheet?: boolean
}

const materialOptions: Array<{ name: string; value: Material; color: string }> = [
  { name: "Silver", value: "silver", color: "#c0c0c0" },
  { name: "Grey", value: "grey", color: "#808080" },
  { name: "Black", value: "black", color: "#1a1a1a" },
  { name: "White", value: "white", color: "#f5f5f5" },
  { name: "Gold", value: "gold", color: "#ffd700" },
]

const surfaceTypeOptions: Array<{ name: string; value: SurfaceType }> = [
  { name: "Empty", value: "empty" },
  { name: "Gemstones", value: "gemstones" },
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
  applyMode,
  setApplyMode,
  autoFitModel,
  setAutoFitModel,
  isInSheet,
}: CustomizerPanelProps) {
  const currentLink = chainConfig.links[selectedLinkIndex]
  const currentSurfaceConfig = currentLink?.surfaces[selectedSurface]

  const handleMaterialChange = (material: Material) => {
    setChainConfig(updateLinkMaterial(chainConfig, selectedLinkIndex, material))
  }

  const handleSurfaceTypeChange = (type: SurfaceType) => {
    let newSurfaceConfig = { type }

    // Add default properties based on type
    if (type === 'gemstones') {
      newSurfaceConfig = {
        ...newSurfaceConfig,
        gemstoneColors: createDefaultGemstoneColors(selectedSurface),
      }
    } else if (type === 'enamel') {
      newSurfaceConfig = {
        ...newSurfaceConfig,
        enamelColor: '#ffffff',
      }
    } else if (type === 'engraving') {
      newSurfaceConfig = {
        ...newSurfaceConfig,
        engravingDesign: 'pattern1' as const,
      }
    }

    setChainConfig(updateSurface(chainConfig, selectedLinkIndex, selectedSurface, newSurfaceConfig))
  }

  const handleGemstoneColorChange = (stoneKey: string, color: string) => {
    if (!currentSurfaceConfig?.gemstoneColors) return

    const newSurfaceConfig = {
      ...currentSurfaceConfig,
      gemstoneColors: {
        ...currentSurfaceConfig.gemstoneColors,
        [stoneKey]: color,
      },
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
    <Card className="w-full lg:w-96 h-full rounded-none border-l-0 lg:border-l border-t lg:border-t-0 border-r-0 border-b-0 bg-card overflow-y-auto">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Chain Customizer</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Design each link individually</p>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox id="auto-fit" checked={autoFitModel} onCheckedChange={(checked) => setAutoFitModel(checked as boolean)} />
            <Label htmlFor="auto-fit" className="cursor-pointer">
              Auto-fit model to view
            </Label>
          </div>
        </div>

        <Separator />

        {/* Chain Length Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="chain-length">Chain Links</Label>
            <span className="text-xs sm:text-sm text-muted-foreground">{chainConfig.chainLength}</span>
          </div>
          <Slider
            id="chain-length"
            min={1}
            max={64}
            step={1}
            value={[chainConfig.chainLength]}
            onValueChange={(value) => setChainLength(value[0])}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Link Selector */}
        <div className="space-y-3">
          <Label htmlFor="link-selector">Select Link to Customize</Label>
          <Select
            value={selectedLinkIndex.toString()}
            onValueChange={(value) => setSelectedLinkIndex(parseInt(value))}
          >
            <SelectTrigger id="link-selector">
              <SelectValue placeholder="Select link" />
            </SelectTrigger>
            <SelectContent>
              {chainConfig.links.map((_, index) => (
                <SelectItem key={index} value={index.toString()}>
                  Link {index + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Material Selector for Current Link */}
        <div className="space-y-3">
          <Label htmlFor="material">Link Material</Label>
          <Select
            value={currentLink?.material}
            onValueChange={(value) => handleMaterialChange(value as Material)}
          >
            <SelectTrigger id="material">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {materialOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Surface Selector */}
        <div className="space-y-3">
          <Label>Select Surface</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={selectedSurface === 'top1' ? 'default' : 'outline'}
              onClick={() => setSelectedSurface('top1')}
              className="w-full"
            >
              Top 1
            </Button>
            <Button
              variant={selectedSurface === 'top2' ? 'default' : 'outline'}
              onClick={() => setSelectedSurface('top2')}
              className="w-full"
            >
              Top 2
            </Button>
            <Button
              variant={selectedSurface === 'side1' ? 'default' : 'outline'}
              onClick={() => setSelectedSurface('side1')}
              className="w-full"
            >
              Side 1
            </Button>
            <Button
              variant={selectedSurface === 'side2' ? 'default' : 'outline'}
              onClick={() => setSelectedSurface('side2')}
              className="w-full"
            >
              Side 2
            </Button>
          </div>
        </div>

        <Separator />

        {/* Surface Type Selector */}
        <div className="space-y-3">
          <Label htmlFor="surface-type">Surface Type</Label>
          <Select
            value={currentSurfaceConfig?.type}
            onValueChange={(value) => handleSurfaceTypeChange(value as SurfaceType)}
          >
            <SelectTrigger id="surface-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {surfaceTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conditional Controls Based on Surface Type */}
        {currentSurfaceConfig?.type === 'gemstones' && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label>Gemstone Colors</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stone1" className="text-sm">Stone 1</Label>
                  <input
                    id="stone1"
                    type="color"
                    value={currentSurfaceConfig.gemstoneColors?.stone1 || '#ffffff'}
                    onChange={(e) => handleGemstoneColorChange('stone1', e.target.value)}
                    className="w-12 h-8 rounded border cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="stone2" className="text-sm">Stone 2</Label>
                  <input
                    id="stone2"
                    type="color"
                    value={currentSurfaceConfig.gemstoneColors?.stone2 || '#ffffff'}
                    onChange={(e) => handleGemstoneColorChange('stone2', e.target.value)}
                    className="w-12 h-8 rounded border cursor-pointer"
                  />
                </div>
                {isTopSurface && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stone3" className="text-sm">Stone 3</Label>
                    <input
                      id="stone3"
                      type="color"
                      value={currentSurfaceConfig.gemstoneColors?.stone3 || '#ffffff'}
                      onChange={(e) => handleGemstoneColorChange('stone3', e.target.value)}
                      className="w-12 h-8 rounded border cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {currentSurfaceConfig?.type === 'enamel' && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label htmlFor="enamel-color">Enamel Color</Label>
              <div className="flex flex-wrap gap-2">
                {enamelColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleEnamelColorChange(color.value)}
                    className={`w-10 h-10 rounded-full border-2 ${currentSurfaceConfig.enamelColor === color.value
                        ? 'border-primary ring-2 ring-primary/50'
                        : 'border-muted'
                      }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {currentSurfaceConfig?.type === 'engraving' && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label htmlFor="engraving-design">Engraving Pattern</Label>
              <Select
                value={currentSurfaceConfig.engravingDesign}
                onValueChange={(value) => handleEngravingDesignChange(value as 'pattern1' | 'pattern2')}
              >
                <SelectTrigger id="engraving-design">
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pattern1">Pattern 1 (Diagonal Lines)</SelectItem>
                  <SelectItem value="pattern2">Pattern 2 (Crosshatch)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <Separator />

        {/* Chain Spacing */}
        {chainSpacing !== undefined && setChainSpacing && (
          <details className="border rounded bg-muted/5 p-2">
            <summary className="cursor-pointer font-semibold py-1 px-2">Advanced Settings</summary>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="chain-spacing">Link Spacing</Label>
                <span className="text-xs sm:text-sm text-muted-foreground">{Math.round(chainSpacing * 100)}%</span>
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
          </details>
        )}

        <Separator />

        {/* Mesh/Node List for debugging */}
        {meshes.length > 0 && (
          <details className="border rounded bg-muted/5 p-2">
            <summary className="cursor-pointer font-semibold py-1 px-2">Model Components ({meshes.length + nodes.length})</summary>
            <div className="space-y-2 pt-2 max-h-48 overflow-y-auto">
              {meshes.slice(0, 10).map((mesh, idx) => (
                <div
                  key={`${mesh}-${idx}`}
                  className="text-xs text-muted-foreground cursor-pointer hover:text-foreground hover:bg-accent p-1 rounded"
                  onClick={() => onSelectMesh(mesh)}
                  onMouseEnter={() => onHoverMesh(mesh)}
                  onMouseLeave={() => onHoverMesh(null)}
                >
                  {mesh}
                </div>
              ))}
              {meshes.length > 10 && (
                <p className="text-xs text-muted-foreground italic">... and {meshes.length - 10} more</p>
              )}
            </div>
          </details>
        )}

        <Separator />

        <div className="space-y-3">
          <Label>Configuration</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" onClick={onSaveConfiguration} className="flex-1 bg-transparent">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <label htmlFor="load-config" className="flex-1">
              <Button variant="outline" size="sm" className="w-full cursor-pointer bg-transparent" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Load
                </span>
              </Button>
            </label>
            <input id="load-config" type="file" accept=".json" onChange={onLoadConfiguration} className="hidden" />
          </div>
        </div>

        <Separator />

        {isInSheet ? (
          <div className="flex items-center justify-center">
            <SheetClose asChild>
              <Button size="sm">Done</Button>
            </SheetClose>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <Button size="sm">Done</Button>
          </div>
        )}

        <div className="pt-2">
          <p className="text-xs text-muted-foreground text-center">
            Customize each link's material and surfaces independently
          </p>
        </div>
      </div>
    </Card>
  )
}
