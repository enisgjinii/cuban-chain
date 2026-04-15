import * as THREE from "three";
import type { ChainConfig, LinkConfig, SurfaceConfig, SurfaceId, Material } from "./chain-config-types";

export const BASE_LINK_COUNT = 7;

// Backward-compatible exports kept for existing callers/integrations.
export const BASE_LINK_MESH_GROUP: string[] = [
  "cuban_main",
  "cuban_main.001",
  "top_flat",
  "top_flat.001",
  "cuban_top_flat",
  "cuban_top_flat.001",
  "cuban_side_flat",
  "cuban_side_flat.001",
];

export const DIAMOND_ELEMENTS: string[] = [
  "diamond_top_1",
  "diamond_top_2",
  "diamond_top_3",
  "diamond_top_1.001",
  "diamond_top_2.001",
  "diamond_top_3.001",
  "diamond_side1",
  "diamond_side1.001",
  "diamond_side_2",
  "diamond_side_2.001",
];

export const COMPLETE_DIAMOND_LINK: string[] = [
  ...BASE_LINK_MESH_GROUP,
  ...DIAMOND_ELEMENTS,
  "cuban_side_cavity_diamond",
  "cuban_side_cavity_diamond.001",
];

export const ADDITIONAL_LINK_MESH_GROUPS: string[][] = [["cuban_main", "cuban_main.001"]];

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

const SURFACE_IDS: SurfaceId[] = ["top1", "top2", "side1", "side2"];

function isThreeMesh(object: THREE.Object3D): object is THREE.Mesh {
  return object instanceof THREE.Mesh || (object as THREE.Mesh).isMesh === true;
}

const SINGLE_LINK_SCENE_MAX_WIDTH = 0.35;

const LEGACY_GEMSTONE_RANGES: Record<SurfaceId, [number, number]> = {
  top1: [1, 9],
  top2: [10, 18],
  side1: [19, 22],
  side2: [23, 99],
};

export const MESH_SURFACE_PATTERNS: Record<SurfaceId | "diamond" | "enamel" | "body", string[]> = {
  top1: [
    "top_flat",
    "top_diamond",
    "top_fill",
    "cuban_top_flat",
    "cuban_top_engraving",
    "_top1",
    "top_1",
    "top1",
  ],
  top2: [
    "top_flat.001",
    "top_diamond.001",
    "top_fill.001",
    "cuban_top_flat.001",
    "cuban_top_engraving.001",
    "_top2",
    "top_2",
    "top2",
  ],
  side1: [
    "cuban_side_flat",
    "cuban_side_cavity",
    "cuban_side_cavity_diamond",
    "side_fill",
    "side_engraving",
    "side_1",
    "side1",
  ],
  side2: [
    "cuban_side_flat.001",
    "cuban_side_cavity.001",
    "cuban_side_cavity_diamond.001",
    "side_fill.001",
    "side_engraving.001",
    "side_2",
    "side2",
    "1001",
  ],
  diamond: [
    "diamond_top_",
    "diamond_side",
    "diamond_octagon",
    "file2",
    "loc_diamond",
    "loc_diamonds",
    "gem",
    "stone",
  ],
  enamel: ["top_fill", "side_fill", "fill_", "fill", "loc_fill", "enamel"],
  body: [
    "cuban_main",
    "cuban_side",
    "cuban_top",
    "cuban_body",
    "top_flat",
    "top_diamond",
    "chain",
    "link",
    "cube",
    "part",
    "extralink",
    "chain_end",
  ],
};

