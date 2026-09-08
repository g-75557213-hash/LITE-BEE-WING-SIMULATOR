import React from 'react';
import { useStore } from '../store/useStore';
import { Drone } from './Drone';
import { ObstacleCourse } from './ObstacleCourse';
import { Environment } from '@react-three/drei';

export function FlightEnvironment() {
  const mode = useStore(state => state.mode);
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048} 
      />
      
      <Environment preset="city" />
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#2e1065" roughness={0.9} />
      </mesh>
      
      <ObstacleCourse />
      <Drone />
    </>
  );
}
