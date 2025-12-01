import type {
  ChainConfig,
  LinkConfig,
  Material,
  SurfaceConfig,
  SurfaceId,
} from "./chain-config-types";

/**
 * Get the hex color for a given material
 */
export function getMaterialColor(material: Material): string {
  const materialColors: Record<Material, string> = {
    silver: "#c0c0c0",
    grey: "#808080",
    black: "#1a1a1a",
    white: "#f5f5f5",
    gold: "#ffd700",
  };
  return materialColors[material];
}

/**
 * Create a default surface configuration (empty type)
 */
export function createDefaultSurface(): SurfaceConfig {
  return {
    type: "empty",
  };
}

/**
 * Create a default link configuration
 */
export function createDefaultLink(): LinkConfig {
  return {
    material: "silver",
    surfaces: {
      top1: createDefaultSurface(),
      top2: createDefaultSurface(),
      side1: createDefaultSurface(),
      side2: createDefaultSurface(),
    },
  };
}

/**
 * Create a default chain configuration with specified length
 */
export function createDefaultConfig(length: number): ChainConfig {
  const links: LinkConfig[] = [];
  for (let i = 0; i < length; i++) {
    links.push(createDefaultLink());
  }
  return {
    chainLength: length,
    links,
  };
}

/**
 * Update a link's material in the chain config (immutable)
 */
export function updateLinkMaterial(
  config: ChainConfig,
  linkIndex: number,
  material: Material,
): ChainConfig {
  if (linkIndex < 0 || linkIndex >= config.links.length) {
    return config;
  }

  const newLinks = [...config.links];
  newLinks[linkIndex] = {
    ...newLinks[linkIndex],
    material,
  };

  return {
    ...config,
    links: newLinks,
  };
}

/**
 * Update a surface configuration for a specific link (immutable)
 */
export function updateSurface(
  config: ChainConfig,
  linkIndex: number,
  surfaceId: SurfaceId,
  surfaceConfig: SurfaceConfig,
): ChainConfig {
  if (linkIndex < 0 || linkIndex >= config.links.length) {
    return config;
  }

  const newLinks = [...config.links];
  newLinks[linkIndex] = {
    ...newLinks[linkIndex],
    surfaces: {
      ...newLinks[linkIndex].surfaces,
      [surfaceId]: surfaceConfig,
    },
  };

  return {
    ...config,
    links: newLinks,
  };
}

/**
 * Adjust chain length, adding or removing links as needed
 */
export function setChainLength(
  config: ChainConfig,
  newLength: number,
): ChainConfig {
  if (newLength === config.chainLength) {
    return config;
  }

  const newLinks = [...config.links];

  if (newLength > config.chainLength) {
    // Add new links
    const toAdd = newLength - config.chainLength;
    for (let i = 0; i < toAdd; i++) {
      newLinks.push(createDefaultLink());
    }
  } else {
    // Remove links from the end
    newLinks.splice(newLength);
  }

  return {
    chainLength: newLength,
    links: newLinks,
  };
}

/**
 * Create default gemstone colors based on surface type
 */
export function createDefaultGemstoneColors(
  surfaceId: SurfaceId,
): SurfaceConfig["gemstoneColors"] {
  const isTopSurface = surfaceId === "top1" || surfaceId === "top2";

  if (isTopSurface) {
    return {
      stone1: "#ffffff", // colorless
      stone2: "#ffffff",
      stone3: "#ffffff",
    };
  } else {
    return {
      stone1: "#ffffff",
      stone2: "#ffffff",
    };
  }
}

/**
 * Copy configuration from one link to all other links
 */
export function copyLinkToAll(
  config: ChainConfig,
  sourceLinkIndex: number,
): ChainConfig {
  if (sourceLinkIndex < 0 || sourceLinkIndex >= config.links.length) {
    return config;
  }

  const sourceLink = config.links[sourceLinkIndex];
  const newLinks = config.links.map(() => ({
    ...sourceLink,
    surfaces: {
      top1: { ...sourceLink.surfaces.top1 },
      top2: { ...sourceLink.surfaces.top2 },
      side1: { ...sourceLink.surfaces.side1 },
      side2: { ...sourceLink.surfaces.side2 },
    },
  }));

  return {
    ...config,
    links: newLinks,
  };
}

/**
 * Apply material to all links
 */
export function applyMaterialToAllLinks(
  config: ChainConfig,
  material: Material,
): ChainConfig {
  const newLinks = config.links.map((link) => ({
    ...link,
    material,
  }));

  return {
    ...config,
    links: newLinks,
  };
}

/**
 * Apply material to alternating links (every other link)
 */
export function applyMaterialToAlternatingLinks(
  config: ChainConfig,
  material: Material,
  startIndex: number = 0,
): ChainConfig {
  const newLinks = config.links.map((link, index) => {
    if ((index - startIndex) % 2 === 0) {
      return { ...link, material };
    }
    return link;
  });

  return {
    ...config,
    links: newLinks,
  };
}

/**
 * Apply surface configuration to all links for a specific surface
 */
export function applySurfaceToAllLinks(
  config: ChainConfig,
  surfaceId: SurfaceId,
  surfaceConfig: SurfaceConfig,
): ChainConfig {
  const newLinks = config.links.map((link) => ({
    ...link,
    surfaces: {
      ...link.surfaces,
      [surfaceId]: { ...surfaceConfig },
    },
  }));

  return {
    ...config,
    links: newLinks,
  };
}

/**
 * Apply surface configuration to all top surfaces (top1 and top2) of all links
 */
export function applySurfaceToAllTopSurfaces(
  config: ChainConfig,
  surfaceConfig: SurfaceConfig,
): ChainConfig {
  const newLinks = config.links.map((link) => ({
    ...link,
    surfaces: {
      ...link.surfaces,
      top1: { ...surfaceConfig },
      top2: { ...surfaceConfig },
    },
  }));

  return {
    ...config,
    links: newLinks,
  };
}

/**
 * Apply surface configuration to all side surfaces (side1 and side2) of all links
 */
export function applySurfaceToAllSideSurfaces(
  config: ChainConfig,
  surfaceConfig: SurfaceConfig,
): ChainConfig {
  // Adjust gemstone count for side surfaces (2 instead of 3)
  const adjustedConfig = { ...surfaceConfig };
  if (adjustedConfig.gemstoneColors?.stone3) {
    adjustedConfig.gemstoneColors = {
      stone1: adjustedConfig.gemstoneColors.stone1,
      stone2: adjustedConfig.gemstoneColors.stone2,
    };
  }

  const newLinks = config.links.map((link) => ({
    ...link,
    surfaces: {
      ...link.surfaces,
      side1: { ...adjustedConfig },
      side2: { ...adjustedConfig },
    },
  }));

  return {
    ...config,
    links: newLinks,
  };
}
