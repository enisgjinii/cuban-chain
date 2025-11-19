"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ChainConfig } from "@/lib/chain-config-types";
import { getMaterialColor } from "@/lib/chain-helpers";
import {
  BASE_LINK_COUNT,
  ADDITIONAL_LINK_MESH_GROUPS,
} from "@/lib/chain-geometry";

interface ModelViewerProps {
  url: string;
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
  selectedLinkIndex?: number;
  isRecording?: boolean;
  onRecordingComplete?: (videoBlob: Blob) => void;
  showRecordingIndicator?: boolean;
  sceneRef?: React.MutableRefObject<any>;
  additionalLinkOffsets?: { x: number; y: number; z: number };
}

export function ModelViewer({
  url,
  chainConfig,
  onMeshesAndNodesExtracted,
  selectedMesh,
  hoveredMesh,
  chainSpacing = 0.95,
  applyMode,
  setApplyMode,
  undoCounter,
  autoFitModel,
  showBoundingBox,
  autoRotate = false,
  selectedLinkIndex = 0,
  isRecording = false,
  onRecordingComplete,
  showRecordingIndicator = false,
  sceneRef,
  additionalLinkOffsets = { x: -0.009, y: 0.007, z: 0.006 },
}: ModelViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const gltf = useGLTF(url);
  const { scene } = gltf;

  // Update sceneRef whenever scene is available
  useEffect(() => {
    if (sceneRef && scene) {
      sceneRef.current = scene;
    }
  }, [scene, sceneRef]);

  // Handle loading state properly
  useEffect(() => {
    // useGLTF handles loading internally, so we'll use a small delay
    // to ensure the model is properly mounted and rendered
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [url]); // Reset loading when URL changes
  const originalMaterials = useRef<Map<string, THREE.Material>>(new Map());
  const originalPositions = useRef<Map<string, THREE.Vector3>>(new Map());
  const appliedHistory = useRef<
    Array<{ name: string; material: THREE.Material }>
  >([]);
  const clonesRef = useRef<THREE.Object3D[]>([]);
  const gemstoneGroupsRef = useRef<THREE.Group[]>([]);
  const boundingBoxRef = useRef<THREE.BoxHelper | null>(null);
  const { gl, scene: threeScene, camera } = useThree();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingLineRef = useRef<THREE.Line | null>(null);
  const blingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const blobCreatedRef = useRef<boolean>(false);

  // Bounding box functionality
  useEffect(() => {
    if (showBoundingBox && scene) {
      // Remove existing bounding box
      if (boundingBoxRef.current) {
        threeScene.remove(boundingBoxRef.current);
        boundingBoxRef.current = null;
      }

      // Create new bounding box
      const box = new THREE.Box3().setFromObject(scene);
      const helper = new THREE.BoxHelper(scene, 0xffff00);
      boundingBoxRef.current = helper;
      threeScene.add(helper);
    } else if (!showBoundingBox && boundingBoxRef.current) {
      // Remove bounding box when disabled
      threeScene.remove(boundingBoxRef.current);
      boundingBoxRef.current = null;
    }
  }, [showBoundingBox, scene, threeScene]);

  // Auto-fit model to prevent cutoff
  useEffect(() => {
    if (autoFitModel && scene) {
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Adjust camera to fit the entire model
      const maxDim = Math.max(size.x, size.y, size.z);
      let cameraZ = 5; // Default distance

      if (camera instanceof THREE.PerspectiveCamera) {
        const perspectiveCamera = camera as THREE.PerspectiveCamera;
        const fov = perspectiveCamera.fov * (Math.PI / 180);
        cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5; // Add some padding
      }

      camera.position.set(center.x, center.y, center.z + cameraZ);
      camera.lookAt(center);
    }
  }, [autoFitModel, scene, camera]);

  // Extract meshes and nodes on load
  useEffect(() => {
    const meshes: string[] = [];
    const nodes: string[] = [];

    scene.traverse((child) => {
      if (child.name) {
        if ((child as THREE.Mesh).isMesh) {
          meshes.push(child.name);
          // Store original material if not already stored
          const meshMaterial = (child as THREE.Mesh).material;
          if (
            !originalMaterials.current.has(child.name) &&
            !(meshMaterial instanceof Array)
          ) {
            originalMaterials.current.set(child.name, meshMaterial.clone());
          }
        } else {
          nodes.push(child.name);
        }
      }
    });

    if (onMeshesAndNodesExtracted) {
      onMeshesAndNodesExtracted(meshes, nodes);
    }
  }, [scene, onMeshesAndNodesExtracted]);

  // Hide the Plane mesh
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.name === "Plane") {
          mesh.visible = false;
        }
      }
    });
  }, [scene]);

  // Control visibility of link meshes based on chainLength
  useEffect(() => {
    if (!scene) return;

    const specialMeshMap = new Map<string, number>();
    ADDITIONAL_LINK_MESH_GROUPS.forEach((names, groupIdx) => {
      names.forEach((name) => specialMeshMap.set(name, groupIdx));
    });

    const regularMeshData: Array<{ mesh: THREE.Mesh; worldPos: THREE.Vector3 }> = [];
    const specialMeshData: Array<Array<{ mesh: THREE.Mesh; worldPos: THREE.Vector3 }>> =
      ADDITIONAL_LINK_MESH_GROUPS.map(() => []);

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        if (!originalPositions.current.has(mesh.uuid)) {
          originalPositions.current.set(mesh.uuid, mesh.position.clone());
        } else {
          const originalPos = originalPositions.current.get(mesh.uuid);
          if (originalPos) {
            mesh.position.copy(originalPos);
          }
        }

        if (mesh.name === "Plane") {
          mesh.visible = false;
          return;
        }

        const worldPos = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);

        const specialGroupIdx = specialMeshMap.get(mesh.name);
        if (specialGroupIdx !== undefined) {
          specialMeshData[specialGroupIdx].push({ mesh, worldPos });
        } else {
          regularMeshData.push({ mesh, worldPos });
        }
      }
    });

    // Sort regular meshes by X position (left to right)
    regularMeshData.sort((a, b) => a.worldPos.x - b.worldPos.x);

    const meshesPerLink = Math.max(
      1,
      Math.ceil(regularMeshData.length / BASE_LINK_COUNT),
    );
    const groupCenters: THREE.Vector3[] = [];
    const groupSpans: number[] = [];

    for (let i = 0; i < BASE_LINK_COUNT; i++) {
      const startIdx = i * meshesPerLink;
      const endIdx = Math.min(startIdx + meshesPerLink, regularMeshData.length);
      const group = regularMeshData.slice(startIdx, endIdx);
      if (!group.length) continue;

      const center = group
        .reduce(
          (acc, entry) => acc.add(entry.worldPos.clone()),
          new THREE.Vector3(),
        )
        .divideScalar(group.length);
      groupCenters.push(center);

      const xs = group.map((entry) => entry.worldPos.x);
      const span = Math.abs(Math.max(...xs) - Math.min(...xs)) || 0.01;
      groupSpans.push(span);

      const shouldShow = i < Math.min(chainConfig.chainLength, BASE_LINK_COUNT);
      group.forEach(({ mesh }) => {
        mesh.visible = shouldShow;
      });
    }

    let baseDirection = new THREE.Vector3(1, 0, 0);
    let baseDistance = 0.02;

    if (groupCenters.length >= 2) {
      baseDirection = groupCenters[groupCenters.length - 1]
        .clone()
        .sub(groupCenters[groupCenters.length - 2]);
      baseDistance = baseDirection.length();
      if (baseDistance === 0) {
        baseDistance =
          groupSpans.reduce((sum, span) => sum + span, 0) /
            (groupSpans.length || 1) || 0.02;
      }
      baseDirection.normalize();
    } else if (regularMeshData.length >= 2) {
      const dir = regularMeshData[regularMeshData.length - 1].worldPos
        .clone()
        .sub(regularMeshData[0].worldPos);
      baseDistance = dir.length() / BASE_LINK_COUNT;
      baseDirection = dir.normalize();
    }

    const averageSpan =
      groupSpans.length > 0
        ? groupSpans.reduce((sum, span) => sum + span, 0) / groupSpans.length
        : baseDistance;

    const effectiveBase = baseDistance || averageSpan || 0.02;
    const spacingMagnitude =
      (effectiveBase + averageSpan * 2.1) * (chainSpacing ?? 1.1);

    const spacingVector = baseDirection.clone().multiplyScalar(spacingMagnitude);

    const lateralShift = new THREE.Vector3(additionalLinkOffsets.x, additionalLinkOffsets.y, additionalLinkOffsets.z);

    specialMeshData.forEach((group, groupIdx) => {
      const requiredLength = BASE_LINK_COUNT + groupIdx + 1;
      const shouldDisplay = chainConfig.chainLength >= requiredLength;
      if (!group.length) return;

      const specialCenter = group
        .reduce(
          (acc, entry) => acc.add(entry.worldPos.clone()),
          new THREE.Vector3(),
        )
        .divideScalar(group.length);

      const lastBaseCenter =
        groupCenters[groupCenters.length - 1] ?? specialCenter.clone();
      const targetCenter = lastBaseCenter
        .clone()
        .add(spacingVector.clone().multiplyScalar(groupIdx + 1))
        .add(lateralShift);
      const offset = targetCenter.clone().sub(specialCenter);

      group.forEach(({ mesh }) => {
        const originalPos = originalPositions.current.get(mesh.uuid);
        if (originalPos) {
          mesh.position.copy(originalPos.clone().add(offset));
        }
        mesh.visible = shouldDisplay;
      });
    });

    console.log("Chain length:", chainConfig.chainLength);
    console.log("Visible base links:", Math.min(chainConfig.chainLength, BASE_LINK_COUNT));
    console.log("Special link groups shown:", specialMeshData.filter((_, idx) => chainConfig.chainLength >= BASE_LINK_COUNT + idx + 1).length);
  }, [scene, chainConfig.chainLength, chainSpacing, additionalLinkOffsets]);

  // Apply materials to the model
  useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        // Hide the Plane mesh
        if (mesh.name === "Plane") {
          mesh.visible = false;
          return;
        }

        // Get material color from the first link (or selected link if available)
        const linkIndex = Math.min(
          selectedLinkIndex || 0,
          chainConfig.links.length - 1,
        );
        const linkConfig = chainConfig.links[linkIndex];
        const materialColor = getMaterialColor(
          linkConfig?.material || "silver",
        );

        // Create and apply material
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(materialColor),
          metalness: 0.9,
          roughness: 0.1,
        });

        mesh.material = material;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [scene, chainConfig.links, selectedLinkIndex]);

  // Recording functionality
  useEffect(() => {
    if (isRecording && !mediaRecorderRef.current) {
      // Store original background and set white background for recording
      const originalClearColor = new THREE.Color();
      gl.getClearColor(originalClearColor);
      const originalClearAlpha = gl.getClearAlpha();
      gl.setClearColor(0xffffff, 1); // White background

      // Start recording
      const canvas = gl.domElement;
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8",
      });

      recordedChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      blobCreatedRef.current = false; // Reset flag for new recording

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Clear bling interval
        if (blingIntervalRef.current) {
          clearInterval(blingIntervalRef.current);
          blingIntervalRef.current = null;
        }

        // Restore original background
        gl.setClearColor(originalClearColor, originalClearAlpha);

        // Create blob only once
        if (recordedChunksRef.current.length > 0 && !blobCreatedRef.current) {
          blobCreatedRef.current = true;
          const blob = new Blob(recordedChunksRef.current, {
            type: "video/webm",
          });
          onRecordingComplete?.(blob);
        }

        // Clear refs
        mediaRecorderRef.current = null;
        recordedChunksRef.current = [];
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      // Add red recording line
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 2,
      });
      const points = [new THREE.Vector3(-2, 2, 0), new THREE.Vector3(2, 2, 0)];
      geometry.setFromPoints(points);
      recordingLineRef.current = new THREE.Line(geometry, material);
      threeScene.add(recordingLineRef.current);

      // Add blinging canvas effect
      let blingState = false;
      blingIntervalRef.current = setInterval(() => {
        blingState = !blingState;
        if (recordingLineRef.current) {
          const material = recordingLineRef.current
            .material as THREE.LineBasicMaterial;
          material.color.setHex(blingState ? 0xff0000 : 0xffffff); // Red to white flash
          material.linewidth = blingState ? 3 : 2;
        }
      }, 500); // Flash every 500ms
    } else if (!isRecording && mediaRecorderRef.current) {
      // Clear bling interval
      if (blingIntervalRef.current) {
        clearInterval(blingIntervalRef.current);
        blingIntervalRef.current = null;
      }

      // Stop recording
      mediaRecorderRef.current.stop();

      // Remove red recording line
      if (recordingLineRef.current) {
        threeScene.remove(recordingLineRef.current);
        recordingLineRef.current = null;
      }
    }
  }, [isRecording, gl, threeScene]);

  // Auto-stop recording after 5 seconds
  useFrame(() => {
    if (
      isRecording &&
      mediaRecorderRef.current &&
      recordingStartTimeRef.current
    ) {
      const elapsed = Date.now() - recordingStartTimeRef.current;
      if (elapsed >= 5000) {
        // 5 seconds
        mediaRecorderRef.current.stop();
      }
    }
  });

  return (
    <>
      <primitive object={scene} position={[0.2, 0, 0]} />
    </>
  );
}
