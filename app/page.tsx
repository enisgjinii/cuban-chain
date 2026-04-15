"use client";

import type React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  IconButton,
  Slide,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { CameraAlt, FitScreen, Refresh, ViewInAr } from "@mui/icons-material";
import { SimpleCustomizerDock } from "@/components/simple-customizer-dock";
import { ModelViewer } from "@/components/model-viewer";
import { ScreenshotModal, type ScreenshotOptions } from "@/components/screenshot-modal";
import type { ChainConfig, LinkConfig, SurfaceConfig, SurfaceId } from "@/lib/chain-config-types";
import { createDefaultConfig, createDefaultLink } from "@/lib/chain-helpers";
import { MAX_CHAIN_LINKS } from "@/lib/chain-geometry";

const DEFAULT_CHAIN_LENGTH = 12;
const DEFAULT_MODEL_URL = "/models/EntireChain.glb";
const DEFAULT_MODEL_URLS = Array(DEFAULT_CHAIN_LENGTH).fill(DEFAULT_MODEL_URL);

type EnvironmentPreset = "city" | "studio" | "sunset" | "dawn" | "night" | "warehouse" | "forest" | "apartment" | "park" | "lobby";

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
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const sceneRef = useRef<THREE.Object3D | null>(null);
  const orbitControlsRef = useRef<any>(null);

  const [modelUrls, setModelUrls] = useState<string[]>(DEFAULT_MODEL_URLS);
  const [detectedLinkCount, setDetectedLinkCount] = useState<number>(MAX_CHAIN_LINKS);
  const [chainConfig, setChainConfig] = useState<ChainConfig>(() =>
    createDefaultConfig(DEFAULT_MODEL_URLS.length)
  );
  const [selectedSurface, setSelectedSurface] = useState<SurfaceId>("top1");
  const [selectedLinkIndex, setSelectedLinkIndex] = useState(0);
  const [background] = useState<EnvironmentPreset>("city");
  const [autoRotate] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
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

  useEffect(() => {
    setChainConfig((previous) => {
      if (previous.chainLength === modelUrls.length) return previous;

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

  const setChainConfigFromDock = useCallback((nextConfig: ChainConfig) => {
    setChainConfig(cloneChainConfig(nextConfig));
  }, []);

  const handleScreenshotCapture = useCallback(
    (options: ScreenshotOptions) => {
      window.dispatchEvent(new CustomEvent("captureImage", { detail: options }));
      showToast("Screenshot captured", "success");
    },
    [showToast]
  );

  const handleRecordingComplete = useCallback(
    (videoBlob: Blob) => {
      setIsRecording(false);
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
      const capped = Math.max(1, Math.min(Math.round(length), detectedLinkCount));
      if (capped === modelUrls.length) return;

      const configTemplate =
        chainConfig.links[selectedLinkIndex] ??
        chainConfig.links[chainConfig.links.length - 1] ??
        createDefaultLink();

      setModelUrls(Array(capped).fill(DEFAULT_MODEL_URL));
      setChainConfig((previous) => {
        const nextLinks = previous.links.map(cloneLinkConfig);
        while (nextLinks.length < capped) {
          nextLinks.push(cloneLinkConfig(configTemplate));
        }
        nextLinks.splice(capped);
        return { chainLength: capped, links: nextLinks };
      });
      setSelectedLinkIndex((previous) =>
        capped > modelUrls.length ? capped - 1 : Math.min(previous, capped - 1)
      );
    },
    [chainConfig.links, detectedLinkCount, modelUrls.length, selectedLinkIndex]
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
    const controls = orbitControlsRef.current;
    const camera = controls.object as THREE.PerspectiveCamera;
    const maxDimension = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const cameraDistance = Math.max(Math.abs(maxDimension / 2 / Math.tan(fov / 2)) * 1.8, 1.2);

    camera.position.set(center.x, center.y + size.y * 0.35, center.z + cameraDistance);
    controls.target.copy(center);
    controls.update();
  }, []);

  const handleDetectedLinkCount = useCallback((count: number) => {
    const supportedCount = Math.max(1, Math.min(count, MAX_CHAIN_LINKS));
    setDetectedLinkCount((previousCount) =>
      supportedCount === previousCount ? previousCount : supportedCount
    );
    setModelUrls((previous) => previous.slice(0, supportedCount));
    setChainConfig((previous) => {
      if (previous.chainLength <= supportedCount) return previous;
      return {
        chainLength: supportedCount,
        links: previous.links.slice(0, supportedCount).map(cloneLinkConfig),
      };
    });
    setSelectedLinkIndex((previous) => Math.min(previous, supportedCount - 1));
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  return (
    <Box
      suppressHydrationWarning
      sx={{
        height: "100dvh",
        width: "100vw",
        overflow: "hidden",
        bgcolor: "#f4f5f2",
      }}
    >
      <ScreenshotModal
        isOpen={showScreenshotModal}
        onClose={() => setShowScreenshotModal(false)}
        onCapture={handleScreenshotCapture}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2200}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
          sx={{ borderRadius: 1.5 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ height: "100%", position: "relative", overflow: "hidden" }}>
        <Box className="canvas-wrapper" sx={{ height: "100%" }}>
          <Canvas
            frameloop={autoRotate || isRecording ? "always" : "demand"}
            dpr={isMobile ? [0.8, 1.15] : [1, 1.35]}
            performance={{ min: 0.6 }}
            gl={{
              preserveDrawingBuffer: false,
              antialias: !isMobile,
              powerPreference: "high-performance",
            }}
            camera={{
              position: isMobile ? [0.3, 0.48, 0.86] : [0.36, 0.64, 0.74],
              fov: isMobile ? 36 : 28,
            }}
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(180deg, #fcfdff 0%, #eef4f3 100%)",
            }}
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
                autoRotateSpeed={1.2}
              />
            </Suspense>
          </Canvas>
        </Box>

        <Box
          sx={{
            position: "absolute",
            left: { xs: 10, sm: 22 },
            top: { xs: 10, sm: 22 },
            zIndex: 13,
            display: "flex",
            alignItems: "center",
            gap: 1,
            maxWidth: "calc(100vw - 96px)",
            px: { xs: 1.1, sm: 1.35 },
            py: 0.8,
            borderRadius: "8px",
            color: "#203035",
            bgcolor: "rgba(249,251,252,0.84)",
            border: "1px solid rgba(117,133,139,0.28)",
            boxShadow: "0 12px 28px rgba(31,45,48,0.1), inset 0 1px 0 rgba(255,255,255,0.85)",
            backdropFilter: "blur(10px) saturate(130%)",
            WebkitBackdropFilter: "blur(10px) saturate(130%)",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.1, whiteSpace: "nowrap" }}>
            Cuban Link
          </Typography>
          <Box
            sx={{
              display: { xs: "none", sm: "block" },
              width: 1,
              alignSelf: "stretch",
              bgcolor: "rgba(79,93,99,0.22)",
            }}
          />
          <Typography
            variant="caption"
            sx={{ display: { xs: "none", sm: "block" }, color: "#52636a", fontWeight: 700, whiteSpace: "nowrap" }}
          >
            {chainConfig.chainLength} links
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "row", sm: "column" }}
          spacing={1}
          sx={{
            position: "absolute",
            right: { xs: 10, sm: 22 },
            top: { xs: 10, sm: "50%" },
            transform: { xs: "none", sm: "translateY(-50%)" },
            zIndex: 12,
            p: 0.6,
            borderRadius: "8px",
            bgcolor: "rgba(249,251,252,0.84)",
            border: "1px solid rgba(117,133,139,0.28)",
            boxShadow: "0 12px 28px rgba(31,45,48,0.1), inset 0 1px 0 rgba(255,255,255,0.85)",
            backdropFilter: "blur(10px) saturate(130%)",
            WebkitBackdropFilter: "blur(10px) saturate(130%)",
            "& .MuiIconButton-root": {
              width: { xs: 34, sm: 36 },
              height: { xs: 34, sm: 36 },
              color: "#263b40",
              borderRadius: "8px",
              backgroundColor: "rgba(255,255,255,0.74)",
              border: "1px solid rgba(117,133,139,0.28)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.78)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.96)" },
            },
          }}
        >
          <Tooltip title="Reset view" placement="left">
            <IconButton size="small" onClick={handleResetView}>
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fit model" placement="left">
            <IconButton size="small" onClick={handleZoomToFit}>
              <FitScreen sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Screenshot" placement="left">
            <IconButton size="small" onClick={() => setShowScreenshotModal(true)}>
              <CameraAlt sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fullscreen" placement="left">
            <IconButton size="small" onClick={handleToggleFullscreen}>
              <ViewInAr sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>

        <Box
          sx={{
            position: "absolute",
            left: "50%",
            bottom: { xs: "calc(env(safe-area-inset-bottom) + 8px)", sm: 24 },
            transform: "translateX(-50%)",
            zIndex: 14,
            width: { xs: "calc(100vw - 16px)", sm: "auto" },
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
