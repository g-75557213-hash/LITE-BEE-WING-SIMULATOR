import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { PerspectiveCamera } from '@react-three/drei';
import { generateCollisionPillars } from '../utils/track';
import { CargoCrate } from './ObstacleCourse';

const COLLISION_PILLARS = generateCollisionPillars();

export function Drone() {
  const groupRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const currentCameraLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const hoverAlt = useRef<number>(0.1);
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const gamepadTakeoffDebounce = useRef<number>(0);
  const gamepadResetDebounce = useRef<number>(0);
  const gamepadCalibrateDebounce = useRef<number>(0);
  const calibStartRef = useRef<number>(0);
  const lastHit = useRef<number>(0);
  const lastPosSync = useRef<number>(0);
  
  const targetRotation = useStore(state => state.targetRotation);
  const mode = useStore(state => state.mode);
  const setTargetPosition = useStore(state => state.setTargetPosition);
  const setTargetRotation = useStore(state => state.setTargetRotation);
  const isRunning = useStore(state => state.isRunning);
  const updateAnalytics = useStore(state => state.updateAnalytics);
  const health = useStore(state => state.health);
  const setHealth = useStore(state => state.setHealth);
  const isFlying = useStore(state => state.isFlying);
  const setIsFlying = useStore(state => state.setIsFlying);
  const gamepadMapping = useStore(state => state.gamepadMapping);
  const resetSignal = useStore(state => state.resetSignal);
  const controlMode = useStore(state => state.controlMode);
  const isCalibrating = useStore(state => state.isCalibrating);
  const setIsCalibrating = useStore(state => state.setIsCalibrating);
  const resetDrone = useStore(state => state.resetDrone);
  const hasCargo = useStore(state => state.hasCargo);
  const autoVelocity = useStore(state => state.autoVelocity);

  // Manual Flight State
  const [keys, setKeys] = useState({
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
  });

  const checkCollision = (pos: THREE.Vector3) => {
      const droneRadius = 0.15;
      for (const pillar of COLLISION_PILLARS) {
         const dist = Math.hypot(pos.x - pillar.x, pos.z - pillar.z);
         if (dist < droneRadius + pillar.radius && pos.y < pillar.height) {
            return true;
         }
      }
      return false;
  };

  // Watch for Reset Signal - Position drone dynamically based on current mode & track start
  useEffect(() => {
     if (groupRef.current) {
         const store = useStore.getState();
         const startPos = store.targetPosition;
         groupRef.current.position.set(startPos[0], startPos[1], startPos[2]);
         groupRef.current.rotation.set(0, 0, 0);
         velocity.current.set(0, 0, 0);
         hoverAlt.current = 0.75;
     }
  }, [resetSignal]);

  // Watch for isFlying changes to set hover altitude if taking off via UI
  useEffect(() => {
     if (isFlying && mode === 'manual') {
         if (groupRef.current && groupRef.current.position.y < 0.2) {
             hoverAlt.current = 0.75;
         }
     }
  }, [isFlying, mode]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key === ' ' ? 'Space' : e.key;
      if (['w', 'a', 's', 'd'].includes(key.toLowerCase())) {
         setKeys(k => ({ ...k, [key.toLowerCase()]: true }));
      } else {
         setKeys(k => ({ ...k, [key]: true }));
      }
      
      if (key.toLowerCase() === 'c') {
         if (!isCalibrating) {
             calibStartRef.current = Date.now();
             setIsCalibrating(true);
             setTimeout(() => setIsCalibrating(false), 1500); // 1.5s duration = exactly 3 on/off flashes
         }
      }

      if (key.toLowerCase() === 't') {
         const store = useStore.getState();
         if (store.health > 0 && store.mode === 'manual') {
            if (!store.isFlying) {
               hoverAlt.current = 0.75;
            }
            store.setIsFlying(!store.isFlying);
         }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key === ' ' ? 'Space' : e.key;
      if (['w', 'a', 's', 'd'].includes(key.toLowerCase())) {
         setKeys(k => ({ ...k, [key.toLowerCase()]: false }));
      } else {
         setKeys(k => ({ ...k, [key]: false }));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isCalibrating, setIsCalibrating]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    let targetPitch = 0;
    let targetRoll = 0;
    const GRAVITY = 9.8 * delta;

    if (mode === 'manual') {
      const pos = groupRef.current.position;
      
      // Physics Constants - Highly sensitive and responsive for gamepad & keyboard
      const ACCEL = 14 * delta; 
      const MAX_SPEED = 3.2; 
      const TURN_SPEED = 2.8 * delta; 
      const DRAG = 0.98;

      let dRotY = 0;
      let dThrottle = 0;

      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads.find(g => g !== null);

      if (gp) {
        const deadzone = 0.08;
        
        // Gamepad Reset: Works REGARDLESS of health (even when crashed!), debounced 400ms
        const isResetPressed = 
          (gamepadMapping.reset !== null && gp.buttons[gamepadMapping.reset]?.pressed) ||
          (gamepadMapping.reset === null && (gp.buttons[8]?.pressed || gp.buttons[9]?.pressed || gp.buttons[2]?.pressed));

        if (isResetPressed) {
          if (Date.now() - gamepadResetDebounce.current > 400) {
            gamepadResetDebounce.current = Date.now();
            resetDrone();
          }
        }
        
        // Gamepad Calibrate: Trigger blue flash 3 times
        const isCalibratePressed =
          (gamepadMapping.calibrate !== null && gp.buttons[gamepadMapping.calibrate]?.pressed) ||
          (gamepadMapping.calibrate === null && gp.buttons[1]?.pressed);

        if (isCalibratePressed) {
          if (!isCalibrating && Date.now() - gamepadCalibrateDebounce.current > 500) {
            gamepadCalibrateDebounce.current = Date.now();
            calibStartRef.current = Date.now();
            setIsCalibrating(true);
            setTimeout(() => setIsCalibrating(false), 1500);
          }
        }

        // Gamepad Takeoff/Land: Active in manual mode
        const isTakeoffPressed =
          (gamepadMapping.takeoff !== null && gp.buttons[gamepadMapping.takeoff]?.pressed) ||
          (gamepadMapping.takeoff === null && gp.buttons[0]?.pressed);

        if (isTakeoffPressed && health > 0 && mode === 'manual') {
          if (Date.now() - gamepadTakeoffDebounce.current > 500) {
            if (!isFlying) {
              hoverAlt.current = 0.75;
            }
            setIsFlying(!isFlying);
            gamepadTakeoffDebounce.current = Date.now();
          }
        }
        
        if (isFlying && health > 0) {
           let yawAxis = 0, throttleAxis = 0, rollAxis = 0, pitchAxis = 0;
           
           // Mode 1: Roll & Pitch on left stick (axes 0, 1), Yaw & Altitude on right stick (axes 2, 3)
           // Mode 2: Yaw & Altitude on left stick (axes 0, 1), Roll & Pitch on right stick (axes 2, 3)
           if (controlMode === 1) {
               rollAxis = gp.axes[0];
               pitchAxis = gp.axes[1];
               yawAxis = gp.axes[2];
               throttleAxis = gp.axes[3];
           } else {
               yawAxis = gp.axes[0];
               throttleAxis = gp.axes[1];
               rollAxis = gp.axes[2];
               pitchAxis = gp.axes[3];
           }

           // Sensitive response curve: immediate tactile control + dynamic boost when pushed hard
           const applyCurve = (val: number) => {
             const abs = Math.abs(val);
             const curve = abs * (1 + 0.65 * abs);
             return Math.sign(val) * curve;
           };
           
           if (Math.abs(yawAxis) > deadzone) dRotY -= applyCurve(yawAxis) * TURN_SPEED; 
           if (Math.abs(throttleAxis) > deadzone) { dThrottle -= applyCurve(throttleAxis) * ACCEL; hoverAlt.current = pos.y; }
           if (Math.abs(rollAxis) > deadzone) { velocity.current.x += applyCurve(rollAxis) * ACCEL; targetRoll = -rollAxis * 0.45; }
           if (Math.abs(pitchAxis) > deadzone) { velocity.current.z += applyCurve(pitchAxis) * ACCEL; targetPitch = -pitchAxis * 0.45; }
        }
      }

      // Keyboard support - Only active if flying and above ground!
      if (isFlying && health > 0 && pos.y > 0.05) {
        if (keys.w) { velocity.current.z -= ACCEL; targetPitch = 0.3; }
        if (keys.s) { velocity.current.z += ACCEL; targetPitch = -0.3; }
        if (keys.a) { velocity.current.x -= ACCEL; targetRoll = 0.3; }
        if (keys.d) { velocity.current.x += ACCEL; targetRoll = -0.3; }
        if (keys.ArrowUp) { dThrottle += ACCEL; hoverAlt.current = pos.y; }
        if (keys.ArrowDown) { dThrottle -= ACCEL; hoverAlt.current = pos.y; }
        if (keys.ArrowLeft) dRotY += TURN_SPEED;
        if (keys.ArrowRight) dRotY -= TURN_SPEED;
      }
      
      const forwardVec = new THREE.Vector3(velocity.current.x, 0, velocity.current.z);
      forwardVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), groupRef.current.rotation.y);
      
      const gSpeed = Math.hypot(forwardVec.x, forwardVec.z);
      if (gSpeed > MAX_SPEED) {
         forwardVec.multiplyScalar(MAX_SPEED / gSpeed);
      }
      
      if (health <= 0) {
         velocity.current.y -= GRAVITY * 2;
      } else if (!isFlying) {
         velocity.current.y -= GRAVITY;
      } else {
         velocity.current.y += dThrottle;
         if (dThrottle === 0) {
             // Auto hover stabilization
             velocity.current.y *= 0.9;
             const altDiff = hoverAlt.current - pos.y;
             velocity.current.y += altDiff * 2.0 * delta;
         }
      }

      let nextPos = new THREE.Vector3(
        pos.x + forwardVec.x * delta,
        pos.y + velocity.current.y * delta,
        pos.z + forwardVec.z * delta
      );
      
      // Ground collision
      if (nextPos.y <= 0.0) {
         nextPos.y = 0;
         if (velocity.current.y < 0) velocity.current.y = 0;
         
         // Disable horizontal movement if landed or crashed
         if (!isFlying || health <= 0) {
             velocity.current.x = 0;
             velocity.current.z = 0;
         }
      }

      // Obstacle collision (Solid) - ONLY in manual mode
      if (health > 0 && nextPos.y > 0.1 && mode === 'manual' && checkCollision(nextPos)) {
          nextPos.x = pos.x;
          nextPos.z = pos.z;
          velocity.current.x *= -0.5;
          velocity.current.z *= -0.5;
          
          if (Date.now() - lastHit.current > 500) {
              const newHealth = health - 25;
              setHealth(newHealth);
              lastHit.current = Date.now();
              if (newHealth <= 0) {
                  updateAnalytics({ crashes: useStore.getState().analytics.crashes + 1 });
              }
          }
      }

      velocity.current.x *= DRAG;
      velocity.current.z *= DRAG;
      
      const nextRot = [
        groupRef.current.rotation.x,
        groupRef.current.rotation.y + dRotY,
        groupRef.current.rotation.z
      ] as [number, number, number];

      groupRef.current.position.copy(nextPos);
      groupRef.current.rotation.set(...nextRot);
      
      setTargetPosition([nextPos.x, nextPos.y, nextPos.z]);
      setTargetRotation(nextRot);
      
      // 3rd Person Camera Logic
      if (mode === 'manual' && useStore.getState().cameraView === 'tpp' && cameraRef.current) {
         const idealOffset = new THREE.Vector3(0, 0.4, 1.5);
         idealOffset.applyQuaternion(groupRef.current.quaternion);
         idealOffset.add(groupRef.current.position);
         
         const idealLookat = new THREE.Vector3(0, 0, -3);
         idealLookat.applyQuaternion(groupRef.current.quaternion);
         idealLookat.add(groupRef.current.position);
         
         state.camera.position.lerp(idealOffset, 0.1);
         currentCameraLookAt.current.lerp(idealLookat, 0.15);
         state.camera.lookAt(currentCameraLookAt.current);
      }

    } else {
      // Autonomous Mode - Smooth, continuous LiteBee Wing flight physics
      const isRunning = useStore.getState().isRunning;
      const isFlying = useStore.getState().isFlying;
      const targetAltitude = useStore.getState().targetAltitude;

      if (health <= 0) {
        // Crashed
        velocity.current.y -= GRAVITY * 2;
        groupRef.current.position.y = Math.max(0, groupRef.current.position.y + velocity.current.y * delta);
      } else if (isRunning || isFlying) {
        const yaw = groupRef.current.rotation.y;
        
        // Translate autoVelocity (forward, right) to world coordinates based on drone's yaw
        const targetWorldVelX = -Math.sin(yaw) * autoVelocity.forward + Math.cos(yaw) * autoVelocity.right;
        const targetWorldVelZ = -Math.cos(yaw) * autoVelocity.forward - Math.sin(yaw) * autoVelocity.right;
        
        // Continuous smooth acceleration & momentum
        velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, targetWorldVelX, 0.14);
        velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, targetWorldVelZ, 0.14);

        // Smooth Altitude Controller (optical flow + barometer altitude hold)
        if (isFlying && targetAltitude > 0) {
          const currentAlt = groupRef.current.position.y;
          const altDiff = targetAltitude - currentAlt;
          velocity.current.y = THREE.MathUtils.lerp(velocity.current.y, altDiff * 3.2, 0.14);
        } else if (!isFlying || targetAltitude <= 0) {
          // Landing descent
          if (groupRef.current.position.y > 0.02) {
            velocity.current.y = THREE.MathUtils.lerp(velocity.current.y, -0.6, 0.12);
          } else {
            velocity.current.y = 0;
            groupRef.current.position.y = 0;
          }
        }

        // Update position continuously
        groupRef.current.position.x += velocity.current.x * delta;
        groupRef.current.position.z += velocity.current.z * delta;
        groupRef.current.position.y = Math.max(0, groupRef.current.position.y + velocity.current.y * delta);

        // Smooth yaw rotation directly on Euler rotation.y
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation[1], 0.1);

        // Natural quadcopter banking tilt based on movement speed
        targetPitch = Math.max(-0.35, Math.min(0.35, autoVelocity.forward * 0.22));
        targetRoll = Math.max(-0.35, Math.min(0.35, -autoVelocity.right * 0.22));
      } else {
        velocity.current.set(0, 0, 0);
      }

      // Sync position to store at 10Hz for telemetry & distance checks without React thrashing
      if (Date.now() - lastPosSync.current > 100) {
        lastPosSync.current = Date.now();
        setTargetPosition([groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z]);
      }
    }
    
    // Apply visual pitch and roll
    if (visualRef.current) {
        visualRef.current.rotation.x = THREE.MathUtils.lerp(visualRef.current.rotation.x, targetPitch, 0.1);
        visualRef.current.rotation.z = THREE.MathUtils.lerp(visualRef.current.rotation.z, targetRoll, 0.1);
    }

    if (groupRef.current.position.y > 0.1 && health > 0) {
       updateAnalytics({ flightTime: useStore.getState().analytics.flightTime + delta });
    }
  });

  return (
    <group ref={groupRef} castShadow>
      {mode === 'manual' && useStore.getState().cameraView === 'tpp' && <PerspectiveCamera makeDefault ref={cameraRef} fov={60} />}
      
      {/* Attached Cargo under drone belly */}
      {hasCargo && (
        <group position={[0, -0.14, 0]}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.04, 12]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.9} />
          </mesh>
          <CargoCrate size={0.16} />
        </group>
      )}

      <group ref={visualRef}>
        <mesh castShadow receiveShadow position={[0, 0.04, 0]}>
          <boxGeometry args={[0.08, 0.04, 0.14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        
        <mesh castShadow receiveShadow position={[0, 0.07, -0.01]}>
          <boxGeometry args={[0.06, 0.02, 0.10]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.7} />
        </mesh>
        
        <mesh position={[0, 0.04, 0.07]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.01, 16]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        
        {isCalibrating && (
           <group position={[0, 0.08, 0]}>
             {Math.floor((Date.now() - calibStartRef.current) / 250) % 2 === 0 && (
               <>
                 <mesh position={[0, 0.01, 0]}>
                   <sphereGeometry args={[0.018, 16, 16]} />
                   <meshBasicMaterial color="#38bdf8" />
                 </mesh>
                 <pointLight 
                     position={[0, 0.05, 0]} 
                     color="#38bdf8" 
                     intensity={4} 
                     distance={2.5} 
                 />
               </>
             )}
           </group>
        )}

        {[
          [-1, -1], [1, -1], [-1, 1], [1, 1]
        ].map(([x, z], i) => (
          <group key={i}>
            <mesh position={[x * 0.05, 0.04, z * 0.05]} rotation={[0, Math.atan2(x, z), 0]} castShadow>
               <boxGeometry args={[0.012, 0.01, 0.08]} />
               <meshStandardMaterial color="#9ca3af" />
            </mesh>
            <mesh position={[x * 0.08, 0.05, z * 0.08]} castShadow>
               <cylinderGeometry args={[0.015, 0.015, 0.02, 16]} />
               <meshStandardMaterial color="#d1d5db" />
            </mesh>
            <mesh position={[x * 0.08, 0.07, z * 0.08]} rotation={[0, ((mode === 'manual' && isFlying) || isRunning) && health > 0 ? Math.random() * Math.PI : 0, 0]}>
               <boxGeometry args={[0.08, 0.002, 0.01]} />
               <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
            </mesh>
            <mesh position={[x * 0.08, 0.05, z * 0.08]} rotation={[Math.PI/2, 0, 0]} castShadow>
               <torusGeometry args={[0.05, 0.003, 6, 24]} />
               <meshStandardMaterial color="#9ca3af" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
