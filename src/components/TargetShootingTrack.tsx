import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { targetManager } from '../utils/targetSystem';

interface TargetProps {
  id: string;
  name: string;
  type: 'static' | 'moving';
  speedLabel?: string;
  initialPos: [number, number, number];
  onUpdatePos?: (time: number, delta: number) => [number, number, number];
}

function ShootingTarget({ id, name, type, speedLabel, initialPos, onUpdatePos }: TargetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const flashMeshRef = useRef<THREE.Mesh>(null);
  const [hitFeedback, setHitFeedback] = React.useState<{ points: number; isBullseye: boolean; key: number } | null>(null);

  useEffect(() => {
    targetManager.registerTarget(id, name, type, speedLabel);
    return () => {
      targetManager.unregisterTarget(id);
    };
  }, [id, name, type, speedLabel]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();

    let newPos: [number, number, number] = initialPos;
    if (onUpdatePos) {
      newPos = onUpdatePos(time, delta);
      groupRef.current.position.set(newPos[0], newPos[1], newPos[2]);
    } else {
      groupRef.current.position.set(initialPos[0], initialPos[1], initialPos[2]);
    }

    targetManager.updateTargetPosition(id, groupRef.current.position);

    // Check hit animation feedback
    const t = targetManager.getTarget(id);
    if (t && t.lastHitTime > 0) {
      const elapsed = (Date.now() - t.lastHitTime) / 1000;
      if (elapsed < 0.6) {
        const pulse = Math.sin((elapsed / 0.6) * Math.PI) * 0.25;
        groupRef.current.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
        if (flashMeshRef.current) {
          (flashMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - elapsed / 0.6);
        }
      } else {
        groupRef.current.scale.set(1, 1, 1);
        if (flashMeshRef.current) {
          (flashMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }

      if (elapsed < 1.4 && (!hitFeedback || hitFeedback.key !== t.lastHitTime)) {
        setHitFeedback({
          points: t.lastHitPoints,
          isBullseye: t.lastHitBullseye,
          key: t.lastHitTime,
        });
      } else if (elapsed >= 1.4 && hitFeedback) {
        setHitFeedback(null);
      }
    }
  });

  return (
    <group ref={groupRef} position={initialPos}>
      {/* Target Disc Facing +Z (towards the drone) */}
      <group>
        {/* Disc Backing & Rim */}
        <mesh position={[0, 0, -0.02]} castShadow>
          <cylinderGeometry args={[0.46, 0.46, 0.04, 36]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Outer Ring (+50 Pts) - Cyan / White */}
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[0.26, 0.44, 36]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.3} metalness={0.2} />
        </mesh>

        {/* Middle Ring (+100 Pts) - Vibrant Red/Orange */}
        <mesh position={[0, 0, 0.007]}>
          <ringGeometry args={[0.12, 0.26, 36]} />
          <meshStandardMaterial color="#ea580c" roughness={0.3} metalness={0.2} />
        </mesh>

        {/* Bullseye Ring (+200 Pts) - Radiant Gold */}
        <mesh position={[0, 0, 0.009]}>
          <circleGeometry args={[0.12, 36]} />
          <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.6} roughness={0.2} />
        </mesh>

        {/* Center Crosshair Dot */}
        <mesh position={[0, 0, 0.012]}>
          <circleGeometry args={[0.025, 24]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>

        {/* Thin concentric dividing wire rings */}
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[0.258, 0.262, 36]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[0.118, 0.122, 36]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Hit Flash Ring (shown briefly when hit) */}
        <mesh ref={flashMeshRef} position={[0, 0, 0.015]}>
          <circleGeometry args={[0.47, 32]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0} />
        </mesh>
      </group>

      {type === 'static' ? (
        <>
          {/* Mounting Pole / Arm down to ground */}
          <mesh position={[0, -initialPos[1] / 2, -0.03]} castShadow>
            <cylinderGeometry args={[0.035, 0.045, initialPos[1], 16]} />
            <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
          </mesh>

          {/* Target Base Plate */}
          <mesh position={[0, -initialPos[1] + 0.02, -0.03]}>
            <cylinderGeometry args={[0.3, 0.35, 0.04, 24]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        </>
      ) : (
        <>
          {/* Mechanical Rail Trolley Carriage Mount */}
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[0.22, 0.16, 0.08]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, -0.05]}>
            <cylinderGeometry args={[0.045, 0.045, 0.24, 16]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.8} />
          </mesh>
        </>
      )}

      {/* Target Name & Speed Tag above */}
      <group position={[0, 0.58, 0]}>
        <Text
          fontSize={0.12}
          color="#f8fafc"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#0f172a"
        >
          {name}
        </Text>
        {speedLabel && (
          <Text
            position={[0, -0.12, 0]}
            fontSize={0.09}
            color={type === 'moving' ? '#38bdf8' : '#94a3b8'}
            anchorX="center"
            anchorY="middle"
          >
            {speedLabel}
          </Text>
        )}
      </group>

      {/* Floating Hit Score Notification */}
      {hitFeedback && (
        <group position={[0, 0.82, 0]}>
          <Text
            fontSize={0.18}
            color={hitFeedback.isBullseye ? '#fde047' : '#38bdf8'}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#020617"
          >
            {hitFeedback.isBullseye ? `🎯 BULLSEYE! +${hitFeedback.points}` : `+${hitFeedback.points}`}
          </Text>
        </group>
      )}
    </group>
  );
}

