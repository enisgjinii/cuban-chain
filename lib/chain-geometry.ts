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
// Based on diagnostic analysis of all GLB models (Dec 2024)
// ============================================================================

// Pattern to identify mesh types by name
// Discovered patterns from model analysis:
// - Cuban-Link.glb: Diamond_Octagon001-071, fill/fill001, loc_diamond_side_1, loc_fill_side1
// - part5.glb: file2001-2007 (Diamond.001 material), Cube019-042
// - part7.glb/enamel.glb: fill/fill001
// - Other parts: B5-24-古巴链-OK-版-倒铜_XXXX (Chinese naming)
export const MESH_SURFACE_PATTERNS = {
  // Top surfaces - typically the main visible faces (general diamonds are on top)
  top1: ["_top1", "_Top1", "top_1", "Top_1", "_t1", "top1", "loc_diamonds"],
  top2: ["_top2", "_Top2", "top_2", "Top_2", "_t2", "top2", "loc_diamonds001"],
  // Side surfaces - specific side zone patterns from Cuban-Link.glb
  side1: ["_side1", "_Side1", "side_1", "Side_1", "_s1", "side1", "loc_diamond_side_1", "loc_fill_side1"],
  side2: ["_side2", "_Side2", "side_2", "Side_2", "_s2", "side2", "loc_diamond_side_1001", "loc_fill_side1001"],
  // Diamond/gemstone meshes - comprehensive patterns from all models
  diamond: [
    "Diamond", "diamond", "gem", "Gem", "stone", "Stone",
    "Diamond_Octagon", // Cuban-Link.glb pattern
    "loc_diamonds",    // General location node
    "file2",           // part5.glb pattern (uses Diamond.001 material)
  ],
  // Enamel surfaces - fill patterns from enamel.glb, part7.glb, Cuban-Link.glb
  enamel: ["enamel", "Enamel", "fill", "Fill", "loc_fill"],
  // Base link body (for material application)
  body: [
    "Cube",            // Generic Three.js cube pattern (part5.glb, part6.glb)
    "Part", "Link",    // General link structure
    "body", "Body",
    "古巴链",           // Chinese "Cuban chain"
    "cubanLink", "Cuban",
    "sm_cubanLink",    // part6.glb pattern
    "Prongs",          // Most models use Prongs material
    "倒铜",             // Part of Chinese naming pattern
  ],
};

// Gemstone mesh patterns for each surface zone
// Updated based on Cuban-Link.glb structure which has the most detailed naming
export const GEMSTONE_MESH_PATTERNS = {
  top1: {
    // General top diamonds (first half of Diamond_Octagon series)
    stone1: ["Diamond_Octagon001", "Diamond_Octagon002", "Diamond_Octagon003", "file2001"],
    stone2: ["Diamond_Octagon004", "Diamond_Octagon005", "Diamond_Octagon006", "file2003"],
    stone3: ["Diamond_Octagon007", "Diamond_Octagon008", "Diamond_Octagon009", "file2006"],
  },
  top2: {
    // Second set of top diamonds
    stone1: ["Diamond_Octagon010", "Diamond_Octagon011", "Diamond_Octagon012"],
    stone2: ["Diamond_Octagon013", "Diamond_Octagon014", "Diamond_Octagon015"],
    stone3: ["Diamond_Octagon016", "Diamond_Octagon017", "Diamond_Octagon018", "file2007"],
  },
  side1: {
    // Left side diamonds (identified by loc_diamond_side_1 node)
    stone1: ["loc_diamond_side_1", "Diamond_Octagon019", "Diamond_Octagon020"],
    stone2: ["loc_diamond_side_1001", "Diamond_Octagon021", "Diamond_Octagon022"],
  },
  side2: {
    // Right side diamonds
    stone1: ["Diamond_Octagon023", "Diamond_Octagon024", "Diamond_Octagon025"],
    stone2: ["Diamond_Octagon026", "Diamond_Octagon027", "Diamond_Octagon028"],
  },
};

// Enamel mesh patterns for each surface zone
export const ENAMEL_MESH_PATTERNS = {
  top1: ["fill", "loc_fill"],
  top2: ["fill001", "loc_fill001"],
  side1: ["loc_fill_side1"],
  side2: ["loc_fill_side1001"],
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
    // Determine which surface zone this diamond belongs to
    let targetSurface: SurfaceId = "top1"; // default

    // First check for explicit side indicators in mesh name
    if (meshName.includes("side") || meshName.includes("Side")) {
      targetSurface = meshName.includes("1001") || meshName.includes("side_2") || meshName.includes("Side2") ? "side2" : "side1";
    } else {
      // For Diamond_Octagon meshes, use numeric ranges based on our mapping
      // Cuban-Link.glb has Diamond_Octagon001 through Diamond_Octagon071
      const match = meshName.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        // Based on GEMSTONE_MESH_PATTERNS structure:
        // top1: 1-9, top2: 10-18, side1: 19-22, side2: 23-28+
        if (num >= 1 && num <= 9) {
          targetSurface = "top1";
        } else if (num >= 10 && num <= 18) {
          targetSurface = "top2";
        } else if (num >= 19 && num <= 22) {
          targetSurface = "side1";
        } else if (num >= 23) {
          targetSurface = "side2";
        }
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


  // Handle enamel meshes - now with zone-specific detection
  if (isEnamelMesh(meshName)) {
    // Determine which zone this enamel mesh belongs to
    let targetSurface: SurfaceId | null = null;

    // Check against ENAMEL_MESH_PATTERNS for zone-specific matching
    for (const [zone, patterns] of Object.entries(ENAMEL_MESH_PATTERNS)) {
      if (patterns.some(pattern => meshName.includes(pattern))) {
        targetSurface = zone as SurfaceId;
        break;
      }
    }

    // If no specific zone found, default to top1 for generic fill meshes
    if (!targetSurface) {
      if (meshName.includes("side") || meshName.includes("Side")) {
        targetSurface = meshName.includes("1001") || meshName.includes("2") ? "side2" : "side1";
      } else if (meshName.includes("001")) {
        targetSurface = "top2";
      } else {
        targetSurface = "top1";
      }
    }

    const config = linkConfig.surfaces[targetSurface];
    if (config.type === "enamel") {
      mesh.visible = true;
      mesh.material = createEnamelMaterial(config.enamelColor || "#ffffff");
    } else {
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
