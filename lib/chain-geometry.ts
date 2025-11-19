export const BASE_LINK_COUNT = 7;

export const ADDITIONAL_LINK_MESH_GROUPS: string[][] = [
  ["B5-24-古巴链-OK-版-倒铜_1009", "B5-24-古巴链-OK-版-倒铜_1010"],
];

// Allow up to 9 links (7 base + 2 additional via cloning)
export const MAX_CHAIN_LINKS = 9;

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
