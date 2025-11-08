"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect } from "react"
import * as THREE from "three"

interface ModelViewerProps {
  url: string
  color: string
  material: string
  metalness: number
  roughness: number
}

export function ModelViewer({ url, color, material, metalness, roughness }: ModelViewerProps) {
  const { scene } = useGLTF(url)

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh

        if (material === "standard") {
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            metalness,
            roughness,
          })
        } else if (material === "basic") {
          mesh.material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
          })
        } else if (material === "phong") {
          mesh.material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(color),
            shininess: (1 - roughness) * 100,
          })
        }
      }
    })
  }, [scene, color, material, metalness, roughness])

  return <primitive object={scene} />
}
