"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useMemo, useCallback, memo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ChainConfig, SurfaceId } from "@/lib/chain-config-types";
import {
  applyChainConfigToScene,
  decomposeIntoLinks,
  getSurfaceIdForMeshName,
  isDiamondMesh,
  isEnamelMesh,
  isEngravingMesh,
  isGemstoneSettingMesh,
  MAX_CHAIN_LINKS,
  toggleDiamondsVisibility,
  setLinkHighlight,
} from "@/lib/chain-geometry";
import {
  detectZoneFromIntersection,
  findLinkContainer,
} from "@/lib/zone-detection";
import { renameMeshesForPatternMatching } from "@/lib/mesh-names";

interface ModelViewerProps {
  urls: string[];
  chainConfig: ChainConfig;
  chainSpacing?: number;
  combineModels?: boolean;
  pairedDuplicate?: boolean;
  autoRotate?: boolean;
  isRecording?: boolean;
  onRecordingComplete?: (videoBlob: Blob) => void;
  sceneRef?: React.MutableRefObject<THREE.Object3D | null>;
  onZoneClick?: (linkIndex: number, surfaceId: SurfaceId) => void;
  selectedLinkIndex?: number | null;
  onDetectedLinkCount?: (count: number) => void;
  onSceneReady?: () => void;
  /** When true, captures GIF_FRAME_COUNT frames then calls onGIFFramesCaptured */
  isCapturingGIF?: boolean;
  onGIFFramesCaptured?: (frames: ImageData[]) => void;
}

const ENTIRE_CHAIN_URL = "/models/EntireChain.glb";
const LINK_OVERLAP_RATIO = 0.58;
const GIF_FRAME_COUNT = 24; // ~2 s at ~12 fps

function optimizeSceneForRuntime(scene: THREE.Object3D): void {
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh) && !(child as THREE.Mesh).isMesh) {
      return;
    }

    const mesh = child as THREE.Mesh;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = true;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
  });
}

function annotateSceneMeshes(scene: THREE.Object3D): void {
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh) && !(child as THREE.Mesh).isMesh) {
      return;
    }

    const mesh = child as THREE.Mesh;
    const surfaceId = getSurfaceIdForMeshName(mesh.name);
    if (surfaceId) {
      mesh.userData.surfaceId = surfaceId;
    } else {
      delete mesh.userData.surfaceId;
    }

    mesh.userData.meshRole = isDiamondMesh(mesh.name)
      ? "gemstone"
      : isEnamelMesh(mesh.name)
        ? "enamel"
        : isEngravingMesh(mesh.name)
          ? "engraving"
          : isGemstoneSettingMesh(mesh.name)
            ? "gemstone-setting"
            : "body";
  });
}

function getSortedLinkContainers(scene: THREE.Object3D): THREE.Object3D[] {
  return scene.children
    .filter((child) => child.userData.linkIndex !== undefined)
    .sort((a, b) => a.userData.linkIndex - b.userData.linkIndex);
}

function cloneLinkContainer(template: THREE.Object3D, linkIndex: number): THREE.Object3D {
  const clone = template.clone(true);
  clone.name = `chain-link-${linkIndex + 1}`;
  clone.userData = {
    ...clone.userData,
    generatedLink: true,
    linkIndex,
  };
  return clone;
}

function createRenderableChainScene(decomposed: THREE.Scene): THREE.Scene {
  const sourceContainers = getSortedLinkContainers(decomposed);

  if (sourceContainers.length !== 1) {
    sourceContainers.forEach((container, index) => {
      container.userData.linkIndex = index;
    });
    decomposed.userData.generatedLinkLayout = false;
    return decomposed;
  }

  const scene = new THREE.Scene();
  const template = sourceContainers[0];
  for (let index = 0; index < MAX_CHAIN_LINKS; index += 1) {
    scene.add(cloneLinkContainer(template, index));
  }
  scene.userData.generatedLinkLayout = true;
  return scene;
}

function layoutGeneratedLinkContainers(
  containers: THREE.Object3D[],
  visibleCount: number,
  chainSpacing: number
): void {
  if (containers.length === 0) {
    return;
  }

  const templateBounds = new THREE.Box3().setFromObject(containers[0]);
  const templateSize = templateBounds.getSize(new THREE.Vector3());
  const pitch = Math.max(templateSize.x * LINK_OVERLAP_RATIO + chainSpacing, templateSize.x * 0.45, 0.04);
  const zOffset = Math.min(templateSize.z * 0.045, 0.008);
  const yOffset = Math.min(templateSize.y * 0.06, 0.004);
  const centerOffset = ((visibleCount - 1) * pitch) / 2;

  containers.forEach((container, index) => {
    container.visible = index < visibleCount;
    container.position.x = index * pitch - centerOffset;
    container.position.y = index % 2 === 0 ? 0 : yOffset;
    container.position.z = index % 2 === 0 ? zOffset : -zOffset;
  });
}

