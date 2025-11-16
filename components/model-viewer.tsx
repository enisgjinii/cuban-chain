"use client"

import { useGLTF, useBounds } from "@react-three/drei"
import { useEffect, useRef } from "react"
import * as THREE from "three"

interface ModelViewerProps {
  url: string
  color: string
  material: string
  metalness: number
  roughness: number
  onMeshesAndNodesExtracted?: (meshes: string[], nodes: string[]) => void
  selectedMesh: string | null
  hoveredMesh: string | null
  chainCount?: number
  chainSpacing?: number
  applyMode?: boolean
  setApplyMode?: (value: boolean) => void
  undoCounter?: number
  autoFitModel?: boolean
}

export function ModelViewer({ url, color, material, metalness, roughness, onMeshesAndNodesExtracted, selectedMesh, hoveredMesh, chainCount = 1, chainSpacing = 0.95, applyMode, setApplyMode, undoCounter, autoFitModel }: ModelViewerProps) {
  const { scene } = useGLTF(url)
  const originalMaterials = useRef<Map<string, THREE.Material>>(new Map())
  const appliedHistory = useRef<Array<{ name: string; material: THREE.Material }>>([])
  const clonesRef = useRef<THREE.Object3D[]>([])

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

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh

        // Hide the Plane mesh
        if (mesh.name === "Plane") {
          mesh.visible = false
          return
        }

        let baseMaterial: THREE.Material

        if (material === "standard") {
          baseMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            metalness,
            roughness,
          })
        } else if (material === "basic") {
          baseMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
          })
        } else if (material === "phong") {
          baseMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color(color),
            shininess: (1 - roughness) * 100,
          })
        } else {
          baseMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            metalness,
            roughness,
          })
        }

        // Apply highlighting
        if (mesh.name === selectedMesh || mesh.name === hoveredMesh) {
          if (baseMaterial instanceof THREE.MeshStandardMaterial || baseMaterial instanceof THREE.MeshPhongMaterial) {
            baseMaterial.emissive = new THREE.Color(0x444444)
          } else if (baseMaterial instanceof THREE.MeshBasicMaterial) {
            baseMaterial.color = new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.3)
          }
        }

        mesh.material = baseMaterial
      }
    })
  }, [scene, color, material, metalness, roughness, onMeshesAndNodesExtracted, selectedMesh, hoveredMesh, chainCount])

  // Clone / extend the model to create multiple chain links
  useEffect(() => {
    // cleanup any previously created clones
    clonesRef.current.forEach((c) => {
      if (c.parent) c.parent.remove(c)
    })
    clonesRef.current = []

    // nothing to do for single original link
    if (!chainCount || chainCount <= 1) return

    // Try to locate a good template for cloning. We look for names that indicate a link.
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
      // prefer the parent group of the first candidate but avoid using `scene` as the template.
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

    // hide the original template group to avoid overlapping — but do NOT hide the scene root
    const templateWasScene = template === scene
    if (template && !templateWasScene) template.visible = false

    // Create clones and position them along the X axis
    for (let i = 0; i < chainCount; i++) {
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
          c.name = `${c.name || "mesh"}-${i}`
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
  }, [scene, chainCount, url, chainSpacing])

  // Re-extract names after clones are added so the UI can show unique names
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

  // Auto-fit camera via useBounds when autoFitModel is true. Use `refresh().clip().fit()` so
  // Stage does not observe changes continuously and cause repeated camera adjustments.
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

  // Apply / Undo logic
  useEffect(() => {
    if (!applyMode) return

    if (!selectedMesh) {
      // still in apply mode until the user picks a mesh
      return
    }

    // Apply current material configuration to all meshes whose name matches selectedMesh
    const appliedEntries: Array<{ name: string; material: THREE.Material }> = []
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (mesh.name === selectedMesh) {
          const prevMaterial = (mesh.material as THREE.Material).clone()
          appliedEntries.push({ name: mesh.name, material: prevMaterial })

          // create new base material using the same rules as above
          let newMaterial: THREE.Material
          if (material === "standard") {
            newMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), metalness, roughness })
          } else if (material === "basic") {
            newMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) })
          } else if (material === "phong") {
            newMaterial = new THREE.MeshPhongMaterial({ color: new THREE.Color(color), shininess: (1 - roughness) * 100 })
          } else {
            newMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), metalness, roughness })
          }

          mesh.material = newMaterial
        }
      }
    })

    if (appliedEntries.length > 0) {
      appliedHistory.current.push(...appliedEntries)
    }

    // exit apply mode after applying
    if (setApplyMode) setApplyMode(false)
  }, [applyMode, selectedMesh, scene, color, material, metalness, roughness, setApplyMode])

  // Undo last apply — parent increments undoCounter to trigger
  useEffect(() => {
    if (!undoCounter) return
    const entry = appliedHistory.current.pop()
    if (!entry) return

    // find meshes with the same name and restore
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
