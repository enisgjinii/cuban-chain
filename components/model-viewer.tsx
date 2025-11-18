"use client"

import { useGLTF, useBounds } from "@react-three/drei"
import { useEffect, useRef, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import type { ChainConfig } from "@/lib/chain-config-types"
import { getMaterialColor } from "@/lib/chain-helpers"

interface ModelViewerProps {
  url: string
  chainConfig: ChainConfig
  onMeshesAndNodesExtracted?: (meshes: string[], nodes: string[]) => void
  selectedMesh?: string | null
  hoveredMesh?: string | null
  chainSpacing?: number
  applyMode?: boolean
  setApplyMode?: (mode: boolean) => void
  undoCounter?: number
  autoFitModel?: boolean
  showBoundingBox?: boolean
  autoRotate?: boolean
  selectedLinkIndex?: number
  isRecording?: boolean
  onRecordingComplete?: (videoBlob: Blob) => void
  showRecordingIndicator?: boolean
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
  selectedLinkIndex,
  isRecording = false,
  onRecordingComplete,
  showRecordingIndicator = false,
}: ModelViewerProps) {
  const { scene } = useGLTF(url)
  const originalMaterials = useRef<Map<string, THREE.Material>>(new Map())
  const appliedHistory = useRef<Array<{ name: string; material: THREE.Material }>>([])
  const clonesRef = useRef<THREE.Object3D[]>([])
  const gemstoneGroupsRef = useRef<THREE.Group[]>([])
  const boundingBoxRef = useRef<THREE.BoxHelper | null>(null)
  const { gl, scene: threeScene, camera } = useThree()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingStartTimeRef = useRef<number>(0)
  const recordingLineRef = useRef<THREE.Line | null>(null)
  const blingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const blobCreatedRef = useRef<boolean>(false)

  // Extract meshes and nodes on load
  useEffect(() => {
    const meshes: string[] = []
    const nodes: string[] = []

    scene.traverse((child) => {
      if (child.name) {
        if ((child as THREE.Mesh).isMesh) {
          meshes.push(child.name)
          // Store original material if not already stored
          const meshMaterial = (child as THREE.Mesh).material
          if (!originalMaterials.current.has(child.name) && !(meshMaterial instanceof Array)) {
            originalMaterials.current.set(child.name, meshMaterial.clone())
          }
        } else {
          nodes.push(child.name)
        }
      }
    })

    if (onMeshesAndNodesExtracted) {
      onMeshesAndNodesExtracted(meshes, nodes)
    }
  }, [scene, onMeshesAndNodesExtracted])

  // Hide the Plane mesh
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (mesh.name === "Plane") {
          mesh.visible = false
        }
      }
    })
  }, [scene])

  // Apply materials to the model
  useEffect(() => {
    if (!scene) return

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh

        // Hide the Plane mesh
        if (mesh.name === "Plane") {
          mesh.visible = false
          return
        }

        // Get material color from the first link (or selected link if available)
        const linkIndex = Math.min(selectedLinkIndex || 0, chainConfig.links.length - 1)
        const linkConfig = chainConfig.links[linkIndex]
        const materialColor = getMaterialColor(linkConfig?.material || "silver")

        // Create and apply material
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(materialColor),
          metalness: 0.9,
          roughness: 0.1,
        })

        mesh.material = material
      }
    })
  }, [scene, chainConfig.links, selectedLinkIndex])

  // Recording functionality
  useEffect(() => {
    if (isRecording && !mediaRecorderRef.current) {
      // Store original background and set white background for recording
      const originalClearColor = new THREE.Color()
      gl.getClearColor(originalClearColor)
      const originalClearAlpha = gl.getClearAlpha()
      gl.setClearColor(0xffffff, 1) // White background
      
      // Start recording
      const canvas = gl.domElement
      const stream = canvas.captureStream(30) // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8'
      })

      recordedChunksRef.current = []
      recordingStartTimeRef.current = Date.now()
      blobCreatedRef.current = false // Reset flag for new recording

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Clear bling interval
        if (blingIntervalRef.current) {
          clearInterval(blingIntervalRef.current)
          blingIntervalRef.current = null
        }
        
        // Restore original background
        gl.setClearColor(originalClearColor, originalClearAlpha)
        
        // Create blob only once
        if (recordedChunksRef.current.length > 0 && !blobCreatedRef.current) {
          blobCreatedRef.current = true
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
          onRecordingComplete?.(blob)
        }
        
        // Clear refs
        mediaRecorderRef.current = null
        recordedChunksRef.current = []
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder

      // Add red recording line
      const geometry = new THREE.BufferGeometry()
      const material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 })
      const points = [
        new THREE.Vector3(-2, 2, 0),
        new THREE.Vector3(2, 2, 0)
      ]
      geometry.setFromPoints(points)
      recordingLineRef.current = new THREE.Line(geometry, material)
      threeScene.add(recordingLineRef.current)

      // Add blinging canvas effect
      let blingState = false
      blingIntervalRef.current = setInterval(() => {
        blingState = !blingState
        if (recordingLineRef.current) {
          const material = recordingLineRef.current.material as THREE.LineBasicMaterial
          material.color.setHex(blingState ? 0xff0000 : 0xffffff) // Red to white flash
          material.linewidth = blingState ? 3 : 2
        }
      }, 500) // Flash every 500ms

    } else if (!isRecording && mediaRecorderRef.current) {
      // Clear bling interval
      if (blingIntervalRef.current) {
        clearInterval(blingIntervalRef.current)
        blingIntervalRef.current = null
      }
      
      // Stop recording
      mediaRecorderRef.current.stop()

      // Remove red recording line
      if (recordingLineRef.current) {
        threeScene.remove(recordingLineRef.current)
        recordingLineRef.current = null
      }
    }
  }, [isRecording, gl, threeScene, onRecordingComplete])

  // Auto-stop recording after 5 seconds
  useFrame(() => {
    if (isRecording && mediaRecorderRef.current && recordingStartTimeRef.current) {
      const elapsed = Date.now() - recordingStartTimeRef.current
      if (elapsed >= 5000) { // 5 seconds
        mediaRecorderRef.current.stop()
      }
    }
  })

  return <primitive object={scene} position={[0.2, 0, 0]} />
}
