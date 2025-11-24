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
  DEFAULT_ADDITIONAL_LINK_OFFSET,
  type AdditionalLinkOffsetMap,
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
  additionalLinkOffsets?: AdditionalLinkOffsetMap;
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
  additionalLinkOffsets = {},
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

    // Remove any previously created extra-link clones before recalculating
    if (clonesRef.current.length) {
      clonesRef.current.forEach((obj) => {
        try {
          scene.remove(obj);
        } catch {}
      });
      clonesRef.current = [];
    }

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

        // Skip any previously created extra-link clones from being grouped as regular meshes
        if ((mesh as any).userData?.__isExtraLinkClone) {
          return;
        }

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
    const baseAnchor =
      groupCenters[groupCenters.length - 1]?.clone() ?? new THREE.Vector3();

    const getOffsetVector = (linkNumber: number) => {
      const offsets =
        additionalLinkOffsets?.[linkNumber] ?? DEFAULT_ADDITIONAL_LINK_OFFSET;
      return new THREE.Vector3(offsets.x, offsets.y, offsets.z);
    };

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

      const linkNumber = BASE_LINK_COUNT + groupIdx + 1;
      const lateralShift = getOffsetVector(linkNumber);
      const targetCenter = baseAnchor
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

    // Clone the first additional group if we need more extra links than are provided in the model
    const totalNeededExtras = Math.max(chainConfig.chainLength - BASE_LINK_COUNT, 0);
    const providedExtras = ADDITIONAL_LINK_MESH_GROUPS.length;
    const missingExtras = Math.max(totalNeededExtras - providedExtras, 0);

    if (missingExtras > 0 && specialMeshData.length > 0) {
      const sourceGroup = specialMeshData[0]; // Reuse the 8th-link meshes "as-is"
      if (sourceGroup.length > 0) {
        const sourceOriginalCenter = sourceGroup
          .reduce((acc, entry) => acc.add(entry.worldPos.clone()), new THREE.Vector3())
          .divideScalar(sourceGroup.length);

        for (let i = 0; i < missingExtras; i++) {
          const groupIdx = providedExtras + i;
          const linkNumber = BASE_LINK_COUNT + groupIdx + 1;
          const lateralShift = getOffsetVector(linkNumber);
          const targetCenter = baseAnchor
            .clone()
            .add(spacingVector.clone().multiplyScalar(groupIdx + 1))
            .add(lateralShift);
          const offset = targetCenter.clone().sub(sourceOriginalCenter);

          // Create clones for each mesh in the source group
          sourceGroup.forEach(({ mesh }) => {
            const clone = mesh.clone(true) as THREE.Mesh;
            
            // Use the original position from the ref
            const srcOriginalPos = originalPositions.current.get(mesh.uuid) ?? mesh.position.clone();
            clone.position.copy(srcOriginalPos.clone().add(offset));
            clone.visible = true;
            clone.name = `${mesh.name}_extra_${providedExtras + i + 1}`;
            (clone as any).userData = {
              ...(clone as any).userData,
              __isExtraLinkClone: true,
            };
            scene.add(clone);
            clonesRef.current.push(clone);
          });
        }
      }
    }

    console.log("Chain length:", chainConfig.chainLength);
    console.log("Visible base links:", Math.min(chainConfig.chainLength, BASE_LINK_COUNT));
    const shownProvidedExtras = specialMeshData.filter((_, idx) => chainConfig.chainLength >= BASE_LINK_COUNT + idx + 1).length;
    const shownClonedExtras = Math.max(chainConfig.chainLength - BASE_LINK_COUNT - shownProvidedExtras, 0);
    console.log("Special link groups shown (provided, cloned):", shownProvidedExtras, shownClonedExtras);
  }, [scene, chainConfig.chainLength, chainSpacing, additionalLinkOffsets]);

  // Apply materials to the model
  useEffect(() => {
    if (!scene) return;

    // Group meshes by link index based on position
    const meshData: Array<{ mesh: THREE.Mesh; x: number }> = [];
    
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        // Hide the Plane mesh
        if (mesh.name === "Plane") {
          mesh.visible = false;
          return;
        }

        // Get world position for sorting
        const worldPos = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);
        meshData.push({ mesh, x: worldPos.x });
      }
    });

    // Sort meshes by X position (left to right)
    meshData.sort((a, b) => a.x - b.x);

    // Calculate how many meshes per link
    const meshesPerLink = Math.max(
      1,
      Math.ceil(meshData.length / chainConfig.chainLength),
    );

    // Apply materials to each link based on its configuration
    meshData.forEach(({ mesh }, index) => {
      // Determine which link this mesh belongs to
      const linkIndex = Math.min(
        Math.floor(index / meshesPerLink),
        chainConfig.links.length - 1,
      );
      
      const linkConfig = chainConfig.links[linkIndex];
      if (!linkConfig) return;

      const materialColor = getMaterialColor(linkConfig.material || "silver");

      // Add slight highlight to selected link
      const isSelected = linkIndex === selectedLinkIndex;
      const baseColor = new THREE.Color(materialColor);
      
      // If selected, add a slight brightening effect
      if (isSelected) {
        baseColor.multiplyScalar(1.15);
      }

      // Create and apply material
      const materialConfig: any = {
        color: baseColor,
        metalness: 0.9,
        roughness: isSelected ? 0.05 : 0.1, // Make selected link slightly shinier
      };
      
      // Only add emissive if selected
      if (isSelected) {
        materialConfig.emissive = baseColor.clone().multiplyScalar(0.1);
      }
      
      const material = new THREE.MeshStandardMaterial(materialConfig);

      mesh.material = material;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
  }, [scene, chainConfig.links, chainConfig.chainLength, selectedLinkIndex]);

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
