"use client";

import type React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Stage } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { ModelViewer } from "@/components/model-viewer";
import { CustomizerPanel } from "@/components/customizer-panel";
import { Mobile3DViewer } from "@/components/mobile-3d-viewer";
import { ThemeToggle } from "@/components/theme-toggle";
import { ViewerControls, type ViewPreset } from "@/components/viewer-controls";
import { FavoritesPanel } from "@/components/favorites-panel";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { OnboardingTour } from "@/components/onboarding-tour";
import { ScreenshotModal, type ScreenshotOptions } from "@/components/screenshot-modal";
import { LoadingOverlay } from "@/components/loading-overlay";
import { toast } from "@/components/ui/toast";
import type { ChainConfig, SurfaceId } from "@/lib/chain-config-types";
import { createDefaultConfig, setChainLength } from "@/lib/chain-helpers";

// Default model URLs for initial chain
const DEFAULT_MODEL_URLS = [
  "/models/part1.glb",
  "/models/part3.glb",
  "/models/part4.glb",
  "/models/part5.glb",
  "/models/part6.glb",
  "/models/part7.glb",
];

// View preset camera positions
const VIEW_PRESET_POSITIONS: Record<ViewPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  front: { position: [0, 0, 2], target: [0, 0, 0] },
  back: { position: [0, 0, -2], target: [0, 0, 0] },
  top: { position: [0, 2, 0], target: [0, 0, 0] },
  left: { position: [-2, 0.5, 0], target: [0, 0, 0] },
  right: { position: [2, 0.5, 0], target: [0, 0, 0] },
  isometric: { position: [0.51, 1.25, 0.74], target: [0, 0, 0] },
};

