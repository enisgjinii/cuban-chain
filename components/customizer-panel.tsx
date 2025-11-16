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

interface CustomizerPanelProps {
  material: string
  setMaterial: (value: string) => void
  color: string
  setColor: (value: string) => void
  metalness: number
  setMetalness: (value: number) => void
  roughness: number
  setRoughness: (value: number) => void
  applyInserts: boolean
  setApplyInserts: (value: boolean) => void
  insertType: string
  setInsertType: (value: string) => void
  insertColor: string
  setInsertColor: (value: string) => void
  applyToSides: boolean
  setApplyToSides: (value: boolean) => void
  enamelColor: string
  setEnamelColor: (value: string) => void
  engraving: string
  setEngraving: (value: string) => void
  onSaveConfiguration: () => void
  onLoadConfiguration: (event: React.ChangeEvent<HTMLInputElement>) => void
  meshes: string[]
  nodes: string[]
  onSelectMesh: (mesh: string | null) => void
  onHoverMesh: (mesh: string | null) => void
  chainCount: number
  setChainCount: (value: number) => void
  chainSpacing?: number
  setChainSpacing?: (value: number) => void
  applyMode?: boolean
  setApplyMode?: (value: boolean) => void
  onUndo?: () => void
  autoFitModel: boolean
  setAutoFitModel: (value: boolean) => void
  isInSheet?: boolean
}

const materialOptions = [
  { name: "Silver", value: "silver", color: "#c0c0c0" },
  { name: "Gold", value: "gold", color: "#ffd700" },
  { name: "Grey", value: "grey", color: "#808080" },
  { name: "Black", value: "black", color: "#1a1a1a" },
]

const insertTypes = ["Diamonds", "Moissanites"]

const insertColorOptions = {
  diamonds: ["Colorless"],
  moissanites: ["Colorless", "Black", "Green", "Red", "Blue", "Yellow", "Orange", "Rainbow1", "Rainbow2"],
}

const enamelOptions = [
  { name: "None", value: "none" },
  { name: "Black", value: "black" },
  { name: "White", value: "white" },
  { name: "Green", value: "green" },
  { name: "Red", value: "red" },
  { name: "Blue", value: "blue" },
  { name: "Yellow", value: "yellow" },
  { name: "Orange", value: "orange" },
  { name: "Opal 1", value: "opal1" },
  { name: "Opal 2", value: "opal2" },
]

const engravingOptions = [
  { name: "None", value: "none" },
  { name: "Pattern 1", value: "pattern1" },
  { name: "Pattern 2", value: "pattern2" },
]

