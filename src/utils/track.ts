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
  
  // Outer walls (Invisible bounding box) - let's keep drone inside 4x4m
  // We'll handle this directly in logic, but for now just actual track items:

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
       // 2 outer pillars, 1 center pillar
      const isRotated = obs.rotation && obs.rotation[1] !== 0;
      const w2 = (obs.width || 1.5) / 2;
      if (isRotated) {
        pillars.push({ x: obs.pos[0], z: obs.pos[2] - w2, radius: 0.1, height: obs.height });
        pillars.push({ x: obs.pos[0], z: obs.pos[2] + w2, radius: 0.1, height: obs.height });
        pillars.push({ x: obs.pos[0], z: obs.pos[2], radius: 0.1, height: obs.height }); // Center
      }
    } else if (obs.type === 'wall') {
      // Wall is solid across its width. We'll sample points along it.
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
