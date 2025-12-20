import * as THREE from "three";
import type { SurfaceId } from "./chain-config-types";

/**
 * Zone detection thresholds for position-based detection
 * These can be tuned based on actual model geometry
 */
const ZONE_THRESHOLDS = {
    // Y threshold to distinguish top surfaces from side surfaces
    topYThreshold: 0.05,
    // X threshold for left/right detection (near center is ambiguous)
    sideXThreshold: 0.01,
    // Z threshold to split top into top1/top2
    topZThreshold: 0,
};

/**
 * Detect which zone (side1, side2, top1, top2) was clicked based on local position
 * 
 * Logic:
 * - If y > threshold → Top surface (split by z: positive = top1, negative = top2)
 * - If y <= threshold → Side surface (split by x: negative = side1/left, positive = side2/right)
 * 
 * @param localPoint - The click point in local coordinates of the link mesh
 * @returns The detected SurfaceId
 */
export function detectZoneFromLocalPosition(localPoint: THREE.Vector3): SurfaceId {
    // Check if we're on a top surface (y is above threshold)
    if (localPoint.y > ZONE_THRESHOLDS.topYThreshold) {
        // Split top into top1 (front/positive z) and top2 (back/negative z)
        return localPoint.z > ZONE_THRESHOLDS.topZThreshold ? "top1" : "top2";
    }

    // Side surfaces - split by x axis
    // Left side (negative x) = side1, Right side (positive x) = side2
    if (localPoint.x < -ZONE_THRESHOLDS.sideXThreshold) {
        return "side1";
    } else if (localPoint.x > ZONE_THRESHOLDS.sideXThreshold) {
        return "side2";
    }

    // Ambiguous center zone - default to top1
    return "top1";
}

/**
 * Get the highlight color for a zone (for visual feedback)
 */
export function getZoneHighlightColor(surfaceId: SurfaceId): THREE.Color {
    const colors: Record<SurfaceId, string> = {
        side1: "#ff6b6b",   // Red for left
        side2: "#4ecdc4",   // Teal for right
        top1: "#ffe66d",    // Yellow for top1
        top2: "#95e1d3",    // Mint for top2
    };
    return new THREE.Color(colors[surfaceId]);
}

/**
 * Convert a world point to local coordinates relative to an object
 */
export function worldToLocal(worldPoint: THREE.Vector3, object: THREE.Object3D): THREE.Vector3 {
    const localPoint = worldPoint.clone();
    object.worldToLocal(localPoint);
    return localPoint;
}


/**
 * Detect which zone (side1, side2, top1, top2) was clicked based on Normal vector and Position
 * This provides much better accuracy for curved surfaces where "high Y" doesn't always mean "Top"
 * 
 * @param normal - The surface normal vector in local space
 * @param position - The click point in local space
 */
export function detectZoneFromNormalAndPosition(
    normal: THREE.Vector3,
    position: THREE.Vector3
): SurfaceId {
    // 1. Check Normal Direction
    // If Y component of normal is high, it's pointing UP -> Top Surface
    const isFacingUp = normal.y > 0.5;

    // If X component is high, it's pointing SIDEWAYS -> Side Surface
    const isFacingSide = Math.abs(normal.x) > 0.5;

    // 2. Determine Zone
    if (isFacingUp) {
        // It's a Top face - split front/back by Z position
        // Use a small Z threshold (0) to split Top 1 vs Top 2
        return position.z > ZONE_THRESHOLDS.topZThreshold ? "top1" : "top2";
    }

    if (isFacingSide) {
        // It's a Side face - split left/right by X position
        // Negative X is Left (side1), Positive X is Right (side2)
        return position.x < 0 ? "side1" : "side2";
    }

    // 3. Ambiguous/Curved cases (Corners)
    // If normal is diagonal (e.g. 45 degrees), fall back to position logic
    return detectZoneFromLocalPosition(position);
}

/**
 * Detect zone from a raycast intersection
 * This is the main entry point for raycaster-based zone detection
 */
export function detectZoneFromIntersection(
    intersection: THREE.Intersection,
    linkContainer: THREE.Object3D
): { surfaceId: SurfaceId; linkIndex: number } | null {
    // Get the link index from userData
    const linkIndex = linkContainer.userData?.linkIndex;
    if (linkIndex === undefined) {
        return null;
    }

    // Convert the hit point to local coordinates of the link container
    const localPoint = worldToLocal(intersection.point, linkContainer);

    // Get the face normal if available and transform to local space
    let surfaceId: SurfaceId;

    if (intersection.face && intersection.object) {
        // Clone normal to avoid modifying the original geometry
        const normal = intersection.face.normal.clone();

        // Transform normal from Mesh Local -> World
        // intersection.face.normal is in Mesh Local space
        // We use transformDirection to ignore translation, only rotation/scale
        normal.transformDirection(intersection.object.matrixWorld);

        // Transform normal from World -> Container Local
        // We extract the rotation of the container and apply inverse
        const containerInverse = new THREE.Matrix4().copy(linkContainer.matrixWorld).invert();
        normal.transformDirection(containerInverse).normalize();

        // Use advanced logic
        surfaceId = detectZoneFromNormalAndPosition(normal, localPoint);
    } else {
        // Fallback to position-only if no face normal available
        surfaceId = detectZoneFromLocalPosition(localPoint);
    }

    return { surfaceId, linkIndex };
}

/**
 * Find the link container that contains the clicked mesh
 * Traverses up the parent chain to find the container with linkIndex userData
 */
export function findLinkContainer(object: THREE.Object3D): THREE.Object3D | null {
    let current: THREE.Object3D | null = object;

    while (current) {
        if (current.userData?.linkIndex !== undefined) {
            return current;
        }
        current = current.parent;
    }

    return null;
}
