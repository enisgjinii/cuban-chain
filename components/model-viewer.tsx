"use client";

import { useGLTF, Outlines } from "@react-three/drei";
import { useEffect, useRef, useState, useMemo, useCallback, Fragment } from "react";
import { useFrame, useThree, createPortal } from "@react-three/fiber";
import * as THREE from "three";
import type { ChainConfig, Material } from "@/lib/chain-config-types";
import {
  type ChainAssembly,
  convertUrlsToChainAssembly,
} from "@/lib/chain-manager";
import {
  applyChainConfigToScene,
  applyLinkConfigToContainer,
  createBaseMaterial,
  createGemstoneMaterial,
  createEnamelMaterial,
  toggleDiamondsVisibility,
  isDiamondMesh,
  isEnamelMesh,
  isBodyMesh,
} from "@/lib/chain-geometry";
import {
  detectZoneFromIntersection,
  findLinkContainer,
} from "@/lib/zone-detection";

interface ModelViewerProps {
  urls: string[];
  chainConfig: ChainConfig;
  onMeshesAndNodesExtracted?: (meshes: string[], nodes: string[]) => void;
  selectedMesh?: string | null;
  hoveredMesh?: string | null;
  chainSpacing?: number;
  applyMode?: boolean;
  setApplyMode?: (mode: boolean) => void;
  undoCounter?: number;
  autoFitModel?: boolean;
  showBoundingBox?: boolean;
  autoRotate?: boolean;
  isRecording?: boolean;
  onRecordingComplete?: (videoBlob: Blob) => void;
  showRecordingIndicator?: boolean;
  sceneRef?: React.MutableRefObject<any>;
  // New props for advanced chain management
  chainAssembly?: ChainAssembly;
  onChainAssemblyChange?: (assembly: ChainAssembly) => void;
  // Animation props
  playEntranceAnimation?: boolean;
  onEntranceAnimationComplete?: () => void;
  // Zone click detection
  // Zone click detection
  onZoneClick?: (linkIndex: number, surfaceId: import("@/lib/chain-config-types").SurfaceId) => void;
  selectedLinkIndex?: number | null;
}

// Entrance animation configuration
const ANIMATION_CONFIG = {
  startY: 3,              // Start position above scene
  staggerDelay: 0.08,     // Delay between each link (seconds)
  springStiffness: 180,   // Spring stiffness (higher = faster)
  springDamping: 12,      // Spring damping (lower = more bouncy)
  mass: 1,                // Mass of each link
};

// Simple spring physics helper
function springValue(
  current: number,
  target: number,
  velocity: number,
  stiffness: number,
  damping: number,
  mass: number,
  dt: number
): { value: number; velocity: number } {
  const springForce = -stiffness * (current - target);
  const dampingForce = -damping * velocity;
  const acceleration = (springForce + dampingForce) / mass;
  const newVelocity = velocity + acceleration * dt;
  const newValue = current + newVelocity * dt;
  return { value: newValue, velocity: newVelocity };
}

// Cache for loaded model bounds
const modelBoundsCache: Record<string, THREE.Box3> = {};

// Model-specific connection offsets - these define how each model connects to the chain
// Values are calibrated for proper chain link interlocking
interface ModelConnectionConfig {
  // X offset to apply when this model follows another (for tighter/looser connection)
  connectionOffsetX: number;
  // Whether to flip rotation for alternating pattern
  alternateRotation: boolean;
  // Scale factor if needed
  scale: number;
}

const MODEL_CONNECTION_CONFIG: Record<string, ModelConnectionConfig> = {
  "/models/part1.glb": {
    connectionOffsetX: 0,
    alternateRotation: false,
    scale: 1,
  },
  "/models/part3.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/part4.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/part5.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/part6.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/part7.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/enamel.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/Pattern 1.glb": {
    connectionOffsetX: -0.02,
    alternateRotation: true,
    scale: 1,
  },
  "/models/Cuban-Link.glb": {
    connectionOffsetX: 0,
    alternateRotation: false,
    scale: 1,
  },
};

const getModelConfig = (url: string): ModelConnectionConfig => {
  return MODEL_CONNECTION_CONFIG[url] || {
    connectionOffsetX: 0,
    alternateRotation: false,
    scale: 1,
  };
};

