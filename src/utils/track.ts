// Define track obstacles for rendering and physics collision
// Based on 4x4m grid

export interface TrackObstacle {
  type: 'pole' | 'gate' | 'wall' | 'poi_gate';
  pos: [number, number, number];
  rotation?: [number, number, number];
  radius?: number;
  height: number;
  width?: number;
  label?: string;
}

// Representing complex objects as simple pillars for easy solid collision
export interface CollisionPillar {
  x: number;
  z: number;
  radius: number;
  height: number;
}

export const TRACK_OBSTACLES: TrackObstacle[] = [
  // Phase 1 (Straight line down Z axis)
  { type: 'pole', pos: [-4, 0, 4], radius: 0.05, height: 2, label: 'Slalom 1' },
  { type: 'pole', pos: [-4, 0, 2], radius: 0.05, height: 2, label: 'Slalom 2' },
  { type: 'pole', pos: [-4, 0, 0], radius: 0.05, height: 2, label: 'Slalom 3' },
  { type: 'pole', pos: [-4, 0, -2], radius: 0.05, height: 2, label: 'Slalom 4' },
  { type: 'gate', pos: [-4, 0, -4], rotation: [0, 0, 0], width: 1, height: 1.5, label: 'Up & Under' },

  // Phase 2 (Straight line right along X axis)
  { type: 'pole', pos: [-1.5, 0, -6], radius: 0.05, height: 2, label: 'Fig 8 Pole 1' },
  { type: 'pole', pos: [0.5, 0, -6], radius: 0.05, height: 2, label: 'Fig 8 Pole 2' },
  { type: 'gate', pos: [3, 0, -6], rotation: [0, Math.PI / 2, 0], width: 1, height: 1.5, label: 'Tunnel' },

  // Phase 3 (Straight line back along Z axis)
  { type: 'gate', pos: [6, 0, -2], rotation: [0, 0, 0], width: 1.5, height: 1.5, label: 'Side Up' },
  { type: 'pole', pos: [6, 0, 2], radius: 0.05, height: 2, label: 'POI' },
];

// Helper to convert complex shapes into solid pillars for simple radial collision
export function generateCollisionPillars(): CollisionPillar[] {
  const pillars: CollisionPillar[] = [];
  
  TRACK_OBSTACLES.forEach(obs => {
    if (obs.type === 'pole') {
      pillars.push({ x: obs.pos[0], z: obs.pos[2], radius: 0.1, height: obs.height });
    } else if (obs.type === 'gate') {
      const isRotated = obs.rotation && obs.rotation[1] !== 0;
      const w2 = (obs.width || 1) / 2;
      if (isRotated) {
        pillars.push({ x: obs.pos[0], z: obs.pos[2] - w2, radius: 0.1, height: obs.height });
        pillars.push({ x: obs.pos[0], z: obs.pos[2] + w2, radius: 0.1, height: obs.height });
      } else {
        pillars.push({ x: obs.pos[0] - w2, z: obs.pos[2], radius: 0.1, height: obs.height });
        pillars.push({ x: obs.pos[0] + w2, z: obs.pos[2], radius: 0.1, height: obs.height });
      }
    } else if (obs.type === 'poi_gate') {
      const isRotated = obs.rotation && obs.rotation[1] !== 0;
      const w2 = (obs.width || 1.5) / 2;
      if (isRotated) {
        pillars.push({ x: obs.pos[0], z: obs.pos[2] - w2, radius: 0.1, height: obs.height });
        pillars.push({ x: obs.pos[0], z: obs.pos[2] + w2, radius: 0.1, height: obs.height });
        pillars.push({ x: obs.pos[0], z: obs.pos[2], radius: 0.1, height: obs.height });
      }
    } else if (obs.type === 'wall') {
      const w = obs.width || 0.8;
      const angle = obs.rotation ? obs.rotation[1] : 0;
      for (let offset = -w/2; offset <= w/2; offset += 0.2) {
        pillars.push({
          x: obs.pos[0] + Math.cos(angle) * offset,
          z: obs.pos[2] - Math.sin(angle) * offset,
          radius: 0.1,
          height: obs.height
        });
      }
    }
  });

  return pillars;
}