export const GEMSTONE_MESH_PATTERNS: Record<SurfaceId, Record<string, string[]>> = {
  top1: {
    stone1: ["diamond_top_1", "diamond_octagon001", "diamond_octagon002", "diamond_octagon003"],
    stone2: ["diamond_top_2", "diamond_octagon004", "diamond_octagon005", "diamond_octagon006"],
    stone3: ["diamond_top_3", "diamond_octagon007", "diamond_octagon008", "diamond_octagon009"],
  },
  top2: {
    stone1: ["diamond_top_1.001", "diamond_octagon010", "diamond_octagon011", "diamond_octagon012"],
    stone2: ["diamond_top_2.001", "diamond_octagon013", "diamond_octagon014", "diamond_octagon015"],
    stone3: ["diamond_top_3.001", "diamond_octagon016", "diamond_octagon017", "diamond_octagon018"],
  },
  side1: {
    stone1: ["diamond_side1", "diamond_octagon019", "diamond_octagon020"],
    stone2: ["diamond_side_2", "diamond_octagon021", "diamond_octagon022"],
  },
  side2: {
    stone1: ["diamond_side1.001", "diamond_octagon023", "diamond_octagon024", "diamond_octagon025"],
    stone2: ["diamond_side_2.001", "diamond_octagon026", "diamond_octagon027", "diamond_octagon028"],
  },
};

export const ENAMEL_MESH_PATTERNS: Record<SurfaceId, string[]> = {
  top1: ["top_fill", "fill", "loc_fill"],
  top2: ["top_fill.001", "fill001", "loc_fill001"],
  side1: ["side_fill", "loc_fill_side1"],
  side2: ["side_fill.001", "loc_fill_side1001"],
};

function toKey(meshName: string): string {
  return meshName.toLowerCase().trim();
}

const SANITIZED_DUPLICATE_BASES = [
  "cuban_main",
  "cuban_side_cavity",
  "cuban_side_cavity_diamond",
  "cuban_side_flat",
  "cuban_top_engraving",
  "cuban_top_flat",
  "diamond_side1",
  "diamond_side_2",
  "diamond_top_1",
  "diamond_top_2",
  "diamond_top_3",
  "side_engraving",
  "side_fill",
  "top_diamond",
  "top_fill",
  "top_flat",
];

function normalizeMeshName(meshName: string): { key: string; base: string; duplicate: boolean } {
  const key = toKey(meshName);
  const dottedDuplicate = key.match(/^(.*)\.\d{3}$/u);
  if (dottedDuplicate) {
    return { key, base: dottedDuplicate[1], duplicate: true };
  }

  const sanitizedBase = SANITIZED_DUPLICATE_BASES.find((base) => key === `${base}001`);
  if (sanitizedBase) {
    return { key, base: sanitizedBase, duplicate: true };
  }

  return { key, base: key, duplicate: false };
}

function stripDuplicateSuffix(meshName: string): string {
  return normalizeMeshName(meshName).base;
}

function matches(meshName: string, patterns: string[]): boolean {
  const normalizedMesh = normalizeMeshName(meshName);
  return patterns.some((pattern) => {
    const normalizedPattern = normalizeMeshName(pattern);
    return (
      normalizedMesh.key.includes(normalizedPattern.key) ||
      normalizedMesh.base.includes(normalizedPattern.base)
    );
  });
}

function inferSurfaceFromName(meshName: string): SurfaceId | null {
  const { key, base, duplicate } = normalizeMeshName(meshName);

  if (base.startsWith("diamond_top_") || base.startsWith("top_") || base.startsWith("cuban_top_")) {
    return duplicate ? "top2" : "top1";
  }

  if (base.startsWith("diamond_side")) {
    return duplicate ? "side2" : "side1";
  }

  if (base.startsWith("side_") || base.startsWith("cuban_side_")) {
    return duplicate || key.includes("side2") || base.includes("side_2") ? "side2" : "side1";
  }

  for (const surfaceId of SURFACE_IDS) {
    if (matches(meshName, MESH_SURFACE_PATTERNS[surfaceId])) {
      return surfaceId;
    }
  }

  return null;
}

function inferSurfaceFromLegacyDiamondNumber(meshName: string): SurfaceId | null {
  const key = toKey(meshName);
  const match = key.match(/diamond_octagon(\d+)/u) ?? key.match(/(\d+)/u);
  if (!match) {
    return null;
  }

  const value = Number.parseInt(match[1], 10);
  for (const surfaceId of SURFACE_IDS) {
    const [min, max] = LEGACY_GEMSTONE_RANGES[surfaceId];
    if (value >= min && value <= max) {
      return surfaceId;
    }
  }

  return null;
}

