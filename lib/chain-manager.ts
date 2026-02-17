import * as THREE from "three";

// Chain link types available
export type ChainLinkType =
  | "cuban-main"
  | "cuban-top-flat"
  | "cuban-top-diamond"
  | "cuban-top-engraving"
  | "cuban-top-filling"
  | "cuban-top-cavity"
  | "cuban-top-cavity-diamond"
  | "cuban-side-flat"
  | "cuban-side-diamond"
  | "cuban-side-engraving"
  | "cuban-side-filling"
  | "cuban-side-cavity"
  | "cuban-side-cavity-diamond";

// Model URL mapping
export const LINK_TYPE_TO_URL: Record<ChainLinkType, string> = {
  "cuban-main": "/models/Cuban_Main.glb",
  "cuban-top-flat": "/models/cuban_top_flat.glb",
  "cuban-top-diamond": "/models/cuban_top_diamond.glb",
  "cuban-top-engraving": "/models/cuban_top_engraving.glb",
  "cuban-top-filling": "/models/cuban_top_filling.glb",
  "cuban-top-cavity": "/models/cuban_top_cavity.glb",
  "cuban-top-cavity-diamond": "/models/cuban_top_cavity_diamond.glb",
  "cuban-side-flat": "/models/cuban_side_flat.glb",
  "cuban-side-diamond": "/models/cuban_side_diamond.glb",
  "cuban-side-engraving": "/models/cuban_side_engraving.glb",
  "cuban-side-filling": "/models/cuban_side_filling.glb",
  "cuban-side-cavity": "/models/cuban_side_cavity.glb",
  "cuban-side-cavity-diamond": "/models/cuban_side_cavity_diamond.glb",
};

// Reverse mapping
export const URL_TO_LINK_TYPE: Record<string, ChainLinkType> = Object.entries(
  LINK_TYPE_TO_URL
).reduce((acc, [type, url]) => {
  acc[url] = type as ChainLinkType;
  return acc;
}, {} as Record<string, ChainLinkType>);

// Individual chain link configuration
export interface ChainLink {
  id: string;
  type: ChainLinkType;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  visible: boolean;
  material?: string;
  customOffset?: THREE.Vector3;
}

// Chain assembly configuration
export interface ChainAssembly {
  id: string;
  name: string;
  links: ChainLink[];
  globalOffset: THREE.Vector3;
  globalRotation: THREE.Euler;
  globalScale: number;
  spacing: number;
  pattern: ChainPattern;
}

// Chain patterns for link arrangement
export type ChainPattern = 
  | "linear"           // All links in a straight line
  | "alternating"      // Links alternate orientation
  | "curved"           // Links follow a curve
  | "custom";          // User-defined positions

// Link geometry bounds (approximate, will be calculated from actual models)
export interface LinkBounds {
  width: number;   // X dimension
  height: number;  // Y dimension
  depth: number;   // Z dimension
  connectionPointStart: THREE.Vector3;
  connectionPointEnd: THREE.Vector3;
}