// -------------------------------------------------------------
// PRECISION RINGS TRACK DEFINITIONS & PRECISE COLLISION
// -------------------------------------------------------------
export interface PrecisionRingData {
  id: number;
  pos: [number, number, number];
  rot: [number, number, number];
  color: string;
  name: string;
  radius: number;     // Centerline radius: 0.72m
  tubeRadius: number; // Tube thickness radius: 0.045m
}

export const PRECISION_RINGS: PrecisionRingData[] = [
  { id: 1, pos: [-4, 1.2, 3], rot: [0, 0, 0], color: '#38bdf8', name: 'GATE 1', radius: 0.72, tubeRadius: 0.045 },
  { id: 2, pos: [-4, 1.5, -2], rot: [0, 0, 0], color: '#a855f7', name: 'GATE 2', radius: 0.72, tubeRadius: 0.045 },
  { id: 3, pos: [0, 1.8, -5], rot: [0, Math.PI / 2, 0], color: '#ec4899', name: 'GATE 3', radius: 0.72, tubeRadius: 0.045 },
  { id: 4, pos: [4, 1.4, -2], rot: [0, 0, 0], color: '#10b981', name: 'GATE 4', radius: 0.72, tubeRadius: 0.045 },
  { id: 5, pos: [4, 1.1, 3], rot: [0, 0, 0], color: '#f59e0b', name: 'GATE 5', radius: 0.72, tubeRadius: 0.045 },
];

/**
 * Highly precise collision detection for Precision Rings:
 * - Drone CAN cleanly pass through the inner circular opening of the torus ring!
 * - Collides only if drone hits the solid circular torus rim or the vertical ground pole below the ring.
 */
export function checkPrecisionRingCollision(
  pos: { x: number; y: number; z: number },
  droneRadius = 0.10
): boolean {
  for (const ring of PRECISION_RINGS) {
    const [cx, cy, cz] = ring.pos;
    const R = ring.radius;
    const rTube = ring.tubeRadius;
    const isRotatedY = Math.abs(ring.rot[1]) > 0.1;

    // 1. Support post & floor base collision (STRICTLY below the bottom rim of the ring)
    // The bottom edge of the ring torus is at y = cy - R
    // The post only exists below the ring: from y=0 to y = cy - R + rTube
    const postTopY = cy - R + rTube;
    if (pos.y <= postTopY) {
      const distFromCenter = Math.hypot(pos.x - cx, pos.z - cz);
      const postRadius = 0.04;
      if (distFromCenter < postRadius + droneRadius) {
        return true; // Collided with vertical post under the ring
      }
      // Floor base plate (y <= 0.06m)
      if (pos.y <= 0.06 && distFromCenter < 0.28 + droneRadius) {
        return true; // Collided with ground base plate
      }
    }

    // 2. Torus collision
    let dAxial: number;
    let dRadial: number;

    if (isRotatedY) {
      // Normal along X axis (plane is YZ - Gate 3)
      dAxial = Math.abs(pos.x - cx);
      dRadial = Math.hypot(pos.z - cz, pos.y - cy);
    } else {
      // Normal along Z axis (plane is XY - Gates 1, 2, 4, 5)
      dAxial = Math.abs(pos.z - cz);
      dRadial = Math.hypot(pos.x - cx, pos.y - cy);
    }

    const collisionThickness = rTube + droneRadius;

    // Only test if within the axial slab of the torus
    if (dAxial < collisionThickness) {
      // Clear aperture check:
      // Inner clear boundary threshold
      const innerClearRadius = R - rTube - droneRadius;
      if (dRadial < innerClearRadius) {
        // Drone is safely inside the opening hole! NO COLLISION! Drone flies through smoothly!
        continue;
      }

      // Outer clear check: outside the entire ring diameter
      const outerClearRadius = R + rTube + droneRadius;
      if (dRadial > outerClearRadius) {
        // Completely outside ring frame! NO COLLISION!
        continue;
      }

      // In the rim boundary zone: compute exact 3D distance to the circular torus centerline
      const distToCenterline = Math.hypot(dRadial - R, dAxial);
      if (distToCenterline < collisionThickness) {
        return true; // Collided with the physical torus ring
      }
    }
  }

  return false;
}

