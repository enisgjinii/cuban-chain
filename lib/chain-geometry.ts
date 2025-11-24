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