function getSurfaceForDiamond(meshName: string): SurfaceId {
  const fromName = inferSurfaceFromName(meshName);
  if (fromName) {
    return fromName;
  }

  const fromLegacy = inferSurfaceFromLegacyDiamondNumber(meshName);
  if (fromLegacy) {
    return fromLegacy;
  }

  return "top1";
}

function getSurfaceForEnamel(meshName: string): SurfaceId {
  for (const surfaceId of SURFACE_IDS) {
    if (matches(meshName, ENAMEL_MESH_PATTERNS[surfaceId])) {
      return surfaceId;
    }
  }

  const inferred = inferSurfaceFromName(meshName);
  return inferred ?? "top1";
}

export function getSurfaceIdForMeshName(meshName: string): SurfaceId | null {
  if (isDiamondMesh(meshName)) {
    return getSurfaceForDiamond(meshName);
  }

  if (isEnamelMesh(meshName)) {
    return getSurfaceForEnamel(meshName);
  }

  return inferSurfaceFromName(meshName);
}

// ============================================================================
// MATERIAL CREATION
// ============================================================================

export function createBaseMaterial(materialType: Material): THREE.MeshStandardMaterial {
  const materialConfigs: Record<Material, { color: number; metalness: number; roughness: number }> = {
    silver: { color: 0xc0c0c0, metalness: 0.9, roughness: 0.1 },
    gold: { color: 0xffd700, metalness: 0.9, roughness: 0.1 },
    grey: { color: 0x808080, metalness: 0.7, roughness: 0.3 },
    black: { color: 0x1a1a1a, metalness: 0.5, roughness: 0.5 },
    white: { color: 0xf5f5f5, metalness: 0.3, roughness: 0.2 },
  };

  const config = materialConfigs[materialType] ?? materialConfigs.silver;
  return new THREE.MeshStandardMaterial({
    color: config.color,
    metalness: config.metalness,
    roughness: config.roughness,
    side: THREE.DoubleSide,
  });
}

export function createGemstoneMaterial(color: string): THREE.MeshPhysicalMaterial {
  const hexColor = Number.parseInt(color.replace("#", ""), 16);
  return new THREE.MeshPhysicalMaterial({
    color: hexColor,
    metalness: 0,
    roughness: 0.1,
    transmission: 0.9,
    thickness: 0.5,
    ior: 2.4,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide,
  });
}

export function createEnamelMaterial(color: string): THREE.MeshStandardMaterial {
  const hexColor = Number.parseInt(color.replace("#", ""), 16);
  return new THREE.MeshStandardMaterial({
    color: hexColor,
    metalness: 0.1,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
}

export function createEngravingMaterial(pattern: "pattern1" | "pattern2"): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: pattern === "pattern1" ? 0x333333 : 0x222222,
    metalness: 0.6,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });
}

// ============================================================================
// MESH IDENTIFICATION
// ============================================================================

export function isMeshForSurface(meshName: string, surfaceId: SurfaceId): boolean {
  const inferred = inferSurfaceFromName(meshName);
  if (inferred !== null) {
    return inferred === surfaceId;
  }

  return matches(meshName, MESH_SURFACE_PATTERNS[surfaceId]);
}

export function isDiamondMesh(meshName: string): boolean {
  return matches(meshName, MESH_SURFACE_PATTERNS.diamond);
}

export function isEnamelMesh(meshName: string): boolean {
  return matches(meshName, MESH_SURFACE_PATTERNS.enamel);
}

export function isBodyMesh(meshName: string): boolean {
  if (isDiamondMesh(meshName) || isEnamelMesh(meshName)) {
    return false;
  }

  return matches(meshName, MESH_SURFACE_PATTERNS.body) || meshName.length > 0;
}

export function getGemstoneIndex(meshName: string, surfaceId: SurfaceId): number | null {
  const patternMap = GEMSTONE_MESH_PATTERNS[surfaceId];
  for (const [stoneKey, patterns] of Object.entries(patternMap)) {
    if (matches(meshName, patterns)) {
      return Number.parseInt(stoneKey.replace("stone", ""), 10) - 1;
    }
  }

  return null;
}

