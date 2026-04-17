"use client";

import type React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Slide,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  CameraAlt,
  FitScreen,
  Fullscreen,
  Refresh,
} from "@mui/icons-material";
import { SimpleCustomizerDock } from "@/components/simple-customizer-dock";
import { ModelViewer } from "@/components/model-viewer";
import { ScreenshotModal, type ScreenshotOptions } from "@/components/screenshot-modal";
import type { ChainConfig, LinkConfig, SurfaceConfig, SurfaceId } from "@/lib/chain-config-types";
import { createDefaultConfig, createDefaultLink } from "@/lib/chain-helpers";
import { MAX_CHAIN_LINKS } from "@/lib/chain-geometry";
import { encodeGif, resizeFrame, type GifFrame } from "@/lib/gif-encoder";

const DEFAULT_CHAIN_LENGTH = 12;
const DEFAULT_MODEL_URL = "/models/EntireChain.glb";
const DEFAULT_MODEL_URLS = Array(DEFAULT_CHAIN_LENGTH).fill(DEFAULT_MODEL_URL);
const GIF_MAX_WIDTH = 560; // keep file size manageable
const GIF_FRAME_DELAY = 8; // 80 ms per frame ≈ 12.5 fps

type EnvironmentPreset =
  | "city" | "studio" | "sunset" | "dawn" | "night"
  | "warehouse" | "forest" | "apartment" | "park" | "lobby";

// ── Shared glass surface style ──────────────────────────────────────────────
const glass = {
  bgcolor: "rgba(252,253,255,0.82)",
  border: "1px solid rgba(255,255,255,0.78)",
  backdropFilter: "blur(28px) saturate(180%) brightness(1.04)",
  WebkitBackdropFilter: "blur(28px) saturate(180%) brightness(1.04)",
  boxShadow:
    "0 0 0 0.5px rgba(255,255,255,0.55), 0 4px 16px rgba(31,45,48,0.10), 0 16px 40px rgba(31,45,48,0.08), inset 0 1.5px 0 rgba(255,255,255,0.98)",
} as const;

// ── Camera view presets ─────────────────────────────────────────────────────
const CAMERA_PRESETS = {
  iso:    { pos: new THREE.Vector3(0.36, 0.64, 0.74), target: new THREE.Vector3(0, 0.03, 0), label: "Isometric",   icon: "◇" },
  front:  { pos: new THREE.Vector3(0,    0.12, 1.10), target: new THREE.Vector3(0, 0.05, 0), label: "Front",       icon: "↑" },
  top:    { pos: new THREE.Vector3(0,    1.50, 0.01), target: new THREE.Vector3(0, 0,    0), label: "Top",         icon: "⊙" },
  bottom: { pos: new THREE.Vector3(0,   -1.40, 0.01), target: new THREE.Vector3(0, 0,    0), label: "Bottom",      icon: "⊕" },
  left:   { pos: new THREE.Vector3(-1.20, 0.14, 0.1), target: new THREE.Vector3(0, 0.05, 0), label: "Left",        icon: "←" },
  right:  { pos: new THREE.Vector3( 1.20, 0.14, 0.1), target: new THREE.Vector3(0, 0.05, 0), label: "Right",       icon: "→" },
} as const;
type CameraPreset = keyof typeof CAMERA_PRESETS;

function cloneSurfaceConfig(s: SurfaceConfig): SurfaceConfig {
  return { ...s, gemstoneColors: s.gemstoneColors ? { ...s.gemstoneColors } : undefined };
}
function cloneLinkConfig(l: LinkConfig): LinkConfig {
  return {
    material: l.material,
    surfaces: {
      top1: cloneSurfaceConfig(l.surfaces.top1),
      top2: cloneSurfaceConfig(l.surfaces.top2),
      side1: cloneSurfaceConfig(l.surfaces.side1),
      side2: cloneSurfaceConfig(l.surfaces.side2),
    },
  };
}
function cloneChainConfig(c: ChainConfig): ChainConfig {
  return { chainLength: c.chainLength, links: c.links.map(cloneLinkConfig) };
}
function SlideTransition(props: any) {
  return <Slide {...props} direction="up" />;
}