/**
 * Checks whether the drone has successfully flown through a precision ring aperture
 */
export function checkRingPassed(
  prevPos: { x: number; y: number; z: number },
  curPos: { x: number; y: number; z: number },
  ring: PrecisionRingData
): boolean {
  const [cx, cy, cz] = ring.pos;
  const isRotatedY = Math.abs(ring.rot[1]) > 0.1;

  if (isRotatedY) {
    // Normal along X (Gate 3)
    const crossed = (prevPos.x - cx) * (curPos.x - cx) <= 0 ||
      (Math.abs(curPos.x - cx) < 0.25 && Math.abs(prevPos.x - cx) < 0.45);
    if (!crossed) return false;

    const dRadial = Math.hypot(curPos.z - cz, curPos.y - cy);
    return dRadial < (ring.radius - ring.tubeRadius * 0.4);
  } else {
    // Normal along Z (Gates 1, 2, 4, 5)
    const crossed = (prevPos.z - cz) * (curPos.z - cz) <= 0 ||
      (Math.abs(curPos.z - cz) < 0.25 && Math.abs(prevPos.z - cz) < 0.45);
    if (!crossed) return false;

    const dRadial = Math.hypot(curPos.x - cx, curPos.y - cy);
    return dRadial < (ring.radius - ring.tubeRadius * 0.4);
  }
}

/**
 * Collision detection for Target Shooting range
 */
export function checkTargetShootingCollision(
  pos: { x: number; y: number; z: number },
  droneRadius = 0.10
): boolean {
  // Static Target poles and discs
  const staticTargets = [
    { x: -3.5, z: 0.5, height: 1.4, targetRadius: 0.45 },
    { x: 0, z: -4.5, height: 2.2, targetRadius: 0.45 },
    { x: 3.5, z: -1.0, height: 1.5, targetRadius: 0.45 },
  ];

  for (const t of staticTargets) {
    if (pos.y <= t.height) {
      if (Math.hypot(pos.x - t.x, pos.z - t.z) < 0.05 + droneRadius) {
        return true;
      }
    }
    if (Math.abs(pos.y - t.height) < t.targetRadius && Math.abs(pos.z - t.z) < 0.12 + droneRadius) {
      if (Math.abs(pos.x - t.x) < t.targetRadius + droneRadius) {
        return true;
      }
    }
  }

  // Horizontal guide rails
  const rails = [
    { z: 1.8, y: 1.3, xMin: -3.3, xMax: 3.3 },
    { z: -2.5, y: 1.6, xMin: -3.7, xMax: 3.7 },
    { z: -5.8, y: 2.3, xMin: -4.7, xMax: 4.7 },
  ];

  for (const r of rails) {
    if (Math.abs(pos.z - r.z) < 0.12 + droneRadius && Math.abs(pos.y - r.y) < 0.12 + droneRadius) {
      if (pos.x >= r.xMin - droneRadius && pos.x <= r.xMax + droneRadius) {
        return true;
      }
    }
    if (pos.y <= r.y) {
      if (Math.hypot(pos.x - r.xMin, pos.z - r.z) < 0.05 + droneRadius ||
          Math.hypot(pos.x - r.xMax, pos.z - r.z) < 0.05 + droneRadius) {
        return true;
      }
    }
  }

  return false;
}

const SLALOM_COLLISION_PILLARS = generateCollisionPillars();

/**
 * Unified, track-aware collision check for Pilot Mode
 */
export function checkTrackCollision(
  pos: { x: number; y: number; z: number },
  pilotTrackType: 'slalom' | 'precision_rings' | 'target_shooting',
  droneRadius = 0.10
): boolean {
  if (pilotTrackType === 'precision_rings') {
    return checkPrecisionRingCollision(pos, droneRadius);
  }
  if (pilotTrackType === 'target_shooting') {
    return checkTargetShootingCollision(pos, droneRadius);
  }

  // Slalom Course collision
  for (const pillar of SLALOM_COLLISION_PILLARS) {
    const dist = Math.hypot(pos.x - pillar.x, pos.z - pillar.z);
    if (dist < droneRadius + pillar.radius && pos.y < pillar.height) {
      return true;
    }
  }
  return false;
}

