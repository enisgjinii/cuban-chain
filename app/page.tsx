"use client";

import type React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Stage } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useState, useRef, useCallback, useEffect } from "react";
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Tooltip,
  Paper,
} from "@mui/material";
import {
  ZoomIn,
  ZoomOut,
  RestartAlt,
  PlayArrow,
  Pause,
  Fullscreen,
  Visibility,
  ViewInAr,
  ArrowUpward,
  ArrowBack,
  ArrowForward,
} from "@mui/icons-material";

import { ModelViewer } from "@/components/model-viewer";
import { CustomizerPanel } from "@/components/customizer-panel";
import { ScreenshotModal, type ScreenshotOptions } from "@/components/screenshot-modal";
import { LoadingOverlay } from "@/components/loading-overlay";
import type { ChainConfig, SurfaceId } from "@/lib/chain-config-types";
import { createDefaultConfig, setChainLength } from "@/lib/chain-helpers";

// ─── Constants ────────────────────────────────────────────────────
const SIDEBAR_WIDTH = 380;

const DEFAULT_MODEL_URLS = [
  "/models/part1.glb",
  "/models/part3.glb",
  "/models/part4.glb",
  "/models/part5.glb",
  "/models/part6.glb",
  "/models/part7.glb",
];

type ViewPreset = "front" | "back" | "top" | "left" | "right" | "isometric";

const VIEW_PRESET_POSITIONS: Record<
  ViewPreset,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  front: { position: [0, 0, 2], target: [0, 0, 0] },
  back: { position: [0, 0, -2], target: [0, 0, 0] },
  top: { position: [0, 2, 0], target: [0, 0, 0] },
  left: { position: [-2, 0.5, 0], target: [0, 0, 0] },
  right: { position: [2, 0.5, 0], target: [0, 0, 0] },
  isometric: { position: [0.51, 1.25, 0.74], target: [0, 0, 0] },
};

const VIEW_PRESETS: { id: ViewPreset; label: string; icon: React.ReactNode }[] = [
  { id: "front", label: "Front", icon: <Visibility sx={{ fontSize: 18 }} /> },
  { id: "top", label: "Top", icon: <ArrowUpward sx={{ fontSize: 18 }} /> },
  { id: "left", label: "Left", icon: <ArrowBack sx={{ fontSize: 18 }} /> },
  { id: "right", label: "Right", icon: <ArrowForward sx={{ fontSize: 18 }} /> },
  { id: "isometric", label: "3D", icon: <ViewInAr sx={{ fontSize: 18 }} /> },
];