export default function Home() {
  const [modelUrls, setModelUrls] = useState<string[]>(DEFAULT_MODEL_URLS);
  const [chainConfig, setChainConfig] = useState<ChainConfig>(createDefaultConfig(DEFAULT_MODEL_URLS.length));
  const [selectedSurface, setSelectedSurface] = useState<SurfaceId>("top1");
  const [selectedLinkIndex, setSelectedLinkIndex] = useState<number | null>(null);
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
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showScreenshotModal, setShowScreenshotModal] = useState<boolean>(false);
  const [cameraZoom, setCameraZoom] = useState<number>(1);
  const cameraRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const orbitControlsRef = useRef<any>(null);

  // Sync chain config length with model URLs
  useEffect(() => {
    if (chainConfig.chainLength !== modelUrls.length) {
      setChainConfig(createDefaultConfig(modelUrls.length));
    }
  }, [modelUrls.length]);

  // Reset selected link when chain changes significantly
  useEffect(() => {
    setSelectedLinkIndex(null);
  }, [modelUrls.length]);

  // Initial loading simulation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

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

  const handleSaveConfiguration = useCallback(() => {
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
    toast.success("Configuration saved!");
  }, [chainConfig, modelUrls]);

  const handleLoadConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          if (config.chainConfig) setChainConfig(config.chainConfig);
          if (config.modelUrls) setModelUrls(config.modelUrls);
          toast.success("Configuration loaded!");
        } catch (error) {
          console.error("Failed to load configuration:", error);
          toast.error("Failed to load configuration");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCaptureImage = useCallback(() => {
    setShowScreenshotModal(true);
  }, []);

  const handleScreenshotCapture = useCallback((options: ScreenshotOptions) => {
    window.dispatchEvent(new CustomEvent("captureImage", { detail: options }));
    toast.success("Screenshot captured!");
  }, []);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      setShowRecordingIndicator(false);
    } else {
      setIsRecording(true);
      setShowRecordingIndicator(true);
      setAutoRotate(true);
      toast.info("Recording started...");
    }
  }, [isRecording]);

  const handleRecordingComplete = useCallback((videoBlob: Blob) => {
    setIsRecording(false);
    setShowRecordingIndicator(false);
    setAutoRotate(false);

    const extension = videoBlob.type.includes("mp4") ? "mp4" : "webm";

    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chain-recording-${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Recording saved!");
  }, []);

  const handleMeshesAndNodesExtracted = (m: string[], n: string[]) => {
    setMeshes(m);
    setNodes(n);
  };

  const handleUndo = useCallback(() => {
    setUndoCounter((c) => c + 1);
    toast.info("Undo applied");
  }, []);

  const handleChainLengthChange = (length: number) => {
    if (length > modelUrls.length) {
      const toAdd = length - modelUrls.length;
      const newUrls = [...modelUrls];
      for (let i = 0; i < toAdd; i++) {
        const template = modelUrls.length > 0 ? modelUrls[modelUrls.length - 1] : "/models/part3.glb";
        newUrls.push(template);
      }
      setModelUrls(newUrls);
      setChainConfig(prev => setChainLength(prev, length));
    } else if (length < modelUrls.length) {
      const newUrls = modelUrls.slice(0, length);
      setModelUrls(newUrls);
      setChainConfig(prev => setChainLength(prev, length));
    }
  };

  const handleReplayAnimation = useCallback(() => {
    setAnimationKey((k) => k + 1);
    toast.info("Replaying animation...");
  }, []);

  const handleZoneClick = useCallback((linkIndex: number, surfaceId: SurfaceId) => {
    console.log(`Zone clicked: Link ${linkIndex}, Surface ${surfaceId}`);
    setSelectedLinkIndex(linkIndex);
    setSelectedSurface(surfaceId);
  }, []);

  // Viewer control handlers
  const handleZoomIn = useCallback(() => {
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current;
      controls.dollyIn(1.2);
      controls.update();
    }
    setCameraZoom(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current;
      controls.dollyOut(1.2);
      controls.update();
    }
    setCameraZoom(prev => Math.max(prev * 0.8, 0.3));
  }, []);

  const handleResetView = useCallback(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.reset();
    }
    setCameraZoom(1);
  }, []);

  const handleViewPreset = useCallback((preset: ViewPreset) => {
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current;
      const camera = controls.object;
      const presetData = VIEW_PRESET_POSITIONS[preset];

      if (presetData) {
        const startPosition = camera.position.clone();
        const startTarget = controls.target.clone();
        const endPosition = new THREE.Vector3(...presetData.position);
        const endTarget = new THREE.Vector3(...presetData.target);

        const duration = 500; // ms
        const startTime = performance.now();

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease out cubic for smooth deceleration
          const eased = 1 - Math.pow(1 - progress, 3);

          camera.position.lerpVectors(startPosition, endPosition, eased);
          controls.target.lerpVectors(startTarget, endTarget, eased);
          controls.update();

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      }
    }
    toast.info(`Switched to ${preset} view`);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  const handleLoadFavorite = useCallback((config: ChainConfig, urls: string[]) => {
    setChainConfig(config);
    setModelUrls(urls);
  }, []);

  const handleViewPresetNumber = useCallback((num: number) => {
    const presets: ViewPreset[] = ["front", "top", "left", "isometric"];
    if (num >= 1 && num <= 4) {
      handleViewPreset(presets[num - 1]);
    }
  }, [handleViewPreset]);

  return (
    <div className="relative min-h-screen w-full bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      {/* Loading Overlay */}
      <LoadingOverlay isLoading={isLoading} message="Loading your chain..." />

      {/* Onboarding Tour */}
      <OnboardingTour onComplete={() => toast.success("Welcome! Start customizing your chain.")} />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        onSave={handleSaveConfiguration}
        onUndo={handleUndo}
        onRotateToggle={() => setAutoRotate(!autoRotate)}
        onReplayAnimation={handleReplayAnimation}
        onViewPreset={handleViewPresetNumber}
        onCaptureImage={handleCaptureImage}
      />

      {/* Screenshot Modal */}
      <ScreenshotModal
        isOpen={showScreenshotModal}
        onClose={() => setShowScreenshotModal(false)}
        onCapture={handleScreenshotCapture}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6 flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-700 dark:text-gray-200">
          Design your Cuban chain
        </h1>
        <ThemeToggle />
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
              setCameraPosition={() => { }}
              setModelPosition={() => { }}
              onMeshesAndNodesExtracted={handleMeshesAndNodesExtracted}
              onSelectMesh={setSelectedMesh}
              onHoverMesh={setHoveredMesh}
              isRecording={isRecording}
              onRecordingComplete={handleRecordingComplete}
              isMobile={isMobile}
              autoZoom={autoZoom}
              setAutoZoom={setAutoZoom}
              selectedLinkIndex={selectedLinkIndex}
              onZoneClick={handleZoneClick}
            />
          ) : (
            <Canvas
              camera={{ position: [0.51, 1.25, 0.74], fov: 35, zoom: cameraZoom }}
              className="w-full h-full"
              gl={{ preserveDrawingBuffer: true }}
            >
              <Suspense fallback={null}>
                <Environment preset="city" />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <Stage environment="city" intensity={0.6} adjustCamera={autoZoom}>
                  <ModelViewer
                    key={animationKey}
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
                    onZoneClick={handleZoneClick}
                    selectedLinkIndex={selectedLinkIndex}
                  />
                </Stage>
                <OrbitControls
                  ref={orbitControlsRef}
                  makeDefault
                  enableRotate={true}
                  autoRotate={autoRotate}
                  autoRotateSpeed={1}
                />
              </Suspense>
            </Canvas>
          )}

          {/* Viewer Controls */}
          {!isMobile && (
            <ViewerControls
              autoRotate={autoRotate}
              setAutoRotate={setAutoRotate}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetView={handleResetView}
              onViewPreset={handleViewPreset}
              onFullscreen={handleFullscreen}
              className="absolute left-4 top-1/2 -translate-y-1/2"
            />
          )}

          {!isMobile && (
            <div className="absolute bottom-6 left-6 text-sm text-orange-500 dark:text-orange-400">
              After configuration, click &quot;Apply to&quot;, then click on the links
            </div>
          )}
        </div>

        <div
          className={`z-20 ${isMobile ? "w-full p-3 bg-gray-100 dark:bg-gray-950 pb-12" : "absolute top-20 right-6"
            }`}
        >
          <div className="space-y-4">

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
              onCaptureImage={handleCaptureImage}
              onStartRecording={handleToggleRecording}
              isRecording={isRecording}
              onChainLengthChange={handleChainLengthChange}
              onReplayAnimation={handleReplayAnimation}
            />



          </div>
        </div>
      </div>

      {isMobile && (
        <div className="fixed bottom-2 left-0 right-0 text-center text-xs text-orange-500 dark:text-orange-400 px-4 bg-gray-100 dark:bg-gray-950 py-1">
          After configuration, click &quot;Apply to&quot;, then click on the links
        </div>
      )}
    </div>
  );
}

