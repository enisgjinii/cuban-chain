import * as THREE from "three";
import type { ChainConfig, LinkConfig, SurfaceConfig, SurfaceId, Material } from "./chain-config-types";

export const BASE_LINK_COUNT = 7;

// Base link mesh groups (7 base links in the chain model)
// Each base link consists of the following meshes grouped together:
// - Link1_Part01 to Link1_Part13: Main chain link structure (13 parts total)
// - Link1_Diamond01 to Link1_Diamond03: Diamond decorations (3 diamonds)
// These meshes together form one complete chain link group with diamonds
export const BASE_LINK_MESH_GROUP: string[] = [
  "Link1_Part01",
  "Link1_Part02",
  "Link1_Part03",
  "Link1_Part04",
  "Link1_Part05",
  "Link1_Part06",
  "Link1_Part07",
  "Link1_Part08",
  "Link1_Part09",
  "Link1_Part10",
  "Link1_Part11",
  "Link1_Part12",
  "Link1_Part13",
  "Link1_Diamond01",
  "Link1_Diamond02",
  "Link1_Diamond03",
];

// Diamond elements that can be added to create a decorated chain link
// These include all diamond meshes and location nodes for diamond positioning
export const DIAMOND_ELEMENTS: string[] = [
  "loc_diamonds",
  "Link1_Diamond01",
  "Link1_Diamond02",
  "Link1_Diamond03",
  "loc_diamonds001",
  "Extra_Diamond01",
  "loc_diamond_side_1",
  "loc_diamond_side_1001",
];

// Complete chain link configuration with all diamond components
// This represents a fully decorated link that can be used as a template
export const COMPLETE_DIAMOND_LINK: string[] = [
  // Main structure cubes
  "Link1_Part01",
  "Link1_Part02",
  "Link1_Part03",
  "Link1_Part04",
  "Link1_Part05",
  "Link1_Part06",
  "Link1_Part07",
  "Link1_Part08",
  "Link1_Part09",
  "Link1_Part10",
  "Link1_Part11",
  "Link1_Part12",
  "Link1_Part13",
  // Diamond meshes
  "Link1_Diamond01",
  "Link1_Diamond02",
  "Link1_Diamond03",
  "Extra_Diamond01",
  // Diamond location nodes
  "loc_diamonds",
  "loc_diamonds001",
  "loc_diamond_side_1",
  "loc_diamond_side_1001",
];

// Additional link mesh groups for extending the chain beyond the base 7 links
// Note: ExtraLink_Part01 and ExtraLink_Part02 together
// make one plain chain link without diamonds or any decorations
export const ADDITIONAL_LINK_MESH_GROUPS: string[][] = [
  ["ExtraLink_Part01", "ExtraLink_Part02"],
];

// Allow up to 9 links (7 base + 2 additional via cloning)
export const MAX_CHAIN_LINKS = 20;

export interface AdditionalLinkOffset {
  x: number;
  y: number;
  z: number;
}

export type AdditionalLinkOffsetMap = Record<number, AdditionalLinkOffset>;

export const DEFAULT_ADDITIONAL_LINK_OFFSET: AdditionalLinkOffset = {
  x: -0.009,
  y: 0.007,
  z: 0.006,
};

// ============================================================================
// SURFACE MESH MAPPING
// Maps mesh names to their corresponding surface types (top1, top2, side1, side2)
// ============================================================================

// Pattern to identify mesh types by name
export const MESH_SURFACE_PATTERNS = {
  // Top surfaces - typically the main visible faces
  top1: ["_top1", "_Top1", "top_1", "Top_1", "_t1", "top1"],
  top2: ["_top2", "_Top2", "top_2", "Top_2", "_t2", "top2"],
  // Side surfaces
  side1: ["_side1", "_Side1", "side_1", "Side_1", "_s1", "side1", "loc_diamond_side_1"],
  side2: ["_side2", "_Side2", "side_2", "Side_2", "_s2", "side2"],
  // Diamond/gemstone meshes - comprehensive patterns
  diamond: ["Diamond", "diamond", "gem", "Gem", "stone", "Stone", "Diamond_Octagon", "loc_diamonds"],
  // Enamel surfaces
  enamel: ["enamel", "Enamel", "fill", "Fill"],
  // Base link body (for material application) - matches most mesh names
  body: ["Cube", "Part", "Link", "body", "Body", "古巴链", "cubanLink", "Cuban"],
};

