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
import type { ChainConfig, SurfaceId } from "@/lib/chain-config-types"
import { createDefaultConfig, setChainLength } from "@/lib/chain-helpers"

export default function Home() {
  const [modelUrl, setModelUrl] = useState<string>("/models/Cuban-Link.glb")
  const [chainConfig, setChainConfig] = useState<ChainConfig>(createDefaultConfig(12))
  const [selectedLinkIndex, setSelectedLinkIndex] = useState<number>(0)
  const [selectedSurface, setSelectedSurface] = useState<SurfaceId>('top1')
  const [meshes, setMeshes] = useState<string[]>([])
  const [nodes, setNodes] = useState<string[]>([])
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null)
  const [hoveredMesh, setHoveredMesh] = useState<string | null>(null)
  const [autoFitModel, setAutoFitModel] = useState<boolean>(false)
  const [chainSpacing, setChainSpacing] = useState<number>(0.95)
  const [applyMode, setApplyMode] = useState<boolean>(false)
  const [undoCounter, setUndoCounter] = useState<number>(0)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setModelUrl(url)
    }
  }

  const handleSaveConfiguration = () => {
    const config = {
      chainConfig,
      chainSpacing,
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "cuban-chain-configuration.json"
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

  const handleSetChainLength = (length: number) => {
    setChainConfig(setChainLength(chainConfig, length))
  }

  const handleLoadConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string)
          if (config.chainConfig) {
            setChainConfig(config.chainConfig)
          }
          if (config.chainSpacing) {
            setChainSpacing(config.chainSpacing)
          }
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
          autoFitModel={autoFitModel}

          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="sm">
                <Menu className="w-4 h-4 mr-2" />
                Customize
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 p-0 overflow-y-auto">
              <CustomizerPanel
                chainConfig={chainConfig}
                setChainConfig={setChainConfig}
                selectedLinkIndex={selectedLinkIndex}
                setSelectedLinkIndex={setSelectedLinkIndex}
                selectedSurface={selectedSurface}
                setSelectedSurface={setSelectedSurface}
                onSaveConfiguration={handleSaveConfiguration}
                onLoadConfiguration={handleLoadConfiguration}
                meshes={meshes}
                nodes={nodes}
                onSelectMesh={handleSelectMesh}
                onHoverMesh={handleHoverMesh}
                setChainLength={handleSetChainLength}
                chainSpacing={chainSpacing}
                setChainSpacing={setChainSpacing}
                applyMode={applyMode}
                setApplyMode={setApplyMode}
                onUndo={() => setUndoCounter((c) => c + 1)}
                autoFitModel={autoFitModel}
                setAutoFitModel={setAutoFitModel}
                isInSheet={true}
              />
            </SheetContent>
          </Sheet>
        </div>

        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            {/* When autoFitModel is true stage will auto-adjust camera to fit model */}
            <ModelViewer
              url={modelUrl}
              chainConfig={chainConfig}
              onMeshesAndNodesExtracted={handleMeshesAndNodesExtracted}
              selectedMesh={selectedMesh}
              hoveredMesh={hoveredMesh}
              chainSpacing={chainSpacing}
              applyMode={applyMode}
              setApplyMode={setApplyMode}
              undoCounter={undoCounter}
              autoFitModel={autoFitModel}
            />

            <OrbitControls makeDefault />
          </Suspense>
        </Canvas>
      </div>

      <div className="hidden lg:block">
        <CustomizerPanel
          chainConfig={chainConfig}
          setChainConfig={setChainConfig}
          selectedLinkIndex={selectedLinkIndex}
          setSelectedLinkIndex={setSelectedLinkIndex}
          selectedSurface={selectedSurface}
          setSelectedSurface={setSelectedSurface}
          onSaveConfiguration={handleSaveConfiguration}
          onLoadConfiguration={handleLoadConfiguration}
          meshes={meshes}
          nodes={nodes}
          onSelectMesh={handleSelectMesh}
          onHoverMesh={handleHoverMesh}
          setChainLength={handleSetChainLength}
          chainSpacing={chainSpacing}
          setChainSpacing={setChainSpacing}
          applyMode={applyMode}
          setApplyMode={setApplyMode}
          onUndo={() => setUndoCounter((c) => c + 1)}
          autoFitModel={autoFitModel}
          setAutoFitModel={setAutoFitModel}
          isInSheet={false}
        />
      </div>
    </div>
  )
}
