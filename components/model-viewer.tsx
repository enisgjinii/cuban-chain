"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ChainConfig } from "@/lib/chain-config-types";

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
}

export function ModelViewer({
  urls,
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
  isRecording = false,
  onRecordingComplete,
  showRecordingIndicator = false,
  sceneRef,
  
}: ModelViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  // Load multiple GLTFs
  const gltfs = urls.map(url => useGLTF(url));
  const scenes = gltfs.map(gltf => gltf.scene);

  // Create a main scene to hold all models
  const mainScene = useMemo(() => {
    const scene = new THREE.Scene();
    
    scenes.forEach((modelScene, index) => {
      if (modelScene) {
        // Clone the scene to avoid modifying the original
        const clonedScene = modelScene.clone();
        
        // Position models next to each other
        // part1.glb at origin, Pattern 1 offset to the right
        if (index > 0) {
          clonedScene.position.x = index * chainSpacing; // Use chainSpacing instead of hardcoded 2
        }
        
        scene.add(clonedScene);
      }
    });
    
    return scene;
  }, [scenes]);

  // Update sceneRef whenever mainScene is available
  useEffect(() => {
    if (sceneRef && mainScene) {
      sceneRef.current = mainScene;
    }
  }, [mainScene, sceneRef]);

  // Handle loading state properly
  useEffect(() => {
    // useGLTF handles loading internally, so we'll use a small delay
    // to ensure the model is properly mounted and rendered
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [urls.join(',')]); // Reset loading when URLs change
  const clonesRef = useRef<THREE.Object3D[]>([]);
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
    if (showBoundingBox && mainScene) {
      // Remove existing bounding box
      if (boundingBoxRef.current) {
        threeScene.remove(boundingBoxRef.current);
        boundingBoxRef.current = null;
      }

      // Create new bounding box
      const box = new THREE.Box3().setFromObject(mainScene);
      const helper = new THREE.BoxHelper(mainScene, 0x00ff00);
      boundingBoxRef.current = helper;
      threeScene.add(helper);
    } else if (!showBoundingBox && boundingBoxRef.current) {
      // Remove bounding box when disabled
      threeScene.remove(boundingBoxRef.current);
      boundingBoxRef.current = null;
    }
  }, [showBoundingBox, mainScene, threeScene]);

  // Auto-fit model to prevent cutoff
  useEffect(() => {
    if (autoFitModel && mainScene) {
      const box = new THREE.Box3().setFromObject(mainScene);
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
  }, [autoFitModel, mainScene, camera]);

  // Extract meshes and nodes on load
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

  // Previously link-splitting and cloning logic removed — model is used as-is
  useEffect(() => {
    // Clean up any previous clones if present
    if (!mainScene) return;
    if (clonesRef.current.length) {
      clonesRef.current.forEach((obj) => {
        try {
          mainScene.remove(obj);
        } catch {}
      });
      clonesRef.current = [];
    }
  }, [mainScene]);

  // Material application logic
  useEffect(() => {
    const handleMaterialApplication = (event: CustomEvent) => {
      const { material, targetModel } = event.detail;
      
      scenes.forEach((scene, index) => {
        if (!scene) return;
        
        const modelUrl = urls[index];
        const shouldApply = targetModel === "all" || targetModel === modelUrl;
        
        if (shouldApply) {
          scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              // Apply material based on selection
              const newMaterial = createMaterial(material);
              child.material = newMaterial;
            }
          });
        }
      });
    };

    // Add event listener
    window.addEventListener("applyMaterialToModel", handleMaterialApplication as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener("applyMaterialToModel", handleMaterialApplication as EventListener);
    };
  }, [scenes, urls]);

  // Helper function to create materials
  const createMaterial = (materialType: string) => {
    switch (materialType) {
      case "silver":
        return new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.1 });
      case "gold":
        return new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
      case "grey":
        return new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.7, roughness: 0.3 });
      case "black":
        return new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.5, roughness: 0.5 });
      default:
        return new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.1 });
    }
  };

  // Material application and per-link coloring removed — models render with their own materials

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
      <primitive object={mainScene} />
    </>
  );
}