// Default bounds for each link type (can be updated after model loading)
export const DEFAULT_LINK_BOUNDS: Record<ChainLinkType, LinkBounds> = {
  "cuban-main": {
    width: 0.12,
    height: 0.05,
    depth: 0.03,
    connectionPointStart: new THREE.Vector3(-0.06, 0, 0),
    connectionPointEnd: new THREE.Vector3(0.06, 0, 0),
  },
  "cuban-top-flat": {
    width: 0.12,
    height: 0.05,
    depth: 0.03,
    connectionPointStart: new THREE.Vector3(-0.06, 0, 0),
    connectionPointEnd: new THREE.Vector3(0.06, 0, 0),
  },
  "cuban-top-diamond": {
    width: 0.12,
    height: 0.05,
    depth: 0.03,
    connectionPointStart: new THREE.Vector3(-0.06, 0, 0),
    connectionPointEnd: new THREE.Vector3(0.06, 0, 0),
  },
  "cuban-top-engraving": {
    width: 0.12,
    height: 0.05,
    depth: 0.03,
    connectionPointStart: new THREE.Vector3(-0.06, 0, 0),
    connectionPointEnd: new THREE.Vector3(0.06, 0, 0),
  },
  "cuban-top-filling": {
    width: 0.12,
    height: 0.05,
    depth: 0.03,
    connectionPointStart: new THREE.Vector3(-0.06, 0, 0),
    connectionPointEnd: new THREE.Vector3(0.06, 0, 0),
  },
  "cuban-top-cavity": {
    width: 0.12,
    height: 0.05,
    depth: 0.03,
    connectionPointStart: new THREE.Vector3(-0.06, 0, 0),
    connectionPointEnd: new THREE.Vector3(0.06, 0, 0),
  },
  "cuban-top-cavity-diamond": {
    width: 0.12,
    height: 0.05,
    depth: 0.03,
    connectionPointStart: new THREE.Vector3(-0.06, 0, 0),
    connectionPointEnd: new THREE.Vector3(0.06, 0, 0),
  },
  "cuban-side-flat": {
    width: 0.12,
    height: 0.05,
    depth: 0.03,
    connectionPointStart: new THREE.Vector3(-0.06, 0, 0),
    connectionPointEnd: new THREE.Vector3(0.06, 0, 0),
  },
  "cuban-side-diamond": {
    width: 0.12,
    height: 0.05,
    depth: 0.03,
    connectionPointStart: new THREE.Vector3(-0.06, 0, 0),
    connectionPointEnd: new THREE.Vector3(0.06, 0, 0),
  },
  "cuban-side-engraving": {
    width: 0.12,
    height: 0.05,
    depth: 0.03,
    connectionPointStart: new THREE.Vector3(-0.06, 0, 0),
    connectionPointEnd: new THREE.Vector3(0.06, 0, 0),
  },
  "cuban-side-filling": {
    width: 0.12,
    height: 0.05,
    depth: 0.03,
    connectionPointStart: new THREE.Vector3(-0.06, 0, 0),
    connectionPointEnd: new THREE.Vector3(0.06, 0, 0),
  },
  "cuban-side-cavity": {
    width: 0.12,
    height: 0.05,
    depth: 0.03,
    connectionPointStart: new THREE.Vector3(-0.06, 0, 0),
    connectionPointEnd: new THREE.Vector3(0.06, 0, 0),
  },
  "cuban-side-cavity-diamond": {
    width: 0.12,
    height: 0.05,
    depth: 0.03,
    connectionPointStart: new THREE.Vector3(-0.06, 0, 0),
    connectionPointEnd: new THREE.Vector3(0.06, 0, 0),
  },
};

