import type { ChainConfig, LinkConfig } from "./chain-config-types";
import { MAX_CHAIN_LINKS } from "./chain-geometry";
import { createDefaultConfig } from "./chain-helpers";

export const CHAIN_DESIGN_FILE_VERSION = 1;

export interface SavedChainDesign {
  version: number;
  savedAt: string;
  chainConfig: ChainConfig;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidLinkConfig(value: unknown): value is LinkConfig {
  if (!isRecord(value) || typeof value.material !== "string" || !isRecord(value.surfaces)) {
    return false;
  }

  const surfaces = value.surfaces;
  const surfaceIds = ["top1", "top2", "side1", "side2"] as const;
  return surfaceIds.every((id) => {
    const surface = surfaces[id];
    return isRecord(surface) && typeof surface.type === "string";
  });
}

function isValidChainConfig(value: unknown): value is ChainConfig {
  if (!isRecord(value) || !Array.isArray(value.links)) {
    return false;
  }

  if (typeof value.chainLength !== "number" || value.chainLength < 1) {
    return false;
  }

  if (value.links.length !== value.chainLength) {
    return false;
  }

  return value.links.every(isValidLinkConfig);
}

export function parseChainDesignFile(raw: unknown): SavedChainDesign {
  if (!isRecord(raw) || !isValidChainConfig(raw.chainConfig)) {
    throw new Error("Invalid design file format");
  }

  const chainLength = Math.max(1, Math.min(Math.round(raw.chainConfig.chainLength), MAX_CHAIN_LINKS));
  const links = raw.chainConfig.links.slice(0, chainLength);

  return {
    version: typeof raw.version === "number" ? raw.version : CHAIN_DESIGN_FILE_VERSION,
    savedAt: typeof raw.savedAt === "string" ? raw.savedAt : new Date().toISOString(),
    chainConfig: {
      chainLength,
      links,
    },
  };
}

export function createChainDesignPayload(chainConfig: ChainConfig): SavedChainDesign {
  const chainLength = Math.max(1, Math.min(chainConfig.chainLength, MAX_CHAIN_LINKS));
  const links = chainConfig.links.slice(0, chainLength);

  return {
    version: CHAIN_DESIGN_FILE_VERSION,
    savedAt: new Date().toISOString(),
    chainConfig: {
      chainLength,
      links: links.map((link) => structuredClone(link)),
    },
  };
}

export function downloadChainDesign(chainConfig: ChainConfig, filename?: string): void {
  const payload = createChainDesignPayload(chainConfig);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download =
    filename ?? `cuban-chain-design-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function readChainDesignFile(file: File): Promise<SavedChainDesign> {
  const text = await file.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Could not read design file — invalid JSON");
  }

  return parseChainDesignFile(parsed);
}

export function chainConfigFromDesign(design: SavedChainDesign): ChainConfig {
  const length = Math.max(1, Math.min(design.chainConfig.chainLength, MAX_CHAIN_LINKS));
  const config = createDefaultConfig(length);

  design.chainConfig.links.slice(0, length).forEach((link, index) => {
    config.links[index] = structuredClone(link);
  });

  config.chainLength = length;
  return config;
}