export function ModelViewer({
  urls,
  chainConfig,
  onMeshesAndNodesExtracted,
  selectedMesh,
  hoveredMesh,
  chainSpacing = 0.02,
  applyMode = false,
  setApplyMode,
  undoCounter = 0,
  autoFitModel = false,
  showBoundingBox = false,
  autoRotate = false,
  isRecording = false,
  onRecordingComplete,
  showRecordingIndicator = false,
  sceneRef,
  chainAssembly: externalChainAssembly,
  onChainAssemblyChange,
  playEntranceAnimation = true,
  onEntranceAnimationComplete,
  onZoneClick,
  selectedLinkIndex,
}: ModelViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [internalChainAssembly, setInternalChainAssembly] = useState<ChainAssembly | null>(null);

  // Animation state
  const [animationPlayed, setAnimationPlayed] = useState(false);
  const animationStateRef = useRef<{
    startTime: number;
    linkStates: Array<{ y: number; velocity: number; targetY: number; settled: boolean }>;
  } | null>(null);

  // Use external chain assembly if provided, otherwise use internal
  const chainAssembly = externalChainAssembly || internalChainAssembly;
  const setChainAssembly = useCallback((assembly: ChainAssembly) => {
    if (onChainAssemblyChange) {
      onChainAssemblyChange(assembly);
    } else {
      setInternalChainAssembly(assembly);
    }
  }, [onChainAssemblyChange]);

  // Memoize the URLs string to prevent unnecessary re-renders
  const urlsKey = urls.join(',');

  // Initialize chain assembly from URLs if not provided externally
  useEffect(() => {
    if (!externalChainAssembly && urls.length > 0) {
      const assembly = convertUrlsToChainAssembly(urls, chainSpacing);
      setInternalChainAssembly(assembly);
    }
  }, [urlsKey, chainSpacing, externalChainAssembly]);

  // Load all GLTFs - this is safe because urls array length determines hook count
  const gltfs = urls.map(url => useGLTF(url));

  // Create a stable reference for scenes
  const scenes = useMemo(() => {
    return gltfs.map(gltf => gltf.scene);
  }, [urlsKey, gltfs.length]);

  // Get or calculate centered bounds for a model
  const getCenteredBounds = useCallback((url: string, scene: THREE.Object3D): { bounds: THREE.Box3; center: THREE.Vector3; size: THREE.Vector3 } => {
    if (!modelBoundsCache[url]) {
      modelBoundsCache[url] = new THREE.Box3().setFromObject(scene);
    }
    const bounds = modelBoundsCache[url];
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    return { bounds, center, size };
  }, []);

  // Create the main scene with properly connected chain links
  const mainScene = useMemo(() => {
    const scene = new THREE.Scene();

    // Calculate the link width for consistent spacing (use first model as reference)
    let referenceWidth = 0.05; // Default fallback
    if (scenes[0]) {
      const firstBounds = getCenteredBounds(urls[0], scenes[0]);
      referenceWidth = firstBounds.size.x;
    }

    // First pass: create and position all links
    const containers: THREE.Group[] = [];

    urls.forEach((url, index) => {
      const modelScene = scenes[index];
      if (modelScene) {
        const clonedScene = modelScene.clone(true);
        const { center, size, bounds } = getCenteredBounds(url, modelScene);
        const config = getModelConfig(url);

        // Create a container group to handle positioning
        const container = new THREE.Group();

        // Center the model within its container
        clonedScene.position.set(-center.x, -center.y, -center.z);

        // Apply model-specific scale
        if (config.scale !== 1) {
          clonedScene.scale.setScalar(config.scale);
        }

        container.add(clonedScene);

        // Calculate position along the chain (X-axis only for horizontal line)
        // Use a consistent step size based on reference width and spacing
        // Spacing set to 0.55
        const stepSize = referenceWidth * 0.55;
        const xPos = index * stepSize;

        // Position only on X axis - keep Y and Z at 0 for straight horizontal line
        container.position.set(
          xPos + config.connectionOffsetX,
          0, // Will be adjusted in second pass to align to ground
          0  // Keep all links in the same Z plane for straight line
        );

        // Apply alternating rotation for chain link interlocking effect
        if (config.alternateRotation && index % 2 === 1) {
          // Slight rotation for alternating links to simulate interlocking
          container.rotation.z = Math.PI * 0.02;
        }

        container.userData.linkIndex = index;
        container.userData.url = url;
        container.userData.originalBounds = bounds;
        containers.push(container);
        scene.add(container);
      }
    });

    // Second pass: align all links to the same ground level
    // Find the lowest point across all links
    let lowestY = 0;
    containers.forEach(container => {
      const bounds = new THREE.Box3().setFromObject(container);
      if (bounds.min.y < lowestY) {
        lowestY = bounds.min.y;
      }
    });

    // Adjust all containers so their lowest point is at Y=0
    containers.forEach(container => {
      const bounds = new THREE.Box3().setFromObject(container);
      const adjustment = -bounds.min.y;
      container.position.y += adjustment;
    });

    // Third pass: center the entire chain horizontally and in Z
    if (scene.children.length > 0) {
      const chainBounds = new THREE.Box3().setFromObject(scene);
      const chainCenter = chainBounds.getCenter(new THREE.Vector3());
      scene.children.forEach(child => {
        child.position.x -= chainCenter.x;
        child.position.z -= chainCenter.z;
        // Don't adjust Y - we want them on the ground
      });
    }

    return scene;
  }, [urlsKey, scenes, chainSpacing, getCenteredBounds]);

  // Initialize entrance animation when mainScene is ready
  useEffect(() => {
    if (!mainScene || animationPlayed || !playEntranceAnimation) return;

    const containers = mainScene.children.filter(child =>
      child.userData.linkIndex !== undefined
    );

    if (containers.length === 0) return;

    // Store target Y positions and set initial positions above screen
    const linkStates = containers.map((container) => {
      const targetY = container.position.y;
      container.position.y = targetY + ANIMATION_CONFIG.startY;
      return {
        y: container.position.y,
        velocity: 0,
        targetY,
        settled: false,
      };
    });

    animationStateRef.current = {
      startTime: performance.now(),
      linkStates,
    };
  }, [mainScene, animationPlayed, playEntranceAnimation]);

  // Animate entrance with spring physics
  useFrame((state, delta) => {
    if (!animationStateRef.current || !mainScene) return;

    const containers = mainScene.children.filter(child =>
      child.userData.linkIndex !== undefined
    ).sort((a, b) => a.userData.linkIndex - b.userData.linkIndex);

    const { linkStates, startTime } = animationStateRef.current;
    const elapsed = (performance.now() - startTime) / 1000;

    let allSettled = true;

    containers.forEach((container, index) => {
      const linkState = linkStates[index];
      if (!linkState || linkState.settled) return;

      // Staggered start: each link waits before dropping
      const linkStartTime = index * ANIMATION_CONFIG.staggerDelay;
      if (elapsed < linkStartTime) {
        allSettled = false;
        return;
      }

      // Apply spring physics
      const result = springValue(
        linkState.y,
        linkState.targetY,
        linkState.velocity,
        ANIMATION_CONFIG.springStiffness,
        ANIMATION_CONFIG.springDamping,
        ANIMATION_CONFIG.mass,
        delta
      );

      linkState.y = result.value;
      linkState.velocity = result.velocity;
      container.position.y = result.value;

      // Check if settled (close enough to target with low velocity)
      const distanceToTarget = Math.abs(result.value - linkState.targetY);
      const speed = Math.abs(result.velocity);

      if (distanceToTarget < 0.001 && speed < 0.01) {
        container.position.y = linkState.targetY;
        linkState.settled = true;
      } else {
        allSettled = false;
      }
    });

    if (allSettled) {
      animationStateRef.current = null;
      setAnimationPlayed(true);
      onEntranceAnimationComplete?.();
    }
  });

  // Update sceneRef
  useEffect(() => {
    if (sceneRef && mainScene) {
      sceneRef.current = mainScene;
    }
  }, [mainScene, sceneRef]);

  // Apply chainConfig to the scene whenever it changes
  useEffect(() => {
    if (!mainScene) return;

    // Apply the chain configuration to all links
    applyChainConfigToScene(mainScene, chainConfig);
  }, [mainScene, chainConfig]);

  // Handle loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [urls.join(',')]);

  const boundingBoxRefs = useRef<THREE.BoxHelper[]>([]);
  const { gl, scene: threeScene, camera } = useThree();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingLineRef = useRef<THREE.Line | null>(null);
  const blingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const blobCreatedRef = useRef<boolean>(false);

  // Cleanup bounding boxes on unmount
  useEffect(() => {
    return () => {
      boundingBoxRefs.current.forEach(box => {
        threeScene.remove(box);
      });
      boundingBoxRefs.current = [];
    };
  }, [threeScene]);

  // Individual bounding boxes for each model
  useEffect(() => {
    boundingBoxRefs.current.forEach(box => {
      threeScene.remove(box);
    });
    boundingBoxRefs.current = [];

    if (showBoundingBox && mainScene) {
      mainScene.children.forEach((child) => {
        if (child instanceof THREE.Object3D) {
          const helper = new THREE.BoxHelper(child, 0x00ff00);
          boundingBoxRefs.current.push(helper);
          threeScene.add(helper);
        }
      });
    }
  }, [showBoundingBox, mainScene, threeScene]);

  // Auto-fit model
  useEffect(() => {
    if (autoFitModel && mainScene) {
      const box = new THREE.Box3().setFromObject(mainScene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      let cameraZ = 5;

      if (camera instanceof THREE.PerspectiveCamera) {
        const fov = camera.fov * (Math.PI / 180);
        cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5;
      }

      camera.position.set(center.x, center.y, center.z + cameraZ);
      camera.lookAt(center);
    }
  }, [autoFitModel, mainScene, camera]);

  // Extract meshes and nodes
  useEffect(() => {
    const meshes: string[] = [];
    const nodes: string[] = [];

    mainScene.traverse((child) => {
      if (child.name) {
        if ((child as THREE.Mesh).isMesh) {
          meshes.push(child.name);
        } else {
          nodes.push(child.name);
        }
      }
    });

    if (onMeshesAndNodesExtracted) {
      onMeshesAndNodesExtracted(meshes, nodes);
    }
  }, [mainScene, onMeshesAndNodesExtracted]);

  // Event listeners for material application
  useEffect(() => {
    const handleMaterialApplication = (event: CustomEvent) => {
      const { material, targetModel, targetIndex } = event.detail;

      mainScene.children.forEach((child, index) => {
        let shouldApply = false;

        if (targetModel === "all") {
          shouldApply = true;
        } else if (targetIndex >= 0) {
          shouldApply = index === targetIndex;
        } else {
          shouldApply = child.userData.url === targetModel;
        }

        if (shouldApply) {
          child.traverse((mesh) => {
            if (mesh instanceof THREE.Mesh) {
              // Only apply to body meshes, not diamonds or enamel
              if (isBodyMesh(mesh.name) && !isDiamondMesh(mesh.name) && !isEnamelMesh(mesh.name)) {
                mesh.material = createBaseMaterial(material as Material);
              }
            }
          });
        }
      });
    };

    // Handle surface customization events
    const handleSurfaceApplication = (event: CustomEvent) => {
      const { linkIndex, surfaceId, surfaceConfig } = event.detail;

      if (linkIndex >= 0 && linkIndex < mainScene.children.length) {
        const container = mainScene.children[linkIndex];
        const linkConfig = chainConfig.links[linkIndex];
        if (linkConfig) {
          applyLinkConfigToContainer(container, linkConfig);
        }
      }
    };

    // Handle toggle diamonds visibility
    const handleToggleDiamonds = (event: CustomEvent) => {
      const { visible } = event.detail;
      toggleDiamondsVisibility(mainScene, visible);
    };

    const handleCaptureImage = () => {
      try {
        const dataUrl = gl.domElement.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `chain-design-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.error("Failed to capture image:", err);
      }
    };

    window.addEventListener("applyMaterialToModel", handleMaterialApplication as EventListener);
    window.addEventListener("applySurfaceConfig", handleSurfaceApplication as EventListener);
    window.addEventListener("toggleDiamonds", handleToggleDiamonds as EventListener);
    window.addEventListener("captureImage", handleCaptureImage as EventListener);

    return () => {
      window.removeEventListener("applyMaterialToModel", handleMaterialApplication as EventListener);
      window.removeEventListener("applySurfaceConfig", handleSurfaceApplication as EventListener);
      window.removeEventListener("toggleDiamonds", handleToggleDiamonds as EventListener);
      window.removeEventListener("captureImage", handleCaptureImage as EventListener);
    };
  }, [mainScene, chainConfig, gl]);



  // Recording functionality
  useEffect(() => {
    if (isRecording && !mediaRecorderRef.current) {
      const originalClearColor = new THREE.Color();
      gl.getClearColor(originalClearColor);
      const originalClearAlpha = gl.getClearAlpha();
      gl.setClearColor(0xffffff, 1);

      const canvas = gl.domElement;
      const stream = canvas.captureStream(30);

      // Determine the best supported mime type, prioritizing MP4
      const mimeTypes = [
        "video/mp4",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];

      const supportedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedType,
      });

      recordedChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      blobCreatedRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (blingIntervalRef.current) {
          clearInterval(blingIntervalRef.current);
          blingIntervalRef.current = null;
        }

        gl.setClearColor(originalClearColor, originalClearAlpha);

        if (recordedChunksRef.current.length > 0 && !blobCreatedRef.current) {
          blobCreatedRef.current = true;
          // Use the actual mime type used by the recorder for the blob
          const blob = new Blob(recordedChunksRef.current, { type: mediaRecorder.mimeType });
          onRecordingComplete?.(blob);
        }

        mediaRecorderRef.current = null;
        recordedChunksRef.current = [];
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
      const points = [new THREE.Vector3(-2, 2, 0), new THREE.Vector3(2, 2, 0)];
      geometry.setFromPoints(points);
      recordingLineRef.current = new THREE.Line(geometry, material);
      threeScene.add(recordingLineRef.current);

      let blingState = false;
      blingIntervalRef.current = setInterval(() => {
        blingState = !blingState;
        if (recordingLineRef.current) {
          const mat = recordingLineRef.current.material as THREE.LineBasicMaterial;
          mat.color.setHex(blingState ? 0xff0000 : 0xffffff);
          mat.linewidth = blingState ? 3 : 2;
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

  // No auto-stop recording logic needed anymore as it's controlled by props
  // Handle click on link to detect zone
  const handlePointerDown = useCallback((event: any) => {
    if (!onZoneClick || !event.intersections?.length) return;

    // Get the first intersection
    const intersection = event.intersections[0];
    if (!intersection.object) return;

    // Find the link container (parent with linkIndex userData)
    const linkContainer = findLinkContainer(intersection.object);
    if (!linkContainer) return;

    // Detect the zone from the intersection
    const result = detectZoneFromIntersection(intersection, linkContainer);
    if (result) {
      onZoneClick(result.linkIndex, result.surfaceId);
    }

    event.stopPropagation();
  }, [onZoneClick]);

  // Helper component for highlighting
  const LinkHighlighter = useMemo(() => {
    if (selectedLinkIndex === undefined || selectedLinkIndex === null || !mainScene) return null;

    // Find the container for the selected link
    const container = mainScene.children.find(
      child => child.userData.linkIndex === selectedLinkIndex
    );

    if (!container) return null;

    // Find body meshes to highlight
    const bodyMeshes: THREE.Mesh[] = [];
    container.traverse((child) => {
      if (child instanceof THREE.Mesh && isBodyMesh(child.name) && !isDiamondMesh(child.name) && !isEnamelMesh(child.name)) {
        bodyMeshes.push(child);
      }
    });

    return bodyMeshes.map((mesh) => (
      <Fragment key={mesh.uuid}>
        {createPortal(
          <Outlines thickness={0.03} color="#f59e0b" screenspace={false} opacity={1} transparent={false} angle={0} />,
          mesh
        )}
      </Fragment>
    ));
  }, [selectedLinkIndex, mainScene]);

  return (
    <group onPointerDown={handlePointerDown}>
      <primitive object={mainScene} />
      {LinkHighlighter}
    </group>
  );
}
