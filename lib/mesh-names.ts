import * as THREE from "three";

function isThreeMesh(object: THREE.Object3D): object is THREE.Mesh {
  return object instanceof THREE.Mesh || (object as THREE.Mesh).isMesh === true;
}

const SEMANTIC_NAME_PATTERN = /^(cuban_|top_|side_|diamond_|fill|file2|loc_|enamel)/i;
const GENERIC_PRIMITIVE_PATTERN = /^(cube|cylinder|sphere|torus|plane|file)\d*(?:_\d+)?$/i;

function findSemanticAncestorName(object: THREE.Object3D): string | null {
  let current = object.parent;

  while (current) {
    if (current.name && SEMANTIC_NAME_PATTERN.test(current.name)) {
      return current.name;
    }
    current = current.parent;
  }

  return null;
}

/**
 * Rename meshes in a loaded scene so that the pattern-matching functions
 * in chain-geometry.ts can identify diamonds, enamel, and body meshes.
 *
 * The EntireChain.glb uses generic Blender names (Cube, Cube001, Diamond_Octagon001, fill, etc.)
 * which don't match the semantic patterns the material system expects.
 * This function assigns semantic names based on the known rename map.
 */
export function renameMeshesForPatternMatching(scene: THREE.Object3D): void {
  scene.traverse((child) => {
    if (!isThreeMesh(child)) return;
    const originalName = child.name;
    if (!originalName) return;
    child.userData.originalMeshName ??= originalName;

    const semanticAncestorName = findSemanticAncestorName(child);
    if (semanticAncestorName && GENERIC_PRIMITIVE_PATTERN.test(originalName)) {
      child.userData.semanticSourceName = semanticAncestorName;
      child.name = `${semanticAncestorName}_${originalName}`;
      return;
    }

    // Check the explicit rename map first
    const mapped = MESH_RENAMES[originalName];
    if (mapped) {
      // Diamond meshes → give a diamond-matching name
      if (mapped.includes("Diamond")) {
        child.name = `diamond_octagon_${originalName.toLowerCase()}`;
        return;
      }
      // Fill/enamel meshes
      if (mapped.startsWith("Fill_")) {
        child.name = `fill_${originalName.toLowerCase()}`;
        return;
      }
      // File meshes (polishing)
      if (mapped.startsWith("File_")) {
        child.name = `file_${originalName.toLowerCase()}`;
        return;
      }
      // Ground plane – hide it
      if (mapped === "Ground_Plane") {
        child.visible = false;
        return;
      }
      // Body / link part meshes – give a body-matching name
      // Format: Link{N}_Part{M} or ExtraLink_Part{M} or Chain_End_*
      child.name = `cuban_body_${originalName.toLowerCase()}`;
      return;
    }

    // Heuristic fallback for meshes not in the map
    const lower = originalName.toLowerCase();

    // Already has a semantic name (diamond_, cuban_, top_, side_, fill, etc.)
    if (
      lower.startsWith("diamond") ||
      lower.startsWith("cuban") ||
      lower.startsWith("top_") ||
      lower.startsWith("side_") ||
      lower.startsWith("fill") ||
      lower.startsWith("file")
    ) {
      return; // keep as-is
    }

    // Generic Blender meshes (Cube###, Cylinder###, etc.) → body
    if (GENERIC_PRIMITIVE_PATTERN.test(originalName)) {
      child.name = `cuban_body_${lower}`;
      return;
    }
  });
}

export const MESH_RENAMES: Record<string, string> = {
  // Base Link (Link 1)
  "Cube": "Link1_Part01",
  "Cube001": "Link1_Part02",
  "Cube002": "Link1_Part03",
  "Cube003": "Link1_Part04",
  "Cube004": "Link1_Part05",
  "Cube005": "Link1_Part06",
  "Cube006": "Link1_Part07",
  "Cube007": "Link1_Part08",
  "Cube008": "Link1_Part09",
  "Cube009": "Link1_Part10",
  "Cube010": "Link1_Part11",
  "Cube011": "Link1_Part12",
  "Cube012": "Link1_Part13",
  "Diamond_Octagon001": "Link1_Diamond01",
  "Diamond_Octagon002": "Link1_Diamond02",
  "Diamond_Octagon003": "Link1_Diamond03",

  // Link 2 (Assumed based on sequence)
  "Cube013": "Link2_Part01",
  "Cube014": "Link2_Part02",
  "Cube015": "Link2_Part03",
  "Cube016": "Link2_Part04",
  "Cube017": "Link2_Part05",
  "Cube018": "Link2_Part06",
  "Cube019": "Link2_Part07",
  "Cube020": "Link2_Part08",
  "Cube021": "Link2_Part09",
  "Cube022": "Link2_Part10",
  "Cube023": "Link2_Part11",
  "Cube024": "Link2_Part12",
  "Cube025": "Link2_Part13",
  
  // Link 3
  "Cube026": "Link3_Part01",
  "Cube027": "Link3_Part02",
  "Cube028": "Link3_Part03",
  "Cube029": "Link3_Part04",
  "Cube030": "Link3_Part05",
  "Cube031": "Link3_Part06",
  "Cube032": "Link3_Part07",
  "Cube033": "Link3_Part08",
  "Cube034": "Link3_Part09",
  "Cube035": "Link3_Part10",
  "Cube036": "Link3_Part11",
  "Cube037": "Link3_Part12",
  "Cube038": "Link3_Part13",

  // Link 4
  "Cube039": "Link4_Part01",
  "Cube040": "Link4_Part02",
  "Cube041": "Link4_Part03",
  "Cube042": "Link4_Part04", // Incomplete?

  // Extra Links (Chinese names)
  "B5-24-古巴链-OK-版-倒铜_1009": "ExtraLink_Part01",
  "B5-24-古巴链-OK-版-倒铜_1010": "ExtraLink_Part02",
  "B5-24-古巴链-OK-版-倒铜_1008": "ExtraLink_Part03",
  "B5-24-古巴链-OK-版-倒铜_1002": "ExtraLink_Part04",
  "B5-24-古巴链-OK-版-倒铜_1001": "ExtraLink_Part05",
  "B5-24-古巴链-OK-版-倒铜_1006": "ExtraLink_Part06",
  "B5-24-古巴链-OK-版-倒铜_1007": "ExtraLink_Part07",
  "B5-24-古巴链-OK-版-倒铜_1011": "ExtraLink_Part08",
  "B5-24-古巴链-OK-版-倒铜_1014": "ExtraLink_Part09",
  "B5-24-古巴链-OK-版-倒铜_1015": "ExtraLink_Part10",
  "B5-24-古巴链-OK-版-倒铜_1016": "ExtraLink_Part11",
  "B5-24-古巴链-OK-版-倒铜_1005": "ExtraLink_Part12",

  // Other
  "sm_cubanLink_gold_a1": "Chain_End_A",
  "sm_cubanLink_gold_b1": "Chain_End_B",
  "Diamond_Octagon007": "Extra_Diamond01",
  "file2001": "File_Part01",
  "file2002": "File_Part02",
  "file2003": "File_Part03",
  "file2004": "File_Part04",
  "file2005": "File_Part05",
  "file2006": "File_Part06",
  "file2007": "File_Part07",
  "Plane": "Ground_Plane",
  "fill": "Fill_Part01",
  "fill001": "Fill_Part02",
};
