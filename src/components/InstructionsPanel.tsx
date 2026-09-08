import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { PlaneTakeoff, RotateCcw, Gamepad2, X, Plus, Check } from 'lucide-react';

export function InstructionsPanel() {
  const mode = useStore(state => state.mode);
  const health = useStore(state => state.health);
  const isFlying = useStore(state => state.isFlying);
  const setIsFlying = useStore(state => state.setIsFlying);
  const resetDrone = useStore(state => state.resetDrone);
  const controlMode = useStore(state => state.controlMode);
  const setControlMode = useStore(state => state.setControlMode);
  const pilotTrackType = useStore(state => state.pilotTrackType);
  const setPilotTrackType = useStore(state => state.setPilotTrackType);
  const gamepadMapping = useStore(state => state.gamepadMapping);
  const setGamepadMapping = useStore(state => state.setGamepadMapping);
  
  const [showGamepadModal, setShowGamepadModal] = useState(false);
  const [assigningButton, setAssigningButton] = useState<'takeoff' | 'reset' | 'calibrate' | null>(null);

  useEffect(() => {
    if (!assigningButton) return;
    
    let animationFrameId: number;
    
    const checkGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads.find(g => g !== null);
      if (gp) {
        for (let i = 0; i < gp.buttons.length; i++) {
          if (gp.buttons[i].pressed) {
            setGamepadMapping({ ...gamepadMapping, [assigningButton]: i });
            setAssigningButton(null);
            return;
          }
        }
      }
      animationFrameId = requestAnimationFrame(checkGamepad);
    };
    
    checkGamepad();
    
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [assigningButton, gamepadMapping, setGamepadMapping]);

  return (
    <>
      <div className="h-full bg-slate-50 overflow-y-auto p-6 space-y-6">
        <div className="text-center pb-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Flight Instructions</h2>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'manual' ? 'Manual Pilot Controls' : 'Autonomous Programming'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <Gamepad2 className="w-5 h-5 text-indigo-500" /> Key Bindings
             </h3>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between items-center">
              <span>Takeoff / Land</span>
              <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-xs">T</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Pitch (Forward/Back)</span>
              <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-xs">W / S</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Roll (Left/Right)</span>
              <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-xs">A / D</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Altitude (Up/Down)</span>
              <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-xs">↑ / ↓</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Yaw (Turn Left/Right)</span>
              <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-xs">← / →</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1 font-medium text-blue-600">
                Calibrate Gyro
              </span>
              <kbd className="px-2 py-1 bg-blue-50 border border-blue-300 text-blue-700 rounded font-mono text-xs font-bold">C (Flash Blue ×3)</kbd>
            </div>
          </div>
        </div>

        {/* Free View Camera Controls */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-2.5 flex items-center justify-between text-xs tracking-wide uppercase text-slate-500">
            <span>Free Orbit Camera Controls</span>
          </h3>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span>Gamepad D-Pad (↑ ↓ ← →)</span>
              <span className="font-semibold text-slate-700">Pan View</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Gamepad L1 / L2</span>
              <span className="font-semibold text-slate-700">Zoom In / Zoom Out</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Mouse Left Drag</span>
              <span className="font-semibold text-slate-700">Rotate Orbit</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Mouse Right Drag / Wheel</span>
              <span className="font-semibold text-slate-700">Pan & Zoom</span>
            </div>
          </div>
        </div>

        {mode === 'manual' && (
          <div className="space-y-4">
            
            <button 
              onClick={() => setShowGamepadModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Gamepad2 className="w-4 h-4" />
              Gamepad Setup
            </button>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
               <h3 className="font-semibold text-slate-700">Pilot Settings</h3>
               
               <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-600">Course Track</label>
                   <select 
                       value={pilotTrackType} 
                       onChange={(e) => setPilotTrackType(e.target.value as any)}
                       className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none"
                   >
                       <option value="slalom">Slalom Air-Gates Track</option>
                       <option value="precision_rings">Precision Ring Course</option>
                   </select>
               </div>

               <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-600">Toggle Control Mode</label>
                   <select 
                       value={controlMode} 
                       onChange={(e) => setControlMode(Number(e.target.value) as 1 | 2)}
                       className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none"
                   >
                       <option value={1}>Mode 1 (Left: Roll & Pitch, Right: Alt & Yaw)</option>
                       <option value={2}>Mode 2 (Left: Alt & Yaw, Right: Roll & Pitch)</option>
                   </select>
               </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
               <h3 className="font-semibold text-slate-700">Drone Controls</h3>
               
               <button
                 onClick={() => {
                   if (health <= 0) return;
                   setIsFlying(!isFlying);
                 }}
                 disabled={health <= 0}
                 className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white shadow transition-all active:scale-95 disabled:opacity-50 ${
                   health <= 0 ? 'bg-slate-400' :
                   isFlying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'
                 }`}
               >
                 <PlaneTakeoff className="w-5 h-5" />
                 {health <= 0 ? 'CRASHED' : isFlying ? 'LAND' : 'TAKE OFF'}
               </button>
               
               <button
                 onClick={() => resetDrone()}
                 className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold bg-slate-700 text-white hover:bg-slate-800 shadow transition-all active:scale-95"
               >
                 <RotateCcw className="w-5 h-5" />
                 RESET TO START
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Gamepad Setup Modal */}
      {showGamepadModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-indigo-500" /> Controller Setup
                 </h3>
                 <button onClick={() => { setShowGamepadModal(false); setAssigningButton(null); }} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="p-6 space-y-4">
                 <p className="text-sm text-slate-500 leading-relaxed">
                   Connect a controller to map specific actions to your controller buttons. Ensure the controller is powered on and connected to your device.
                 </p>
                 
                 <div className="space-y-3 pt-2">
                    {/* Takeoff / Land Mapping */}
                    <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                       <div className="flex justify-between items-center font-medium text-slate-700 text-sm">
                          Takeoff / Land
                          {gamepadMapping.takeoff !== null && (
                             <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-bold">
                               <Check className="w-3 h-3" /> Btn {gamepadMapping.takeoff}
                             </span>
                          )}
                       </div>
                       <button 
                          onClick={() => setAssigningButton('takeoff')}
                          disabled={assigningButton !== null}
                          className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                            assigningButton === 'takeoff'
                              ? 'bg-indigo-500 text-white animate-pulse' 
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                       >
                          {assigningButton === 'takeoff' ? 'Press any controller button...' : 'Assign Takeoff/Land'}
                       </button>
                    </div>

                    {/* Reset Mapping */}
                    <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                       <div className="flex justify-between items-center font-medium text-slate-700 text-sm">
                          Reset Drone
                          {gamepadMapping.reset !== null && (
                             <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-bold">
                               <Check className="w-3 h-3" /> Btn {gamepadMapping.reset}
                             </span>
                          )}
                       </div>
                       <button 
                          onClick={() => setAssigningButton('reset')}
                          disabled={assigningButton !== null}
                          className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                            assigningButton === 'reset'
                              ? 'bg-indigo-500 text-white animate-pulse' 
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                       >
                          {assigningButton === 'reset' ? 'Press any controller button...' : 'Assign Reset'}
                       </button>
                    </div>

                    {/* Calibrate Mapping */}
                    <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                       <div className="flex justify-between items-center font-medium text-slate-700 text-sm">
                          Calibrate
                          {gamepadMapping.calibrate !== null && (
                             <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-bold">
                               <Check className="w-3 h-3" /> Btn {gamepadMapping.calibrate}
                             </span>
                          )}
                       </div>
                       <button 
                          onClick={() => setAssigningButton('calibrate')}
                          disabled={assigningButton !== null}
                          className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                            assigningButton === 'calibrate'
                              ? 'bg-indigo-500 text-white animate-pulse' 
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                       >
                          {assigningButton === 'calibrate' ? 'Press any controller button...' : 'Assign Calibrate'}
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </>
  );
}