function getGemstoneColor(surfaceConfig: SurfaceConfig, stoneIndex: number | null): string {
  if (!surfaceConfig.gemstoneColors) {
    return "#ffffff";
  }

  if (stoneIndex === null) {
    return surfaceConfig.gemstoneColors.stone1 ?? "#ffffff";
  }

  const key = `stone${stoneIndex + 1}` as keyof NonNullable<SurfaceConfig["gemstoneColors"]>;
  return surfaceConfig.gemstoneColors[key] ?? surfaceConfig.gemstoneColors.stone1 ?? "#ffffff";
}

function setMeshVisibility(mesh: THREE.Mesh, visible: boolean): void {
  if (mesh.visible !== visible) {
    mesh.visible = visible;
  }
}

function assignMaterialIfChanged(
  mesh: THREE.Mesh,
  signature: string,
  createMaterial: () => THREE.Material
): void {
  if (mesh.userData.appliedMaterialSignature === signature) {
    return;
  }

  mesh.material = createMaterial();
  mesh.userData.appliedMaterialSignature = signature;
}

// ============================================================================
// CONFIG APPLICATION
// ============================================================================

export function applyLinkConfigToMesh(mesh: THREE.Mesh, linkConfig: LinkConfig, _surfaceId?: SurfaceId): void {
  const meshName = mesh.name;

  if (isDiamondMesh(meshName)) {
    const targetSurface = getSurfaceForDiamond(meshName);
    const config = linkConfig.surfaces[targetSurface];

    if (config.type === "gemstones" || config.type === "moissanites") {
      setMeshVisibility(mesh, true);
      const stoneIndex = getGemstoneIndex(meshName, targetSurface);
      const color = getGemstoneColor(config, stoneIndex);
      assignMaterialIfChanged(mesh, `gemstone:${targetSurface}:${color}`, () =>
        createGemstoneMaterial(color)
      );
    } else {
      setMeshVisibility(mesh, false);
    }

    return;
  }

  if (isEnamelMesh(meshName)) {
    const targetSurface = getSurfaceForEnamel(meshName);
    const config = linkConfig.surfaces[targetSurface];

    if (config.type === "enamel") {
      setMeshVisibility(mesh, true);
      const color = config.enamelColor ?? "#ffffff";
      assignMaterialIfChanged(mesh, `enamel:${targetSurface}:${color}`, () =>
        createEnamelMaterial(color)
      );
    } else {
      setMeshVisibility(mesh, false);
    }

    return;
  }

  setMeshVisibility(mesh, true);

  // Apply engraving material if this body mesh belongs to a surface configured for engraving
  const bodySurface = inferSurfaceFromName(meshName);
  if (bodySurface !== null) {
    const surfaceConfig = linkConfig.surfaces[bodySurface];
    if (surfaceConfig.type === "engraving") {
      const pattern = surfaceConfig.engravingDesign ?? "pattern1";
      assignMaterialIfChanged(mesh, `engraving:${bodySurface}:${pattern}`, () =>
        createEngravingMaterial(pattern)
      );
      return;
    }
  }

  assignMaterialIfChanged(mesh, `base:${linkConfig.material}`, () =>
    createBaseMaterial(linkConfig.material)
  );
}

