"use client";

import type React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Stage, GizmoHelper, GizmoViewport, Grid, Stats } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Fab,
  SwipeableDrawer,
  Snackbar,
  Alert,
  Slide,
  Divider,
  useMediaQuery,
  useTheme,
  Slider,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
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
  DarkMode,
  LightMode,
  GridOn,
  GridOff,
  Speed,
  FitScreen,
  Tune,
  Close,
  CameraAlt,
  Videocam,
  Stop as StopIcon,
  Share,
  Casino,
  ContentCopy,
  ContentPaste,
  RestartAltOutlined,
  CompareArrows,
  History,
  VisibilityOff,
  KeyboardAlt,
  HelpOutline,
  Download,
  Upload,
  Undo,
  Redo,
  SettingsBackupRestore,
  SwapHoriz,
  Info,
  Scale,
  MoreVert,
} from "@mui/icons-material";

import { useThemeMode } from "@/components/mui-theme-registry";
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

// Weight estimation per material (grams per link)
const MATERIAL_WEIGHTS: Record<string, number> = {
  silver: 8.5,
  gold: 15.2,
  grey: 7.8,
  black: 9.1,
  white: 8.0,
};

// Recent designs storage key
const RECENT_DESIGNS_KEY = "cuban-chain-recent-designs";

// ─── Snackbar Transition ──────────────────────────────────────────
function SlideTransition(props: any) {
  return <Slide {...props} direction="up" />;
}

