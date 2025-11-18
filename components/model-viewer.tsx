"use client"

import { useGLTF, useBounds } from "@react-three/drei"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import type { ChainConfig } from "@/lib/chain-config-types"
import { getMaterialColor } from "@/lib/chain-helpers"

interface ModelViewerProps {
  url: string
  chainConfig: ChainConfig
  onMeshesAndNodesExtracted?: (meshes: string[], nodes: string[]) => void
  selectedMesh: string | null
  hoveredMesh: string | null
  chainSpacing?: number
  applyMode?: boolean
  setApplyMode?: (value: boolean) => void
  undoCounter?: number
  autoFitModel?: boolean
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
  autoFitModel
}: ModelViewerProps) {
  const { scene } = useGLTF(url)
  const originalMaterials = useRef<Map<string, THREE.Material>>(new Map())
  const appliedHistory = useRef<Array<{ name: string; material: THREE.Material }>>([])
  const clonesRef = useRef<THREE.Object3D[]>([])
  const gemstoneGroupsRef = useRef<THREE.Group[]>([])

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

  // Clone links based on chain length
  useEffect(() => {
    // cleanup any previously created clones
    clonesRef.current.forEach((c) => {
      if (c.parent) c.parent.remove(c)
    })
    clonesRef.current = []

    // cleanup gemstones
    gemstoneGroupsRef.current.forEach((g) => {
      if (g.parent) g.parent.remove(g)
    })
    gemstoneGroupsRef.current = []

    const chainLength = chainConfig.chainLength

    // nothing to do for single original link
    if (!chainLength || chainLength <= 1) return

    // Try to locate a good template for cloning
    let template: THREE.Object3D | null = null
    const candidates: THREE.Object3D[] = []
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const name = child.name || ''
        if (/cuban|link|chain/i.test(name)) {
          candidates.push(child)
        }
      }
    })

    if (candidates.length > 0) {
      // prefer the parent group of the first candidate
      const candidate = candidates[0]
      const parent = candidate.parent
      if (parent && parent !== scene) {
        template = parent
      } else {
        template = candidate
      }
    } else {
      // fallback: first mesh in the scene
      scene.traverse((child) => {
        if (!template && (child as THREE.Mesh).isMesh) template = child
      })
    }

    if (!template) return

    // Determine spacing between links using bounding box width
    const bbox = new THREE.Box3().setFromObject(template)
    const size = new THREE.Vector3()
    bbox.getSize(size)
    const spacing = size.x > 0 ? size.x * chainSpacing : 1

    // hide the original template group to avoid overlapping
    const templateWasScene = template === scene
    if (template && !templateWasScene) template.visible = false

    // Create clones and position them along the X axis
    for (let i = 0; i < chainLength; i++) {
      const clone = template.clone(true)
      // reposition clones relative to template's world position
      const worldPos = new THREE.Vector3()
      template.getWorldPosition(worldPos)
      clone.position.copy(worldPos)
      clone.position.x += i * spacing
      scene.add(clone)
      clonesRef.current.push(clone)

      // Make each clone's mesh names unique by appending an index
      clone.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          c.name = `${c.name || "mesh"}-link${i}`
          c.userData.linkIndex = i
        }
      })
    }

    return () => {
      clonesRef.current.forEach((c) => {
        if (c.parent) c.parent.remove(c)
      })
      clonesRef.current = []
      // only restore visibility if we hid the template and it still exists
      if (template && !templateWasScene) template.visible = true
    }
  }, [scene, chainConfig.chainLength, url, chainSpacing])

  // Re-extract names after clones are added
  useEffect(() => {
    if (!onMeshesAndNodesExtracted) return
    const meshes: string[] = []
    const nodes: string[] = []
    scene.traverse((child) => {
      if (child.name) {
        if ((child as THREE.Mesh).isMesh) meshes.push(child.name)
        else nodes.push(child.name)
      }
    })
    onMeshesAndNodesExtracted(meshes, nodes)
  }, [scene, clonesRef.current.length, onMeshesAndNodesExtracted])

  // Apply materials and surface customizations to each link
  useEffect(() => {
    // Clear old gemstones
    gemstoneGroupsRef.current.forEach((g) => {
      if (g.parent) g.parent.remove(g)
    })
    gemstoneGroupsRef.current = []

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh

        // Hide the Plane mesh
        if (mesh.name === "Plane") {
          mesh.visible = false
          return
        }

        // Determine link index from userData (set during cloning)
        const linkIndex = mesh.userData.linkIndex ?? 0
        const linkConfig = chainConfig.links[linkIndex]

        if (!linkConfig) return

        // Get material color
        const materialColor = getMaterialColor(linkConfig.material)

        // Create base material
        const baseMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(materialColor),
          metalness: 0.9,
          roughness: 0.1,
        })

        // Apply highlighting for selected/hovered
        if (mesh.name === selectedMesh || mesh.name === hoveredMesh) {
          baseMaterial.emissive = new THREE.Color(0x444444)
        }

        mesh.material = baseMaterial

        // Apply surface customizations
        // For now, we'll add gemstones programmatically as separate meshes
        // This is a simplified implementation - a real one would identify specific surfaces

        // Check if any surface has gemstones
        let hasGemstones = false
        let gemstoneColor = '#ffffff'

        Object.entries(linkConfig.surfaces).forEach(([surfaceId, surfaceConfig]) => {
          if (surfaceConfig.type === 'gemstones' && surfaceConfig.gemstoneColors) {
            hasGemstones = true
            // Use first stone color as representative
            gemstoneColor = surfaceConfig.gemstoneColors.stone1
          }

          // Apply enamel (as a slight color tint to the base material)
          if (surfaceConfig.type === 'enamel' && surfaceConfig.enamelColor) {
            const enamelColor = new THREE.Color(surfaceConfig.enamelColor)
            baseMaterial.color.lerp(enamelColor, 0.3)
          }

          // Engraving would use normal maps - placeholder for now
          if (surfaceConfig.type === 'engraving') {
            baseMaterial.roughness = 0.3 // Make surface slightly rougher to simulate engraving
          }
        })

        // Add gemstones to the link
        if (hasGemstones) {
          const gemGroup = new THREE.Group()
          const gemGeometry = new THREE.SphereGeometry(0.05, 16, 16)

          // Position gemstones on top of the mesh
          const bbox = new THREE.Box3().setFromObject(mesh)
          const center = new THREE.Vector3()
          bbox.getCenter(center)
          const size = new THREE.Vector3()
          bbox.getSize(size)

          // Add 3 gemstones along the top
          for (let i = 0; i < 3; i++) {
            const gemMaterial = new THREE.MeshStandardMaterial({
              color: new THREE.Color(gemstoneColor),
              metalness: 0.1,
              roughness: 0.0,
              emissive: new THREE.Color(gemstoneColor).multiplyScalar(0.2),
            })

            const gem = new THREE.Mesh(gemGeometry, gemMaterial)
            const xOffset = (i - 1) * size.x * 0.25
            gem.position.set(
              center.x + xOffset,
              bbox.max.y + 0.08, // Slightly above the top surface
              center.z
            )
            gemGroup.add(gem)
          }

          scene.add(gemGroup)
          gemstoneGroupsRef.current.push(gemGroup)
        }
      }
    })
  }, [scene, chainConfig, selectedMesh, hoveredMesh])

  // Auto-fit camera
  const bounds = useBounds()
  useEffect(() => {
    if (!autoFitModel) return
    const id = setTimeout(() => {
      try {
        bounds.refresh().clip().fit()
      } catch (err) {
        // bounds may not be ready on first mount
      }
    }, 20)
    return () => clearTimeout(id)
  }, [autoFitModel, scene, clonesRef.current.length, bounds])

  // Apply / Undo logic (keeping for backward compatibility but may not be needed)
  useEffect(() => {
    if (!applyMode) return

    if (!selectedMesh) {
      return
    }

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (mesh.name === selectedMesh) {
          const prevMaterial = (mesh.material as THREE.Material).clone()
          appliedHistory.current.push({ name: mesh.name, material: prevMaterial })
        }
      }
    })

    if (setApplyMode) setApplyMode(false)
  }, [applyMode, selectedMesh, scene, setApplyMode])

  useEffect(() => {
    if (!undoCounter) return
    const entry = appliedHistory.current.pop()
    if (!entry) return

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (mesh.name === entry.name) {
          mesh.material = entry.material
        }
      }
    })
  }, [undoCounter, scene])

  return <primitive object={scene} />
}