export function applySurfaceConfigToMesh(mesh: THREE.Mesh, surfaceConfig: SurfaceConfig, surfaceId: SurfaceId): void {
  const meshName = mesh.name;
  const belongsToSurface = isMeshForSurface(meshName, surfaceId);

  switch (surfaceConfig.type) {
    case "empty": {
      if ((isDiamondMesh(meshName) || isEnamelMesh(meshName)) && belongsToSurface) {
        setMeshVisibility(mesh, false);
      }
      return;
    }

    case "gemstones":
    case "moissanites": {
      if (isDiamondMesh(meshName) && belongsToSurface) {
        setMeshVisibility(mesh, true);
        const stoneIndex = getGemstoneIndex(meshName, surfaceId);
        const color = getGemstoneColor(surfaceConfig, stoneIndex);
        assignMaterialIfChanged(mesh, `gemstone:${surfaceId}:${color}`, () =>
          createGemstoneMaterial(color)
        );
      }
      if (isEnamelMesh(meshName) && belongsToSurface) {
        setMeshVisibility(mesh, false);
      }
      return;
    }

    case "enamel": {
      if (isEnamelMesh(meshName) && belongsToSurface) {
        setMeshVisibility(mesh, true);
        const color = surfaceConfig.enamelColor ?? "#ffffff";
        assignMaterialIfChanged(mesh, `enamel:${surfaceId}:${color}`, () =>
          createEnamelMaterial(color)
        );
      }
      if (isDiamondMesh(meshName) && belongsToSurface) {
        setMeshVisibility(mesh, false);
      }
      return;
    }

    case "engraving": {
      if ((isDiamondMesh(meshName) || isEnamelMesh(meshName)) && belongsToSurface) {
        setMeshVisibility(mesh, false);
      }
      if (belongsToSurface && isBodyMesh(meshName)) {
        const pattern = surfaceConfig.engravingDesign ?? "pattern1";
        assignMaterialIfChanged(mesh, `engraving:${surfaceId}:${pattern}`, () =>
          createEngravingMaterial(pattern)
        );
      }
      return;
    }
  }
}

export function applyChainConfigToScene(scene: THREE.Object3D, chainConfig: ChainConfig): void {
  const linkContainers = scene.children.filter((child) => child.userData.linkIndex !== undefined);

  linkContainers.forEach((container, index) => {
    const linkConfig = chainConfig.links[index];
    if (!linkConfig) {
      return;
    }

    container.traverse((child) => {
      if (isThreeMesh(child)) {
        applyLinkConfigToMesh(child, linkConfig);
      }
    });
  });
}

export function applyLinkConfigToContainer(container: THREE.Object3D, linkConfig: LinkConfig): void {
  container.traverse((child) => {
    if (isThreeMesh(child)) {
      applyLinkConfigToMesh(child, linkConfig);
    }
  });
}

export function toggleDiamondsVisibility(scene: THREE.Object3D, visible: boolean): void {
  scene.traverse((child) => {
    if (isThreeMesh(child) && isDiamondMesh(child.name)) {
      child.visible = visible;
    }
  });
}

export function toggleEnamelVisibility(scene: THREE.Object3D, visible: boolean): void {
  scene.traverse((child) => {
    if (isThreeMesh(child) && isEnamelMesh(child.name)) {
      child.visible = visible;
    }
  });
}

// ============================================================================
// SCENE DECOMPOSITION – split a pre-assembled model into per-link containers
// ============================================================================

function countMeshes(object: THREE.Object3D): number {
  let meshCount = 0;
  object.traverse((child) => {
    if (isThreeMesh(child)) {
      meshCount += 1;
    }
  });
  return meshCount;
}

function createSingleLinkScene(source: THREE.Object3D): THREE.Scene {
  const scene = new THREE.Scene();
  const container = new THREE.Group();
  const content = source.clone(true);

  source.updateMatrixWorld(true);
  content.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(content);
  if (!bounds.isEmpty()) {
    const center = bounds.getCenter(new THREE.Vector3());
    content.position.x -= center.x;
    content.position.y -= center.y;
    content.position.z -= center.z;
  }

  container.userData.linkIndex = 0;
  container.add(content);
  scene.add(container);
  return scene;
}

/**
 * Decompose a single pre-assembled chain scene (like EntireChain.glb) into
 * individual link containers by spatially clustering meshes along the X axis.
 *
 * Returns a new THREE.Scene where each direct child is a Group with
 * `userData.linkIndex` set, containing the meshes that belong to that link.
 */