// ── Smooth camera animation ─────────────────────────────────────────────────
function animateCameraTo(
  controls: any,
  toPos: THREE.Vector3,
  toTarget: THREE.Vector3,
  duration = 0.72,
) {
  if (!controls) return;
  const cam = controls.object as THREE.PerspectiveCamera;
  const fromPos    = cam.position.clone();
  const fromTarget = controls.target.clone();
  const start = performance.now();

  const step = () => {
    const t = Math.min((performance.now() - start) / (duration * 1000), 1);
    const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
    cam.position.lerpVectors(fromPos, toPos, e);
    controls.target.lerpVectors(fromTarget, toTarget, e);
    controls.update();
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export default function Home() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const sceneRef = useRef<THREE.Object3D | null>(null);
  const orbitControlsRef = useRef<any>(null);
  const dockContainerRef = useRef<HTMLDivElement>(null);
  const mouseMoveThrottleRef = useRef<number | null>(null);

  const [modelUrls, setModelUrls] = useState<string[]>(DEFAULT_MODEL_URLS);
  const [detectedLinkCount, setDetectedLinkCount] = useState<number>(MAX_CHAIN_LINKS);
  const [chainConfig, setChainConfig] = useState<ChainConfig>(() =>
    createDefaultConfig(DEFAULT_MODEL_URLS.length)
  );
  const [selectedSurface, setSelectedSurface] = useState<SurfaceId>("top1");
  const [selectedLinkIndex, setSelectedLinkIndex] = useState(0);
  const [background] = useState<EnvironmentPreset>("city");
  const [autoRotate, setAutoRotate] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCapturingGIF, setIsCapturingGIF] = useState(false);
  const [gifProgress, setGifProgress] = useState<"idle" | "capturing" | "encoding">("idle");
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean; message: string; severity: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });

  const showToast = useCallback(
    (msg: string, sev: "success" | "error" | "info" | "warning" = "info") =>
      setSnackbar({ open: true, message: msg, severity: sev }),
    [],
  );

  // ── Chain length sync ───────────────────────────────────────────────────
  useEffect(() => {
    setChainConfig((prev) => {
      if (prev.chainLength === modelUrls.length) return prev;
      const links = prev.links.map(cloneLinkConfig);
      while (links.length < modelUrls.length) {
        const tpl = links[links.length - 1] ?? createDefaultLink();
        links.push(cloneLinkConfig(tpl));
      }
      links.splice(modelUrls.length);
      return { chainLength: modelUrls.length, links };
    });
  }, [modelUrls.length]);

  useEffect(() => {
    setSelectedLinkIndex((p) => Math.min(p, Math.max(modelUrls.length - 1, 0)));
  }, [modelUrls.length]);

  const setChainConfigFromDock = useCallback(
    (next: ChainConfig) => setChainConfig(cloneChainConfig(next)),
    [],
  );

  // ── Screenshot ──────────────────────────────────────────────────────────
  const handleScreenshotCapture = useCallback(
    (options: ScreenshotOptions) => {
      window.dispatchEvent(new CustomEvent("captureImage", { detail: options }));
      showToast("Screenshot saved", "success");
    },
    [showToast],
  );

  // ── Quick image export (PNG / JPG / WebP) ───────────────────────────────
  const handleQuickExport = useCallback(
    (fmt: "png" | "jpg" | "webp") => {
      window.dispatchEvent(
        new CustomEvent("captureImage", {
          detail: {
            backgroundColor: "white",
            addWatermark: false,
            format: fmt,
          },
        }),
      );
      showToast(`Saved as ${fmt.toUpperCase()}`, "success");
    },
    [showToast],
  );

  // ── Video recording ─────────────────────────────────────────────────────
  const handleRecordingComplete = useCallback(
    (blob: Blob) => {
      setIsRecording(false);
      setAutoRotate(false);
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cuban-chain-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Video saved", "success");
    },
    [showToast],
  );

  const handleStartVideo = useCallback(() => {
    setAutoRotate(true);
    setIsRecording(true);
    showToast("Recording… click again to stop", "info");
  }, [showToast]);

  const handleStopVideo = useCallback(() => {
    setIsRecording(false);
  }, []);

  // ── GIF export ──────────────────────────────────────────────────────────
  const handleStartGIF = useCallback(() => {
    if (gifProgress !== "idle") return;
    setAutoRotate(true);
    setGifProgress("capturing");
    setIsCapturingGIF(true);
    showToast("Capturing frames…", "info");
  }, [gifProgress, showToast]);

  const handleGIFFramesCaptured = useCallback(
    (frames: ImageData[]) => {
      setIsCapturingGIF(false);
      setAutoRotate(false);
      setGifProgress("encoding");
      showToast("Encoding GIF…", "info");

      // Run encoding on next tick to allow UI to update
      setTimeout(() => {
        try {
          const gifFrames: GifFrame[] = frames.map((f) => ({
            imageData: resizeFrame(f, GIF_MAX_WIDTH),
            delay: GIF_FRAME_DELAY,
          }));
          const blob = encodeGif(gifFrames, true);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `cuban-chain-${Date.now()}.gif`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast("GIF saved!", "success");
        } catch (err) {
          console.error("GIF encoding error:", err);
          showToast("GIF export failed", "error");
        } finally {
          setGifProgress("idle");
        }
      }, 60);
    },
    [showToast],
  );

  // ── Camera handlers ─────────────────────────────────────────────────────
  const handleChainLengthChange = useCallback(
    (length: number) => {
      const capped = Math.max(1, Math.min(Math.round(length), detectedLinkCount));
      if (capped === modelUrls.length) return;
      const tpl =
        chainConfig.links[selectedLinkIndex] ??
        chainConfig.links[chainConfig.links.length - 1] ??
        createDefaultLink();
      setModelUrls(Array(capped).fill(DEFAULT_MODEL_URL));
      setChainConfig((prev) => {
        const links = prev.links.map(cloneLinkConfig);
        while (links.length < capped) links.push(cloneLinkConfig(tpl));
        links.splice(capped);
        return { chainLength: capped, links };
      });
      setSelectedLinkIndex((p) =>
        capped > modelUrls.length ? capped - 1 : Math.min(p, capped - 1),
      );
    },
    [chainConfig.links, detectedLinkCount, modelUrls.length, selectedLinkIndex],
  );

  const handleZoneClick = useCallback((linkIndex: number, surfaceId: SurfaceId) => {
    setSelectedLinkIndex(linkIndex);
    setSelectedSurface(surfaceId);
  }, []);

  const handleResetView = useCallback(() => {
    orbitControlsRef.current?.reset();
  }, []);

  const handleZoomToFit = useCallback(() => {
    if (!sceneRef.current || !orbitControlsRef.current) return;
    const box = new THREE.Box3().setFromObject(sceneRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const ctrl = orbitControlsRef.current;
    const cam = ctrl.object as THREE.PerspectiveCamera;
    const fov = cam.fov * (Math.PI / 180);
    const dist = Math.max(Math.abs(Math.max(size.x, size.y, size.z) / 2 / Math.tan(fov / 2)) * 1.8, 1.2);
    cam.position.set(center.x, center.y + size.y * 0.35, center.z + dist);
    ctrl.target.copy(center);
    ctrl.update();
  }, []);

  const handleDetectedLinkCount = useCallback((count: number) => {
    const n = Math.max(1, Math.min(count, MAX_CHAIN_LINKS));
    setDetectedLinkCount((p) => (n === p ? p : n));
    setModelUrls((p) => p.slice(0, n));
    setChainConfig((p) => {
      if (p.chainLength <= n) return p;
      return { chainLength: n, links: p.links.slice(0, n).map(cloneLinkConfig) };
    });
    setSelectedLinkIndex((p) => Math.min(p, n - 1));
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }, []);

  const handleCameraPreset = useCallback((key: CameraPreset) => {
    const { pos, target } = CAMERA_PRESETS[key];
    animateCameraTo(orbitControlsRef.current, pos.clone(), target.clone());
  }, []);

  // ── Mouse tracking tilt on dock ─────────────────────────────────────────
  useEffect(() => {
    if (isMobile) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseMoveThrottleRef.current !== null) return;
      mouseMoveThrottleRef.current = window.requestAnimationFrame(() => {
        mouseMoveThrottleRef.current = null;
        const el = dockContainerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const rx = ((e.clientY - cy) / window.innerHeight) * -5;
        const ry = ((e.clientX - cx) / window.innerWidth)  *  5;
        el.style.transform = `translateX(-50%) perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
    };
    const handleMouseLeave = () => {
      const el = dockContainerRef.current;
      if (!el) return;
      el.style.transition = "transform 0.55s cubic-bezier(0.34,1.56,0.64,1)";
      el.style.transform   = "translateX(-50%)";
      setTimeout(() => { if (el) el.style.transition = ""; }, 600);
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isMobile]);

  // ── Compact sidebar button ──────────────────────────────────────────────
  const sidebarBtn = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    active = false,
    disabled = false,
  ) => (
    <Tooltip title={label} placement="left" key={label}>
      <span>
        <IconButton
          size="small"
          disabled={disabled}
          onClick={onClick}
          sx={{
            width: 32,
            height: 32,
            borderRadius: "10px",
            bgcolor: active ? "rgba(20,112,105,0.12)" : "rgba(255,255,255,0.62)",
            color: active ? "#0a3530" : "#1a3035",
            border: active ? "1px solid rgba(20,112,105,0.30)" : "1px solid rgba(117,133,139,0.20)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.92)",
            transition: "all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
            "&:hover": {
              bgcolor: active ? "rgba(20,112,105,0.18)" : "rgba(255,255,255,0.92)",
              transform: "scale(1.08)",
            },
            "&:active": { transform: "scale(0.91)" },
            "&.Mui-disabled": { opacity: 0.35 },
          }}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );

  const SD = () => (
    <Divider sx={{ borderColor: "rgba(79,93,99,0.11)", my: "3px" }} />
  );

  return (
    <Box
      suppressHydrationWarning
      sx={{
        height: "100dvh",
        width: "100vw",
        overflow: "hidden",
        background: "linear-gradient(160deg, #f0f4ff 0%, #e8f4f3 45%, #f0ede8 100%)",
      }}
    >
      <ScreenshotModal
        isOpen={showScreenshotModal}
        onClose={() => setShowScreenshotModal(false)}
        onCapture={handleScreenshotCapture}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2400}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          sx={{ borderRadius: "14px" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ height: "100%", position: "relative", overflow: "hidden" }}>
        {/* Canvas — paddingBottom reserves space for the dock so the model is visually centered */}
        <Box
          className="canvas-wrapper"
          sx={{ height: "100%", pb: { xs: "220px", sm: "270px" } }}
        >
          <Canvas
            frameloop={autoRotate || isRecording ? "always" : "demand"}
            dpr={isMobile ? [0.8, 1.15] : [1, 1.35]}
            performance={{ min: 0.6 }}
            gl={{ preserveDrawingBuffer: false, antialias: !isMobile, powerPreference: "high-performance" }}
            camera={{
              position: isMobile ? [0.3, 0.48, 0.86] : [0.36, 0.64, 0.74],
              fov: isMobile ? 36 : 28,
            }}
            style={{ width: "100%", height: "100%", background: "transparent" }}
          >
            <Suspense fallback={null}>
              <Stage environment={background} intensity={0.58} adjustCamera={false} shadows={false}>
                <ModelViewer
                  urls={modelUrls}
                  chainConfig={chainConfig}
                  autoRotate={autoRotate}
                  isRecording={isRecording}
                  onRecordingComplete={handleRecordingComplete}
                  sceneRef={sceneRef as React.MutableRefObject<THREE.Object3D | null>}
                  onZoneClick={handleZoneClick}
                  selectedLinkIndex={selectedLinkIndex}
                  onDetectedLinkCount={handleDetectedLinkCount}
                  isCapturingGIF={isCapturingGIF}
                  onGIFFramesCaptured={handleGIFFramesCaptured}
                />
              </Stage>
              <OrbitControls
                ref={orbitControlsRef}
                makeDefault
                enableDamping={false}
                enablePan={false}
                target={[0, 0.03, 0]}
                minDistance={0.22}
                maxDistance={1.7}
                minPolarAngle={0.08}
                maxPolarAngle={Math.PI / 2 - 0.08}
                autoRotate={autoRotate}
                autoRotateSpeed={1.4}
              />
            </Suspense>
          </Canvas>
        </Box>

        {/* ── Brand badge ───────────────────────────────────────────── */}
        <Box
          sx={{
            position: "absolute",
            left: { xs: 12, sm: 22 },
            top: { xs: 12, sm: 22 },
            zIndex: 13,
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: { xs: 1.4, sm: 1.6 },
            py: 0.9,
            borderRadius: "18px",
            color: "#1a2f33",
            ...glass,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
            Cuban Link
          </Typography>
          <Box sx={{ display: { xs: "none", sm: "block" }, width: "1px", alignSelf: "stretch", bgcolor: "rgba(79,93,99,0.18)" }} />
          <Tooltip title="Number of links in the chain — adjust from the Chain tab" placement="bottom">
            <Typography
              variant="caption"
              sx={{ display: { xs: "none", sm: "block" }, color: "#4a6268", fontWeight: 700, whiteSpace: "nowrap", cursor: "help" }}
            >
              {chainConfig.chainLength} links
            </Typography>
          </Tooltip>
        </Box>

        {/* ── Right sidebar ─────────────────────────────────────────── */}
        <Box
          sx={{
            position: "absolute",
            right: { xs: 10, sm: 16 },
            top: { xs: 10, sm: "50%" },
            transform: { xs: "none", sm: "translateY(-50%)" },
            zIndex: 12,
            p: "5px",
            borderRadius: "18px",
            display: "flex",
            flexDirection: { xs: "row", sm: "column" },
            alignItems: "center",
            gap: "3px",
            ...glass,
          }}
        >
          {/* Camera */}
          {sidebarBtn("Reset view", <Refresh sx={{ fontSize: 16 }} />, handleResetView)}
          {sidebarBtn("Fit model in view", <FitScreen sx={{ fontSize: 16 }} />, handleZoomToFit)}

          {/* View presets — hidden on mobile */}
          <Box sx={{ display: { xs: "none", sm: "contents" } }}>
            <SD />
            {(Object.entries(CAMERA_PRESETS) as [CameraPreset, typeof CAMERA_PRESETS[CameraPreset]][]).map(
              ([key, preset]) =>
                sidebarBtn(
                  `${preset.label} view`,
                  <Typography sx={{ fontSize: 12, lineHeight: 1, fontWeight: 800 }}>{preset.icon}</Typography>,
                  () => handleCameraPreset(key),
                ),
            )}
          </Box>

          {/* Export */}
          <SD />
          {sidebarBtn("Export PNG", <Typography sx={{ fontSize: 9, fontWeight: 800 }}>PNG</Typography>, () => handleQuickExport("png"))}
          {sidebarBtn("Export JPG", <Typography sx={{ fontSize: 9, fontWeight: 800 }}>JPG</Typography>, () => handleQuickExport("jpg"))}
          {sidebarBtn("Export WebP", <Typography sx={{ fontSize: 9, fontWeight: 800 }}>WP</Typography>, () => handleQuickExport("webp"))}
          {sidebarBtn(
            isRecording ? "Stop video recording" : "Record 360° video",
            isRecording
              ? <Box sx={{ width: 9, height: 9, borderRadius: "2px", bgcolor: "#e53935" }} />
              : <CameraAlt sx={{ fontSize: 15 }} />,
            isRecording ? handleStopVideo : handleStartVideo,
            isRecording,
          )}
          {sidebarBtn(
            gifProgress !== "idle" ? `GIF ${gifProgress}…` : "Export animated GIF",
            gifProgress !== "idle"
              ? <CircularProgress size={12} thickness={5} sx={{ color: "#0a3530" }} />
              : <Typography sx={{ fontSize: 9, fontWeight: 800 }}>GIF</Typography>,
            handleStartGIF,
            gifProgress !== "idle",
            gifProgress !== "idle",
          )}

          <SD />
          {sidebarBtn("Screenshot options", <CameraAlt sx={{ fontSize: 15 }} />, () => setShowScreenshotModal(true))}
          {sidebarBtn("Toggle fullscreen", <Fullscreen sx={{ fontSize: 15 }} />, handleToggleFullscreen)}
        </Box>

        {/* ── Customizer dock ──────────────────────────────────────── */}
        <Box
          ref={dockContainerRef}
          sx={{
            position: "absolute",
            left: "50%",
            bottom: { xs: "calc(env(safe-area-inset-bottom) + 8px)", sm: 20 },
            transform: "translateX(-50%)",
            zIndex: 14,
            width: { xs: "calc(100vw - 12px)", sm: "auto" },
            willChange: "transform",
          }}
        >
          <SimpleCustomizerDock
            chainConfig={chainConfig}
            setChainConfig={setChainConfigFromDock}
            selectedSurface={selectedSurface}
            setSelectedSurface={setSelectedSurface}
            selectedLinkIndex={selectedLinkIndex}
            setSelectedLinkIndex={setSelectedLinkIndex}
            onChainLengthChange={handleChainLengthChange}
          />
        </Box>
      </Box>
    </Box>
  );
}
