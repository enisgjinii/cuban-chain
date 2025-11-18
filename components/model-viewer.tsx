"use client"

import { useGLTF, useBounds } from "@react-three/drei"
import { useEffect, useRef, useState } from "react"
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
}: ModelViewerProps) {
  const { scene } = useGLTF(url)
  const originalMaterials = useRef<Map<string, THREE.Material>>(new Map())
  const appliedHistory = useRef<Array<{ name: string; material: THREE.Material }>>([])
  const clonesRef = useRef<THREE.Object3D[]>([])
  const gemstoneGroupsRef = useRef<THREE.Group[]>([])
  const boundingBoxRef = useRef<THREE.BoxHelper | null>(null)

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

  return <primitive object={scene} position={[0.2, 0, 0]} />
}
