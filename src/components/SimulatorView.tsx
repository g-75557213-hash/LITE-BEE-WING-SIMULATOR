import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { FlightEnvironment } from './FlightEnvironment';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { Maximize, Minimize, Camera, Sliders, MapPin, Layers, Gauge, Target, RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import { CustomTrackDesigner } from './CustomTrackDesigner';

function GamepadCameraController() {
  const { camera, controls } = useThree();
  const targetOffset = useRef(new THREE.Vector3(0, 0, 0));
  const baseTarget = useStore(state => state.targetPosition);

  useFrame((state, delta) => {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads.find(g => g !== null);
    
    if (controls && gp) {
       let panX = 0;
       let panZ = 0;
       let zoomDelta = 0;
       
       // D-pad (buttons 12: Up, 13: Down, 14: Left, 15: Right)
       if (gp.buttons[12]?.pressed) panZ -= 5 * delta;
       if (gp.buttons[13]?.pressed) panZ += 5 * delta;
       if (gp.buttons[14]?.pressed) panX -= 5 * delta;
       if (gp.buttons[15]?.pressed) panX += 5 * delta;

       // L1 (Button 4) Zoom in, L2 (Button 6) Zoom out
       if (gp.buttons[4]?.pressed) zoomDelta -= 10 * delta;
       if (gp.buttons[6]?.pressed) zoomDelta += 10 * delta;
       
       // Update offset based on D-pad relative to camera view
       if (panX !== 0 || panZ !== 0) {
           const forward = new THREE.Vector3();
           camera.getWorldDirection(forward);
           forward.y = 0;
           forward.normalize();
           
           const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
           
           targetOffset.current.add(right.multiplyScalar(panX));
           targetOffset.current.add(forward.multiplyScalar(-panZ));
       }
       
       // Apply Zoom
       if (zoomDelta !== 0) {
           camera.position.add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(zoomDelta));
       }

       // Update orbit controls target
       const orbitControls = controls as any;
       orbitControls.target.set(
           baseTarget[0] + targetOffset.current.x,
           baseTarget[1] + targetOffset.current.y,
           baseTarget[2] + targetOffset.current.z
       );
       orbitControls.update();
    } else if (controls) {
       // Reset offset if no gamepad to default tracking
       // or keep it? We'll keep the current offset so they don't snap back.
       const orbitControls = controls as any;
       orbitControls.target.set(
           baseTarget[0] + targetOffset.current.x,
           baseTarget[1] + targetOffset.current.y,
           baseTarget[2] + targetOffset.current.z
       );
    }
  });
  
  return null;
}