export function CustomizerPanel({
  material,
  setMaterial,
  color,
  setColor,
  metalness,
  setMetalness,
  roughness,
  setRoughness,
  applyInserts,
  setApplyInserts,
  insertType,
  setInsertType,
  insertColor,
  setInsertColor,
  applyToSides,
  setApplyToSides,
  enamelColor,
  setEnamelColor,
  engraving,
  setEngraving,
  onSaveConfiguration,
  onLoadConfiguration,
  meshes,
  nodes,
  onSelectMesh,
  onHoverMesh,
  chainCount,
  setChainCount,
  chainSpacing,
  setChainSpacing,
  applyMode,
  setApplyMode,
  autoFitModel,
  setAutoFitModel,
  isInSheet,
}: CustomizerPanelProps) {
  return (
    <Card className="w-full lg:w-96 h-full rounded-none border-l-0 lg:border-l border-t lg:border-t-0 border-r-0 border-b-0 bg-card overflow-y-auto">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Customizer</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Design your 3D model</p>
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

        {/* Meshes and Nodes List */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">After configuration, click "Apply" then select a link in the viewer or in this list. Click "Undo" to revert last.</p>
          <Label>Meshes</Label>
          <div className="space-y-1">
            {meshes.map((mesh, idx) => (
              <div
                key={`${mesh}-${idx}`}
                className="text-sm text-muted-foreground cursor-pointer hover:text-foreground hover:bg-accent p-1 rounded"
                onClick={() => onSelectMesh(mesh)}
                onMouseEnter={() => onHoverMesh(mesh)}
                onMouseLeave={() => onHoverMesh(null)}
              >
                {mesh}
              </div>
            ))}
          </div>
          <Label>Nodes</Label>
          <div className="space-y-1">
            {nodes.map((node, idx) => (
              <div
                key={`${node}-${idx}`}
                className="text-sm text-muted-foreground cursor-pointer hover:text-foreground hover:bg-accent p-1 rounded"
                onClick={() => onSelectMesh(node)}
                onMouseEnter={() => onHoverMesh(node)}
                onMouseLeave={() => onHoverMesh(null)}
              >
                {node}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Chain Controls */}
        <details className="border rounded bg-muted/5 p-2">
          <summary className="cursor-pointer font-semibold py-1 px-2">Chain Settings</summary>
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="chain-count">Links</Label>
              <span className="text-xs sm:text-sm text-muted-foreground">{chainCount}</span>
            </div>
            <Slider
              id="chain-count"
              min={1}
              max={64}
              step={1}
              value={[chainCount]}
              onValueChange={(value) => setChainCount(value[0])}
              className="w-full"
            />

            <div className="flex items-center justify-between">
              <Label htmlFor="chain-spacing">Spacing</Label>
              <span className="text-xs sm:text-sm text-muted-foreground">{Math.round((chainSpacing ?? 0.95) * 100)}%</span>
            </div>
            <Slider
              id="chain-spacing"
              min={0.5}
              max={1.5}
              step={0.01}
              value={[chainSpacing ?? 0.95]}
              onValueChange={(value) => setChainSpacing?.(value[0])}
              className="w-full"
            />

            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setApplyMode?.(true)}>Apply</Button>
              <Button variant="outline" className="flex-1" onClick={() => onUndo?.()}>Undo</Button>
            </div>
          </div>
        </details>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="chain-count">Chain Links</Label>
            <span className="text-xs sm:text-sm text-muted-foreground">{chainCount}</span>
          </div>
          <Slider
            id="chain-count"
            min={1}
            max={64}
            step={1}
            value={[chainCount]}
            onValueChange={(value) => setChainCount(value[0])}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Appearance */}
        <details className="border rounded bg-muted/5 p-2">
          <summary className="cursor-pointer font-semibold py-1 px-2">Appearance</summary>
          <div className="space-y-3 pt-2">
          <Label htmlFor="material">Select Material</Label>
          <Select
            value={material}
            onValueChange={(value) => {
              setMaterial(value)
              const selectedMaterial = materialOptions.find((m) => m.value === value)
              if (selectedMaterial) {
                setColor(selectedMaterial.color)
              }
            }}
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
        </details>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apply-inserts"
              checked={applyInserts}
              onCheckedChange={(checked) => setApplyInserts(checked as boolean)}
            />
            <Label htmlFor="apply-inserts" className="cursor-pointer">
              Apply Inserts
            </Label>
          </div>

          {applyInserts && (
            <>
              <div className="space-y-2 pl-6">
                <Label htmlFor="insert-type">Insert Type</Label>
                <Select
                  value={insertType}
                  onValueChange={(value) => {
                    setInsertType(value)
                    setInsertColor("colorless")
                  }}
                >
                  <SelectTrigger id="insert-type">
                    <SelectValue placeholder="Select insert type" />
                  </SelectTrigger>
                  <SelectContent>
                    {insertTypes.map((type) => (
                      <SelectItem key={type.toLowerCase()} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pl-6">
                <Label htmlFor="insert-color">Insert Color</Label>
                <Select value={insertColor} onValueChange={setInsertColor}>
                  <SelectTrigger id="insert-color">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {insertColorOptions[insertType as keyof typeof insertColorOptions]?.map((color) => (
                      <SelectItem key={color.toLowerCase()} value={color.toLowerCase()}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pl-6">
                <Checkbox
                  id="apply-to-sides"
                  checked={applyToSides}
                  onCheckedChange={(checked) => setApplyToSides(checked as boolean)}
                />
                <Label htmlFor="apply-to-sides" className="cursor-pointer text-sm">
                  Apply to Sides
                </Label>
              </div>
            </>
          )}
        </div>

        <Separator />

        <details className="border rounded bg-muted/5 p-2">
          <summary className="cursor-pointer font-semibold py-1 px-2">Enamel</summary>
          <div className="space-y-3 pt-2">
          <Label htmlFor="engraving">Engraving</Label>
          <Select value={engraving} onValueChange={setEngraving}>
            <SelectTrigger id="engraving">
              <SelectValue placeholder="Select engraving" />
            </SelectTrigger>
            <SelectContent>
              {engravingOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </details>

        <Separator />

        {/* Metalness Slider */}
        <details className="border rounded bg-muted/5 p-2">
          <summary className="cursor-pointer font-semibold py-1 px-2">Engraving</summary>
          <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="metalness">Metalness</Label>
            <span className="text-xs sm:text-sm text-muted-foreground">{Math.round(metalness * 100)}%</span>
          </div>
          <Slider
            id="metalness"
            min={0}
            max={1}
            step={0.01}
            value={[metalness]}
            onValueChange={(value) => setMetalness(value[0])}
            className="w-full"
          />
          </div>
        </details>

        {/* Roughness Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="roughness">Roughness</Label>
            <span className="text-xs sm:text-sm text-muted-foreground">{Math.round(roughness * 100)}%</span>
          </div>
          <Slider
            id="roughness"
            min={0}
            max={1}
            step={0.01}
            value={[roughness]}
            onValueChange={(value) => setRoughness(value[0])}
            className="w-full"
          />
        </div>

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

        <Separator />

        <div className="pt-2">
          <p className="text-xs text-muted-foreground text-center">
            Upload a .glb or .gltf file to customize your own 3D model
          </p>
        </div>
      </div>
    </Card>
  )
}
