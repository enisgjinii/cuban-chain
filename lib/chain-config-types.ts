// Material types
export type Material = "silver" | "grey" | "black" | "white" | "gold";

// Surface customization types
export type SurfaceType =
  | "empty"
  | "gemstones"
  | "moissanites"
  | "enamel"
  | "engraving";

// Surface identifiers
export type SurfaceId = "top1" | "top2" | "side1" | "side2";

// Gemstone color per stone (top surfaces have 3, side surfaces have 2)
export interface GemstoneColors {
  stone1: string; // hex color
  stone2: string;
  stone3?: string; // only for top surfaces
}

// Surface configuration
export interface SurfaceConfig {
  type: SurfaceType;
  gemstoneColors?: GemstoneColors; // when type === 'gemstones' | 'moissanites'
  enamelColor?: string; // when type === 'enamel'
  engravingDesign?: "pattern1" | "pattern2"; // when type === 'engraving'
}

// Per-link configuration
export interface LinkConfig {
  material: Material;
  surfaces: {
    top1: SurfaceConfig;
    top2: SurfaceConfig;
    side1: SurfaceConfig;
    side2: SurfaceConfig;
  };
}

// Full chain configuration
export interface ChainConfig {
  chainLength: number;
  links: LinkConfig[]; // length should match chainLength
}