export function decomposeIntoLinks(source: THREE.Object3D): THREE.Scene {
  // 1. Collect all meshes with their world-space X centre
  const entries: { mesh: THREE.Mesh; worldX: number }[] = [];

  // If the source already has groups with children, try to use the top-level
  // structure before falling back to spatial clustering.
  const rootMeshCount = source.children.filter((child) => isThreeMesh(child)).length;
  const topGroups = source.children.filter(
    (child) => !isThreeMesh(child) && child.children.length > 0
  );

  const sourceBounds = new THREE.Box3().setFromObject(source);
  const sourceSize = sourceBounds.getSize(new THREE.Vector3());

  if (rootMeshCount > 0 && sourceSize.x > 0 && sourceSize.x <= SINGLE_LINK_SCENE_MAX_WIDTH) {
    return createSingleLinkScene(source);
  }

  if (rootMeshCount === 0 && topGroups.length >= 2 && topGroups.every((group) => countMeshes(group) >= 4)) {
    // Model already has link groups – use them directly.
    const scene = new THREE.Scene();
    topGroups.forEach((group, index) => {
      const container = group.clone(true);
      container.userData.linkIndex = index;
      scene.add(container);
    });
    return scene;
  }

  // Fallback: spatial clustering
  source.updateMatrixWorld(true);
  source.traverse((child) => {
    if (isThreeMesh(child)) {
      const pos = new THREE.Vector3();
      child.getWorldPosition(pos);
      entries.push({ mesh: child, worldX: pos.x });
    }
  });

  if (entries.length === 0) {
    const empty = new THREE.Scene();
    const container = new THREE.Group();
    container.userData.linkIndex = 0;
    empty.add(container);
    return empty;
  }

  // Sort by X position
  entries.sort((a, b) => a.worldX - b.worldX);

  // Determine clustering gap – use the median inter-mesh distance × multiplier
  const gaps: number[] = [];
  for (let i = 1; i < entries.length; i++) {
    gaps.push(entries[i].worldX - entries[i - 1].worldX);
  }
  gaps.sort((a, b) => a - b);

  // Adaptive threshold: use 3× the median gap, with a reasonable floor & ceiling
  const medianGap = gaps.length > 0 ? gaps[Math.floor(gaps.length / 2)] : 0.01;
  const clusterThreshold = Math.max(0.005, Math.min(medianGap * 3, 0.15));

  // Build clusters
  const clusters: typeof entries[] = [[entries[0]]];
  for (let i = 1; i < entries.length; i++) {
    const gap = entries[i].worldX - entries[i - 1].worldX;
    if (gap > clusterThreshold) {
      clusters.push([]);
    }
    clusters[clusters.length - 1].push(entries[i]);
  }

  // 2. Build the decomposed scene
  const scene = new THREE.Scene();

  clusters.forEach((cluster, linkIndex) => {
    const container = new THREE.Group();
    container.userData.linkIndex = linkIndex;

    // Calculate cluster centre so we can position the container properly
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    cluster.forEach((e) => {
      const p = new THREE.Vector3();
      e.mesh.getWorldPosition(p);
      sumX += p.x;
      sumY += p.y;
      sumZ += p.z;
    });
    const cx = sumX / cluster.length;
    const cy = sumY / cluster.length;
    const cz = sumZ / cluster.length;

    container.position.set(cx, cy, cz);

    const inverseContainerMatrix = new THREE.Matrix4().makeTranslation(-cx, -cy, -cz);

    cluster.forEach((entry) => {
      const clone = entry.mesh.clone(true);
      entry.mesh.updateWorldMatrix(true, false);
      const relativeMatrix = entry.mesh.matrixWorld.clone().premultiply(inverseContainerMatrix);
      relativeMatrix.decompose(clone.position, clone.quaternion, clone.scale);
      container.add(clone);
    });

    scene.add(container);
  });

  return scene;
}

// ============================================================================
// SELECTION HIGHLIGHTING
// ============================================================================

const HIGHLIGHT_EMISSIVE = new THREE.Color(0x334455);
const NORMAL_EMISSIVE = new THREE.Color(0x000000);

/**
 * Apply or remove a subtle emissive highlight on a link container's body meshes.
 */
export function setLinkHighlight(container: THREE.Object3D, highlighted: boolean): void {
  container.traverse((child) => {
    if (!isThreeMesh(child)) return;
    const mat = child.material;
    if (
      mat instanceof THREE.MeshStandardMaterial ||
      mat instanceof THREE.MeshPhysicalMaterial ||
      ("emissive" in mat && "needsUpdate" in mat)
    ) {
      mat.emissive = highlighted ? HIGHLIGHT_EMISSIVE : NORMAL_EMISSIVE;
      mat.needsUpdate = true;
    }
  });
}
