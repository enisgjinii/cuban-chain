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
}: ModelViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [pattern1Offset, setPattern1Offset] = useState(0.2);
  const [modelOffsets, setModelOffsets] = useState<Record<string, number>>({});
  const [chainPattern, setChainPattern] = useState<'linear' | 'alternating' | 'custom'>('linear');
  const [customSpacing, setCustomSpacing] = useState<Record<string, number>>({});

  // Advanced positioning logic - unique positioning for each model type
  const calculatePosition = (index: number, url: string, totalModels: number) => {
    const modelKey = url.split('/').pop() || `model-${index}`;
    
    // Use individual model offset if set, otherwise fall back to unique positioning
    if (modelOffsets[modelKey] !== undefined) {
      return modelOffsets[modelKey];
    }
    
    // Pattern 1 uses the slider value directly
    if (url === "/models/Pattern 1.glb") {
      return pattern1Offset;
    }
    
    // Unique positioning for each model type
    const uniquePositions: Record<string, number> = {
      "part1.glb": 0.00,      // First model at origin
      "part3.glb": 0.15,      // Slightly to the right
      "part4.glb": 0.28,      // Further right
      "part5.glb": 0.41,      // Continuing
      "part6.glb": 0.54,      // More spacing
      "part7.glb": 0.67,      // Even more
      "enamel.glb": 0.80,     // Enamel at the end
    };
    
    // Return unique position for this model type, or fallback
    return uniquePositions[modelKey] ?? (index * 0.02);
  };

  // Load multiple GLTFs
  const gltfs = urls.map(url => useGLTF(url));
  const scenes = gltfs.map(gltf => gltf.scene);

  // Create a main scene to hold all models
  const mainScene = useMemo(() => {
    const scene = new THREE.Scene();
    const totalModels = urls.length;
    
    scenes.forEach((modelScene, index) => {
      if (modelScene) {
        // Clone the scene to avoid modifying the original
        const clonedScene = modelScene.clone();
        
        // Use advanced positioning logic
        const position = calculatePosition(index, urls[index], totalModels);
        clonedScene.position.x = position;
        
        scene.add(clonedScene);
      }
    });
    
    return scene;
  }, [scenes, pattern1Offset, chainSpacing, urls, chainPattern, customSpacing, modelOffsets]);

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
      // Remove all bounding boxes when component unmounts
      boundingBoxRefs.current.forEach(box => {
        threeScene.remove(box);
      });
      boundingBoxRefs.current = [];
    };
  }, [threeScene]);

  // Individual bounding boxes for each model
  useEffect(() => {
    // Remove all existing bounding boxes
    boundingBoxRefs.current.forEach(box => {
      threeScene.remove(box);
    });
    boundingBoxRefs.current = [];

    if (showBoundingBox && mainScene) {
      // Create bounding box for each cloned model (direct children of mainScene)
      mainScene.children.forEach((child) => {
        if (child instanceof THREE.Object3D) {
          // Create bounding box for this individual cloned model
          const helper = new THREE.BoxHelper(child, 0x00ff00);
          boundingBoxRefs.current.push(helper);
          threeScene.add(helper);
        }
      });
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

  // Advanced controls event listeners
  useEffect(() => {
    const handlePattern1PositionUpdate = (event: CustomEvent) => {
      const { offset } = event.detail;
      setPattern1Offset(offset);
    };

    const handleChainPatternChange = (event: CustomEvent) => {
      const { pattern } = event.detail;
      setChainPattern(pattern);
    };

    const handleCustomSpacingUpdate = (event: CustomEvent) => {
      const { modelKey, spacing } = event.detail;
      setCustomSpacing(prev => ({
        ...prev,
        [modelKey]: spacing
      }));
    };

    const handleModelOffsetUpdate = (event: CustomEvent) => {
      const { modelKey, offset } = event.detail;
      setModelOffsets(prev => ({
        ...prev,
        [modelKey]: offset
      }));
    };

    // Add event listeners
    window.addEventListener("updatePattern1Position", handlePattern1PositionUpdate as EventListener);
    window.addEventListener("changeChainPattern", handleChainPatternChange as EventListener);
    window.addEventListener("updateCustomSpacing", handleCustomSpacingUpdate as EventListener);
    window.addEventListener("updateModelOffset", handleModelOffsetUpdate as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener("updatePattern1Position", handlePattern1PositionUpdate as EventListener);
      window.removeEventListener("changeChainPattern", handleChainPatternChange as EventListener);
      window.removeEventListener("updateCustomSpacing", handleCustomSpacingUpdate as EventListener);
      window.removeEventListener("updateModelOffset", handleModelOffsetUpdate as EventListener);
    };
  }, []);

  // Pattern 1 position control (legacy - kept for compatibility)
  useEffect(() => {
    const handlePattern1PositionUpdate = (event: CustomEvent) => {
      const { offset } = event.detail;
      
      // Update the pattern1Offset state, which will trigger mainScene recalculation
      setPattern1Offset(offset);
    };

    // Add event listener
    window.addEventListener("updatePattern1Position", handlePattern1PositionUpdate as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener("updatePattern1Position", handlePattern1PositionUpdate as EventListener);
    };
  }, []);

  // Material application logic
  useEffect(() => {
    const handleMaterialApplication = (event: CustomEvent) => {
      const { material, targetModel, targetIndex } = event.detail;
      
      scenes.forEach((scene, index) => {
        if (!scene) return;
        
        let shouldApply = false;
        
        if (targetModel === "all") {
          shouldApply = true;
        } else if (targetIndex >= 0) {
          // Apply to specific model by index
          shouldApply = index === targetIndex;
        } else {
          // Legacy fallback - apply by URL
          const modelUrl = urls[index];
          shouldApply = modelUrl === targetModel;
        }
        
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
