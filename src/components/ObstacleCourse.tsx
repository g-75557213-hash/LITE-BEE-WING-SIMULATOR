import React from 'react';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { TRACK_OBSTACLES, PRECISION_RINGS } from '../utils/track';
import { Text } from '@react-three/drei';
import { TargetShootingTrack } from './TargetShootingTrack';

export function ObstacleCourse() {
  const mode = useStore(state => state.mode);
  const currentTargetPos = useStore(state => state.targetPosition);
  const pilotTrackType = useStore(state => state.pilotTrackType);
  const autonomousTrackType = useStore(state => state.autonomousTrackType);
  const customTrackElements = useStore(state => state.customTrackElements);
  const cargoDroppedPosition = useStore(state => state.cargoDroppedPosition);

  return (
    <group>
      {/* Floor with grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#4c1d95" roughness={0.7} metalness={0.1} />
      </mesh>
      
      <gridHelper args={[16, 16, '#7c3aed', '#5b21b6']} position={[0, 0.01, 0]} />
      
      {/* Expanded Boundary Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.2} />
      </mesh>

      {/* Target Marker for autonomous mode (or manual debug) */}
      <mesh position={[currentTargetPos[0], 0.05, currentTargetPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.22, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
      </mesh>

      {/* Dropped Cargo Crate on Ground */}
      {cargoDroppedPosition && (
        <group position={cargoDroppedPosition}>
          <CargoCrate size={0.24} />
        </group>
      )}

      {/* PILOT MODE TRACKS (Strictly NO QR pads) */}
      {mode === 'manual' && (
        <>
          {pilotTrackType === 'slalom' && <UnifiedTrack />}
          {pilotTrackType === 'precision_rings' && <PrecisionRingsTrack />}
          {pilotTrackType === 'target_shooting' && <TargetShootingTrack />}
        </>
      )}

      {/* AUTONOMOUS MODE TRACKS */}
      {mode === 'autonomous' && (
        <>
          {autonomousTrackType === 'qr_pad' && <AutonomousQRTrack />}
          {autonomousTrackType === 'custom' && <CustomAutonomousTrack elements={customTrackElements} />}
        </>
      )}
    </group>
  );
}

function PrecisionRingsTrack() {
  const clearedRings = useStore(state => state.clearedRings);

  // Flight path waypoints connecting takeoff -> rings 1-5 -> landing pad
  const flightPathPoints = React.useMemo(() => [
    -4, 0.2, 6,
    -4, 1.2, 3,
    -4, 1.5, -2,
    0, 1.8, -5,
    4, 1.4, -2,
    4, 1.1, 3,
    2, 0.2, 6,
  ], []);

  return (
    <group>
      <Pad position={[-4, 0.03, 6]} color="#ef4444" label="Take Off" />
      <LandingPad position={[2, 0.03, 6]} />

      {/* Guide Flight Corridor Path */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={7}
            array={new Float32Array(flightPathPoints)}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#818cf8" transparent opacity={0.35} />
      </line>

      {PRECISION_RINGS.map((ring) => {
        const isCleared = clearedRings.includes(ring.id);
        const [, cy] = ring.pos;
        const R = ring.radius;
        const rTube = ring.tubeRadius;
        
        // Pole extends from ground y=0 strictly to the bottom rim of the ring.
        // The central aperture hole of the ring is completely OPEN and unblocked!
        const poleHeight = Math.max(0.1, cy - R + rTube * 0.5);
        const poleCenterY = -cy + (poleHeight / 2);

        return (
          <group key={ring.id} position={ring.pos} rotation={ring.rot}>
            {/* Ground Base Stand */}
            <mesh position={[0, -cy + 0.02, 0]}>
              <cylinderGeometry args={[0.26, 0.32, 0.04, 24]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
            </mesh>
            <mesh position={[0, -cy + 0.05, 0]}>
              <cylinderGeometry args={[0.08, 0.12, 0.04, 16]} />
              <meshStandardMaterial color="#475569" metalness={0.7} />
            </mesh>

            {/* Vertical Support Pole (ONLY below the bottom rim of the ring - hole is 100% CLEAR!) */}
            <mesh position={[0, poleCenterY, 0]}>
              <cylinderGeometry args={[0.035, 0.04, poleHeight, 16]} />
              <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.3} />
            </mesh>

            {/* Precision Torus Ring */}
            <mesh rotation={[0, 0, 0]}>
              <torusGeometry args={[R, rTube, 20, 48]} />
              <meshStandardMaterial 
                color={isCleared ? '#10b981' : ring.color} 
                emissive={isCleared ? '#10b981' : ring.color} 
                emissiveIntensity={isCleared ? 0.9 : 0.55} 
                metalness={0.7} 
                roughness={0.2} 
              />
            </mesh>

            {/* 4 LED Navigation Beacons on Ring Rim */}
            {[
              [0, R, 0],
              [0, -R + rTube, 0],
              [R, 0, 0],
              [-R, 0, 0],
            ].map((pos, i) => (
              <mesh key={i} position={pos as [number, number, number]}>
                <sphereGeometry args={[0.035, 12, 12]} />
                <meshBasicMaterial color={isCleared ? '#34d399' : '#ffffff'} />
              </mesh>
            ))}

            {/* Gate Number & Status Banner */}
            <group position={[0, R + 0.22, 0]}>
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[0.85, 0.24]} />
                <meshBasicMaterial color={isCleared ? '#064e3b' : '#0f172a'} transparent opacity={0.85} />
              </mesh>
              <Text
                position={[0, 0, 0]}
                fontSize={0.15}
                color={isCleared ? '#34d399' : '#ffffff'}
                anchorX="center"
                anchorY="middle"
              >
                {isCleared ? `GATE ${ring.id} ✓` : `GATE ${ring.id}`}
              </Text>
            </group>
          </group>
        );
      })}
    </group>
  );
}

function AutonomousQRTrack() {
  const hasCargo = useStore(state => state.hasCargo);
  const cargoDroppedPosition = useStore(state => state.cargoDroppedPosition);
  const showCrateOnChains = !hasCargo && cargoDroppedPosition === null;

  return (
    <group>
      {/* Take Off Pad */}
      <Pad position={[-2, 0.03, 2]} color="#ef4444" label="Take Off" />
      {/* QR Pad 1 */}
      <Pad position={[-2, 0.03, -1]} color="#3b82f6" label="QR 1" isQR />
      {/* Chains for Cargo Station */}
      <CargoGantry position={[0, 0, -2]} hasCrate={showCrateOnChains} />
      {/* QR Pad 2 */}
      <Pad position={[2, 0.03, -1]} color="#10b981" label="QR 2" isQR />
      {/* QR Pad 3 */}
      <Pad position={[2, 0.03, 2]} color="#f59e0b" label="QR 3" isQR />
      {/* Landing Pad */}
      <LandingPad position={[0, 0.03, 2]} />
    </group>
  );
}

function CustomAutonomousTrack({ elements }: { elements: import('../types').TrackElement[] }) {
  const hasCargo = useStore(state => state.hasCargo);
  const cargoDroppedPosition = useStore(state => state.cargoDroppedPosition);
  const showCrateOnChains = !hasCargo && cargoDroppedPosition === null;

  return (
    <group>
      {elements.map(elem => {
        switch (elem.type) {
          case 'start_pad':
            return <Pad key={elem.id} position={[elem.x, 0.03, elem.z]} color="#ef4444" label="Take Off" />;
          case 'qr_pad_1':
            return <Pad key={elem.id} position={[elem.x, 0.03, elem.z]} color="#3b82f6" label="QR 1" isQR />;
          case 'qr_pad_2':
            return <Pad key={elem.id} position={[elem.x, 0.03, elem.z]} color="#10b981" label="QR 2" isQR />;
          case 'qr_pad_3':
            return <Pad key={elem.id} position={[elem.x, 0.03, elem.z]} color="#f59e0b" label="QR 3" isQR />;
          case 'cargo_station':
            return <CargoGantry key={elem.id} position={[elem.x, 0, elem.z]} hasCrate={showCrateOnChains} />;
          case 'landing_pad':
            return <LandingPad key={elem.id} position={[elem.x, 0.03, elem.z]} />;
          default:
            return null;
        }
      })}
    </group>
  );
}

export function CargoGantry({ position, hasCrate = true }: { position: [number, number, number], hasCrate?: boolean }) {
  return (
    <group position={position}>
      {/* Ground Footing Plates */}
      <mesh position={[-0.6, 0.02, 0]}>
        <boxGeometry args={[0.2, 0.04, 0.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>
      <mesh position={[0.6, 0.02, 0]}>
        <boxGeometry args={[0.2, 0.04, 0.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>

      {/* Vertical Support Columns */}
      <mesh position={[-0.6, 0.8, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.6, 16]} />
        <meshStandardMaterial color="#f97316" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.6, 0.8, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.6, 16]} />
        <meshStandardMaterial color="#f97316" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Top Crossbeam */}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[1.3, 0.06, 0.08]} />
        <meshStandardMaterial color="#ea580c" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Station Sign */}
      <group position={[0, 1.75, 0]}>
        <mesh>
          <planeGeometry args={[0.8, 0.18]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.08}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
        >
          CHAINS & CARGO
        </Text>
      </group>

      {/* Hanging Chains (Left and Right) */}
      <ChainLink position={[-0.12, 1.58, 0]} length={0.65} />
      <ChainLink position={[0.12, 1.58, 0]} length={0.65} />

      {/* Suspended Cargo Crate */}
      {hasCrate && (
        <group position={[0, 0.85, 0]}>
          <CargoCrate size={0.24} />
        </group>
      )}

      {/* Ground Cargo Target Circle */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.35, 32]} />
        <meshBasicMaterial color="#eab308" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function ChainLink({ position, length }: { position: [number, number, number], length: number }) {
  const linksCount = 6;
  const linkHeight = length / linksCount;

  return (
    <group position={position}>
      {Array.from({ length: linksCount }).map((_, i) => (
        <mesh key={i} position={[0, -i * linkHeight, 0]}>
          <torusGeometry args={[0.02, 0.006, 8, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export function CargoCrate({ size = 0.22 }: { size?: number }) {
  return (
    <group>
      {/* Main Crate Box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Black Hazard Warning Bands */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[size * 1.02, size * 0.3, size * 1.02]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>

      {/* Top Magnetic Ring */}
      <mesh position={[0, size / 2 + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 0.2, 0.015, 12, 24]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Glowing Indicator Light */}
      <mesh position={[0, size / 2 + 0.01, 0]}>
        <sphereGeometry args={[0.02, 12, 12]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
    </group>
  );
}

function LandingPad({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Outer Circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.5, 32]} />
        <meshStandardMaterial color="#059669" roughness={0.4} />
      </mesh>

      {/* White Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.38, 0.44, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Helipad 'H' */}
      <group position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh position={[-0.12, 0, 0]}>
          <planeGeometry args={[0.06, 0.3]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.12, 0, 0]}>
          <planeGeometry args={[0.06, 0.3]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.18, 0.06]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      <Text
        position={[0, 0.01, 0.38]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        LANDING
      </Text>
    </group>
  );
}

function UnifiedTrack() {
  return (
    <group>
      {/* Take Off Pad */}
      <Pad position={[-4, 0.03, 6]} color="#ef4444" label="Take Off" />
      
      {/* Landing Pad 1 */}
      <Pad position={[-4, 0.03, -6]} color="#10b981" label="Pad 1" />
      
      {/* Landing Pad 2 */}
      <Pad position={[6, 0.03, -6]} color="#10b981" label="Pad 2" />
      
      {/* Landing Pad 3 / Final */}
      <Pad position={[6, 0.03, 6]} color="#3b82f6" label="Final Pad" />

      {TRACK_OBSTACLES.map((obs, i) => {
        if (obs.type === 'pole') {
          return (
            <group key={i} position={obs.pos}>
              <mesh castShadow>
                <cylinderGeometry args={[obs.radius, obs.radius, obs.height, 16]} />
                <meshStandardMaterial color="#f97316" />
              </mesh>
              {obs.label && (
                <Text position={[0, 0.01, 0.5]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.3} color="#ffffff" anchorX="center" anchorY="middle">
                  {obs.label}
                </Text>
              )}
            </group>
          );
        }
        
        if (obs.type === 'gate') {
          return (
            <group key={i} position={obs.pos} rotation={obs.rotation as [number, number, number]}>
              <mesh position={[-(obs.width || 1)/2, obs.height/2, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, obs.height, 16]} />
                <meshStandardMaterial color="#f97316" />
              </mesh>
              <mesh position={[(obs.width || 1)/2, obs.height/2, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, obs.height, 16]} />
                <meshStandardMaterial color="#f97316" />
              </mesh>
              <mesh position={[0, obs.height, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, obs.width || 1, 16]} />
                <meshStandardMaterial color="#f97316" />
              </mesh>
              {obs.label && (
                <Text position={[0, 0.01, 0.5]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.3} color="#ffffff" anchorX="center" anchorY="middle">
                  {obs.label}
                </Text>
              )}
            </group>
          );
        }

        if (obs.type === 'wall') {
           return (
            <group key={i} position={[obs.pos[0], 0, obs.pos[2]]} rotation={obs.rotation as [number, number, number]}>
              <mesh position={[0, obs.height/2, 0]} castShadow>
                <boxGeometry args={[obs.width || 0.8, obs.height, 0.1]} />
                <meshStandardMaterial color="#0ea5e9" transparent opacity={0.8} />
              </mesh>
              {obs.label && (
                <Text position={[0, 0.01, 0.5]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.3} color="#ffffff" anchorX="center" anchorY="middle">
                  {obs.label}
                </Text>
              )}
            </group>
           )
        }

        if (obs.type === 'poi_gate') {
          return (
            <group key={i} position={obs.pos} rotation={obs.rotation as [number, number, number]}>
              <mesh position={[-(obs.width || 1)/2, obs.height/2, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, obs.height, 16]} />
                <meshStandardMaterial color="#8b5cf6" />
              </mesh>
              <mesh position={[0, obs.height/2, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, obs.height, 16]} />
                <meshStandardMaterial color="#8b5cf6" />
              </mesh>
              <mesh position={[(obs.width || 1)/2, obs.height/2, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, obs.height, 16]} />
                <meshStandardMaterial color="#8b5cf6" />
              </mesh>
              <mesh position={[0, obs.height, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, obs.width || 1, 16]} />
                <meshStandardMaterial color="#8b5cf6" />
              </mesh>
              {obs.label && (
                <Text position={[0, 0.01, 0.5]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.3} color="#ffffff" anchorX="center" anchorY="middle">
                  {obs.label}
                </Text>
              )}
            </group>
          );
        }
        return null;
      })}
    </group>
  );
}


function Pad({ position, color, label, isQR = false }: { position: [number, number, number], color: string, label: string, isQR?: boolean }) {
  return (
    <group position={position}>
      {/* Main Base Circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.4, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Inner White Circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* QR Code Approximation */}
      {isQR && (
         <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            {/* Outer Box */}
            <mesh><planeGeometry args={[0.35, 0.35]} /><meshBasicMaterial color="#111827"/></mesh>
            {/* Inner White Box */}
            <mesh position={[0, 0, 0.001]}><planeGeometry args={[0.25, 0.25]} /><meshBasicMaterial color="#ffffff"/></mesh>
            
            {/* QR Position Markers (Corners) */}
            <mesh position={[-0.08, 0.08, 0.002]}><planeGeometry args={[0.06, 0.06]} /><meshBasicMaterial color="#111827"/></mesh>
            <mesh position={[0.08, 0.08, 0.002]}><planeGeometry args={[0.06, 0.06]} /><meshBasicMaterial color="#111827"/></mesh>
            <mesh position={[-0.08, -0.08, 0.002]}><planeGeometry args={[0.06, 0.06]} /><meshBasicMaterial color="#111827"/></mesh>
            
            {/* Center Data Pattern */}
            <mesh position={[0.02, -0.02, 0.002]}><planeGeometry args={[0.1, 0.1]} /><meshBasicMaterial color="#111827"/></mesh>
         </group>
      )}
    </group>
  );
}