// ─── Page ─────────────────────────────────────────────────────────
export default function Home() {
  const [modelUrls, setModelUrls] = useState<string[]>(DEFAULT_MODEL_URLS);
  const [chainConfig, setChainConfig] = useState<ChainConfig>(
    createDefaultConfig(DEFAULT_MODEL_URLS.length)
  );
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
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showRecordingIndicator, setShowRecordingIndicator] = useState<boolean>(false);
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState<boolean>(false);
  const [cameraZoom, setCameraZoom] = useState<number>(1);
  const [background, setBackground] = useState<any>("city");
  const [showViewPresets, setShowViewPresets] = useState(false);

  const sceneRef = useRef<any>(null);
  const orbitControlsRef = useRef<any>(null);

  // Sync chain config length with model URLs
  useEffect(() => {
    if (chainConfig.chainLength !== modelUrls.length) {
      setChainConfig(createDefaultConfig(modelUrls.length));
    }
  }, [modelUrls.length]);

  useEffect(() => {
    setSelectedLinkIndex(null);
  }, [modelUrls.length]);

  // ─── Handlers ───────────────────────────────────────────────────
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
        } catch (error) {
          console.error("Failed to load configuration:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleScreenshotCapture = useCallback((options: ScreenshotOptions) => {
    window.dispatchEvent(new CustomEvent("captureImage", { detail: options }));
  }, []);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      setShowRecordingIndicator(false);
    } else {
      setIsRecording(true);
      setShowRecordingIndicator(true);
      setAutoRotate(true);
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
  }, []);

  const handleMeshesAndNodesExtracted = (m: string[], n: string[]) => {
    setMeshes(m);
    setNodes(n);
  };

  const handleUndo = useCallback(() => setUndoCounter((c) => c + 1), []);

  const handleChainLengthChange = (length: number) => {
    if (length < 1) return;
    if (length > modelUrls.length) {
      const newUrls = [...modelUrls];
      for (let i = 0; i < length - modelUrls.length; i++) {
        newUrls.push(modelUrls.length > 0 ? modelUrls[modelUrls.length - 1] : "/models/part3.glb");
      }
      setModelUrls(newUrls);
      setChainConfig((prev) => setChainLength(prev, length));
    } else if (length < modelUrls.length) {
      setModelUrls(modelUrls.slice(0, length));
      setChainConfig((prev) => setChainLength(prev, length));
    }
  };

  const handleReplayAnimation = useCallback(() => setAnimationKey((k) => k + 1), []);

  const handleZoneClick = useCallback((linkIndex: number, surfaceId: SurfaceId) => {
    setSelectedLinkIndex(linkIndex);
    setSelectedSurface(surfaceId);
  }, []);

  const handleLoadFavorite = useCallback((config: ChainConfig, urls: string[]) => {
    setChainConfig(config);
    setModelUrls(urls);
  }, []);

  // Camera helpers
  const handleZoomIn = useCallback(() => {
    orbitControlsRef.current?.dollyIn(1.2);
    orbitControlsRef.current?.update();
    setCameraZoom((z) => Math.min(z * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    orbitControlsRef.current?.dollyOut(1.2);
    orbitControlsRef.current?.update();
    setCameraZoom((z) => Math.max(z * 0.8, 0.3));
  }, []);

  const handleResetView = useCallback(() => {
    orbitControlsRef.current?.reset();
    setCameraZoom(1);
  }, []);

  const handleViewPreset = useCallback((preset: ViewPreset) => {
    if (!orbitControlsRef.current) return;
    const controls = orbitControlsRef.current;
    const camera = controls.object;
    const presetData = VIEW_PRESET_POSITIONS[preset];
    if (!presetData) return;

    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const endPosition = new THREE.Vector3(...presetData.position);
    const endTarget = new THREE.Vector3(...presetData.target);
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(startPosition, endPosition, eased);
      controls.target.lerpVectors(startTarget, endTarget, eased);
      controls.update();
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }, []);

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", bgcolor: "background.default" }}>
      {/* Loading */}
      <LoadingOverlay isLoading={isLoading} message="Loading your chain..." />

      {/* Screenshot Modal */}
      <ScreenshotModal
        isOpen={showScreenshotModal}
        onClose={() => setShowScreenshotModal(false)}
        onCapture={handleScreenshotCapture}
      />

      {/* ─── Canvas Area ───────────────────────────────────── */}
      <Box className="canvas-wrapper">
        <Canvas
          gl={{ preserveDrawingBuffer: true }}
          camera={{ position: [0.51, 1.25, 0.74], fov: 35, zoom: cameraZoom }}
          style={{ width: "100%", height: "100%" }}
        >
          <Suspense fallback={null}>
            <Environment preset={background} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <Stage environment={background} intensity={0.6} adjustCamera={autoZoom}>
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
              enableRotate
              autoRotate={autoRotate}
              autoRotateSpeed={1}
            />
          </Suspense>
        </Canvas>

        {/* ─── Floating Viewer Toolbar (bottom-left) ───── */}
        <Paper
          elevation={4}
          sx={{
            position: "absolute",
            left: 16,
            bottom: 16,
            display: "flex",
            flexDirection: "row",
            gap: 0.5,
            p: 0.75,
            borderRadius: 3,
            bgcolor: "rgba(20,20,20,0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Tooltip title="Zoom In" arrow>
            <IconButton size="small" onClick={handleZoomIn} sx={{ color: "text.secondary" }}>
              <ZoomIn fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out" arrow>
            <IconButton size="small" onClick={handleZoomOut} sx={{ color: "text.secondary" }}>
              <ZoomOut fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box sx={{ width: "1px", bgcolor: "divider", mx: 0.5 }} />

          {/* View Presets */}
          <Box sx={{ position: "relative" }}>
            <Tooltip title="View Angles" arrow>
              <IconButton
                size="small"
                onClick={() => setShowViewPresets(!showViewPresets)}
                sx={{
                  color: showViewPresets ? "primary.main" : "text.secondary",
                  bgcolor: showViewPresets ? "rgba(212,160,23,0.1)" : "transparent",
                }}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            {showViewPresets && (
              <Paper
                elevation={8}
                sx={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  mb: 1,
                  display: "flex",
                  gap: 0.5,
                  p: 0.5,
                  borderRadius: 2,
                  bgcolor: "rgba(20,20,20,0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {VIEW_PRESETS.map((p) => (
                  <Tooltip key={p.id} title={p.label} arrow>
                    <IconButton
                      size="small"
                      onClick={() => { handleViewPreset(p.id); setShowViewPresets(false); }}
                      sx={{ color: "text.secondary" }}
                    >
                      {p.icon}
                    </IconButton>
                  </Tooltip>
                ))}
              </Paper>
            )}
          </Box>

          <Box sx={{ width: "1px", bgcolor: "divider", mx: 0.5 }} />

          <Tooltip title={autoRotate ? "Stop Rotation" : "Auto Rotate"} arrow>
            <IconButton
              size="small"
              onClick={() => setAutoRotate(!autoRotate)}
              sx={{
                color: autoRotate ? "primary.main" : "text.secondary",
                bgcolor: autoRotate ? "rgba(212,160,23,0.1)" : "transparent",
              }}
            >
              {autoRotate ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Reset View" arrow>
            <IconButton size="small" onClick={handleResetView} sx={{ color: "text.secondary" }}>
              <RestartAlt fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Fullscreen" arrow>
            <IconButton size="small" onClick={handleFullscreen} sx={{ color: "text.secondary" }}>
              <Fullscreen fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>

        {/* Brand watermark */}
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            top: 16,
            left: 20,
            fontWeight: 700,
            letterSpacing: "0.04em",
            background: "linear-gradient(135deg, #d4a017, #ffd700)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "1rem",
            userSelect: "none",
          }}
        >
          Cuban Chain Studio
        </Typography>
      </Box>

      {/* ─── Sidebar Drawer ────────────────────────────────── */}
      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            boxSizing: "border-box",
            bgcolor: "background.paper",
            borderLeft: "1px solid",
            borderColor: "divider",
          },
        }}
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
          isMobile={false}
          onCaptureImage={() => setShowScreenshotModal(true)}
          onStartRecording={handleToggleRecording}
          isRecording={isRecording}
          onChainLengthChange={handleChainLengthChange}
          onReplayAnimation={handleReplayAnimation}
          onLoadFavorite={handleLoadFavorite}
          background={background}
          setBackground={setBackground}
        />
      </Drawer>
    </Box>
  );
}
