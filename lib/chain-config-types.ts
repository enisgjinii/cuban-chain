// Material types - all available materials per technical brief
export type Material = "silver" | "grey" | "black" | "white" | "gold";

// Material display names and colors for UI
export const MATERIAL_OPTIONS: Array<{ name: string; value: Material; color: string }> = [
  { name: "Silver", value: "silver", color: "#c0c0c0" },
  { name: "Gold", value: "gold", color: "#ffd700" },
  { name: "Grey", value: "grey", color: "#808080" },
  { name: "Black", value: "black", color: "#1a1a1a" },
  { name: "White", value: "white", color: "#f5f5f5" },
];

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

// Gemstone color options
export const GEMSTONE_COLORS: Array<{ name: string; value: string }> = [
  { name: "Colourless", value: "#ffffff" },
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#dc2626" },
  { name: "Blue", value: "#2563eb" },
  { name: "Green", value: "#16a34a" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#ea580c" },
  { name: "Pink", value: "#ec4899" },
  { name: "Purple", value: "#9333ea" },
];

// Enamel color options
export const ENAMEL_COLORS: Array<{ name: string; value: string }> = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#ffffff" },
  { name: "Red", value: "#dc2626" },
  { name: "Green", value: "#16a34a" },
  { name: "Blue", value: "#2563eb" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#ea580c" },
  { name: "Opal 1", value: "#b8b8ff" },
  { name: "Opal 2", value: "#ffb8d1" },
];

// Engraving design options
export const ENGRAVING_DESIGNS: Array<{ name: string; value: "pattern1" | "pattern2" }> = [
  { name: "Pattern 1", value: "pattern1" },
  { name: "Pattern 2", value: "pattern2" },
];
