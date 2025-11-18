import type { ChainConfig, LinkConfig, Material, SurfaceConfig, SurfaceId } from './chain-config-types'

/**
 * Get the hex color for a given material
 */
export function getMaterialColor(material: Material): string {
    const materialColors: Record<Material, string> = {
        silver: '#c0c0c0',
        grey: '#808080',
        black: '#1a1a1a',
        white: '#f5f5f5',
        gold: '#ffd700',
    }
    return materialColors[material]
}

/**
 * Create a default surface configuration (empty type)
 */
export function createDefaultSurface(): SurfaceConfig {
    return {
        type: 'empty',
    }
}

/**
 * Create a default link configuration
 */
export function createDefaultLink(): LinkConfig {
    return {
        material: 'silver',
        surfaces: {
            top1: createDefaultSurface(),
            top2: createDefaultSurface(),
            side1: createDefaultSurface(),
            side2: createDefaultSurface(),
        },
    }
}

/**
 * Create a default chain configuration with specified length
 */
export function createDefaultConfig(length: number): ChainConfig {
    const links: LinkConfig[] = []
    for (let i = 0; i < length; i++) {
        links.push(createDefaultLink())
    }
    return {
        chainLength: length,
        links,
    }
}

/**
 * Update a link's material in the chain config (immutable)
 */
export function updateLinkMaterial(
    config: ChainConfig,
    linkIndex: number,
    material: Material
): ChainConfig {
    if (linkIndex < 0 || linkIndex >= config.links.length) {
        return config
    }

    const newLinks = [...config.links]
    newLinks[linkIndex] = {
        ...newLinks[linkIndex],
        material,
    }

    return {
        ...config,
        links: newLinks,
    }
}

/**
 * Update a surface configuration for a specific link (immutable)
 */
export function updateSurface(
    config: ChainConfig,
    linkIndex: number,
    surfaceId: SurfaceId,
    surfaceConfig: SurfaceConfig
): ChainConfig {
    if (linkIndex < 0 || linkIndex >= config.links.length) {
        return config
    }

    const newLinks = [...config.links]
    newLinks[linkIndex] = {
        ...newLinks[linkIndex],
        surfaces: {
            ...newLinks[linkIndex].surfaces,
            [surfaceId]: surfaceConfig,
        },
    }

    return {
        ...config,
        links: newLinks,
    }
}

/**
 * Adjust chain length, adding or removing links as needed
 */
export function setChainLength(config: ChainConfig, newLength: number): ChainConfig {
    if (newLength === config.chainLength) {
        return config
    }

    const newLinks = [...config.links]

    if (newLength > config.chainLength) {
        // Add new links
        const toAdd = newLength - config.chainLength
        for (let i = 0; i < toAdd; i++) {
            newLinks.push(createDefaultLink())
        }
    } else {
        // Remove links from the end
        newLinks.splice(newLength)
    }

    return {
        chainLength: newLength,
        links: newLinks,
    }
}

/**
 * Create default gemstone colors based on surface type
 */
export function createDefaultGemstoneColors(surfaceId: SurfaceId): SurfaceConfig['gemstoneColors'] {
    const isTopSurface = surfaceId === 'top1' || surfaceId === 'top2'

    if (isTopSurface) {
        return {
            stone1: '#ffffff', // colorless
            stone2: '#ffffff',
            stone3: '#ffffff',
        }
    } else {
        return {
            stone1: '#ffffff',
            stone2: '#ffffff',
        }
    }
}
