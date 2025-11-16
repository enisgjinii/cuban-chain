"use client"

import type React from "react"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Stage } from "@react-three/drei"
import { Suspense, useState } from "react"
import { ModelViewer } from "@/components/model-viewer"
import { CustomizerPanel } from "@/components/customizer-panel"
import { Button } from "@/components/ui/button"
import { Upload, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Home() {
  const [modelUrl, setModelUrl] = useState<string>("/models/Cuban-Link.glb")
  const [material, setMaterial] = useState("silver")
  const [color, setColor] = useState("#c0c0c0")
  const [metalness, setMetalness] = useState(0.8)
  const [roughness, setRoughness] = useState(0.2)
  const [applyInserts, setApplyInserts] = useState(false)
  const [insertType, setInsertType] = useState("diamonds")
  const [insertColor, setInsertColor] = useState("colorless")
  const [applyToSides, setApplyToSides] = useState(false)
  const [enamelColor, setEnamelColor] = useState("none")
  const [engraving, setEngraving] = useState("none")
  const [meshes, setMeshes] = useState<string[]>([])
  const [nodes, setNodes] = useState<string[]>([])
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null)
  const [hoveredMesh, setHoveredMesh] = useState<string | null>(null)
  const [chainCount, setChainCount] = useState<number>(12)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setModelUrl(url)
    }
  }

  const handleSaveConfiguration = () => {
    const config = {
      material,
      color,
      metalness,
      roughness,
      applyInserts,
      insertType,
      insertColor,
      applyToSides,
      enamelColor,
      engraving,
      chainCount,
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "model-configuration.json"
    a.click()
  }

  const handleMeshesAndNodesExtracted = (extractedMeshes: string[], extractedNodes: string[]) => {
    setMeshes(extractedMeshes)
    setNodes(extractedNodes)
  }

  const handleSelectMesh = (mesh: string | null) => {
    setSelectedMesh(mesh)
  }

  const handleHoverMesh = (mesh: string | null) => {
    setHoveredMesh(mesh)
  }

  const handleSetChainCount = (count: number) => {
    setChainCount(count)
  }

  const handleLoadConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string)
          setMaterial(config.material)
          setColor(config.color)
          setMetalness(config.metalness)
          setRoughness(config.roughness)
          setApplyInserts(config.applyInserts)
          setInsertType(config.insertType)
          setInsertColor(config.insertColor)
          setApplyToSides(config.applyToSides)
          setEnamelColor(config.enamelColor)
          setEngraving(config.engraving)
            if (config.chainCount) setChainCount(config.chainCount)
        } catch (error) {
          console.error("Error loading configuration:", error)
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-background">
      {/* Left side - 3D Viewer */}
      <div className="flex-1 relative h-[50vh] lg:h-full">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <label htmlFor="file-upload">
            <Button variant="outline" size="sm" className="cursor-pointer bg-transparent" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Upload Model</span>
                <span className="sm:hidden">Upload Test</span>
              </span>
            </Button>
          </label>
          <input id="file-upload" type="file" accept=".glb,.gltf" onChange={handleFileUpload} className="hidden" />

          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="sm">
                <Menu className="w-4 h-4 mr-2" />
                Customize
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 p-0 overflow-y-auto">
              <CustomizerPanel
                material={material}
                setMaterial={setMaterial}
                color={color}
                setColor={setColor}
                metalness={metalness}
                setMetalness={setMetalness}
                roughness={roughness}
                setRoughness={setRoughness}
                applyInserts={applyInserts}
                setApplyInserts={setApplyInserts}
                insertType={insertType}
                setInsertType={setInsertType}
                insertColor={insertColor}
                setInsertColor={setInsertColor}
                applyToSides={applyToSides}
                setApplyToSides={setApplyToSides}
                enamelColor={enamelColor}
                setEnamelColor={setEnamelColor}
                engraving={engraving}
                setEngraving={setEngraving}
                onSaveConfiguration={handleSaveConfiguration}
                onLoadConfiguration={handleLoadConfiguration}
                meshes={meshes}
                nodes={nodes}
                onSelectMesh={handleSelectMesh}
                onHoverMesh={handleHoverMesh}
              />
            </SheetContent>
          </Sheet>
        </div>

        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.6}>
              <ModelViewer
                url={modelUrl}
                color={color}
                material={material}
                metalness={metalness}
                roughness={roughness}
                onMeshesAndNodesExtracted={handleMeshesAndNodesExtracted}
                selectedMesh={selectedMesh}
                hoveredMesh={hoveredMesh}
                chainCount={chainCount}
              />
            </Stage>
            <OrbitControls makeDefault />
            <Environment preset="city" />
          </Suspense>
        </Canvas>
      </div>

      <div className="hidden lg:block">
        <CustomizerPanel
          material={material}
          setMaterial={setMaterial}
          color={color}
          setColor={setColor}
          metalness={metalness}
          setMetalness={setMetalness}
          roughness={roughness}
          setRoughness={setRoughness}
          applyInserts={applyInserts}
          setApplyInserts={setApplyInserts}
          insertType={insertType}
          setInsertType={setInsertType}
          insertColor={insertColor}
          setInsertColor={setInsertColor}
          applyToSides={applyToSides}
          setApplyToSides={setApplyToSides}
          enamelColor={enamelColor}
          setEnamelColor={setEnamelColor}
          engraving={engraving}
          setEngraving={setEngraving}
          onSaveConfiguration={handleSaveConfiguration}
          onLoadConfiguration={handleLoadConfiguration}
          meshes={meshes}
          nodes={nodes}
          onSelectMesh={handleSelectMesh}
          onHoverMesh={handleHoverMesh}
          chainCount={chainCount}
          setChainCount={handleSetChainCount}
        />
      </div>
    </div>
  )
}
