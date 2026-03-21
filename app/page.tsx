"use client";

import type React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Fab,
  IconButton,
  Paper,
  Slide,
  Snackbar,
  Stack,
  SwipeableDrawer,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  AutoAwesome,
  CameraAlt,
  FitScreen,
  Menu as MenuIcon,
  Refresh,
  Replay,
  ThreeDRotation,
  Undo,
  Redo,
  Visibility,
  ArrowUpward,
  ArrowBack,
  ArrowForward,
  ViewInAr,
  Videocam,
  Stop as StopIcon,
} from "@mui/icons-material";

import { CustomizerPanel } from "@/components/customizer-panel";
import { LoadingOverlay } from "@/components/loading-overlay";
import { ModelViewer } from "@/components/model-viewer";
import { ScreenshotModal, type ScreenshotOptions } from "@/components/screenshot-modal";
import type { ChainConfig, LinkConfig, SurfaceConfig, SurfaceId } from "@/lib/chain-config-types";
import { createDefaultConfig, createDefaultLink } from "@/lib/chain-helpers";
import {
  CHAIN_PRESETS,
  LINK_TYPE_TO_URL,
  type ChainLinkType,
  URL_TO_LINK_TYPE,
} from "@/lib/chain-manager";

const SIDEBAR_WIDTH = 372;
const DEFAULT_MAIN_URL = LINK_TYPE_TO_URL["cuban-main"];
const DEFAULT_MODEL_URLS = ["/models/EntireChain.glb"];

const MATERIAL_WEIGHTS: Record<string, number> = {
  silver: 8.5,
  gold: 15.2,
  grey: 7.8,
  black: 9.1,
  white: 8.0,
};

const RECENT_DESIGNS_KEY = "cuban-chain-recent-designs";

type ViewPreset = "front" | "top" | "left" | "right" | "isometric";
type EnvironmentPreset =
  | "city"
  | "studio"
  | "sunset"
  | "dawn"
  | "night"
  | "warehouse"
  | "forest"
  | "apartment"
  | "park"
  | "lobby";

const VIEW_PRESET_POSITIONS: Record<
  ViewPreset,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  front: { position: [0, 0.35, 1.8], target: [0, 0.1, 0] },
  top: { position: [0, 2.1, 0.001], target: [0, 0, 0] },
  left: { position: [-1.8, 0.45, 0], target: [0, 0.1, 0] },
  right: { position: [1.8, 0.45, 0], target: [0, 0.1, 0] },
  isometric: { position: [0.78, 1.12, 1.45], target: [0, 0.1, 0] },
};

const VIEW_PRESETS: { id: ViewPreset; label: string; icon: React.ReactNode }[] = [
  { id: "front", label: "Front", icon: <Visibility sx={{ fontSize: 16 }} /> },
  { id: "top", label: "Top", icon: <ArrowUpward sx={{ fontSize: 16 }} /> },
  { id: "left", label: "Left", icon: <ArrowBack sx={{ fontSize: 16 }} /> },
  { id: "right", label: "Right", icon: <ArrowForward sx={{ fontSize: 16 }} /> },
  { id: "isometric", label: "3D", icon: <ViewInAr sx={{ fontSize: 16 }} /> },
];

type HistoryState = {
  chainConfig: ChainConfig;
  modelUrls: string[];
  selectedLinkIndex: number;
  selectedSurface: SurfaceId;
};

function cloneSurfaceConfig(surface: SurfaceConfig): SurfaceConfig {
  return {
    ...surface,
    gemstoneColors: surface.gemstoneColors ? { ...surface.gemstoneColors } : undefined,
  };
}

function cloneLinkConfig(link: LinkConfig): LinkConfig {
  return {
    material: link.material,
    surfaces: {
      top1: cloneSurfaceConfig(link.surfaces.top1),
      top2: cloneSurfaceConfig(link.surfaces.top2),
      side1: cloneSurfaceConfig(link.surfaces.side1),
      side2: cloneSurfaceConfig(link.surfaces.side2),
    },
  };
}

function cloneChainConfig(config: ChainConfig): ChainConfig {
  return {
    chainLength: config.chainLength,
    links: config.links.map(cloneLinkConfig),
  };
}

