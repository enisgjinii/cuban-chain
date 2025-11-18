"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Stage } from "@react-three/drei";
import { Suspense, useRef, useEffect, useState } from "react";
import { ModelViewer } from "@/components/model-viewer";
import { Button } from "@/components/ui/button";
import { Maximize2, Move3D, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

interface Mobile3DViewerProps {
  modelUrl: string;
  chainConfig: any;
  selectedLinkIndex: number;
  selectedSurface: any;
  meshes: string[];
  nodes: string[];
  selectedMesh: string | null;
  hoveredMesh: string | null;
  autoFitModel: boolean;
  chainSpacing: number;
  applyMode: boolean;
  undoCounter: number;
  autoRotate: boolean;
  showBoundingBox: boolean;
  showDebug: boolean;
  cameraPosition: { x: number; y: number; z: number };
  modelPosition: { x: number; y: number; z: number };
  setCameraPosition: (position: { x: number; y: number; z: number }) => void;
  setModelPosition: (position: { x: number; y: number; z: number }) => void;
  onMeshesAndNodesExtracted: (meshes: string[], nodes: string[]) => void;
  onSelectMesh: (mesh: string | null) => void;
  onHoverMesh: (mesh: string | null) => void;
  isRecording: boolean;
  isMobile: boolean;
  autoZoom: boolean;
  setAutoZoom: (zoom: boolean) => void;
}

export function Mobile3DViewer({
  modelUrl,
  chainConfig,
  selectedLinkIndex,
  selectedSurface,
  meshes,
  nodes,
  selectedMesh,
  hoveredMesh,
  autoFitModel,
  chainSpacing,
  applyMode,
  undoCounter,
  autoRotate,
  showBoundingBox,
  showDebug,
  cameraPosition,
  modelPosition,
  setCameraPosition,
  setModelPosition,
  onMeshesAndNodesExtracted,
  onSelectMesh,
  onHoverMesh,
  isRecording,
  isMobile,
  autoZoom,
  setAutoZoom,
}: Mobile3DViewerProps) {
  const cameraRef = useRef<any>(null);
  const [modelScale, setModelScale] = useState(1);

  // Auto-adjust model scale based on screen size
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      // Debounce resize events
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (isMobile && autoZoom) {
          const screenWidth = window.innerWidth;
          const screenHeight = window.innerHeight - 64; // Account for bottom nav
          const minDimension = Math.min(screenWidth, screenHeight);

          // Fixed scale values based on screen size - no cumulative changes
          let newScale = 1;
          if (minDimension < 350) {
            newScale = 0.7;
          } else if (minDimension < 450) {
            newScale = 0.8;
          } else if (minDimension < 550) {
            newScale = 0.9;
          }

          // Only update if scale is significantly different to prevent unnecessary re-renders
          setModelScale((prevScale) => {
            if (Math.abs(prevScale - newScale) > 0.05) {
              // Increased threshold for more stability
              return newScale;
            }
            return prevScale;
          });
        }
      }, 500); // Increased debounce to 500ms for more stability
    };

    // Only add resize listener if autoZoom is enabled
    if (autoZoom && isMobile) {
      handleResize();
      window.addEventListener("resize", handleResize);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [isMobile, autoZoom]);

  // Listen for manual reset events
  useEffect(() => {
    const handleResetScale = () => {
      setModelScale(1);
      setAutoZoom(false);
    };

    window.addEventListener("resetModelScale", handleResetScale);
    return () => {
      window.removeEventListener("resetModelScale", handleResetScale);
    };
  }, [setAutoZoom]);

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

      updateCameraPosition();

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

  const handleZoomIn = () => {
    setModelScale((prev) => Math.min(prev + 0.1, 2));
    setAutoZoom(false);
  };

  const handleZoomOut = () => {
    setModelScale((prev) => Math.max(prev - 0.1, 0.5));
    setAutoZoom(false);
  };

  const handleResetView = () => {
    setModelScale(1);
    setAutoZoom(true);
    if (cameraRef.current) {
      cameraRef.current.reset();
    }
  };

  return (
    <div
      className={`relative w-full h-full rounded-xl overflow-hidden transition-all duration-300 ${
        isRecording
          ? "border-4 border-red-500 animate-pulse shadow-red-500/50 shadow-lg"
          : ""
      }`}
    >
      <Canvas
        camera={{ position: [0.51, 1.25, 0.74], fov: isMobile ? 40 : 35 }}
        className="w-full h-full"
      >
        <Suspense fallback={null}>
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          <Stage environment="city" intensity={0.6} adjustCamera={autoZoom}>
            <ModelViewer
              url={modelUrl}
              chainConfig={chainConfig}
              selectedMesh={selectedMesh}
              hoveredMesh={hoveredMesh}
              autoFitModel={autoFitModel}
              chainSpacing={chainSpacing}
              applyMode={applyMode}
              undoCounter={undoCounter}
              autoRotate={autoRotate}
              showBoundingBox={showBoundingBox}
              selectedLinkIndex={selectedLinkIndex}
              isRecording={isRecording}
              onMeshesAndNodesExtracted={onMeshesAndNodesExtracted}
            />
          </Stage>

          <OrbitControls
            ref={cameraRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={1}
            minDistance={0.5}
            maxDistance={10}
            maxPolarAngle={Math.PI}
            minPolarAngle={0}
          />
        </Suspense>
      </Canvas>

      {/* Mobile Controls Overlay */}
      {isMobile && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <div className="bg-background/95 backdrop-blur-sm rounded-xl border border-border p-1 flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetView}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <Move3D className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Debug Info Overlay */}
      {showDebug && (
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-xl border border-black/50 p-3 text-xs font-mono text-green-400 max-w-xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-yellow-400">Mobile:</span>
              <span>{isMobile ? "Yes" : "No"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-400">Scale:</span>
              <span>{modelScale.toFixed(2)}x</span>
            </div>
            <div className="flex items-center">
              <Move3D className="w-3 h-3 mr-2 text-purple-400" />
              <span className="text-purple-400">Camera:</span>
              <span className="ml-2">
                [{cameraPosition.x}, {cameraPosition.y}, {cameraPosition.z}]
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-blue-400">Model:</span>
              <span className="ml-2">
                [{modelPosition.x}, {modelPosition.y}, {modelPosition.z}]
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-400">FOV:</span>
              <span>{isMobile ? 40 : 35}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-400">Auto Zoom:</span>
              <span>{autoZoom ? "On" : "Off"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