export function TargetShootingTrack() {
  return (
    <group>
      {/* Pilot Takeoff Pad at [0, 0.03, 5.5] */}
      <group position={[0, 0.02, 5.5]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.7, 36]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
          <ringGeometry args={[0.55, 0.65, 36]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
          <ringGeometry args={[0.3, 0.35, 36]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <Text
          position={[0, 0.01, 0.42]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.13}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          FIRING PAD
        </Text>
      </group>

      {/* Distance Lines on Ground */}
      {[2, 4, 6, 8].map((dist) => {
        const z = 5.5 - dist;
        return (
          <group key={dist} position={[0, 0.005, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[10, 0.04]} />
              <meshBasicMaterial color="#475569" transparent opacity={0.5} />
            </mesh>
            <Text
              position={[-4.8, 0.01, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.16}
              color="#94a3b8"
              anchorX="left"
              anchorY="middle"
            >
              {dist}M
            </Text>
            <Text
              position={[4.8, 0.01, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.16}
              color="#94a3b8"
              anchorX="right"
              anchorY="middle"
            >
              {dist}M
            </Text>
          </group>
        );
      })}

      {/* Target 1: Static Left - Alpha Tactical */}
      <ShootingTarget
        id="target_static_1"
        name="TARGET ALPHA"
        type="static"
        speedLabel="STATIC (50/100/200 PTS)"
        initialPos={[-3.5, 1.4, 0.5]}
      />

      {/* Target 2: Static Center High - Bravo Apex */}
      <ShootingTarget
        id="target_static_2"
        name="TARGET BRAVO"
        type="static"
        speedLabel="STATIC (ELEVATED)"
        initialPos={[0, 2.2, -4.5]}
      />

      {/* Target 3: Static Right - Charlie Tactical */}
      <ShootingTarget
        id="target_static_3"
        name="TARGET CHARLIE"
        type="static"
        speedLabel="STATIC (50/100/200 PTS)"
        initialPos={[3.5, 1.5, -1.0]}
      />

      {/* Moving Target 1: Slow Patrol Target (Speed ~ 1.0 m/s - Horizontal Left/Right) */}
      <group position={[0, 1.3, 1.8]}>
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[6.4, 0.06, 0.06]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-3.2, -0.65, -0.05]}>
          <cylinderGeometry args={[0.04, 0.04, 1.3, 12]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh position={[3.2, -0.65, -0.05]}>
          <cylinderGeometry args={[0.04, 0.04, 1.3, 12]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>
      <ShootingTarget
        id="target_moving_slow"
        name="SLOW PATROL"
        type="moving"
        speedLabel="HORIZONTAL ONLY (1.0 m/s)"
        initialPos={[0, 1.3, 1.8]}
        onUpdatePos={(time) => {
          // Strictly horizontal left-and-right movement only
          const x = Math.sin(time * 0.75) * 2.8;
          return [x, 1.3, 1.8];
        }}
      />

      {/* Moving Target 2: Medium Sweeper Target (Speed ~ 2.2 m/s - Horizontal Left/Right) */}
      <group position={[0, 1.6, -2.5]}>
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[7.2, 0.06, 0.06]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-3.6, -0.8, -0.05]}>
          <cylinderGeometry args={[0.04, 0.04, 1.6, 12]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh position={[3.6, -0.8, -0.05]}>
          <cylinderGeometry args={[0.04, 0.04, 1.6, 12]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>
      <ShootingTarget
        id="target_moving_medium"
        name="MEDIUM SWEEPER"
        type="moving"
        speedLabel="HORIZONTAL ONLY (2.2 m/s)"
        initialPos={[0, 1.6, -2.5]}
        onUpdatePos={(time) => {
          // Strictly horizontal left-and-right movement only
          const x = Math.sin(time * 1.5) * 3.2;
          return [x, 1.6, -2.5];
        }}
      />

      {/* Moving Target 3: Fast Interceptor Target (Speed ~ 3.5 m/s - Horizontal Left/Right) */}
      <group position={[0, 2.3, -5.8]}>
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[9.2, 0.06, 0.06]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-4.6, -1.15, -0.05]}>
          <cylinderGeometry args={[0.04, 0.04, 2.3, 12]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh position={[4.6, -1.15, -0.05]}>
          <cylinderGeometry args={[0.04, 0.04, 2.3, 12]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>
      <ShootingTarget
        id="target_moving_fast"
        name="FAST INTERCEPTOR"
        type="moving"
        speedLabel="HORIZONTAL ONLY (3.5 m/s)"
        initialPos={[0, 2.3, -5.8]}
        onUpdatePos={(time) => {
          // Strictly horizontal left-and-right movement only
          const x = Math.sin(time * 2.5) * 4.2;
          return [x, 2.3, -5.8];
        }}
      />

      {/* Safety Arena Bounding Fence & Range Backdrop */}
      <group position={[0, 0, -7]}>
        {/* Back Wall Glow Grid */}
        <mesh position={[0, 2.5, 0]}>
          <planeGeometry args={[14, 5]} />
          <meshStandardMaterial color="#090d16" roughness={0.8} />
        </mesh>
        {/* Neon range boundary line */}
        <mesh position={[0, 5, 0.01]}>
          <boxGeometry args={[14, 0.08, 0.02]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <Text
          position={[0, 4.3, 0.02]}
          fontSize={0.4}
          color="#f43f5e"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.1}
        >
          TARGET RANGE • PRECISION AIMING
        </Text>
      </group>
    </group>
  );
}