function SlideTransition(props: any) {
  return <Slide {...props} direction="up" />;
}

export default function Home() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("lg"));
  const sceneRef = useRef<THREE.Object3D | null>(null);
  const orbitControlsRef = useRef<any>(null);

  const [modelUrls, setModelUrls] = useState<string[]>(DEFAULT_MODEL_URLS);
  const [chainConfig, setChainConfig] = useState<ChainConfig>(() =>
    createDefaultConfig(DEFAULT_MODEL_URLS.length)
  );
  const [selectedSurface, setSelectedSurface] = useState<SurfaceId>("top1");
  const [selectedLinkIndex, setSelectedLinkIndex] = useState(0);
  const [background, setBackground] = useState<EnvironmentPreset>("city");
  const [autoRotate, setAutoRotate] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [clipboardLink, setClipboardLink] = useState<LinkConfig | null>(null);
  const [undoStack, setUndoStack] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);
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

  const createHistoryState = useCallback(
    (): HistoryState => ({
      chainConfig: cloneChainConfig(chainConfig),
      modelUrls: [...modelUrls],
      selectedLinkIndex,
      selectedSurface,
    }),
    [chainConfig, modelUrls, selectedLinkIndex, selectedSurface]
  );

  const restoreHistoryState = useCallback((state: HistoryState) => {
    setChainConfig(cloneChainConfig(state.chainConfig));
    setModelUrls([...state.modelUrls]);
    setSelectedLinkIndex(state.selectedLinkIndex);
    setSelectedSurface(state.selectedSurface);
  }, []);

  const pushUndo = useCallback(() => {
    setUndoStack((previous) => [...previous.slice(-19), createHistoryState()]);
    setRedoStack([]);
  }, [createHistoryState]);

  useEffect(() => {
    setChainConfig((previous) => {
      if (previous.chainLength === modelUrls.length) {
        return previous;
      }

      const nextLinks = previous.links.map(cloneLinkConfig);
      while (nextLinks.length < modelUrls.length) {
        const template = nextLinks[nextLinks.length - 1] ?? createDefaultLink();
        nextLinks.push(cloneLinkConfig(template));
      }
      nextLinks.splice(modelUrls.length);

      return {
        chainLength: modelUrls.length,
        links: nextLinks,
      };
    });
  }, [modelUrls.length]);

  useEffect(() => {
    setSelectedLinkIndex((previous) => Math.min(previous, Math.max(modelUrls.length - 1, 0)));
  }, [modelUrls.length]);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    setIsLoading(true);
    const timer = window.setTimeout(() => setIsLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, [modelUrls]);

  const chainWeight = useMemo(() => {
    return chainConfig.links.reduce((total, link) => total + (MATERIAL_WEIGHTS[link.material] ?? 8), 0);
  }, [chainConfig]);

  const selectedLinkType = useMemo(() => {
    return URL_TO_LINK_TYPE[modelUrls[selectedLinkIndex]] ?? "cuban-main";
  }, [modelUrls, selectedLinkIndex]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) {
      return;
    }

    const previous = undoStack[undoStack.length - 1];
    setUndoStack((current) => current.slice(0, -1));
    setRedoStack((current) => [...current, createHistoryState()]);
    restoreHistoryState(previous);
    showToast("Previous step restored", "info");
  }, [createHistoryState, restoreHistoryState, showToast, undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) {
      return;
    }

    const next = redoStack[redoStack.length - 1];
    setRedoStack((current) => current.slice(0, -1));
    setUndoStack((current) => [...current, createHistoryState()]);
    restoreHistoryState(next);
    showToast("Step reapplied", "info");
  }, [createHistoryState, redoStack, restoreHistoryState, showToast]);

  const setChainConfigWithUndo = useCallback(
    (nextConfig: ChainConfig) => {
      pushUndo();
      setChainConfig(nextConfig);
    },
    [pushUndo]
  );

  const handleSaveConfiguration = useCallback(() => {
    const payload = { chainConfig, modelUrls };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chain-configuration.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

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

    showToast("Configuration saved", "success");
  }, [chainConfig, modelUrls, showToast]);

  const handleLoadConfiguration = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        try {
          const parsed = JSON.parse(loadEvent.target?.result as string);
          if (!parsed.chainConfig || !parsed.modelUrls) {
            throw new Error("Invalid configuration");
          }

          pushUndo();
          setChainConfig(cloneChainConfig(parsed.chainConfig));
          setModelUrls([...parsed.modelUrls]);
          setSelectedLinkIndex(0);
          setSelectedSurface("top1");
          showToast("Configuration loaded", "success");
        } catch {
          showToast("Failed to load configuration", "error");
        }
      };
      reader.readAsText(file);
    },
    [pushUndo, showToast]
  );

  const handleScreenshotCapture = useCallback(
    (options: ScreenshotOptions) => {
      window.dispatchEvent(new CustomEvent("captureImage", { detail: options }));
      showToast("Screenshot captured", "success");
    },
    [showToast]
  );

  const handleToggleRecording = useCallback(() => {
    setIsRecording((recording) => {
      const next = !recording;
      showToast(next ? "Recording started" : "Recording stopped", "info");
      return next;
    });
    setAutoRotate((value) => (isRecording ? value : true));
  }, [isRecording, showToast]);

  const handleRecordingComplete = useCallback(
    (videoBlob: Blob) => {
      setIsRecording(false);
      setAutoRotate(false);
      const extension = videoBlob.type.includes("mp4") ? "mp4" : "webm";
      const url = URL.createObjectURL(videoBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chain-recording-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Recording saved", "success");
    },
    [showToast]
  );

  const handleChainLengthChange = useCallback(
    (length: number) => {
      if (length < 1 || length === modelUrls.length) {
        return;
      }

      pushUndo();

      if (length > modelUrls.length) {
        const urlTemplate = modelUrls[selectedLinkIndex] ?? modelUrls[modelUrls.length - 1] ?? DEFAULT_MAIN_URL;
        const configTemplate =
          chainConfig.links[selectedLinkIndex] ??
          chainConfig.links[chainConfig.links.length - 1] ??
          createDefaultLink();

        setModelUrls((previous) => {
          const next = [...previous];
          while (next.length < length) {
            next.push(urlTemplate);
          }
          return next;
        });

        setChainConfig((previous) => {
          const nextLinks = previous.links.map(cloneLinkConfig);
          while (nextLinks.length < length) {
            nextLinks.push(cloneLinkConfig(configTemplate));
          }
          return { chainLength: length, links: nextLinks };
        });
      } else {
        setModelUrls((previous) => previous.slice(0, length));
        setChainConfig((previous) => ({
          chainLength: length,
          links: previous.links.slice(0, length).map(cloneLinkConfig),
        }));
        setSelectedLinkIndex((previous) => Math.min(previous, length - 1));
      }

      showToast(`Chain updated to ${length} links`, "info");
    },
    [chainConfig.links, modelUrls, pushUndo, selectedLinkIndex, showToast]
  );

  const handleDuplicateSelectedLink = useCallback(() => {
    const sourceUrl = modelUrls[selectedLinkIndex] ?? DEFAULT_MAIN_URL;
    const sourceConfig = chainConfig.links[selectedLinkIndex] ?? createDefaultLink();

    pushUndo();
    setModelUrls((previous) => [
      ...previous.slice(0, selectedLinkIndex + 1),
      sourceUrl,
      ...previous.slice(selectedLinkIndex + 1),
    ]);
    setChainConfig((previous) => ({
      chainLength: previous.chainLength + 1,
      links: [
        ...previous.links.slice(0, selectedLinkIndex + 1),
        cloneLinkConfig(sourceConfig),
        ...previous.links.slice(selectedLinkIndex + 1).map(cloneLinkConfig),
      ],
    }));
    setSelectedLinkIndex(selectedLinkIndex + 1);
    showToast("Selected link duplicated", "success");
  }, [chainConfig.links, modelUrls, pushUndo, selectedLinkIndex, showToast]);

  const handleRemoveSelectedLink = useCallback(() => {
    if (modelUrls.length <= 1) {
      showToast("The chain needs at least one link", "warning");
      return;
    }

    pushUndo();
    setModelUrls((previous) => previous.filter((_, index) => index !== selectedLinkIndex));
    setChainConfig((previous) => ({
      chainLength: previous.chainLength - 1,
      links: previous.links.filter((_, index) => index !== selectedLinkIndex).map(cloneLinkConfig),
    }));
    setSelectedLinkIndex((previous) => Math.max(0, Math.min(previous - 1, modelUrls.length - 2)));
    showToast("Selected link removed", "info");
  }, [modelUrls.length, pushUndo, selectedLinkIndex, showToast]);

  const handleReplaceSelectedLinkType = useCallback(
    (linkType: ChainLinkType) => {
      pushUndo();
      setModelUrls((previous) =>
        previous.map((url, index) => (index === selectedLinkIndex ? LINK_TYPE_TO_URL[linkType] : url))
      );
      showToast("Selected link type updated", "success");
    },
    [pushUndo, selectedLinkIndex, showToast]
  );

  const handleAddLinkType = useCallback(
    (linkType: ChainLinkType) => {
      pushUndo();
      setModelUrls((previous) => [
        ...previous.slice(0, selectedLinkIndex + 1),
        LINK_TYPE_TO_URL[linkType],
        ...previous.slice(selectedLinkIndex + 1),
      ]);
      setChainConfig((previous) => ({
        chainLength: previous.chainLength + 1,
        links: [
          ...previous.links.slice(0, selectedLinkIndex + 1),
          createDefaultLink(),
          ...previous.links.slice(selectedLinkIndex + 1).map(cloneLinkConfig),
        ],
      }));
      setSelectedLinkIndex(selectedLinkIndex + 1);
      showToast("New link added", "success");
    },
    [pushUndo, selectedLinkIndex, showToast]
  );

  const handleLoadPreset = useCallback(
    (presetName: string) => {
      const preset = CHAIN_PRESETS[presetName];
      if (!preset) {
        return;
      }

      pushUndo();
      setModelUrls(preset.map((type) => LINK_TYPE_TO_URL[type]));
      setChainConfig(createDefaultConfig(preset.length));
      setSelectedLinkIndex(0);
      setSelectedSurface("top1");
      showToast(`${presetName} preset loaded`, "success");
    },
    [pushUndo, showToast]
  );

  const handleLoadFavorite = useCallback(
    (config: ChainConfig, urls: string[]) => {
      pushUndo();
      setChainConfig(cloneChainConfig(config));
      setModelUrls([...urls]);
      setSelectedLinkIndex(0);
      setSelectedSurface("top1");
      showToast("Saved design loaded", "success");
    },
    [pushUndo, showToast]
  );

  const handleCopySelectedLink = useCallback(() => {
    const link = chainConfig.links[selectedLinkIndex];
    if (!link) {
      return;
    }
    setClipboardLink(cloneLinkConfig(link));
    showToast("Selected link copied", "info");
  }, [chainConfig.links, selectedLinkIndex, showToast]);

  const handlePasteToSelectedLink = useCallback(() => {
    if (!clipboardLink) {
      showToast("No copied link yet", "warning");
      return;
    }

    pushUndo();
    setChainConfig((previous) => ({
      chainLength: previous.chainLength,
      links: previous.links.map((link, index) =>
        index === selectedLinkIndex ? cloneLinkConfig(clipboardLink) : cloneLinkConfig(link)
      ),
    }));
    showToast("Copied link applied", "success");
  }, [clipboardLink, pushUndo, selectedLinkIndex, showToast]);

  const handleResetSelectedLink = useCallback(() => {
    pushUndo();
    setChainConfig((previous) => ({
      chainLength: previous.chainLength,
      links: previous.links.map((link, index) =>
        index === selectedLinkIndex ? createDefaultLink() : cloneLinkConfig(link)
      ),
    }));
    showToast("Selected link reset", "info");
  }, [pushUndo, selectedLinkIndex, showToast]);

  const handleReplayAnimation = useCallback(() => {
    setAnimationKey((previous) => previous + 1);
    showToast("Replay started", "info");
  }, [showToast]);

  const handleZoneClick = useCallback(
    (linkIndex: number, surfaceId: SurfaceId) => {
      setSelectedLinkIndex(linkIndex);
      setSelectedSurface(surfaceId);
      if (isMobile) {
        setSidebarOpen(true);
      }
    },
    [isMobile]
  );

  const handleResetView = useCallback(() => {
    if (!orbitControlsRef.current) {
      return;
    }
    orbitControlsRef.current.reset();
    showToast("View reset", "info");
  }, [showToast]);

  const handleZoomToFit = useCallback(() => {
    if (!sceneRef.current || !orbitControlsRef.current) {
      return;
    }

    const box = new THREE.Box3().setFromObject(sceneRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const controls = orbitControlsRef.current;
    const camera = controls.object as THREE.PerspectiveCamera;
    const maxDimension = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const cameraDistance = Math.max(Math.abs(maxDimension / 2 / Math.tan(fov / 2)) * 1.8, 1.2);

    camera.position.set(center.x, center.y + size.y * 0.35, center.z + cameraDistance);
    controls.target.copy(center);
    controls.update();
    showToast("Model fitted to view", "info");
  }, [showToast]);

  const handleViewPreset = useCallback((preset: ViewPreset) => {
    if (!orbitControlsRef.current) {
      return;
    }

    const controls = orbitControlsRef.current;
    const camera = controls.object;
    const presetData = VIEW_PRESET_POSITIONS[preset];
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const endPosition = new THREE.Vector3(...presetData.position);
    const endTarget = new THREE.Vector3(...presetData.target);
    const startTime = performance.now();
    const duration = 400;

    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(startPosition, endPosition, eased);
      controls.target.lerpVectors(startTarget, endTarget, eased);
      controls.update();
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  const sidebar = (
    <CustomizerPanel
      chainConfig={chainConfig}
      setChainConfig={setChainConfigWithUndo}
      selectedSurface={selectedSurface}
      setSelectedSurface={setSelectedSurface}
      selectedLinkIndex={selectedLinkIndex}
      setSelectedLinkIndex={setSelectedLinkIndex}
      onSaveConfiguration={handleSaveConfiguration}
      onLoadConfiguration={handleLoadConfiguration}
      onCaptureImage={() => setShowScreenshotModal(true)}
      onStartRecording={handleToggleRecording}
      isRecording={isRecording}
      modelUrls={modelUrls}
      onChainLengthChange={handleChainLengthChange}
      onLoadFavorite={handleLoadFavorite}
      autoRotate={autoRotate}
      setAutoRotate={setAutoRotate}
      background={background}
      setBackground={setBackground}
      onDuplicateSelectedLink={handleDuplicateSelectedLink}
      onRemoveSelectedLink={handleRemoveSelectedLink}
      onAddLinkType={handleAddLinkType}
      onReplaceSelectedLinkType={handleReplaceSelectedLinkType}
      onLoadPreset={handleLoadPreset}
      onCopySelectedLink={handleCopySelectedLink}
      onPasteToSelectedLink={handlePasteToSelectedLink}
      onResetSelectedLink={handleResetSelectedLink}
      onReplayAnimation={handleReplayAnimation}
    />
  );

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <LoadingOverlay isLoading={isLoading} message="Loading Cuban chain…" />

      <ScreenshotModal
        isOpen={showScreenshotModal}
        onClose={() => setShowScreenshotModal(false)}
        onCapture={handleScreenshotCapture}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2600}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ flex: 1, minWidth: 0, position: "relative", overflow: "hidden" }}>
        <Box className="canvas-wrapper" sx={{ height: "100%" }}>
          <Canvas
            gl={{ preserveDrawingBuffer: true }}
            camera={{ position: [0.78, 1.12, 1.45], fov: 34 }}
            style={{
              width: "100%",
              height: "100%",
              background:
                muiTheme.palette.mode === "dark"
                  ? "radial-gradient(circle at top, #2d2b29 0%, #171717 60%, #111111 100%)"
                  : "radial-gradient(circle at top, #f6f2eb 0%, #ece6dc 42%, #ddd8cf 100%)",
            }}
          >
            <Suspense fallback={null}>
              <Stage environment={background} intensity={0.65} adjustCamera={false}>
                <ModelViewer
                  key={animationKey}
                  urls={modelUrls}
                  chainConfig={chainConfig}
                  chainSpacing={0.03}
                  combineModels={false}
                  pairedDuplicate={modelUrls.length === 1 && modelUrls[0] === DEFAULT_MAIN_URL}
                  autoRotate={autoRotate}
                  isRecording={isRecording}
                  onRecordingComplete={handleRecordingComplete}
                  sceneRef={sceneRef as React.MutableRefObject<any>}
                  onZoneClick={handleZoneClick}
                  selectedLinkIndex={selectedLinkIndex}
                />
              </Stage>
              <OrbitControls
                ref={orbitControlsRef}
                makeDefault
                enablePan={false}
                minDistance={0.7}
                maxDistance={4}
                minPolarAngle={0.08}
                maxPolarAngle={Math.PI / 2 - 0.08}
                autoRotate={autoRotate}
                autoRotateSpeed={1.2}
              />
            </Suspense>
          </Canvas>
        </Box>

        <Paper
          elevation={0}
          sx={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 2,
            width: { xs: "calc(100% - 88px)", sm: 360 },
            p: 1.75,
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "rgba(255,255,255,0.78)",
            backdropFilter: "blur(18px)",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: "0.18em", color: "text.secondary" }}>
                Cuban Builder
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                Compact chain workbench
              </Typography>
            </Box>
            {isMobile && (
              <Fab size="small" color="primary" onClick={() => setSidebarOpen(true)}>
                <MenuIcon sx={{ fontSize: 20 }} />
              </Fab>
            )}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 1.5 }}>
            <Chip label={`${modelUrls.length} links`} size="small" />
            <Chip label={`Selected ${selectedLinkIndex + 1}`} size="small" />
            <Chip
              label={selectedLinkType.replace("cuban-", "").replaceAll("-", " ")}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip label={`${chainWeight.toFixed(1)}g`} size="small" variant="outlined" />
          </Stack>

          <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, flexWrap: "wrap" }}>
            <Tooltip title="Undo">
              <span>
                <IconButton size="small" onClick={handleUndo} disabled={undoStack.length === 0}>
                  <Undo sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo">
              <span>
                <IconButton size="small" onClick={handleRedo} disabled={redoStack.length === 0}>
                  <Redo sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Reset view">
              <IconButton size="small" onClick={handleResetView}>
                <Refresh sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fit model">
              <IconButton size="small" onClick={handleZoomToFit}>
                <FitScreen sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={autoRotate ? "Stop rotation" : "Start rotation"}>
              <IconButton size="small" onClick={() => setAutoRotate((value) => !value)} color={autoRotate ? "primary" : "default"}>
                <ThreeDRotation sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Capture image">
              <IconButton size="small" onClick={() => setShowScreenshotModal(true)}>
                <CameraAlt sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={isRecording ? "Stop recording" : "Start recording"}>
              <IconButton
                size="small"
                onClick={handleToggleRecording}
                color={isRecording ? "error" : "default"}
              >
                {isRecording ? <StopIcon sx={{ fontSize: 18 }} /> : <Videocam sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Replay entrance">
              <IconButton size="small" onClick={handleReplayAnimation}>
                <Replay sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>

          <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, flexWrap: "wrap" }}>
            {VIEW_PRESETS.map((preset) => (
              <Chip
                key={preset.id}
                icon={preset.icon as any}
                label={preset.label}
                onClick={() => handleViewPreset(preset.id)}
                variant="outlined"
                size="small"
              />
            ))}
          </Stack>
        </Paper>
      </Box>

      {isMobile ? (
        <SwipeableDrawer
          anchor="right"
          open={sidebarOpen}
          onOpen={() => setSidebarOpen(true)}
          onClose={() => setSidebarOpen(false)}
          PaperProps={{
            sx: {
              width: "min(100vw, 390px)",
              bgcolor: "background.paper",
            },
          }}
        >
          {sidebar}
        </SwipeableDrawer>
      ) : (
        <Paper
          elevation={0}
          square
          sx={{
            width: SIDEBAR_WIDTH,
            borderLeft: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {sidebar}
        </Paper>
      )}
    </Box>
  );
}