// ─── Page ─────────────────────────────────────────────────────────
export default function Home() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const isTablet = useMediaQuery(muiTheme.breakpoints.between("md", "lg"));
  const { mode, toggleTheme } = useThemeMode();

  // ─── Core State ────────────────────────────────────────────────
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

  // ─── New Feature State ─────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [showViewPresets, setShowViewPresets] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(1);
  const [cameraFov, setCameraFov] = useState(35);
  const [hideUI, setHideUI] = useState(false);
  const [clipboardLink, setClipboardLink] = useState<any>(null);
  const [undoStack, setUndoStack] = useState<ChainConfig[]>([]);
  const [redoStack, setRedoStack] = useState<ChainConfig[]>([]);
  const [showSpeedSlider, setShowSpeedSlider] = useState(false);
  const [showFovSlider, setShowFovSlider] = useState(false);

  // ─── Snackbar State ────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });

  const showToast = useCallback(
    (message: string, severity: "success" | "error" | "info" | "warning" = "info") => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  const sceneRef = useRef<any>(null);
  const orbitControlsRef = useRef<any>(null);

  // ─── Sync & Effects ────────────────────────────────────────────
  useEffect(() => {
    if (chainConfig.chainLength !== modelUrls.length) {
      setChainConfig(createDefaultConfig(modelUrls.length));
    }
  }, [modelUrls.length]);

  useEffect(() => {
    setSelectedLinkIndex(null);
  }, [modelUrls.length]);

  // Close sidebar on mobile when switching to mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  // ─── Undo/Redo with Config Tracking ────────────────────────────
  const pushUndo = useCallback(
    (prevConfig: ChainConfig) => {
      setUndoStack((prev) => [...prev.slice(-19), prevConfig]);
      setRedoStack([]);
    },
    []
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, chainConfig]);
    setUndoStack((u) => u.slice(0, -1));
    setChainConfig(prev);
    showToast("Undone", "info");
  }, [undoStack, chainConfig, showToast]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, chainConfig]);
    setRedoStack((r) => r.slice(0, -1));
    setChainConfig(next);
    showToast("Redone", "info");
  }, [redoStack, chainConfig, showToast]);

  const setChainConfigWithUndo = useCallback(
    (newConfig: ChainConfig) => {
      pushUndo(chainConfig);
      setChainConfig(newConfig);
    },
    [chainConfig, pushUndo]
  );

  // ─── Chain Weight Estimator ────────────────────────────────────
  const chainWeight = useMemo(() => {
    let weight = 0;
    chainConfig.links.forEach((link) => {
      weight += MATERIAL_WEIGHTS[link.material] || 8;
    });
    return weight;
  }, [chainConfig]);

  // ─── Handlers ──────────────────────────────────────────────────
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
    showToast("Configuration saved!", "success");

    // Save to recent designs
    try {
      const recent = JSON.parse(localStorage.getItem(RECENT_DESIGNS_KEY) || "[]");
      recent.unshift({
        id: Date.now(),
        name: `Design ${new Date().toLocaleDateString()}`,
        chainConfig,
        modelUrls,
        timestamp: Date.now(),
      });
      localStorage.setItem(RECENT_DESIGNS_KEY, JSON.stringify(recent.slice(0, 10)));
    } catch {}
  }, [chainConfig, modelUrls, showToast]);

  const handleLoadConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          if (config.chainConfig) {
            pushUndo(chainConfig);
            setChainConfig(config.chainConfig);
          }
          if (config.modelUrls) setModelUrls(config.modelUrls);
          showToast("Configuration loaded!", "success");
        } catch (error) {
          showToast("Failed to load configuration", "error");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleScreenshotCapture = useCallback(
    (options: ScreenshotOptions) => {
      window.dispatchEvent(new CustomEvent("captureImage", { detail: options }));
      showToast("Screenshot captured!", "success");
    },
    [showToast]
  );

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      setShowRecordingIndicator(false);
      showToast("Recording stopped", "info");
    } else {
      setIsRecording(true);
      setShowRecordingIndicator(true);
      setAutoRotate(true);
      showToast("Recording started…", "info");
    }
  }, [isRecording, showToast]);

  const handleRecordingComplete = useCallback(
    (videoBlob: Blob) => {
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
      showToast("Recording saved!", "success");
    },
    [showToast]
  );

  const handleMeshesAndNodesExtracted = useCallback((m: string[], n: string[]) => {
    setMeshes(m);
    setNodes(n);
  }, []);

  const handleEntranceComplete = useCallback(() => {}, []);

  const handleChainLengthChange = useCallback(
    (length: number) => {
      if (length < 1) return;
      pushUndo(chainConfig);
      if (length > modelUrls.length) {
        const newUrls = [...modelUrls];
        for (let i = 0; i < length - modelUrls.length; i++) {
          newUrls.push(
            modelUrls.length > 0 ? modelUrls[modelUrls.length - 1] : "/models/part3.glb"
          );
        }
        setModelUrls(newUrls);
        setChainConfig((prev) => setChainLength(prev, length));
      } else if (length < modelUrls.length) {
        setModelUrls(modelUrls.slice(0, length));
        setChainConfig((prev) => setChainLength(prev, length));
      }
      showToast(`Chain length: ${length} links`, "info");
    },
    [chainConfig, modelUrls, pushUndo, showToast]
  );

  const handleReplayAnimation = useCallback(() => {
    setAnimationKey((k) => k + 1);
    showToast("Replaying animation…", "info");
  }, [showToast]);

  const handleZoneClick = useCallback((linkIndex: number, surfaceId: SurfaceId) => {
    setSelectedLinkIndex(linkIndex);
    setSelectedSurface(surfaceId);
  }, []);

  const handleLoadFavorite = useCallback(
    (config: ChainConfig, urls: string[]) => {
      pushUndo(chainConfig);
      setChainConfig(config);
      setModelUrls(urls);
      showToast("Design loaded!", "success");
    },
    [chainConfig, pushUndo, showToast]
  );

  // ─── Camera Helpers ────────────────────────────────────────────
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
    showToast("View reset", "info");
  }, [showToast]);

  const handleZoomToFit = useCallback(() => {
    if (!sceneRef.current || !orbitControlsRef.current) return;
    const box = new THREE.Box3().setFromObject(sceneRef.current);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const camera = orbitControlsRef.current.object;
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
    camera.position.set(center.x, center.y, center.z + cameraZ);
    orbitControlsRef.current.target.copy(center);
    orbitControlsRef.current.update();
    showToast("Zoomed to fit", "info");
  }, [showToast]);

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

  // ─── New Feature Handlers ──────────────────────────────────────
  const handleRandomize = useCallback(() => {
    pushUndo(chainConfig);
    const materials = ["silver", "gold", "grey", "black", "white"] as const;
    const surfaceTypes = ["gemstones", "moissanites", "enamel", "empty"] as const;
    const colors = ["#ffffff", "#000000", "#dc2626", "#2563eb", "#16a34a", "#eab308"];
    const newConfig = { ...chainConfig, links: chainConfig.links.map((link) => {
      const material = materials[Math.floor(Math.random() * materials.length)];
      const surfaces = { ...link.surfaces };
      Object.keys(surfaces).forEach((key) => {
        const type = surfaceTypes[Math.floor(Math.random() * surfaceTypes.length)];
        if (type === "gemstones" || type === "moissanites") {
          const c = colors[Math.floor(Math.random() * colors.length)];
          (surfaces as any)[key] = { type, gemstoneColors: { stone1: c, stone2: c, stone3: c } };
        } else if (type === "enamel") {
          (surfaces as any)[key] = { type, enamelColor: colors[Math.floor(Math.random() * colors.length)] };
        } else {
          (surfaces as any)[key] = { type };
        }
      });
      return { ...link, material, surfaces };
    })};
    setChainConfig(newConfig);
    showToast("Design randomized! 🎲", "success");
  }, [chainConfig, pushUndo, showToast]);

  const handleCopyLink = useCallback(() => {
    if (selectedLinkIndex === null || selectedLinkIndex >= chainConfig.links.length) {
      showToast("Select a link first", "warning");
      return;
    }
    setClipboardLink({ ...chainConfig.links[selectedLinkIndex] });
    showToast("Link design copied!", "info");
  }, [selectedLinkIndex, chainConfig, showToast]);

  const handlePasteLink = useCallback(() => {
    if (!clipboardLink) {
      showToast("Nothing to paste", "warning");
      return;
    }
    if (selectedLinkIndex === null || selectedLinkIndex >= chainConfig.links.length) {
      showToast("Select a target link first", "warning");
      return;
    }
    pushUndo(chainConfig);
    const newLinks = [...chainConfig.links];
    newLinks[selectedLinkIndex] = { ...clipboardLink };
    setChainConfig({ ...chainConfig, links: newLinks });
    showToast("Link design pasted!", "success");
  }, [clipboardLink, selectedLinkIndex, chainConfig, pushUndo, showToast]);

  const handleResetLink = useCallback(() => {
    if (selectedLinkIndex === null) {
      showToast("Select a link first", "warning");
      return;
    }
    pushUndo(chainConfig);
    const defaultConfig = createDefaultConfig(1);
    const newLinks = [...chainConfig.links];
    newLinks[selectedLinkIndex] = defaultConfig.links[0];
    setChainConfig({ ...chainConfig, links: newLinks });
    showToast("Link reset to default", "info");
  }, [selectedLinkIndex, chainConfig, pushUndo, showToast]);

  const handleShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "My Custom Cuban Chain",
          text: "Check out this Cuban chain I designed!",
          url: window.location.href,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") showToast("Share failed", "error");
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Link copied to clipboard!", "success");
      } catch {
        showToast("Failed to copy link", "error");
      }
    }
  }, [showToast]);

  // ─── Keyboard Shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      if (modKey && event.key === "s") {
        event.preventDefault();
        handleSaveConfiguration();
      } else if (modKey && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      } else if (modKey && (event.key === "y" || (event.key === "z" && event.shiftKey))) {
        event.preventDefault();
        handleRedo();
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        setAutoRotate((a) => !a);
      } else if (event.key === " ") {
        event.preventDefault();
        handleReplayAnimation();
      } else if (["1", "2", "3", "4", "5"].includes(event.key)) {
        event.preventDefault();
        const presets: ViewPreset[] = ["front", "top", "left", "right", "isometric"];
        handleViewPreset(presets[parseInt(event.key) - 1]);
      } else if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        setShowScreenshotModal(true);
      } else if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        handleFullscreen();
      } else if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        setShowGrid((g) => !g);
      } else if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        setHideUI((h) => !h);
      } else if (event.key === "Escape") {
        setSidebarOpen(false);
        setShowViewPresets(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleSaveConfiguration,
    handleUndo,
    handleRedo,
    handleReplayAnimation,
    handleViewPreset,
    handleFullscreen,
  ]);

  // ─── More-menu state ─────────────────────────────────────────
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);

  // ─── Toolbar Button Helper (compact 18px icons) ──────────────
  const ToolbarBtn = useCallback(
    ({
      title,
      onClick,
      icon,
      active,
      color,
    }: {
      title: string;
      onClick: (e?: any) => void;
      icon: React.ReactNode;
      active?: boolean;
      color?: string;
    }) => (
      <Tooltip title={title} arrow placement="top">
        <IconButton
          size="small"
          onClick={onClick}
          sx={{
            p: 0.5,
            color: active ? "primary.main" : color || "text.secondary",
            bgcolor: active ? "action.hover" : "transparent",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          {icon}
        </IconButton>
      </Tooltip>
    ),
    [isMobile]
  );

  // ─── Render ─────────────────────────────────────────────────────
  const sidebarWidth = isTablet ? 340 : SIDEBAR_WIDTH;

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        bgcolor: "background.default",
        position: "relative",
      }}
    >
      {/* Loading */}
      <LoadingOverlay isLoading={isLoading} message="Loading your chain..." />

      {/* Screenshot Modal */}
      <ScreenshotModal
        isOpen={showScreenshotModal}
        onClose={() => setShowScreenshotModal(false)}
        onCapture={handleScreenshotCapture}
      />

      {/* ─── Snackbar / Toast ──────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ mb: isMobile ? 8 : 2 }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2, fontWeight: 500 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ─── Full Canvas Area ──────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          /* Shift content so the 3D model centres in the visible gap */
          pr: !isMobile && sidebarOpen ? `${sidebarWidth}px` : 0,
          transition: "padding-right 0.3s ease",
        }}
      >
        <Box className="canvas-wrapper" sx={{ width: "100%", height: "100%", position: "relative" }}>
          <Canvas
            gl={{ preserveDrawingBuffer: true }}
            camera={{ position: [0.51, 1.25, 0.74], fov: cameraFov, zoom: cameraZoom }}
            style={{ width: "100%", height: "100%" }}
          >
            <Suspense fallback={null}>
              <Environment preset={background} />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />

              {showGrid && (
                <Grid
                  args={[10, 10]}
                  cellSize={0.1}
                  cellThickness={0.5}
                  cellColor="#6f6f6f"
                  sectionSize={0.5}
                  sectionThickness={1}
                  sectionColor="#9d4b4b"
                  fadeDistance={5}
                  fadeStrength={1}
                  followCamera={false}
                  position={[0, -0.01, 0]}
                />
              )}

              {showStats && <Stats />}

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
                autoRotateSpeed={autoRotateSpeed}
              />
            </Suspense>
          </Canvas>
        </Box>

        {/* ─── Brand Watermark (top-left) ──────────────────── */}
        {!hideUI && (
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              top: 16,
              left: isMobile ? 12 : 20,
              fontWeight: 700,
              letterSpacing: "0.04em",
              background: "linear-gradient(135deg, #d4a017, #ffd700)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: isMobile ? "0.85rem" : "1rem",
              userSelect: "none",
              zIndex: 10,
            }}
          >
            Cuban Chain Studio
          </Typography>
        )}

        {/* ─── Chain Info Badge (top-right, over canvas) ───── */}
        {!hideUI && (
          <Paper
            elevation={2}
            sx={{
              position: "absolute",
              top: 16,
              right: isMobile ? 12 : (sidebarOpen && !isMobile ? sidebarWidth + 20 : 20),
              px: 2,
              py: 0.75,
              borderRadius: 2,
              bgcolor: (t) =>
                t.palette.mode === "dark" ? "rgba(20,20,20,0.8)" : "rgba(255,255,255,0.8)",
              backdropFilter: "blur(10px)",
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              gap: 2,
              alignItems: "center",
              zIndex: 10,
              transition: "right 0.3s ease",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.6rem", display: "block" }}>
                LINKS
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                {modelUrls.length}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.6rem", display: "block" }}>
                WEIGHT
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                {chainWeight.toFixed(1)}g
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.6rem", display: "block" }}>
                MATERIAL
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: "text.primary", textTransform: "capitalize" }}
              >
                {chainConfig.links[0]?.material || "—"}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* ─── Recording Indicator ─────────────────────────── */}
        {isRecording && (
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 0.75,
              bgcolor: "error.main",
              borderRadius: 2,
              zIndex: 20,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "#fff",
                animation: "pulse-ring 1.5s infinite",
              }}
            />
            <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>
              Recording…
            </Typography>
          </Box>
        )}

        {/* ─── Floating Viewer Toolbar (compact, bottom-left) ── */}
        {!hideUI && (
          <Paper
            elevation={4}
            sx={{
              position: "absolute",
              left: isMobile ? 8 : 12,
              bottom: isMobile ? 72 : 12,
              display: "flex",
              alignItems: "center",
              gap: 0.15,
              p: 0.35,
              borderRadius: 2,
              bgcolor: (t) =>
                t.palette.mode === "dark" ? "rgba(20,20,20,0.88)" : "rgba(255,255,255,0.88)",
              backdropFilter: "blur(12px)",
              border: "1px solid",
              borderColor: "divider",
              zIndex: 10,
              maxWidth: isMobile ? "calc(100vw - 16px)" : "auto",
            }}
          >
            {/* Zoom */}
            <ToolbarBtn title="Zoom In" onClick={handleZoomIn} icon={<ZoomIn sx={{ fontSize: 18 }} />} />
            <ToolbarBtn title="Zoom Out" onClick={handleZoomOut} icon={<ZoomOut sx={{ fontSize: 18 }} />} />
            <ToolbarBtn title="Zoom to Fit" onClick={handleZoomToFit} icon={<FitScreen sx={{ fontSize: 18 }} />} />

            <Box sx={{ width: "1px", height: 18, bgcolor: "divider", mx: 0.15 }} />

            {/* View Presets */}
            <Box sx={{ position: "relative" }}>
              <ToolbarBtn
                title="View Angles"
                onClick={() => setShowViewPresets(!showViewPresets)}
                icon={<Visibility sx={{ fontSize: 18 }} />}
                active={showViewPresets}
              />
              {showViewPresets && (
                <Paper
                  elevation={8}
                  sx={{
                    position: "absolute",
                    bottom: "100%",
                    left: 0,
                    mb: 0.75,
                    display: "flex",
                    gap: 0.25,
                    p: 0.4,
                    borderRadius: 1.5,
                    bgcolor: (t) =>
                      t.palette.mode === "dark"
                        ? "rgba(20,20,20,0.95)"
                        : "rgba(255,255,255,0.95)",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {VIEW_PRESETS.map((p) => (
                    <Tooltip key={p.id} title={p.label} arrow>
                      <IconButton
                        size="small"
                        onClick={() => {
                          handleViewPreset(p.id);
                          setShowViewPresets(false);
                        }}
                        sx={{ p: 0.5, color: "text.secondary" }}
                      >
                        {p.icon}
                      </IconButton>
                    </Tooltip>
                  ))}
                </Paper>
              )}
            </Box>

            {/* Rotate */}
            <ToolbarBtn
              title={autoRotate ? "Stop Rotation" : "Auto Rotate"}
              onClick={() => setAutoRotate(!autoRotate)}
              icon={autoRotate ? <Pause sx={{ fontSize: 18 }} /> : <PlayArrow sx={{ fontSize: 18 }} />}
              active={autoRotate}
            />

            <ToolbarBtn title="Reset View" onClick={handleResetView} icon={<RestartAlt sx={{ fontSize: 18 }} />} />

            <Box sx={{ width: "1px", height: 18, bgcolor: "divider", mx: 0.15 }} />

            {/* Toggle features */}
            <ToolbarBtn
              title={showGrid ? "Hide Grid" : "Show Grid"}
              onClick={() => setShowGrid(!showGrid)}
              icon={showGrid ? <GridOff sx={{ fontSize: 18 }} /> : <GridOn sx={{ fontSize: 18 }} />}
              active={showGrid}
            />
            <ToolbarBtn
              title="Fullscreen"
              onClick={handleFullscreen}
              icon={<Fullscreen sx={{ fontSize: 18 }} />}
            />
            <ToolbarBtn
              title={mode === "dark" ? "Light Mode" : "Dark Mode"}
              onClick={toggleTheme}
              icon={mode === "dark" ? <LightMode sx={{ fontSize: 18 }} /> : <DarkMode sx={{ fontSize: 18 }} />}
            />

            <Box sx={{ width: "1px", height: 18, bgcolor: "divider", mx: 0.15 }} />

            {/* Primary actions */}
            <ToolbarBtn
              title="Screenshot"
              onClick={() => setShowScreenshotModal(true)}
              icon={<CameraAlt sx={{ fontSize: 18 }} />}
            />
            <ToolbarBtn
              title={isRecording ? "Stop Recording" : "Record Video"}
              onClick={handleToggleRecording}
              icon={isRecording ? <StopIcon sx={{ fontSize: 18 }} /> : <Videocam sx={{ fontSize: 18 }} />}
              active={isRecording}
              color={isRecording ? "error.main" : undefined}
            />
            <ToolbarBtn title="Undo" onClick={handleUndo} icon={<Undo sx={{ fontSize: 18 }} />} />
            <ToolbarBtn title="Redo" onClick={handleRedo} icon={<Redo sx={{ fontSize: 18 }} />} />
            <ToolbarBtn title="Randomize 🎲" onClick={handleRandomize} icon={<Casino sx={{ fontSize: 18 }} />} />

            <Box sx={{ width: "1px", height: 18, bgcolor: "divider", mx: 0.15 }} />

            {/* More overflow menu */}
            <ToolbarBtn
              title="More"
              onClick={(e: any) => setMoreAnchor(e.currentTarget)}
              icon={<MoreVert sx={{ fontSize: 18 }} />}
              active={Boolean(moreAnchor)}
            />
            <Menu
              anchorEl={moreAnchor}
              open={Boolean(moreAnchor)}
              onClose={() => setMoreAnchor(null)}
              anchorOrigin={{ vertical: "top", horizontal: "left" }}
              transformOrigin={{ vertical: "bottom", horizontal: "left" }}
              slotProps={{
                paper: {
                  sx: {
                    bgcolor: (t: any) =>
                      t.palette.mode === "dark" ? "rgba(30,30,30,0.95)" : "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    minWidth: 180,
                  },
                },
              }}
            >
              <MenuItem onClick={() => { handleShare(); setMoreAnchor(null); }}>
                <ListItemIcon><Share sx={{ fontSize: 18 }} /></ListItemIcon>
                <ListItemText>Share</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { handleCopyLink(); setMoreAnchor(null); }}>
                <ListItemIcon><ContentCopy sx={{ fontSize: 18 }} /></ListItemIcon>
                <ListItemText>Copy Link Design</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { handlePasteLink(); setMoreAnchor(null); }}>
                <ListItemIcon><ContentPaste sx={{ fontSize: 18 }} /></ListItemIcon>
                <ListItemText>Paste Link Design</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { handleResetLink(); setMoreAnchor(null); }}>
                <ListItemIcon><SettingsBackupRestore sx={{ fontSize: 18 }} /></ListItemIcon>
                <ListItemText>Reset Link</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { handleReplayAnimation(); setMoreAnchor(null); }}>
                <ListItemIcon><SwapHoriz sx={{ fontSize: 18 }} /></ListItemIcon>
                <ListItemText>Replay Animation</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setShowStats(!showStats); setMoreAnchor(null); }}>
                <ListItemIcon><Info sx={{ fontSize: 18 }} /></ListItemIcon>
                <ListItemText>{showStats ? "Hide FPS" : "Show FPS"}</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { setHideUI(true); setMoreAnchor(null); }}>
                <ListItemIcon><VisibilityOff sx={{ fontSize: 18 }} /></ListItemIcon>
                <ListItemText>Hide UI</ListItemText>
              </MenuItem>
            </Menu>
          </Paper>
        )}

        {/* ─── Hide UI: Minimal restore button ────────────── */}
        {hideUI && (
          <Tooltip title="Show UI (H)" arrow>
            <IconButton
              onClick={() => setHideUI(false)}
              sx={{
                position: "absolute",
                bottom: isMobile ? 72 : 16,
                left: 16,
                bgcolor: (t) =>
                  t.palette.mode === "dark" ? "rgba(20,20,20,0.6)" : "rgba(255,255,255,0.6)",
                backdropFilter: "blur(8px)",
                zIndex: 10,
                color: "text.secondary",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* ─── Mobile FAB (open sidebar) ───────────────────── */}
        {isMobile && !hideUI && (
          <Fab
            color="primary"
            onClick={() => setSidebarOpen(true)}
            sx={{
              position: "absolute",
              bottom: 16,
              right: 16,
              zIndex: 10,
              background: "linear-gradient(135deg, #d4a017, #ffd700)",
              "&:hover": { background: "linear-gradient(135deg, #b8860b, #d4a017)" },
            }}
          >
            <Tune />
          </Fab>
        )}

        {/* ─── Desktop: Toggle Sidebar Button ──────────────── */}
        {!isMobile && !hideUI && (
          <Tooltip title={sidebarOpen ? "Close Panel" : "Open Panel"} arrow placement="left">
            <IconButton
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{
                position: "absolute",
                top: "50%",
                right: sidebarOpen ? sidebarWidth + 4 : 8,
                transform: "translateY(-50%)",
                zIndex: 15,
                bgcolor: (t) =>
                  t.palette.mode === "dark" ? "rgba(30,30,30,0.9)" : "rgba(255,255,255,0.9)",
                backdropFilter: "blur(8px)",
                border: "1px solid",
                borderColor: "divider",
                transition: "right 0.3s ease",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              {sidebarOpen ? <ArrowForward fontSize="small" /> : <ArrowBack fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* ─── Sidebar: Desktop = Floating Paper, Mobile = Bottom SwipeableDrawer ── */}
      {isMobile ? (
        <SwipeableDrawer
          anchor="bottom"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpen={() => setSidebarOpen(true)}
          swipeAreaWidth={30}
          disableSwipeToOpen={false}
          PaperProps={{
            sx: {
              height: "85vh",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              bgcolor: "background.paper",
              overflow: "hidden",
            },
          }}
        >
          {/* Drag Handle */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              pt: 1.5,
              pb: 1,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 4,
                borderRadius: 2,
                bgcolor: "divider",
              }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 2,
              pb: 1,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
              CUSTOMIZE
            </Typography>
            <IconButton size="small" onClick={() => setSidebarOpen(false)}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
          <CustomizerPanel
            chainConfig={chainConfig}
            setChainConfig={setChainConfigWithUndo}
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
            isMobile={true}
            onCaptureImage={() => setShowScreenshotModal(true)}
            onStartRecording={handleToggleRecording}
            isRecording={isRecording}
            onChainLengthChange={handleChainLengthChange}
            onReplayAnimation={handleReplayAnimation}
            onLoadFavorite={handleLoadFavorite}
            background={background}
            setBackground={setBackground}
          />
        </SwipeableDrawer>
      ) : (
        /* Desktop Floating Sidebar */
        <Paper
          elevation={8}
          sx={{
            position: "absolute",
            top: 0,
            right: sidebarOpen ? 0 : -sidebarWidth,
            width: sidebarWidth,
            height: "100vh",
            transition: "right 0.3s ease",
            zIndex: 12,
            bgcolor: "background.paper",
            borderLeft: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <CustomizerPanel
            chainConfig={chainConfig}
            setChainConfig={setChainConfigWithUndo}
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
        </Paper>
      )}
    </Box>
  );
}