// Gemstone mesh patterns for each surface
export const GEMSTONE_MESH_PATTERNS = {
  top1: {
    stone1: ["Diamond_Octagon001", "top1_stone1", "t1_gem1"],
    stone2: ["Diamond_Octagon002", "top1_stone2", "t1_gem2"],
    stone3: ["Diamond_Octagon003", "top1_stone3", "t1_gem3"],
  },
  top2: {
    stone1: ["Diamond_Octagon004", "top2_stone1", "t2_gem1"],
    stone2: ["Diamond_Octagon005", "top2_stone2", "t2_gem2"],
    stone3: ["Diamond_Octagon006", "top2_stone3", "t2_gem3"],
  },
  side1: {
    stone1: ["Diamond_Octagon007", "side1_stone1", "s1_gem1", "loc_diamond_side_1"],
    stone2: ["Diamond_Octagon008", "side1_stone2", "s1_gem2", "loc_diamond_side_1001"],
  },
  side2: {
    stone1: ["Diamond_Octagon009", "side2_stone1", "s2_gem1"],
    stone2: ["Diamond_Octagon010", "side2_stone2", "s2_gem2"],
  },
};

// ============================================================================
// MATERIAL CREATION FUNCTIONS
// ============================================================================

export function createBaseMaterial(materialType: Material): THREE.MeshStandardMaterial {
  const materialConfigs: Record<Material, { color: number; metalness: number; roughness: number }> = {
    silver: { color: 0xc0c0c0, metalness: 0.9, roughness: 0.1 },
    gold: { color: 0xffd700, metalness: 0.9, roughness: 0.1 },
    grey: { color: 0x808080, metalness: 0.7, roughness: 0.3 },
    black: { color: 0x1a1a1a, metalness: 0.5, roughness: 0.5 },
    white: { color: 0xf5f5f5, metalness: 0.3, roughness: 0.2 },
  };
  
  const config = materialConfigs[materialType] || materialConfigs.silver;
  return new THREE.MeshStandardMaterial({
    color: config.color,
    metalness: config.metalness,
    roughness: config.roughness,
  });
}

export function createGemstoneMaterial(color: string): THREE.MeshPhysicalMaterial {
  const hexColor = parseInt(color.replace("#", ""), 16);
  return new THREE.MeshPhysicalMaterial({
    color: hexColor,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    thickness: 0.5,
    ior: 2.4, // Diamond-like refraction
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });
}

export function createEnamelMaterial(color: string): THREE.MeshStandardMaterial {
  const hexColor = parseInt(color.replace("#", ""), 16);
  return new THREE.MeshStandardMaterial({
    color: hexColor,
    metalness: 0.1,
    roughness: 0.3,
  });
}

export function createEngravingMaterial(pattern: "pattern1" | "pattern2"): THREE.MeshStandardMaterial {
  // For now, use a darker version of the base material to simulate engraving
  // In production, this could use normal maps or displacement maps
  return new THREE.MeshStandardMaterial({
    color: pattern === "pattern1" ? 0x333333 : 0x222222,
    metalness: 0.6,
    roughness: 0.4,
  });
}

// ============================================================================
// MESH IDENTIFICATION FUNCTIONS
// ============================================================================

export function isMeshForSurface(meshName: string, surfaceId: SurfaceId): boolean {
  const patterns = MESH_SURFACE_PATTERNS[surfaceId];
  return patterns.some(pattern => meshName.includes(pattern));
}

export function isDiamondMesh(meshName: string): boolean {
  return MESH_SURFACE_PATTERNS.diamond.some(pattern => meshName.includes(pattern));
}

export function isEnamelMesh(meshName: string): boolean {
  return MESH_SURFACE_PATTERNS.enamel.some(pattern => meshName.includes(pattern));
}

export function isBodyMesh(meshName: string): boolean {
  // If it's a diamond or enamel mesh, it's not a body mesh
  if (isDiamondMesh(meshName) || isEnamelMesh(meshName)) {
    return false;
  }
  // Check if it matches body patterns, or if it's any mesh (fallback for unknown meshes)
  const matchesPattern = MESH_SURFACE_PATTERNS.body.some(pattern => meshName.includes(pattern));
  // If no specific pattern matches, treat it as a body mesh (for material application)
  return matchesPattern || meshName.length > 0;
}

export function getGemstoneIndex(meshName: string, surfaceId: SurfaceId): number | null {
  const patterns = GEMSTONE_MESH_PATTERNS[surfaceId];
  if (!patterns) return null;
  
  for (const [key, meshPatterns] of Object.entries(patterns)) {
    if (meshPatterns.some(pattern => meshName.includes(pattern))) {
      return parseInt(key.replace("stone", "")) - 1;
    }
  }
  return null;
}

// ============================================================================
// CHAIN CONFIG APPLICATION
// ============================================================================

