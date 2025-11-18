"use client";

import type React from "react";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Stage } from "@react-three/drei";
import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { ModelViewer } from "@/components/model-viewer";
import { ModelLoading } from "@/components/model-loading";
import { CustomizerPanel } from "@/components/customizer-panel";
import { CompactSidebar } from "@/components/compact-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Mobile3DViewer } from "@/components/mobile-3d-viewer";
import { Button } from "@/components/ui/button";
import { Camera, Move3D, Copy, Menu, Video, VideoOff } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { ChainConfig, SurfaceId } from "@/lib/chain-config-types";
import { createDefaultConfig, setChainLength } from "@/lib/chain-helpers";

export default function Home() {
  const [modelUrl, setModelUrl] = useState<string>("/models/Cuban-Link.glb");
  const [chainConfig, setChainConfig] = useState<ChainConfig>(
    createDefaultConfig(12),
  );
  const [selectedLinkIndex, setSelectedLinkIndex] = useState<number>(0);
  const [selectedSurface, setSelectedSurface] = useState<SurfaceId>("top1");
  const [meshes, setMeshes] = useState<string[]>([]);
  const [nodes, setNodes] = useState<string[]>([]);
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null);
  const [hoveredMesh, setHoveredMesh] = useState<string | null>(null);
  const [autoFitModel, setAutoFitModel] = useState<boolean>(false);
  const [chainSpacing, setChainSpacing] = useState<number>(0.95);
  const [applyMode, setApplyMode] = useState<boolean>(false);
  const [undoCounter, setUndoCounter] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [autoZoom, setAutoZoom] = useState<boolean>(false);
  const [showBoundingBox, setShowBoundingBox] = useState<boolean>(false);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [cameraPosition, setCameraPosition] = useState({
    x: 0.51,
    y: 1.25,
    z: 0.74,
  });
  const [modelPosition, setModelPosition] = useState({ x: 0, y: 0, z: 0 });
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showRecordingIndicator, setShowRecordingIndicator] =
    useState<boolean>(false);
  const cameraRef = useRef<any>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 1024 ||
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
          ),
      );
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSaveConfiguration = () => {
    const config = {
      chainConfig,
      cameraPosition,
      modelPosition,
    };
    console.log("Configuration saved:", config);
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chain-configuration.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCaptureImage = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      // Store original context settings
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const originalFillStyle = ctx.fillStyle;
        const originalGlobalAlpha = ctx.globalAlpha;

        // Create a temporary canvas with white background
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");

        if (tempCtx) {
          // Fill with white background
          tempCtx.fillStyle = "#ffffff";
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

          // Draw the original canvas on top
          tempCtx.drawImage(canvas, 0, 0);

          // Convert to PNG and download
          tempCanvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `chain-capture-${Date.now()}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }, "image/png");
        }
      }
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setShowRecordingIndicator(true);
    setAutoRotate(true); // Enable auto-rotate during recording
  };

  const handleRecordingComplete = useCallback((videoBlob: Blob) => {
    setIsRecording(false);
    setShowRecordingIndicator(false);
    setAutoRotate(false); // Disable auto-rotate after recording

    // Download the video
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chain-recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const copyPositionData = () => {
    const data = {
      camera: cameraPosition,
      model: modelPosition,
      fov: 35,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("Position data copied to clipboard!");
  };

  const handleMeshesAndNodesExtracted = (
    extractedMeshes: string[],
    extractedNodes: string[],
  ) => {
    setMeshes(extractedMeshes);
    setNodes(extractedNodes);
  };

  const handleSelectMesh = (mesh: string | null) => {
    setSelectedMesh(mesh);
  };

  const handleHoverMesh = (mesh: string | null) => {
    setHoveredMesh(mesh);
  };

  // Track camera position changes
  useEffect(() => {
    if (cameraRef.current) {
      const updateCameraPosition = () => {
        if (cameraRef.current && cameraRef.current.object) {
          const pos = cameraRef.current.object.position;
          setCameraPosition({
            x: parseFloat(pos.x.toFixed(2)),
            y: parseFloat(pos.y.toFixed(2)),
            z: parseFloat(pos.z.toFixed(2)),
          });
        }
      };

      // Update position initially and on changes
      updateCameraPosition();

      // Listen to camera changes
      const controls = cameraRef.current;
      if (controls) {
        controls.addEventListener("change", updateCameraPosition);
      }

      return () => {
        if (controls) {
          controls.removeEventListener("change", updateCameraPosition);
        }
      };
    }
  }, [cameraRef.current]);

  const handleSetChainLength = (length: number) => {
    setChainConfig(setChainLength(chainConfig, length));
  };

  const handleLoadConfiguration = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          if (config.chainConfig) {
            setChainConfig(config.chainConfig);
          }
          if (config.modelUrl) {
            setModelUrl(config.modelUrl);
          }
        } catch (error) {
          console.error("Failed to load configuration:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLoadConfigurationClick = () => {
    // Trigger file input click
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const event = e as any;
      handleLoadConfiguration(event);
    };
    input.click();
  };

  return (
    <div className="relative mobile-height lg:h-screen w-full bg-background">
      {/* Floating Sidebar (Desktop) */}
      <div className="hidden lg:block absolute top-4 left-4 z-20">
        <CompactSidebar
          chainConfig={chainConfig}
          setChainConfig={setChainConfig}
          selectedLinkIndex={selectedLinkIndex}
          setSelectedLinkIndex={setSelectedLinkIndex}
          selectedSurface={selectedSurface}
          setSelectedSurface={setSelectedSurface}
          onSaveConfiguration={handleSaveConfiguration}
          onLoadConfiguration={handleLoadConfigurationClick}
          meshes={meshes}
          nodes={nodes}
          onSelectMesh={handleSelectMesh}
          onHoverMesh={handleHoverMesh}
          setChainLength={handleSetChainLength}
          chainSpacing={chainSpacing}
          setChainSpacing={setChainSpacing}
          onUndo={() => setUndoCounter((c) => c + 1)}
          autoRotate={autoRotate}
          setAutoRotate={setAutoRotate}
          showDebug={showDebug}
          setShowDebug={setShowDebug}
          onCaptureImage={handleCaptureImage}
          onStartRecording={handleStartRecording}
          isRecording={isRecording}
        />
      </div>

      {/* Mobile Menu Button - REMOVED */}

      {/* Full Screen 3D Viewer */}
      <div
        className={`relative w-full h-full lg:h-screen rounded-xl overflow-hidden transition-all duration-300 lg:pb-0 pb-16 ${
          isRecording
            ? "border-4 border-red-500 animate-pulse shadow-red-500/50 shadow-lg"
            : ""
        }`}
      >
        {isMobile ? (
          <Mobile3DViewer
            modelUrl={modelUrl}
            chainConfig={chainConfig}
            selectedLinkIndex={selectedLinkIndex}
            selectedSurface={selectedSurface}
            meshes={meshes}
            nodes={nodes}
            selectedMesh={selectedMesh}
            hoveredMesh={hoveredMesh}
            autoFitModel={autoFitModel}
            chainSpacing={chainSpacing}
            applyMode={applyMode}
            undoCounter={undoCounter}
            autoRotate={autoRotate}
            showBoundingBox={showBoundingBox}
            showDebug={showDebug}
            cameraPosition={cameraPosition}
            modelPosition={modelPosition}
            setCameraPosition={setCameraPosition}
            setModelPosition={setModelPosition}
            onMeshesAndNodesExtracted={handleMeshesAndNodesExtracted}
            onSelectMesh={handleSelectMesh}
            onHoverMesh={handleHoverMesh}
            isRecording={isRecording}
            isMobile={isMobile}
            autoZoom={autoZoom}
            setAutoZoom={setAutoZoom}
          />
        ) : (
          <Canvas
            camera={{ position: [0.51, 1.25, 0.74], fov: 35 }}
            className="w-full h-full"
            ref={cameraRef}
          >
            <Suspense fallback={null}>
              <Environment preset="city" />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />

              <Stage environment="city" intensity={0.6} adjustCamera={autoZoom}>
                <ModelViewer
                  url={modelUrl}
                  chainConfig={chainConfig}
                  onMeshesAndNodesExtracted={handleMeshesAndNodesExtracted}
                  selectedMesh={selectedMesh}
                  hoveredMesh={hoveredMesh}
                  chainSpacing={chainSpacing}
                  applyMode={applyMode}
                  undoCounter={undoCounter}
                  autoFitModel={autoFitModel}
                  showBoundingBox={showBoundingBox}
                  autoRotate={autoRotate}
                  selectedLinkIndex={selectedLinkIndex}
                  isRecording={isRecording}
                  onRecordingComplete={handleRecordingComplete}
                  showRecordingIndicator={showRecordingIndicator}
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

        {/* Debug Panel */}
        <div className="absolute top-4 right-4 z-10">
          {showDebug && (
            <div className="mt-2 p-3 bg-black/80 text-white rounded-2xl text-xs font-mono backdrop-blur-sm border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-green-400">Position Data</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyPositionData}
                  className="h-6 px-2 text-xs hover:bg-white/10"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center">
                  <Camera className="w-3 h-3 mr-2 text-blue-400" />
                  <span className="text-blue-400">Camera:</span>
                  <span className="ml-2">
                    [{cameraPosition.x}, {cameraPosition.y}, {cameraPosition.z}]
                  </span>
                </div>

                <div className="flex items-center">
                  <Move3D className="w-3 h-3 mr-2 text-purple-400" />
                  <span className="text-purple-400">Model:</span>
                  <span className="ml-2">
                    [{modelPosition.x}, {modelPosition.y}, {modelPosition.z}]
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="text-yellow-400">FOV:</span>
                  <span className="ml-2">35</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-white/20 text-green-400 text-xs">
                Click "Copy" to copy this data and share with developer
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        chainConfig={chainConfig}
        setChainConfig={setChainConfig}
        selectedLinkIndex={selectedLinkIndex}
        setSelectedLinkIndex={setSelectedLinkIndex}
        selectedSurface={selectedSurface}
        setSelectedSurface={setSelectedSurface}
        onSaveConfiguration={handleSaveConfiguration}
        onLoadConfiguration={handleLoadConfigurationClick}
        meshes={meshes}
        nodes={nodes}
        onSelectMesh={handleSelectMesh}
        onHoverMesh={handleHoverMesh}
        selectedMesh={selectedMesh}
        hoveredMesh={hoveredMesh}
        autoFitModel={autoFitModel}
        setAutoFitModel={setAutoFitModel}
        chainSpacing={chainSpacing}
        setChainSpacing={setChainSpacing}
        applyMode={applyMode}
        setApplyMode={setApplyMode}
        undoCounter={undoCounter}
        setUndoCounter={setUndoCounter}
        autoRotate={autoRotate}
        setAutoRotate={setAutoRotate}
        showBoundingBox={showBoundingBox}
        setShowBoundingBox={setShowBoundingBox}
        showDebug={showDebug}
        setShowDebug={setShowDebug}
        modelUrl={modelUrl}
        setModelUrl={setModelUrl}
        autoZoom={autoZoom}
        setAutoZoom={setAutoZoom}
        onCaptureImage={handleCaptureImage}
        onStartRecording={handleStartRecording}
        isRecording={isRecording}
        setIsRecording={setIsRecording}
        showRecordingIndicator={showRecordingIndicator}
        setShowRecordingIndicator={setShowRecordingIndicator}
        setChainLength={handleSetChainLength}
        onUndo={() => setUndoCounter((c) => c + 1)}
      />
    </div>
  );
}