// Generate unique ID
export function generateLinkId(): string {
  return `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new chain link with default values
export function createChainLink(
  type: ChainLinkType,
  position?: THREE.Vector3,
  options?: Partial<ChainLink>
): ChainLink {
  return {
    id: generateLinkId(),
    type,
    position: position || new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    scale: new THREE.Vector3(1, 1, 1),
    visible: true,
    ...options,
  };
}

// Calculate position for a new link based on previous link
export function calculateNextLinkPosition(
  previousLink: ChainLink | null,
  newLinkType: ChainLinkType,
  spacing: number = 0.02,
  pattern: ChainPattern = "linear"
): THREE.Vector3 {
  if (!previousLink) {
    return new THREE.Vector3(0, 0, 0);
  }

  const prevBounds = DEFAULT_LINK_BOUNDS[previousLink.type];
  const newBounds = DEFAULT_LINK_BOUNDS[newLinkType];

  // Calculate base offset (end of previous link to start of new link)
  const baseOffset = prevBounds.width / 2 + newBounds.width / 2 + spacing;

  const newPosition = previousLink.position.clone();

  switch (pattern) {
    case "linear":
      newPosition.x += baseOffset;
      break;
    case "alternating":
      newPosition.x += baseOffset;
      // Slight Y offset for alternating pattern
      newPosition.y += (Math.random() - 0.5) * 0.01;
      break;
    case "curved":
      // Simple curve calculation
      const angle = Math.PI * 0.1; // 18 degrees
      newPosition.x += baseOffset * Math.cos(angle);
      newPosition.y += baseOffset * Math.sin(angle);
      break;
    default:
      newPosition.x += baseOffset;
  }

  return newPosition;
}

// Create a chain assembly with specified links
export function createChainAssembly(
  linkTypes: ChainLinkType[],
  options?: {
    spacing?: number;
    pattern?: ChainPattern;
    name?: string;
  }
): ChainAssembly {
  const spacing = options?.spacing ?? 0.02;
  const pattern = options?.pattern ?? "linear";
  const links: ChainLink[] = [];

  let previousLink: ChainLink | null = null;

  for (const type of linkTypes) {
    const position = calculateNextLinkPosition(previousLink, type, spacing, pattern);
    const link = createChainLink(type, position);
    
    // Apply alternating rotation for alternating pattern
    if (pattern === "alternating" && links.length % 2 === 1) {
      link.rotation = new THREE.Euler(0, Math.PI, 0);
    }
    
    links.push(link);
    previousLink = link;
  }

  return {
    id: `chain-${Date.now()}`,
    name: options?.name ?? "New Chain",
    links,
    globalOffset: new THREE.Vector3(0, 0, 0),
    globalRotation: new THREE.Euler(0, 0, 0),
    globalScale: 1,
    spacing,
    pattern,
  };
}

// Add a link to an existing chain assembly
export function addLinkToChain(
  chain: ChainAssembly,
  linkType: ChainLinkType,
  insertIndex?: number
): ChainAssembly {
  const newLinks = [...chain.links];
  
  if (insertIndex !== undefined && insertIndex >= 0 && insertIndex < newLinks.length) {
    // Insert at specific position
    const prevLink = insertIndex > 0 ? newLinks[insertIndex - 1] : null;
    const position = calculateNextLinkPosition(prevLink, linkType, chain.spacing, chain.pattern);
    const newLink = createChainLink(linkType, position);
    
    newLinks.splice(insertIndex, 0, newLink);
    
    // Recalculate positions for all links after insertion
    recalculateLinkPositions(newLinks, chain.spacing, chain.pattern, insertIndex);
  } else {
    // Add to end
    const lastLink = newLinks.length > 0 ? newLinks[newLinks.length - 1] : null;
    const position = calculateNextLinkPosition(lastLink, linkType, chain.spacing, chain.pattern);
    const newLink = createChainLink(linkType, position);
    newLinks.push(newLink);
  }

  return {
    ...chain,
    links: newLinks,
  };
}

// Remove a link from the chain
export function removeLinkFromChain(
  chain: ChainAssembly,
  linkId: string
): ChainAssembly {
  const linkIndex = chain.links.findIndex(l => l.id === linkId);
  if (linkIndex === -1) return chain;

  const newLinks = chain.links.filter(l => l.id !== linkId);
  
  // Recalculate positions for remaining links
  if (linkIndex < newLinks.length) {
    recalculateLinkPositions(newLinks, chain.spacing, chain.pattern, linkIndex);
  }

  return {
    ...chain,
    links: newLinks,
  };
}

// Recalculate positions for links starting from a given index
function recalculateLinkPositions(
  links: ChainLink[],
  spacing: number,
  pattern: ChainPattern,
  startIndex: number = 0
): void {
  for (let i = startIndex; i < links.length; i++) {
    const prevLink = i > 0 ? links[i - 1] : null;
    links[i].position = calculateNextLinkPosition(prevLink, links[i].type, spacing, pattern);
    
    // Apply pattern-specific rotation
    if (pattern === "alternating" && i % 2 === 1) {
      links[i].rotation = new THREE.Euler(0, Math.PI, 0);
    }
  }
}

// Update chain spacing and recalculate all positions
export function updateChainSpacing(
  chain: ChainAssembly,
  newSpacing: number
): ChainAssembly {
  const newLinks = [...chain.links];
  recalculateLinkPositions(newLinks, newSpacing, chain.pattern, 0);
  
  return {
    ...chain,
    links: newLinks,
    spacing: newSpacing,
  };
}

// Update chain pattern and recalculate positions
export function updateChainPattern(
  chain: ChainAssembly,
  newPattern: ChainPattern
): ChainAssembly {
  const newLinks = [...chain.links];
  recalculateLinkPositions(newLinks, chain.spacing, newPattern, 0);
  
  return {
    ...chain,
    links: newLinks,
    pattern: newPattern,
  };
}

// Update a specific link's custom offset
export function updateLinkOffset(
  chain: ChainAssembly,
  linkId: string,
  offset: THREE.Vector3
): ChainAssembly {
  const newLinks = chain.links.map(link => {
    if (link.id === linkId) {
      return {
        ...link,
        customOffset: offset,
      };
    }
    return link;
  });

  return {
    ...chain,
    links: newLinks,
  };
}

// Get model URLs from chain assembly
export function getModelUrlsFromChain(chain: ChainAssembly): string[] {
  return chain.links.map(link => LINK_TYPE_TO_URL[link.type]);
}

// Convert legacy modelUrls array to chain assembly
export function convertUrlsToChainAssembly(
  urls: string[],
  spacing: number = 0.02
): ChainAssembly {
  const linkTypes: ChainLinkType[] = urls.map(url => {
    const type = URL_TO_LINK_TYPE[url];
    return type || "cuban-main";
  });

  return createChainAssembly(linkTypes, { spacing, pattern: "linear" });
}

// Calculate actual bounds from a loaded model
export function calculateModelBounds(scene: THREE.Object3D): LinkBounds {
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  return {
    width: size.x,
    height: size.y,
    depth: size.z,
    connectionPointStart: new THREE.Vector3(box.min.x - center.x, 0, 0),
    connectionPointEnd: new THREE.Vector3(box.max.x - center.x, 0, 0),
  };
}

// Preset chain configurations
export const CHAIN_PRESETS: Record<string, ChainLinkType[]> = {
  "basic-7": [
    "cuban-main",
    "cuban-main",
    "cuban-main",
    "cuban-main",
    "cuban-main",
    "cuban-main",
    "cuban-main",
  ],
  "basic-9": [
    "cuban-main",
    "cuban-main",
    "cuban-main",
    "cuban-main",
    "cuban-main",
    "cuban-main",
    "cuban-main",
    "cuban-main",
    "cuban-main",
  ],
  "top-diamond": [
    "cuban-main",
    "cuban-top-diamond",
    "cuban-main",
    "cuban-top-diamond",
    "cuban-main",
    "cuban-top-diamond",
    "cuban-main",
  ],
  "side-diamond": [
    "cuban-main",
    "cuban-side-diamond",
    "cuban-main",
    "cuban-side-diamond",
    "cuban-main",
    "cuban-side-diamond",
    "cuban-main",
  ],
  "engraving-mix": [
    "cuban-main",
    "cuban-top-engraving",
    "cuban-main",
    "cuban-side-engraving",
    "cuban-main",
    "cuban-top-engraving",
    "cuban-main",
  ],
};

// Create chain from preset
export function createChainFromPreset(
  presetName: string,
  options?: { spacing?: number; pattern?: ChainPattern }
): ChainAssembly | null {
  const preset = CHAIN_PRESETS[presetName];
  if (!preset) return null;

  return createChainAssembly(preset, {
    ...options,
    name: presetName,
  });
}