export function applyLinkConfigToMesh(
  mesh: THREE.Mesh,
  linkConfig: LinkConfig,
  surfaceId?: SurfaceId
): void {
  const meshName = mesh.name;
  
  // Handle diamond meshes - apply gemstone colors based on surface config
  if (isDiamondMesh(meshName)) {
    // Try to determine which surface this diamond belongs to
    let targetSurface: SurfaceId = "top1"; // default
    if (meshName.includes("side") || meshName.includes("Side")) {
      targetSurface = meshName.includes("2") ? "side2" : "side1";
    } else {
      // For top diamonds, try to determine from mesh name
      const match = meshName.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        targetSurface = num <= 3 ? "top1" : "top2";
      }
    }
    
    const surfaceConfig = linkConfig.surfaces[targetSurface];
    if (surfaceConfig.type === "gemstones" || surfaceConfig.type === "moissanites") {
      mesh.visible = true;
      // Apply color based on stone index
      const stoneIndex = getGemstoneIndex(meshName, targetSurface);
      if (stoneIndex !== null && surfaceConfig.gemstoneColors) {
        const colorKey = `stone${stoneIndex + 1}` as keyof typeof surfaceConfig.gemstoneColors;
        const color = surfaceConfig.gemstoneColors[colorKey] || "#ffffff";
        mesh.material = createGemstoneMaterial(color);
      } else {
        // Default white gemstone
        mesh.material = createGemstoneMaterial("#ffffff");
      }
    } else {
      // Hide diamonds if surface type is not gemstones
      mesh.visible = false;
    }
    return;
  }
  
  // Handle enamel meshes
  if (isEnamelMesh(meshName)) {
    // Check if any surface has enamel type
    let hasEnamel = false;
    for (const sid of ["top1", "top2", "side1", "side2"] as SurfaceId[]) {
      const config = linkConfig.surfaces[sid];
      if (config.type === "enamel") {
        hasEnamel = true;
        mesh.visible = true;
        mesh.material = createEnamelMaterial(config.enamelColor || "#ffffff");
        break;
      }
    }
    if (!hasEnamel) {
      mesh.visible = false;
    }
    return;
  }
  
  // Apply base material to body meshes (everything else)
  mesh.material = createBaseMaterial(linkConfig.material);
}

export function applySurfaceConfigToMesh(
  mesh: THREE.Mesh,
  surfaceConfig: SurfaceConfig,
  surfaceId: SurfaceId
): void {
  const meshName = mesh.name;
  
  switch (surfaceConfig.type) {
    case "empty":
      // Hide gemstones/enamel, show base material
      if (isDiamondMesh(meshName) || isEnamelMesh(meshName)) {
        mesh.visible = false;
      }
      break;
      
    case "gemstones":
    case "moissanites":
      if (isDiamondMesh(meshName)) {
        mesh.visible = true;
        const stoneIndex = getGemstoneIndex(meshName, surfaceId);
        if (stoneIndex !== null && surfaceConfig.gemstoneColors) {
          const colorKey = `stone${stoneIndex + 1}` as keyof typeof surfaceConfig.gemstoneColors;
          const color = surfaceConfig.gemstoneColors[colorKey] || "#ffffff";
          mesh.material = createGemstoneMaterial(color);
        }
      }
      if (isEnamelMesh(meshName)) {
        mesh.visible = false;
      }
      break;
      
    case "enamel":
      if (isEnamelMesh(meshName)) {
        mesh.visible = true;
        mesh.material = createEnamelMaterial(surfaceConfig.enamelColor || "#ffffff");
      }
      if (isDiamondMesh(meshName)) {
        mesh.visible = false;
      }
      break;
      
    case "engraving":
      if (isDiamondMesh(meshName) || isEnamelMesh(meshName)) {
        mesh.visible = false;
      }
      // Apply engraving material to surface meshes
      if (isMeshForSurface(meshName, surfaceId)) {
        mesh.material = createEngravingMaterial(surfaceConfig.engravingDesign || "pattern1");
      }
      break;
  }
}

export function applyChainConfigToScene(
  scene: THREE.Object3D,
  chainConfig: ChainConfig
): void {
  // Get all link containers (direct children of scene)
  const linkContainers = scene.children.filter(child => 
    child.userData.linkIndex !== undefined
  );
  
  linkContainers.forEach((container, index) => {
    const linkConfig = chainConfig.links[index];
    if (!linkConfig) return;
    
    container.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        applyLinkConfigToMesh(child, linkConfig);
      }
    });
  });
}

// Apply config to a specific link by index
export function applyLinkConfigToContainer(
  container: THREE.Object3D,
  linkConfig: LinkConfig
): void {
  container.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      applyLinkConfigToMesh(child, linkConfig);
    }
  });
}

// Toggle visibility of all diamond meshes
export function toggleDiamondsVisibility(scene: THREE.Object3D, visible: boolean): void {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && isDiamondMesh(child.name)) {
      child.visible = visible;
    }
  });
}

// Toggle visibility of all enamel meshes
export function toggleEnamelVisibility(scene: THREE.Object3D, visible: boolean): void {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && isEnamelMesh(child.name)) {
      child.visible = visible;
    }
  });
}
