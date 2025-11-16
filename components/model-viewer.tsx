"use client"

import { useGLTF } from "@react-three/drei"
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
}

export function ModelViewer({ url, color, material, metalness, roughness, onMeshesAndNodesExtracted, selectedMesh, hoveredMesh, chainCount = 1 }: ModelViewerProps) {
  const { scene } = useGLTF(url)
  const originalMaterials = useRef<Map<string, THREE.Material>>(new Map())
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
    const spacing = size.x > 0 ? size.x * 0.95 : 1

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
    }

    return () => {
      clonesRef.current.forEach((c) => {
        if (c.parent) c.parent.remove(c)
      })
      clonesRef.current = []
      // only restore visibility if we hid the template and it still exists
      if (template && !templateWasScene) template.visible = true
    }
  }, [scene, chainCount, url])

  return <primitive object={scene} />
}
