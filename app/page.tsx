"use client";

import type React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Stage } from "@react-three/drei";
import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { ModelViewer } from "@/components/model-viewer";
import { CustomizerPanel } from "@/components/customizer-panel";
import { Mobile3DViewer } from "@/components/mobile-3d-viewer";
import type { ChainConfig, SurfaceId } from "@/lib/chain-config-types";
import { createDefaultConfig } from "@/lib/chain-helpers";

// Default model URLs for initial chain
const DEFAULT_MODEL_URLS = [
  "/models/part1.glb",
  "/models/part3.glb",
  "/models/part4.glb",
  "/models/part5.glb",
  "/models/part6.glb",
  "/models/part7.glb",
];

export default function Home() {
  const [modelUrls, setModelUrls] = useState<string[]>(DEFAULT_MODEL_URLS);
  const [chainConfig, setChainConfig] = useState<ChainConfig>(createDefaultConfig(DEFAULT_MODEL_URLS.length));
  const [selectedSurface, setSelectedSurface] = useState<SurfaceId>("top1");
  const [meshes, setMeshes] = useState<string[]>([]);
  const [nodes, setNodes] = useState<string[]>([]);
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null);
  const [hoveredMesh, setHoveredMesh] = useState<string | null>(null);
  const [chainSpacing, setChainSpacing] = useState<number>(0.3);
  const [undoCounter, setUndoCounter] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [autoZoom, setAutoZoom] = useState<boolean>(false);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showRecordingIndicator, setShowRecordingIndicator] = useState<boolean>(false);
  const cameraRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);

  // Sync chain config length with model URLs
  useEffect(() => {
    if (chainConfig.chainLength !== modelUrls.length) {
      setChainConfig(createDefaultConfig(modelUrls.length));
    }
  }, [modelUrls.length]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 ||
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSaveConfiguration = () => {
    const config = { chainConfig, modelUrls };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chain-configuration.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          if (config.chainConfig) setChainConfig(config.chainConfig);
          if (config.modelUrls) setModelUrls(config.modelUrls);
        } catch (error) {
          console.error("Failed to load configuration:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRecordingComplete = useCallback((videoBlob: Blob) => {
    setIsRecording(false);
    setShowRecordingIndicator(false);
    setAutoRotate(false);
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chain-recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleMeshesAndNodesExtracted = (m: string[], n: string[]) => {
    setMeshes(m);
    setNodes(n);
  };

  const handleUndo = () => {
    setUndoCounter((c) => c + 1);
  };

  return (
    <div className="relative min-h-screen w-full bg-gray-100">
      <div className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-700">
          Design your Cuban chain
        </h1>
      </div>

      <div className={`flex h-screen ${isMobile ? "flex-col" : "flex-row"}`}>
        <div className={`relative ${isMobile ? "flex-1 min-h-[45vh]" : "flex-1"}`}>
          {isMobile ? (
            <Mobile3DViewer
              modelUrls={modelUrls}
              chainConfig={chainConfig}
              selectedSurface={selectedSurface}
              meshes={meshes}
              nodes={nodes}
              selectedMesh={selectedMesh}
              hoveredMesh={hoveredMesh}
              autoFitModel={false}
              chainSpacing={chainSpacing}
              applyMode={false}
              undoCounter={undoCounter}
              autoRotate={autoRotate}
              showBoundingBox={false}
              showDebug={showDebug}
              cameraPosition={{ x: 0.51, y: 1.25, z: 0.74 }}
              modelPosition={{ x: 0, y: 0, z: 0 }}
              setCameraPosition={() => {}}
              setModelPosition={() => {}}
              onMeshesAndNodesExtracted={handleMeshesAndNodesExtracted}
              onSelectMesh={setSelectedMesh}
              onHoverMesh={setHoveredMesh}
              isRecording={isRecording}
              isMobile={isMobile}
              autoZoom={autoZoom}
              setAutoZoom={setAutoZoom}
            />
          ) : (
            <Canvas
              camera={{ position: [0.51, 1.25, 0.74], fov: 35 }}
              className="w-full h-full"
            >
              <Suspense fallback={null}>
                <Environment preset="city" />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <Stage environment="city" intensity={0.6} adjustCamera={autoZoom}>
                  <ModelViewer
                    urls={modelUrls}
                    chainConfig={chainConfig}
                    onMeshesAndNodesExtracted={handleMeshesAndNodesExtracted}
                    selectedMesh={selectedMesh}
                    hoveredMesh={hoveredMesh}
                    chainSpacing={chainSpacing}
                    applyMode={false}
                    undoCounter={undoCounter}
                    autoFitModel={false}
                    showBoundingBox={false}
                    autoRotate={autoRotate}
                    isRecording={isRecording}
                    onRecordingComplete={handleRecordingComplete}
                    showRecordingIndicator={showRecordingIndicator}
                    sceneRef={sceneRef}
                  />
                </Stage>
                <OrbitControls
                  ref={cameraRef}
                  makeDefault
                  enableRotate={true}
                  autoRotate={autoRotate}
                  autoRotateSpeed={1}
                />
              </Suspense>
            </Canvas>
          )}

          {!isMobile && (
            <div className="absolute bottom-6 left-6 text-sm text-orange-500">
              After configuration, click &quot;Apply to&quot;, then click on the links
            </div>
          )}
        </div>

        <div
          className={`z-20 ${
            isMobile ? "w-full p-3 bg-gray-100 pb-12" : "absolute top-20 right-6"
          }`}
        >
          <CustomizerPanel
            chainConfig={chainConfig}
            setChainConfig={setChainConfig}
            selectedSurface={selectedSurface}
            setSelectedSurface={setSelectedSurface}
            onSaveConfiguration={handleSaveConfiguration}
            onLoadConfiguration={handleLoadConfiguration}
            meshes={meshes}
            nodes={nodes}
            onSelectMesh={setSelectedMesh}
            onHoverMesh={setHoveredMesh}
            chainSpacing={chainSpacing}
            setChainSpacing={setChainSpacing}
            onUndo={handleUndo}
            autoRotate={autoRotate}
            setAutoRotate={setAutoRotate}
            showDebug={showDebug}
            setShowDebug={setShowDebug}
            modelUrls={modelUrls}
            setModelUrls={setModelUrls}
            isMobile={isMobile}
          />
        </div>
      </div>

      {isMobile && (
        <div className="fixed bottom-2 left-0 right-0 text-center text-xs text-orange-500 px-4 bg-gray-100 py-1">
          After configuration, click &quot;Apply to&quot;, then click on the links
        </div>
      )}
    </div>
  );
}
