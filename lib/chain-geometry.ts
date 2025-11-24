export const BASE_LINK_COUNT = 7;

// Base link mesh groups (7 base links in the chain model)
// Each base link consists of the following meshes grouped together:
// - Cube, Cube.001 to Cube.012: Main chain link structure (13 cubes total)
// - Diamond_Octagon.001 to Diamond_Octagon.003: Diamond decorations (3 diamonds)
// These meshes together form one complete chain link group with diamonds
export const BASE_LINK_MESH_GROUP: string[] = [
  "Cube",
  "Cube001",
  "Cube002",
  "Cube003",
  "Cube004",
  "Cube005",
  "Cube006",
  "Cube007",
  "Cube008",
  "Cube009",
  "Cube010",
  "Cube011",
  "Cube012",
  "Diamond_Octagon001",
  "Diamond_Octagon002",
  "Diamond_Octagon003",
];

// Diamond elements that can be added to create a decorated chain link
// These include all diamond meshes and location nodes for diamond positioning
export const DIAMOND_ELEMENTS: string[] = [
  "loc_diamonds",
  "Diamond_Octagon001",
  "Diamond_Octagon002",
  "Diamond_Octagon003",
  "loc_diamonds001",
  "Diamond_Octagon007",
  "loc_diamond_side_1",
  "loc_diamond_side_1001",
];

// Complete chain link configuration with all diamond components
// This represents a fully decorated link that can be used as a template
export const COMPLETE_DIAMOND_LINK: string[] = [
  // Main structure cubes
  "Cube",
  "Cube001",
  "Cube002",
  "Cube003",
  "Cube004",
  "Cube005",
  "Cube006",
  "Cube007",
  "Cube008",
  "Cube009",
  "Cube010",
  "Cube011",
  "Cube012",
  // Diamond meshes
  "Diamond_Octagon001",
  "Diamond_Octagon002",
  "Diamond_Octagon003",
  "Diamond_Octagon007",
  // Diamond location nodes
  "loc_diamonds",
  "loc_diamonds001",
  "loc_diamond_side_1",
  "loc_diamond_side_1001",
];

// Additional link mesh groups for extending the chain beyond the base 7 links
// Note: B5-24-古巴链-OK-版-倒铜_1009 and B5-24-古巴链-OK-版-倒铜_1010 together
// make one plain chain link without diamonds or any decorations
export const ADDITIONAL_LINK_MESH_GROUPS: string[][] = [
  ["B5-24-古巴链-OK-版-倒铜_1009", "B5-24-古巴链-OK-版-倒铜_1010"],
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
