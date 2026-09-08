import * as THREE from 'three';
import { soundFX } from './audio';
import { useStore } from '../store/useStore';

export interface TargetInfo {
  id: string;
  name: string;
  type: 'static' | 'moving';
  speedLabel?: string;
  position: THREE.Vector3;
  radius: number; // overall target radius (e.g. 0.45m)
  lastHitTime: number;
  lastHitPoints: number;
  lastHitBullseye: boolean;
}

export interface HitResult {
  targetId: string;
  targetName: string;
  hitPoint: THREE.Vector3;
  distanceFromCenter: number;
  points: number;
  isBullseye: boolean;
}

class TargetManager {
  private targets = new Map<string, TargetInfo>();

  registerTarget(id: string, name: string, type: 'static' | 'moving', speedLabel?: string) {
    this.targets.set(id, {
      id,
      name,
      type,
      speedLabel,
      position: new THREE.Vector3(0, 0, 0),
      radius: 0.45,
      lastHitTime: 0,
      lastHitPoints: 0,
      lastHitBullseye: false,
    });
  }

  unregisterTarget(id: string) {
    this.targets.delete(id);
  }

  updateTargetPosition(id: string, pos: THREE.Vector3) {
    const t = this.targets.get(id);
    if (t) {
      t.position.copy(pos);
    }
  }

  getTarget(id: string) {
    return this.targets.get(id);
  }

  getAllTargets(): TargetInfo[] {
    return Array.from(this.targets.values());
  }

  // Raycast forward from drone position along aiming direction
  testShot(origin: THREE.Vector3, direction: THREE.Vector3): HitResult | null {
    const ray = new THREE.Ray(origin, direction.clone().normalize());
    let bestHit: HitResult | null = null;
    let closestRayDist = Infinity;

    this.targets.forEach((target) => {
      // Targets face roughly along +Z towards player
      const targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -target.position.z);
      const hitPoint = new THREE.Vector3();
      const intersect = ray.intersectPlane(targetPlane, hitPoint);

      if (intersect) {
        // Distance along ray must be positive (in front of drone) and within range (up to 20m)
        const rayDistance = origin.distanceTo(hitPoint);
        if (rayDistance > 0.2 && rayDistance < 20) {
          const distToCenter = Math.hypot(hitPoint.x - target.position.x, hitPoint.y - target.position.y);
          
          if (distToCenter <= target.radius && rayDistance < closestRayDist) {
            closestRayDist = rayDistance;
            
            let points = 50;
            let isBullseye = false;
            if (distToCenter <= 0.12) {
              points = 200;
              isBullseye = true;
            } else if (distToCenter <= 0.26) {
              points = 100;
            }

            bestHit = {
              targetId: target.id,
              targetName: target.name,
              hitPoint: hitPoint.clone(),
              distanceFromCenter: distToCenter,
              points,
              isBullseye,
            };
          }
        }
      }
    });

    if (bestHit) {
      const t = this.targets.get(bestHit.targetId);
      if (t) {
        t.lastHitTime = Date.now();
        t.lastHitPoints = bestHit.points;
        t.lastHitBullseye = bestHit.isBullseye;
      }
      soundFX.playHit(bestHit.isBullseye);
      useStore.getState().recordHit(bestHit.points, bestHit.isBullseye);
      useStore.getState().showNotification(
        bestHit.isBullseye 
          ? `🎯 BULLSEYE! +${bestHit.points} PTS` 
          : `🎯 TARGET HIT! +${bestHit.points} PTS`
      );
    }

    return bestHit;
  }
}

export const targetManager = new TargetManager();
