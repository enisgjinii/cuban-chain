"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState, useMemo, useCallback, memo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
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
  combineModels?: boolean;
  showDuplicate?: boolean;
  pairedDuplicate?: boolean;
  duplicatePosition?: [number, number, number];
  duplicateRotationX?: number;
  duplicateRotationY?: number;
  duplicateRotationZ?: number;
  duplicateScale?: number;
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
  onZoneClick?: (linkIndex: number, surfaceId: import("@/lib/chain-config-types").SurfaceId) => void;
  selectedLinkIndex?: number | null;
  onModelPicked?: () => void;
  onDuplicateSnap?: (data: {
    position: [number, number, number];
    rotationX: number;
    rotationY: number;
    rotationZ: number;
    scale: number;
  }) => void;
  onDuplicateTarget?: (offset: [number, number, number]) => void;
  snapNowCounter?: number;
  snapEnabled?: boolean;
  snapDistance?: number;
  snapAngleDeg?: number;
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
const ENTIRE_CHAIN_URL = "/models/EntireChain.glb";

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

interface DuplicateSnapTransform {
  offset: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  groundBias: number;
}

const MODEL_CONNECTION_CONFIG: Record<string, ModelConnectionConfig> = {
  "/models/Cuban_Main.glb": {
    connectionOffsetX: 0,
    alternateRotation: false,
    scale: 1,
  },
  "/models/cuban_top_flat.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/cuban_top_diamond.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/cuban_top_engraving.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/cuban_top_filling.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/cuban_top_cavity.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/cuban_top_cavity_diamond.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/cuban_side_flat.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/cuban_side_diamond.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/cuban_side_engraving.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/cuban_side_filling.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/cuban_side_cavity.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
    scale: 1,
  },
  "/models/cuban_side_cavity_diamond.glb": {
    connectionOffsetX: -0.01,
    alternateRotation: true,
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

const getDuplicateSnapTransform = (
  url: string | undefined,
  size: THREE.Vector3,
  pairedDuplicate: boolean
): DuplicateSnapTransform => {
  if (pairedDuplicate && url === "/models/Cuban_Main.glb") {
    const linkSpan = Math.max(size.x, size.z);
    return {
      // Mirror the second link across the opening and keep the diagonal offset tight enough to read as one snapped pair.
      offset: new THREE.Vector3(-linkSpan * 0.56, 0, linkSpan * 0.22),
      rotation: new THREE.Euler(0, Math.PI, 0),
      scale: 1,
      groundBias: 0,
    };
  }

  return {
    offset: new THREE.Vector3(size.x * 1.05, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    scale: 1,
    groundBias: 0,
  };
};

const placeObjectOnGround = (object: THREE.Object3D, groundBias = 0) => {
  const bounds = new THREE.Box3().setFromObject(object);
  object.position.y -= bounds.min.y + groundBias;
};

function ModelViewerComponent({
  urls,
  chainConfig,
  onMeshesAndNodesExtracted,
  selectedMesh,
  hoveredMesh,
  chainSpacing = 0.02,
  combineModels = false,
  showDuplicate = false,
  pairedDuplicate = false,
  duplicatePosition = [0.12, 0, 0],
  duplicateRotationX = 0,
  duplicateRotationY = 0,
  duplicateRotationZ = 0,
  duplicateScale = 1,
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
  onModelPicked,
  onDuplicateSnap,
  onDuplicateTarget,
  snapNowCounter = 0,
  snapEnabled = false,
  snapDistance = 0.02,
  snapAngleDeg = 6,
}: ModelViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [internalChainAssembly, setInternalChainAssembly] = useState<ChainAssembly | null>(null);
  const [duplicateObject, setDuplicateObject] = useState<THREE.Object3D | null>(null);
  const shouldShowDuplicate = showDuplicate || pairedDuplicate;
  const lastSnapCounterRef = useRef<number>(0);
  const lastTargetOffsetRef = useRef<THREE.Vector3 | null>(null);

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
  const isRawEntireChainMode = urls.length === 1 && urls[0] === ENTIRE_CHAIN_URL;

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
    // Safety check: if no URLs or scenes aren't ready, return null
    if (!urls || urls.length === 0 || scenes.length !== urls.length) {
      return null;
    }

    if (isRawEntireChainMode && scenes[0]) {
      const rawScene = new THREE.Scene();
      const container = new THREE.Group();
      const clonedScene = scenes[0].clone(true);
      const bounds = new THREE.Box3().setFromObject(clonedScene);
      const center = bounds.getCenter(new THREE.Vector3());

      clonedScene.position.set(-center.x, -center.y, -center.z);
      container.add(clonedScene);

      const groundedBounds = new THREE.Box3().setFromObject(container);
      container.position.y -= groundedBounds.min.y;
      container.userData.linkIndex = 0;
      container.userData.url = ENTIRE_CHAIN_URL;

      rawScene.add(container);
      return rawScene;
    }

    const scene = new THREE.Scene();

    let referenceBounds: THREE.Box3 | null = null;
    let referenceCenter: THREE.Vector3 | null = null;
    if (combineModels && scenes[0]) {
      const refScene = scenes[0].clone(true);
      const { center: refCenter } = getCenteredBounds(urls[0], scenes[0]);
      refScene.position.set(-refCenter.x, -refCenter.y, -refCenter.z);
      referenceBounds = new THREE.Box3().setFromObject(refScene);
      referenceCenter = referenceBounds.getCenter(new THREE.Vector3());
    }

    // First pass: create and position all links
    const containers: THREE.Group[] = [];
    let previousCenterX = 0;
    let previousHalfWidth = 0;

    urls.forEach((url, index) => {
      const modelScene = scenes[index];
      // Skip if model scene isn't ready
      if (!modelScene) return;

      if (modelScene) {
        const clonedScene = modelScene.clone(true);
        const { center, size, bounds } = getCenteredBounds(url, modelScene);
        const config = getModelConfig(url);
        const scaledWidth = size.x * config.scale;
        const currentHalfWidth = scaledWidth / 2;

        // Create a container group to handle positioning
        const container = new THREE.Group();

        // Center the model within its container
        clonedScene.position.set(-center.x, -center.y, -center.z);

        // Apply model-specific scale
        if (config.scale !== 1) {
          clonedScene.scale.setScalar(config.scale);
        }

        container.add(clonedScene);

        if (combineModels) {
          let offset = new THREE.Vector3(0, 0, 0);
          if (referenceBounds && referenceCenter) {
            const centeredBounds = new THREE.Box3().setFromObject(clonedScene);
            const centeredCenter = centeredBounds.getCenter(new THREE.Vector3());
            const centerDelta = referenceCenter.clone().sub(centeredCenter);
            const yDelta = referenceBounds.min.y - centeredBounds.min.y;
            offset = new THREE.Vector3(centerDelta.x, yDelta, centerDelta.z);
          }
          container.position.copy(offset);
        } else {
          // Position links side-by-side using their actual widths instead of the old overlap factor.
          const xPos =
            index === 0
              ? 0
              : previousCenterX + previousHalfWidth + currentHalfWidth + chainSpacing;

          container.position.set(
            xPos + config.connectionOffsetX,
            0,
            0
          );

          // Apply alternating rotation for chain link interlocking effect
          if (config.alternateRotation && index % 2 === 1) {
            // Slight rotation for alternating links to simulate interlocking
            container.rotation.z = Math.PI * 0.02;
          }

          previousCenterX = xPos;
          previousHalfWidth = currentHalfWidth;
        }

        container.userData.linkIndex = combineModels ? 0 : index;
        container.userData.url = url;
        container.userData.originalBounds = bounds;
        containers.push(container);
        scene.add(container);
      }
    });

    if (!combineModels) {
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
    }

    return scene;
  }, [urlsKey, scenes, chainSpacing, getCenteredBounds, combineModels, isRawEntireChainMode]);

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

    if (isRawEntireChainMode) {
      return;
    }

    if (combineModels) {
      const linkConfig = chainConfig.links[0];
      if (!linkConfig) return;
      mainScene.children.forEach((child) => {
        applyLinkConfigToContainer(child, linkConfig);
      });
      if (duplicateObject) {
        applyLinkConfigToContainer(duplicateObject, linkConfig);
      }
      return;
    }

    // Apply the chain configuration to all links
    applyChainConfigToScene(mainScene, chainConfig);

    if (duplicateObject) {
      const sourceLinkIndex = duplicateObject.userData.sourceLinkIndex ?? 0;
      const duplicateConfig = chainConfig.links[sourceLinkIndex] ?? chainConfig.links[0];
      if (duplicateConfig) {
        applyLinkConfigToContainer(duplicateObject, duplicateConfig);
      }
    }
  }, [mainScene, chainConfig, combineModels, duplicateObject, isRawEntireChainMode]);

  useEffect(() => {
    if (!mainScene || !shouldShowDuplicate) {
      setDuplicateObject(null);
      return;
    }

    const baseChild = mainScene.children.find((child) => child.userData.linkIndex !== undefined) || mainScene.children[0];
    if (!baseChild) return;

    // Get bounds for proper side-by-side placement
    const bounds = new THREE.Box3().setFromObject(baseChild);
    const size = bounds.getSize(new THREE.Vector3());
    const snapTransform = getDuplicateSnapTransform(
      baseChild.userData.url,
      size,
      pairedDuplicate
    );

    const clone = baseChild.clone(true);
    // Place the duplicate using the snap transform so paired links can interlock immediately.
    clone.position.set(
      baseChild.position.x + snapTransform.offset.x,
      baseChild.position.y + snapTransform.offset.y,
      baseChild.position.z + snapTransform.offset.z
    );
    clone.rotation.set(
      baseChild.rotation.x + snapTransform.rotation.x,
      baseChild.rotation.y + snapTransform.rotation.y,
      baseChild.rotation.z + snapTransform.rotation.z
    );
    clone.scale.copy(baseChild.scale).multiplyScalar(snapTransform.scale);
    placeObjectOnGround(clone, snapTransform.groundBias);
    clone.userData.linkIndex = 0;
    clone.userData.isDuplicate = true;
    clone.userData.sourceLinkIndex = baseChild.userData.linkIndex ?? 0;

    setDuplicateObject(clone);
  }, [mainScene, shouldShowDuplicate, pairedDuplicate]);

  // Update duplicate position/rotation from props (offsets relative to original)
  useEffect(() => {
    if (!duplicateObject || !mainScene) return;
    const baseChild = mainScene.children.find((child) => child.userData.linkIndex !== undefined) || mainScene.children[0];
    if (!baseChild) return;

    const bounds = new THREE.Box3().setFromObject(baseChild);
    const size = bounds.getSize(new THREE.Vector3());
    const snapTransform = getDuplicateSnapTransform(
      baseChild.userData.url,
      size,
      pairedDuplicate
    );
    const targetOffset = snapTransform.offset.clone();
    const currentOffset = pairedDuplicate
      ? targetOffset.clone()
      : new THREE.Vector3(
          duplicatePosition[0],
          duplicatePosition[1],
          duplicatePosition[2]
        );

    if (!lastTargetOffsetRef.current || !lastTargetOffsetRef.current.equals(targetOffset)) {
      lastTargetOffsetRef.current = targetOffset.clone();
      onDuplicateTarget?.([targetOffset.x, targetOffset.y, targetOffset.z]);
    }

    const forceSnap = snapNowCounter !== lastSnapCounterRef.current;
    if (forceSnap) {
      lastSnapCounterRef.current = snapNowCounter;
    }

    const snapAngleRad = (snapAngleDeg * Math.PI) / 180;

    const shouldSnap =
      pairedDuplicate ||
      forceSnap ||
      (
        snapEnabled &&
        currentOffset.distanceTo(targetOffset) < snapDistance &&
        Math.abs(duplicateRotationY - snapTransform.rotation.y) < snapAngleRad
      );

    let finalOffset = currentOffset;
    let finalRotX = duplicateRotationX;
    let finalRotY = duplicateRotationY;
    let finalRotZ = duplicateRotationZ;
    let finalScale = duplicateScale;

    if (shouldSnap) {
      finalOffset = targetOffset;
      finalRotX = snapTransform.rotation.x;
      finalRotY = snapTransform.rotation.y;
      finalRotZ = snapTransform.rotation.z;
      finalScale = snapTransform.scale;

      const alreadySnapped =
        currentOffset.distanceTo(targetOffset) < 0.0001 &&
        Math.abs(duplicateRotationX - snapTransform.rotation.x) < 0.0001 &&
        Math.abs(duplicateRotationY - snapTransform.rotation.y) < 0.0001 &&
        Math.abs(duplicateRotationZ - snapTransform.rotation.z) < 0.0001 &&
        Math.abs(duplicateScale - snapTransform.scale) < 0.0001;

      if (!alreadySnapped || forceSnap) {
        onDuplicateSnap?.({
          position: [finalOffset.x, finalOffset.y, finalOffset.z],
          rotationX: finalRotX,
          rotationY: finalRotY,
          rotationZ: finalRotZ,
          scale: finalScale,
        });
      }
    }

    duplicateObject.position.set(
      baseChild.position.x + finalOffset.x,
      baseChild.position.y + finalOffset.y,
      baseChild.position.z + finalOffset.z
    );
    duplicateObject.rotation.x = baseChild.rotation.x + finalRotX;
    duplicateObject.rotation.y = baseChild.rotation.y + finalRotY;
    duplicateObject.rotation.z = baseChild.rotation.z + finalRotZ;
    duplicateObject.scale.copy(baseChild.scale).multiplyScalar(finalScale);
    placeObjectOnGround(duplicateObject, snapTransform.groundBias);
  }, [
    duplicateObject,
    mainScene,
    duplicatePosition[0],
    duplicatePosition[1],
    duplicatePosition[2],
    duplicateRotationX,
    duplicateRotationY,
    duplicateRotationZ,
    duplicateScale,
    onDuplicateSnap,
    onDuplicateTarget,
    pairedDuplicate,
    snapNowCounter,
    snapEnabled,
    snapDistance,
    snapAngleDeg,
  ]);

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

  const prevExtractedRef = useRef({ meshStr: '', nodeStr: '' });

  // Extract meshes and nodes
  useEffect(() => {
    const meshes: string[] = [];
    const nodes: string[] = [];

    if (!mainScene) return;

    mainScene.traverse((child) => {
      if (child.name) {
        if ((child as THREE.Mesh).isMesh) {
          meshes.push(child.name);
        } else {
          nodes.push(child.name);
        }
      }
    });

    // Only update if content actually changed to avoid loop
    const meshStr = meshes.sort().join(',');
    const nodeStr = nodes.sort().join(',');
    
    if (prevExtractedRef.current.meshStr !== meshStr || prevExtractedRef.current.nodeStr !== nodeStr) {
        if (onMeshesAndNodesExtracted) {
            onMeshesAndNodesExtracted(meshes, nodes);
        }
        prevExtractedRef.current = { meshStr, nodeStr };
    }
  }, [mainScene, onMeshesAndNodesExtracted]);

  // Event listeners for material application
  useEffect(() => {
    const handleMaterialApplication = (event: CustomEvent) => {
      if (isRawEntireChainMode) return;
      const { material, targetModel, targetIndex } = event.detail;

      if (!mainScene) return;

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

      if (duplicateObject && (targetModel === "all" || targetIndex === -1)) {
        duplicateObject.traverse((mesh) => {
          if (mesh instanceof THREE.Mesh) {
            if (isBodyMesh(mesh.name) && !isDiamondMesh(mesh.name) && !isEnamelMesh(mesh.name)) {
              mesh.material = createBaseMaterial(material as Material);
            }
          }
        });
      }
    };

    // Handle surface customization events
    const handleSurfaceApplication = (event: CustomEvent) => {
      if (isRawEntireChainMode) return;
      const { linkIndex, surfaceId, surfaceConfig } = event.detail;

      if (!mainScene) return;

      if (combineModels) {
        const linkConfig = chainConfig.links[0];
        if (!linkConfig) return;
        mainScene.children.forEach((container) => {
          applyLinkConfigToContainer(container, linkConfig);
        });
        if (duplicateObject) {
          applyLinkConfigToContainer(duplicateObject, linkConfig);
        }
        return;
      }

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
      if (isRawEntireChainMode) return;
      const { visible } = event.detail;
      if (!mainScene) return;
      toggleDiamondsVisibility(mainScene, visible);
    };

    const handleCaptureImage = (event: CustomEvent) => {
      try {
        const options = event.detail || {};
        const { backgroundColor, addWatermark, watermarkText, resolution, format } = options;

        // Force a render to ensure the buffer is fresh
        gl.render(threeScene, camera);

        // Get the canvas content
        const canvas = gl.domElement;
        const width = canvas.width;
        const height = canvas.height;

        // Create a temporary canvas for composition
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext("2d");

        if (!ctx) throw new Error("Could not get 2D context");

        // 1. Draw Background
        if (backgroundColor && backgroundColor !== "transparent") {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, width, height);
        }

        // 2. Draw 3D Scale (flip Y if needed, but usually toDataURL is correct)
        ctx.drawImage(canvas, 0, 0);

        // 3. Add Watermark
        if (addWatermark && watermarkText) {
          const fontSize = Math.max(16, Math.floor(width * 0.03));
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = "rgba(128, 128, 128, 0.5)"; // Semi-transparent gray
          ctx.textAlign = "right";
          ctx.textBaseline = "bottom";
          ctx.fillText(watermarkText, width - 20, height - 20);
        }

        // 4. Download
        const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
        const dataUrl = tempCanvas.toDataURL(mimeType, 0.95); // High quality for JPG

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
  }, [mainScene, chainConfig, gl, combineModels, duplicateObject, isRawEntireChainMode]);



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

  // Handle click on link to detect zone
  const handlePointerDown = useCallback((event: any) => {
    if (!event.intersections?.length) return;

    const intersection = event.intersections[0];
    if (!intersection.object) return;

    onModelPicked?.();

    if (!onZoneClick) return;

    const linkContainer = findLinkContainer(intersection.object);
    if (!linkContainer) return;

    const result = detectZoneFromIntersection(intersection, linkContainer);
    if (result) {
      onZoneClick(result.linkIndex, result.surfaceId);
    }

    event.stopPropagation();
  }, [onZoneClick, onModelPicked]);

  if (!mainScene) return null;

  return (
    <group onPointerDown={handlePointerDown}>
      <primitive object={mainScene} />
      {duplicateObject && (
        <primitive object={duplicateObject} />
      )}
    </group>
  );
}

export const ModelViewer = memo(ModelViewerComponent);