function ModelViewerComponent({
  urls,
  chainConfig,
  chainSpacing = 0.006,
  autoRotate = false,
  isRecording = false,
  onRecordingComplete,
  sceneRef,
  onZoneClick,
  selectedLinkIndex = 0,
  onDetectedLinkCount,
  onSceneReady,
  isCapturingGIF = false,
  onGIFFramesCaptured,
}: ModelViewerProps) {
  const gltf = useGLTF(ENTIRE_CHAIN_URL);

  // Recording state
  const { gl, scene: threeScene, camera, invalidate } = useThree();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const blobCreatedRef = useRef<boolean>(false);
  const recordingLineRef = useRef<THREE.Line | null>(null);
  const blingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Previous selected link for highlight cleanup
  const prevSelectedRef = useRef<number | null>(null);

  // GIF frame capture state
  const gifFramesRef = useRef<ImageData[]>([]);
  const gifFrameCountRef = useRef(0);

  // Use the real GLB chain once; chain length changes only toggle visibility.
  const mainScene = useMemo(() => {
    if (!gltf.scene) return null;

    const cloned = gltf.scene.clone(true);
    renameMeshesForPatternMatching(cloned);
    annotateSceneMeshes(cloned);

    const decomposed = decomposeIntoLinks(cloned);
    const renderableScene = createRenderableChainScene(decomposed);
    optimizeSceneForRuntime(renderableScene);

    const bounds = new THREE.Box3().setFromObject(renderableScene);
    const center = bounds.getCenter(new THREE.Vector3());
    renderableScene.children.forEach((child) => {
      child.position.x -= center.x;
      child.position.z -= center.z;
    });

    const groundedBounds = new THREE.Box3().setFromObject(renderableScene);
    renderableScene.children.forEach((child) => {
      child.position.y -= groundedBounds.min.y;
    });
    renderableScene.position.y = 0.035;

    return renderableScene;
  }, [gltf.scene]);

  const linkContainers = useMemo(() => {
    if (!mainScene) return [];
    return getSortedLinkContainers(mainScene);
  }, [mainScene]);

  // Report detected link count to parent
  useEffect(() => {
    if (!mainScene || !onDetectedLinkCount) return;
    const supportedCount = mainScene.userData.generatedLinkLayout
      ? MAX_CHAIN_LINKS
      : Math.min(linkContainers.length || 1, MAX_CHAIN_LINKS);
    onDetectedLinkCount(supportedCount);
    invalidate();
  }, [linkContainers.length, mainScene, onDetectedLinkCount, invalidate]);

  // Update sceneRef for external access (zoom-to-fit, etc.)
  useEffect(() => {
    if (sceneRef && mainScene) {
      sceneRef.current = mainScene;
      onSceneReady?.();
    }
    invalidate();
  }, [mainScene, onSceneReady, sceneRef, invalidate]);

  // ─── Apply chainConfig to scene whenever it changes ───────────────────
  useEffect(() => {
    if (!mainScene) return;
    applyChainConfigToScene(mainScene, chainConfig);
    invalidate();
  }, [mainScene, chainConfig, invalidate]);

  // ─── Selection highlighting ───────────────────────────────────────────
  useEffect(() => {
    if (!mainScene) return;

    // Remove highlight from previous selection
    if (prevSelectedRef.current !== null) {
      const prev = linkContainers.find(
        (c) => c.userData.linkIndex === prevSelectedRef.current
      );
      if (prev) setLinkHighlight(prev, false);
    }

    // Apply highlight to current selection
    if (selectedLinkIndex !== null && selectedLinkIndex !== undefined) {
      const current = linkContainers.find(
        (c) => c.userData.linkIndex === selectedLinkIndex
      );
      if (current) setLinkHighlight(current, true);
    }

    prevSelectedRef.current = selectedLinkIndex ?? null;
    invalidate();
  }, [linkContainers, mainScene, selectedLinkIndex, chainConfig, invalidate]);

  // ─── Link visibility based on urls.length (chain length control) ──────
  useEffect(() => {
    if (!mainScene) return;

    const visibleCount = urls.length;

    if (mainScene.userData.generatedLinkLayout) {
      layoutGeneratedLinkContainers(linkContainers, visibleCount, chainSpacing);
    } else {
      linkContainers.forEach((container, index) => {
        container.visible = index < visibleCount;
      });
    }
    invalidate();
  }, [chainSpacing, linkContainers, mainScene, urls.length, invalidate]);

  // ─── Image capture event ──────────────────────────────────────────────
  useEffect(() => {
    const handleCaptureImage = (event: CustomEvent) => {
      try {
        const options = event.detail || {};
        const { backgroundColor, addWatermark, watermarkText, format } = options;

        gl.render(threeScene, camera);

        const canvas = gl.domElement;
        const width = canvas.width;
        const height = canvas.height;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext("2d");
        if (!ctx) throw new Error("Could not get 2D context");

        if (backgroundColor && backgroundColor !== "transparent") {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(canvas, 0, 0);

        if (addWatermark && watermarkText) {
          const fontSize = Math.max(16, Math.floor(width * 0.03));
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
          ctx.textAlign = "right";
          ctx.textBaseline = "bottom";
          ctx.fillText(watermarkText, width - 20, height - 20);
        }

        const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
        const dataUrl = tempCanvas.toDataURL(mimeType, 0.95);

        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `cuban-chain-design-${Date.now()}.${format || "png"}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.error("Failed to capture image:", err);
      }
    };

    const handleToggleDiamonds = (event: CustomEvent) => {
      if (!mainScene) return;
      toggleDiamondsVisibility(mainScene, event.detail.visible);
    };

    window.addEventListener("captureImage", handleCaptureImage as EventListener);
    window.addEventListener("toggleDiamonds", handleToggleDiamonds as EventListener);

    return () => {
      window.removeEventListener("captureImage", handleCaptureImage as EventListener);
      window.removeEventListener("toggleDiamonds", handleToggleDiamonds as EventListener);
    };
  }, [mainScene, gl, threeScene, camera]);

  // ─── Recording ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRecording && !mediaRecorderRef.current) {
      const originalClearColor = new THREE.Color();
      gl.getClearColor(originalClearColor);
      const originalClearAlpha = gl.getClearAlpha();
      gl.setClearColor(0xffffff, 1);

      const canvas = gl.domElement;
      const stream = canvas.captureStream(30);

      const mimeTypes = [
        "video/mp4",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];

      const supportedType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedType });

      recordedChunksRef.current = [];
      blobCreatedRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        if (blingIntervalRef.current) {
          clearInterval(blingIntervalRef.current);
          blingIntervalRef.current = null;
        }
        gl.setClearColor(originalClearColor, originalClearAlpha);

        if (recordedChunksRef.current.length > 0 && !blobCreatedRef.current) {
          blobCreatedRef.current = true;
          const blob = new Blob(recordedChunksRef.current, { type: mediaRecorder.mimeType });
          onRecordingComplete?.(blob);
        }

        mediaRecorderRef.current = null;
        recordedChunksRef.current = [];
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      // Recording indicator line
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
      geometry.setFromPoints([new THREE.Vector3(-2, 2, 0), new THREE.Vector3(2, 2, 0)]);
      recordingLineRef.current = new THREE.Line(geometry, material);
      threeScene.add(recordingLineRef.current);

      let blingState = false;
      blingIntervalRef.current = setInterval(() => {
        blingState = !blingState;
        if (recordingLineRef.current) {
          const mat = recordingLineRef.current.material as THREE.LineBasicMaterial;
          mat.color.setHex(blingState ? 0xff0000 : 0xffffff);
        }
      }, 500);
    } else if (!isRecording && mediaRecorderRef.current) {
      if (blingIntervalRef.current) {
        clearInterval(blingIntervalRef.current);
        blingIntervalRef.current = null;
      }
      mediaRecorderRef.current.stop();
      if (recordingLineRef.current) {
        threeScene.remove(recordingLineRef.current);
        recordingLineRef.current = null;
      }
    }
  }, [isRecording, gl, threeScene, onRecordingComplete]);

  // ─── Click handler for zone detection ─────────────────────────────────
  const handlePointerDown = useCallback(
    (event: any) => {
      if (!event.intersections?.length || !onZoneClick) return;

      const intersection = event.intersections[0];
      if (!intersection.object) return;

      const linkContainer = findLinkContainer(intersection.object);
      if (!linkContainer) return;

      const directSurface = intersection.object.userData?.surfaceId as SurfaceId | undefined;
      if (directSurface) {
        onZoneClick(linkContainer.userData.linkIndex, directSurface);
        event.stopPropagation();
        return;
      }

      const result = detectZoneFromIntersection(intersection, linkContainer);
      if (result) {
        onZoneClick(result.linkIndex, result.surfaceId);
      }

      event.stopPropagation();
    },
    [onZoneClick]
  );

  // ─── GIF frame capture ────────────────────────────────────────────────
  useEffect(() => {
    if (isCapturingGIF) {
      gifFramesRef.current = [];
      gifFrameCountRef.current = 0;
    }
  }, [isCapturingGIF]);

  useFrame(({ gl: frameGl, scene: frameScene, camera: frameCam }) => {
    if (!isCapturingGIF || gifFrameCountRef.current >= GIF_FRAME_COUNT) return;

    // Force a render so the canvas is populated (works even with preserveDrawingBuffer=false)
    frameGl.render(frameScene, frameCam);

    const canvas = frameGl.domElement;
    const w = canvas.width;
    const h = canvas.height;
    const tmp = document.createElement("canvas");
    tmp.width = w; tmp.height = h;
    tmp.getContext("2d")!.drawImage(canvas, 0, 0);
    gifFramesRef.current.push(tmp.getContext("2d")!.getImageData(0, 0, w, h));
    gifFrameCountRef.current++;

    if (gifFrameCountRef.current >= GIF_FRAME_COUNT) {
      onGIFFramesCaptured?.(gifFramesRef.current.slice());
      gifFramesRef.current = [];
      gifFrameCountRef.current = 0;
    }
  });

  if (!mainScene) return null;

  return (
    <group onPointerDown={handlePointerDown}>
      <primitive object={mainScene} />
    </group>
  );
}

export const ModelViewer = memo(ModelViewerComponent);

useGLTF.preload(ENTIRE_CHAIN_URL);