export function SimulatorView() {
  const mode = useStore(state => state.mode);
  const targetPosition = useStore(state => state.targetPosition);
  const health = useStore(state => state.health);
  const cameraView = useStore(state => state.cameraView);
  const setCameraView = useStore(state => state.setCameraView);
  const pilotTrackType = useStore(state => state.pilotTrackType);
  const setPilotTrackType = useStore(state => state.setPilotTrackType);
  const autonomousTrackType = useStore(state => state.autonomousTrackType);
  const setAutonomousTrackType = useStore(state => state.setAutonomousTrackType);
  const setIsTrackDesignerOpen = useStore(state => state.setIsTrackDesignerOpen);

  // Speed & Shooting Score State
  const speedMode = useStore(state => state.speedMode);
  const setSpeedMode = useStore(state => state.setSpeedMode);
  const shootingScore = useStore(state => state.shootingScore);
  const targetsHit = useStore(state => state.targetsHit);
  const shotsFired = useStore(state => state.shotsFired);
  const bullseyeHits = useStore(state => state.bullseyeHits);
  const resetShootingStats = useStore(state => state.resetShootingStats);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-purple-950 rounded-lg overflow-hidden shadow-inner border border-slate-200">
      <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 2]} gl={{ antialias: true }} onCreated={({ scene }) => { scene.background = new THREE.Color('#3b0764') }}>
         {(mode === 'autonomous' || cameraView === 'free') && (
           <>
             <PerspectiveCamera 
                 makeDefault 
                 position={[targetPosition[0], targetPosition[1] + 3, targetPosition[2] + 4]} 
                 rotation={[0, Math.PI, 0]} 
                 fov={60}
             />
             <OrbitControls 
                 target={[targetPosition[0], targetPosition[1], targetPosition[2]]}
                 enableDamping
                 dampingFactor={0.05}
                 maxPolarAngle={Math.PI / 2 - 0.05} // don't go below ground
                 enablePan={true}
                 enableZoom={true} maxDistance={15}
             />
             {cameraView === 'free' && <GamepadCameraController />}
           </>
         )}
         <FlightEnvironment />
      </Canvas>
      
      {/* Overlay UI - Top Left: Stats & Mode */}
      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-10">
         <div className="bg-slate-900/85 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-slate-200 shadow-md border border-slate-700/60">
            Mode: <span className={mode === 'manual' ? 'text-indigo-400 uppercase font-bold' : 'text-purple-400 uppercase font-bold'}>{mode}</span>
         </div>
         <div className="bg-slate-900/85 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-slate-200 shadow-md border border-slate-700/60">
            Alt: <span className="font-mono text-emerald-400">{targetPosition[1].toFixed(2)}m</span>
         </div>
         <div className="bg-slate-900/85 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-slate-200 shadow-md border border-slate-700/60 flex items-center gap-1.5">
            <span>Health:</span>
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
               <div className={`h-full ${health > 50 ? 'bg-emerald-500' : health > 20 ? 'bg-amber-500' : 'bg-rose-500'} transition-all`} style={{ width: `${health}%` }} />
            </div>
         </div>

         {/* Independent Track Selector */}
         {mode === 'manual' ? (
           <div className="flex items-center gap-2">
             <div className="flex items-center bg-slate-900/85 backdrop-blur rounded-full p-0.5 border border-slate-700/60 text-xs shadow-md">
               <button
                 onClick={() => setPilotTrackType('slalom')}
                 className={`px-2.5 py-0.5 rounded-full transition-colors ${pilotTrackType === 'slalom' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
               >
                 Slalom
               </button>
               <button
                 onClick={() => setPilotTrackType('precision_rings')}
                 className={`px-2.5 py-0.5 rounded-full transition-colors ${pilotTrackType === 'precision_rings' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
               >
                 Precision Rings
               </button>
               <button
                 onClick={() => setPilotTrackType('target_shooting')}
                 className={`px-2.5 py-0.5 rounded-full transition-colors flex items-center gap-1 ${pilotTrackType === 'target_shooting' ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/50' : 'text-rose-400 hover:text-rose-200'}`}
               >
                 <Target className="w-3 h-3" /> Target Range
               </button>
             </div>

             {/* Speed Mode Toggle for Pilot Mode */}
             <div className="flex items-center bg-slate-900/85 backdrop-blur rounded-full p-0.5 border border-slate-700/60 text-xs shadow-md">
               <span className="pl-2 pr-1 text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                 <Gauge className="w-3.5 h-3.5 text-amber-400" /> Speed:
               </span>
               <button
                 onClick={() => setSpeedMode('slow')}
                 className={`px-2 py-0.5 rounded-full font-medium transition-all ${
                   speedMode === 'slow' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
                 }`}
                 title="Slow Speed (45%) - Maximum hover stability and precision aiming"
               >
                 Slow [1]
               </button>
               <button
                 onClick={() => setSpeedMode('normal')}
                 className={`px-2 py-0.5 rounded-full font-medium transition-all ${
                   speedMode === 'normal' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
                 }`}
                 title="Normal Speed (85%) - Standard balanced flight"
               >
                 Normal [2]
               </button>
               <button
                 onClick={() => setSpeedMode('fast')}
                 className={`px-2 py-0.5 rounded-full font-medium transition-all ${
                   speedMode === 'fast' ? 'bg-amber-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
                 }`}
                 title="Fast Speed (125%) - Sport speed and high agility"
               >
                 Fast [3]
               </button>
             </div>
           </div>
         ) : (
           <div className="flex items-center gap-2">
             <div className="flex items-center bg-slate-900/85 backdrop-blur rounded-full p-0.5 border border-slate-700/60 text-xs shadow-md">
               <button
                 onClick={() => setAutonomousTrackType('qr_pad')}
                 className={`px-2.5 py-0.5 rounded-full transition-colors ${autonomousTrackType === 'qr_pad' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
               >
                 QR Pad Track
               </button>
               <button
                 onClick={() => setAutonomousTrackType('custom')}
                 className={`px-2.5 py-0.5 rounded-full transition-colors ${autonomousTrackType === 'custom' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
               >
                 Custom Track
               </button>
             </div>

             <button
               onClick={() => setIsTrackDesignerOpen(true)}
               className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg transition-all active:scale-95 border border-purple-400/30"
               title="Open 2D Track Layout Designer"
             >
               <Sliders className="w-3.5 h-3.5" />
               Design Track Layout
             </button>
           </div>
         )}
      </div>

      {/* Target Shooting Scoreboard HUD (Top Center) */}
      {mode === 'manual' && pilotTrackType === 'target_shooting' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-rose-500/30 shadow-xl shadow-rose-950/40 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-1.5 text-rose-400 font-bold tracking-wide uppercase">
            <Target className="w-4 h-4 animate-pulse text-rose-500" /> Range Score
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-3 font-mono">
            <span className="text-white font-bold text-sm">
              {shootingScore} <span className="text-[10px] text-slate-400 font-sans font-normal">pts</span>
            </span>
            <span className="text-amber-400 font-semibold">
              {bullseyeHits} <span className="text-[10px] text-slate-400 font-sans font-normal">bullseyes</span>
            </span>
            <span className="text-emerald-400 font-semibold">
              {targetsHit}/{shotsFired} <span className="text-[10px] text-slate-400 font-sans font-normal">hits ({shotsFired > 0 ? Math.round((targetsHit / shotsFired) * 100) : 0}%)</span>
            </span>
          </div>
          <button 
            onClick={resetShootingStats}
            className="p-1 text-slate-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg transition-colors"
            title="Reset Shooting Score"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Overlay UI - Top Right: View Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {mode === 'manual' && (
          <button 
            onClick={() => setCameraView(cameraView === 'tpp' ? 'free' : 'tpp')}
            className="bg-slate-900/85 hover:bg-slate-800 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 shadow-md border border-slate-700/60 transition-colors flex items-center gap-2"
            title="Toggle Camera View"
          >
            <Camera className="w-3.5 h-3.5" />
            {cameraView === 'tpp' ? 'Follow View' : 'Free Orbit'}
          </button>
        )}
        <button 
          onClick={toggleFullscreen}
          className="bg-slate-900/85 hover:bg-slate-800 backdrop-blur p-2 rounded-xl text-slate-200 shadow-md border border-slate-700/60 transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      {/* 2D Interactive Track Layout Designer Modal */}
      <CustomTrackDesigner />
    </div>
  );
}
