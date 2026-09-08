import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { CodeBlock, BlockType } from '../types';
import { Play, Square, RotateCcw, Plus, Trash2, BookOpen, Sparkles, Navigation, Box, ChevronUp, ChevronDown } from 'lucide-react';

const BLOCK_COLORS: Record<string, string> = {
  motion: 'bg-[#3b82f6] hover:bg-[#2563eb] text-white',
  action: 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white',
  control: 'bg-[#f59e0b] hover:bg-[#d97706] text-white',
  event: 'bg-[#10b981] hover:bg-[#059669] text-white'
};

interface BlockTemplate {
  type: BlockType;
  label: string;
  category: string;
  defaultVal: number;
  unit?: string;
  description: string;
}

const AVAILABLE_BLOCKS: BlockTemplate[] = [
  { type: 'when_run', label: 'When 🏁 clicked', category: 'event', defaultVal: 0, description: 'Start sequence' },
  { type: 'takeoff', label: 'Take Off', category: 'motion', defaultVal: 1.2, unit: 'm', description: 'Ascend to hover altitude' },
  { type: 'forward', label: 'Fly Forward (speed)', category: 'motion', defaultVal: 1.2, unit: 'm/s', description: 'Sets forward speed (use wait for distance)' },
  { type: 'backward', label: 'Fly Backward (speed)', category: 'motion', defaultVal: 1.2, unit: 'm/s', description: 'Sets backward speed (use wait for distance)' },
  { type: 'left', label: 'Fly Left (speed)', category: 'motion', defaultVal: 1.0, unit: 'm/s', description: 'Sets left strafe speed' },
  { type: 'right', label: 'Fly Right (speed)', category: 'motion', defaultVal: 1.0, unit: 'm/s', description: 'Sets right strafe speed' },
  { type: 'up', label: 'Fly Up (speed)', category: 'motion', defaultVal: 0.8, unit: 'm/s', description: 'Climb at vertical speed' },
  { type: 'down', label: 'Fly Down (speed)', category: 'motion', defaultVal: 0.8, unit: 'm/s', description: 'Descend at vertical speed' },
  { type: 'turn_left', label: 'Turn Left ↺', category: 'motion', defaultVal: 90, unit: 'deg', description: 'Rotate drone yaw left' },
  { type: 'turn_right', label: 'Turn Right ↻', category: 'motion', defaultVal: 90, unit: 'deg', description: 'Rotate drone yaw right' },
  { type: 'hover', label: 'Hover in Place', category: 'motion', defaultVal: 1.0, unit: 'sec', description: 'Brakes and hovers steadily' },
  { type: 'wait', label: 'Wait (duration)', category: 'control', defaultVal: 2.0, unit: 'sec', description: 'Maintains active speed to travel distance' },
  { type: 'scan_qr', label: 'Scan QR Pad', category: 'action', defaultVal: 0, description: 'Downward scanner checks QR pad' },
  { type: 'pickup_cargo', label: 'Pick Up Cargo', category: 'action', defaultVal: 0, description: 'Magnetic coupler grabs cargo crate' },
  { type: 'drop_cargo', label: 'Drop Cargo', category: 'action', defaultVal: 0, description: 'Releases cargo to ground target' },
  { type: 'land', label: 'Land Drone', category: 'motion', defaultVal: 0, description: 'Descends and cuts motors' },
];

export function BlocklyEditor() {
  const blocks = useStore(state => state.blocks);
  const addBlock = useStore(state => state.addBlock);
  const removeBlock = useStore(state => state.removeBlock);
  const moveBlock = useStore(state => state.moveBlock);
  const setBlocks = useStore(state => state.setBlocks);
  const isRunning = useStore(state => state.isRunning);
  const setIsRunning = useStore(state => state.setIsRunning);
  const resetDrone = useStore(state => state.resetDrone);
  const lastScannedQR = useStore(state => state.lastScannedQR);
  const hasCargo = useStore(state => state.hasCargo);
  const autoVelocity = useStore(state => state.autoVelocity);
  const autonomousTrackType = useStore(state => state.autonomousTrackType);
  const setAutonomousTrackType = useStore(state => state.setAutonomousTrackType);

  const [activeStep, setActiveStep] = useState(-1);

  const handleAddBlock = (template: BlockTemplate) => {
    addBlock({
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: template.type,
      value: template.defaultVal
    });
  };

  const loadPreset = (presetKey: 'qr_mission' | 'cargo_mission') => {
    if (isRunning) return;
    if (presetKey === 'qr_mission') {
      setAutonomousTrackType('qr_pad');
      setBlocks([
        { id: 'p1-1', type: 'when_run', value: 0 },
        { id: 'p1-2', type: 'takeoff', value: 1.2 },
        { id: 'p1-3', type: 'forward', value: 1.2 },
        { id: 'p1-4', type: 'wait', value: 2.5 },
        { id: 'p1-5', type: 'scan_qr', value: 0 },
        { id: 'p1-6', type: 'turn_right', value: 90 },
        { id: 'p1-7', type: 'forward', value: 1.2 },
        { id: 'p1-8', type: 'wait', value: 3.3 },
        { id: 'p1-9', type: 'scan_qr', value: 0 },
        { id: 'p1-10', type: 'turn_right', value: 90 },
        { id: 'p1-11', type: 'forward', value: 1.2 },
        { id: 'p1-12', type: 'wait', value: 2.5 },
        { id: 'p1-13', type: 'scan_qr', value: 0 },
        { id: 'p1-14', type: 'turn_right', value: 90 },
        { id: 'p1-15', type: 'forward', value: 1.2 },
        { id: 'p1-16', type: 'wait', value: 1.7 },
        { id: 'p1-17', type: 'land', value: 0 },
      ]);
    } else {
      setAutonomousTrackType('qr_pad');
      setBlocks([
        { id: 'p2-1', type: 'when_run', value: 0 },
        { id: 'p2-2', type: 'takeoff', value: 1.2 },
        { id: 'p2-3', type: 'forward', value: 1.2 },
        { id: 'p2-4', type: 'wait', value: 3.3 },
        { id: 'p2-5', type: 'turn_right', value: 90 },
        { id: 'p2-6', type: 'forward', value: 1.2 },
        { id: 'p2-7', type: 'wait', value: 1.7 },
        { id: 'p2-8', type: 'pickup_cargo', value: 0 },
        { id: 'p2-9', type: 'forward', value: 1.2 },
        { id: 'p2-10', type: 'wait', value: 1.7 },
        { id: 'p2-11', type: 'turn_right', value: 90 },
        { id: 'p2-12', type: 'forward', value: 1.2 },
        { id: 'p2-13', type: 'wait', value: 3.3 },
        { id: 'p2-14', type: 'turn_right', value: 90 },
        { id: 'p2-15', type: 'forward', value: 1.2 },
        { id: 'p2-16', type: 'wait', value: 1.7 },
        { id: 'p2-17', type: 'drop_cargo', value: 0 },
        { id: 'p2-18', type: 'land', value: 0 },
      ]);
    }
  };

  const executeBlock = async (block: CodeBlock, nextBlock?: CodeBlock) => {
    return new Promise<void>((resolve) => {
      const state = useStore.getState();
      const rot = state.targetRotation;
      const setAutoVelocity = useStore.getState().setAutoVelocity;
      const setTargetRotation = useStore.getState().setTargetRotation;
      const setIsFlying = useStore.getState().setIsFlying;
      const setLastScannedQR = useStore.getState().setLastScannedQR;
      const setHasCargo = useStore.getState().setHasCargo;
      const setCargoDroppedPosition = useStore.getState().setCargoDroppedPosition;

      switch (block.type) {
        case 'when_run':
          setLastScannedQR('🚀 Autonomous flight sequence initiated...');
          setTimeout(resolve, 350);
          break;

        case 'takeoff': {
          const targetAlt = block.value && block.value > 0 ? block.value : 1.2;
          setIsFlying(true);
          useStore.getState().setTargetAltitude(targetAlt);
          setLastScannedQR(`🛫 Taking off: Climbing to ${targetAlt.toFixed(1)}m...`);
          const startT = Date.now();
          const checkT = setInterval(() => {
            const curY = useStore.getState().targetPosition[1];
            if (curY >= targetAlt - 0.15 || Date.now() - startT > 2200 || !useStore.getState().isRunning) {
              clearInterval(checkT);
              setLastScannedQR(`Hovering steadily at ${targetAlt.toFixed(1)}m`);
              resolve();
            }
          }, 60);
          break;
        }

        case 'land': {
          setLastScannedQR('🛬 Landing drone smoothly...');
          useStore.getState().setAutoVelocity({ forward: 0, right: 0, up: 0 });
          useStore.getState().setTargetAltitude(0);
          const startT = Date.now();
          const checkT = setInterval(() => {
            const curY = useStore.getState().targetPosition[1];
            if (curY <= 0.08 || Date.now() - startT > 2800 || !useStore.getState().isRunning) {
              clearInterval(checkT);
              setIsFlying(false);
              setLastScannedQR('Drone safely landed on ground/pad');
              resolve();
            }
          }, 60);
          break;
        }

        case 'forward': {
          const speed = block.value || 1.2;
          setAutoVelocity({ forward: speed, right: 0, up: 0 });
          setLastScannedQR(`⚡ Flying Forward at speed ${speed.toFixed(1)} m/s`);
          if (nextBlock && nextBlock.type === 'wait') {
            // Speed initiated; wait block will sustain it for exact duration
            setTimeout(resolve, 120);
          } else {
            // Default 1.5s flight burst if no wait block
            setTimeout(() => {
              setAutoVelocity({ forward: 0, right: 0, up: 0 });
              resolve();
            }, 1500);
          }
          break;
        }

        case 'backward': {
          const speed = block.value || 1.2;
          setAutoVelocity({ forward: -speed, right: 0, up: 0 });
          setLastScannedQR(`⚡ Flying Backward at speed ${speed.toFixed(1)} m/s`);
          if (nextBlock && nextBlock.type === 'wait') {
            setTimeout(resolve, 120);
          } else {
            setTimeout(() => {
              setAutoVelocity({ forward: 0, right: 0, up: 0 });
              resolve();
            }, 1500);
          }
          break;
        }

        case 'left': {
          const speed = block.value || 1.0;
          setAutoVelocity({ forward: 0, right: -speed, up: 0 });
          setLastScannedQR(`⚡ Strafing Left at speed ${speed.toFixed(1)} m/s`);
          if (nextBlock && nextBlock.type === 'wait') {
            setTimeout(resolve, 120);
          } else {
            setTimeout(() => {
              setAutoVelocity({ forward: 0, right: 0, up: 0 });
              resolve();
            }, 1500);
          }
          break;
        }

        case 'right': {
          const speed = block.value || 1.0;
          setAutoVelocity({ forward: 0, right: speed, up: 0 });
          setLastScannedQR(`⚡ Strafing Right at speed ${speed.toFixed(1)} m/s`);
          if (nextBlock && nextBlock.type === 'wait') {
            setTimeout(resolve, 120);
          } else {
            setTimeout(() => {
              setAutoVelocity({ forward: 0, right: 0, up: 0 });
              resolve();
            }, 1500);
          }
          break;
        }

        case 'up': {
          const deltaAlt = block.value || 0.6;
          const currentAlt = useStore.getState().targetAltitude || 1.2;
          const newAlt = currentAlt + deltaAlt;
          useStore.getState().setTargetAltitude(newAlt);
          setLastScannedQR(`Ascending to ${newAlt.toFixed(1)}m...`);
          setTimeout(resolve, 1000);
          break;
        }

        case 'down': {
          const deltaAlt = block.value || 0.6;
          const currentAlt = useStore.getState().targetAltitude || 1.2;
          const newAlt = Math.max(0.3, currentAlt - deltaAlt);
          useStore.getState().setTargetAltitude(newAlt);
          setLastScannedQR(`Descending to ${newAlt.toFixed(1)}m...`);
          setTimeout(resolve, 1000);
          break;
        }

        case 'turn_left': {
          useStore.getState().setAutoVelocity({ forward: 0, right: 0, up: 0 });
          const rad = ((block.value || 90) * Math.PI) / 180;
          setTargetRotation([rot[0], rot[1] + rad, rot[2]]);
          setLastScannedQR(`↺ Turning Left by ${block.value || 90}°`);
          setTimeout(resolve, 1100);
          break;
        }

        case 'turn_right': {
          useStore.getState().setAutoVelocity({ forward: 0, right: 0, up: 0 });
          const rad = ((block.value || 90) * Math.PI) / 180;
          setTargetRotation([rot[0], rot[1] - rad, rot[2]]);
          setLastScannedQR(`↻ Turning Right by ${block.value || 90}°`);
          setTimeout(resolve, 1100);
          break;
        }

        case 'hover': {
          setAutoVelocity({ forward: 0, right: 0, up: 0 });
          const duration = block.value || 1.0;
          setLastScannedQR(`Hovering in fixed position for ${duration.toFixed(1)}s...`);
          setTimeout(resolve, duration * 1000);
          break;
        }

        case 'wait': {
          const waitTime = Math.max(0.2, block.value || 1.5);
          setLastScannedQR(`⏱️ Sustaining flight for ${waitTime.toFixed(1)}s (determining distance)`);
          setTimeout(() => {
            // When wait finishes, if next block is not another motion block, smooth stop
            if (!nextBlock || !['forward', 'backward', 'left', 'right'].includes(nextBlock.type)) {
              setAutoVelocity({ forward: 0, right: 0, up: 0 });
            }
            resolve();
          }, waitTime * 1000);
          break;
        }

        case 'scan_qr': {
          setAutoVelocity({ forward: 0, right: 0, up: 0 });
          const curPos = useStore.getState().targetPosition;
          const trackType = useStore.getState().autonomousTrackType;
          let scannedMessage = '⚠️ No QR code in range (<1.8m)';
          
          if (trackType === 'qr_pad') {
            const pads = [
              { name: 'QR Pad 1 (Waypoint Alpha)', pos: [-2, -1] },
              { name: 'QR Pad 2 (Waypoint Bravo)', pos: [2, -1] },
              { name: 'QR Pad 3 (Waypoint Charlie)', pos: [2, 2] },
            ];
            for (const pad of pads) {
              const dist = Math.hypot(curPos[0] - pad.pos[0], curPos[2] - pad.pos[1]);
              if (dist <= 1.8) {
                scannedMessage = `📷 Scanned: ${pad.name} [Dist: ${dist.toFixed(2)}m]`;
                break;
              }
            }
          } else {
            const customEls = useStore.getState().customTrackElements;
            for (const el of customEls) {
              if (['qr_pad_1', 'qr_pad_2', 'qr_pad_3'].includes(el.type)) {
                const dist = Math.hypot(curPos[0] - el.x, curPos[2] - el.z);
                if (dist <= 1.8) {
                  const label = el.type === 'qr_pad_1' ? 'QR Pad 1' : el.type === 'qr_pad_2' ? 'QR Pad 2' : 'QR Pad 3';
                  scannedMessage = `📷 Scanned: ${label} [Dist: ${dist.toFixed(2)}m]`;
                  break;
                }
              }
            }
          }

          setLastScannedQR(scannedMessage);
          setTimeout(resolve, 1400);
          break;
        }

        case 'pickup_cargo': {
          setAutoVelocity({ forward: 0, right: 0, up: 0 });
          const curPos = useStore.getState().targetPosition;
          const trackType = useStore.getState().autonomousTrackType;
          let stationPos = [0, -2];
          
          if (trackType === 'custom') {
            const gantry = useStore.getState().customTrackElements.find(e => e.type === 'cargo_station');
            if (gantry) stationPos = [gantry.x, gantry.z];
          }

          const dist = Math.hypot(curPos[0] - stationPos[0], curPos[2] - stationPos[1]);
          if (dist <= 2.2) {
            setHasCargo(true);
            setCargoDroppedPosition(null);
            setLastScannedQR('📦 Magnetic Coupler Engaged: Cargo Secured!');
          } else {
            setLastScannedQR(`⚠️ Pickup Failed: Drone is ${dist.toFixed(1)}m away (Needs <2.2m)`);
          }
          setTimeout(resolve, 1200);
          break;
        }

        case 'drop_cargo': {
          setAutoVelocity({ forward: 0, right: 0, up: 0 });
          const curPos = useStore.getState().targetPosition;
          if (useStore.getState().hasCargo) {
            setHasCargo(false);
            setCargoDroppedPosition([curPos[0], 0.05, curPos[2]]);
            setLastScannedQR(`📦 Cargo Dropped at [X: ${curPos[0].toFixed(1)}, Z: ${curPos[2].toFixed(1)}]`);
          } else {
            setLastScannedQR('⚠️ Drop Failed: No cargo currently attached');
          }
          setTimeout(resolve, 1000);
          break;
        }

        default:
          setTimeout(resolve, 200);
      }
    });
  };

  const handleRunCode = async () => {
    if (isRunning) return;
    if (blocks.length === 0) {
      loadPreset('qr_mission');
      return;
    }

    // 1. Reset drone to start position & clear previous status first
    resetDrone();
    
    // 2. Allow drone to reset starting point on pad
    await new Promise(r => setTimeout(r, 300));

    // 3. Mark sequence as running (after resetDrone so isRunning isn't cleared!)
    setIsRunning(true);
    
    // 4. Sequential execution of each block
    for (let i = 0; i < blocks.length; i++) {
       if (!useStore.getState().isRunning || useStore.getState().health <= 0) break;
       setActiveStep(i);
       const block = blocks[i];
       const nextBlock = blocks[i + 1];
       
       await executeBlock(block, nextBlock);
       
       if (!useStore.getState().isRunning) break;
       await new Promise(r => setTimeout(r, 200));
    }
    
    useStore.getState().setAutoVelocity({ forward: 0, right: 0, up: 0 });
    setActiveStep(-1);
    setIsRunning(false);
  };
  
  const handleStop = () => {
     useStore.getState().setAutoVelocity({ forward: 0, right: 0, up: 0 });
     setIsRunning(false);
     setActiveStep(-1);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 text-slate-100 border-l border-slate-800">
      {/* Top Header & Track Selector */}
      <div className="p-3 border-b border-slate-800 bg-slate-950 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h2 className="font-bold text-sm tracking-wide text-slate-200 uppercase">
              Autonomous Logic
            </h2>
          </div>
          <div className="flex gap-2">
            {!isRunning ? (
              <button 
                onClick={handleRunCode}
                disabled={blocks.length === 0}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95 disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Run Sequence
              </button>
            ) : (
              <button 
                onClick={handleStop}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> Stop
              </button>
            )}
            <button 
              onClick={() => { resetDrone(); setActiveStep(-1); }}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>

        {/* Track Type & Mission Presets */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setAutonomousTrackType('qr_pad')}
              className={`px-2.5 py-1 rounded-md transition-colors ${autonomousTrackType === 'qr_pad' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              QR Pad Track
            </button>
            <button
              onClick={() => setAutonomousTrackType('custom')}
              className={`px-2.5 py-1 rounded-md transition-colors ${autonomousTrackType === 'custom' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              Custom Track
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Presets:</span>
            <button
              onClick={() => loadPreset('qr_mission')}
              disabled={isRunning}
              className="text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
            >
              QR
            </button>
            <button
              onClick={() => loadPreset('cargo_mission')}
              disabled={isRunning}
              className="text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
            >
              Cargo
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Available Block Palette */}
        <div className="w-52 bg-slate-950 border-r border-slate-800 p-2.5 overflow-y-auto">
          <div className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center justify-between">
            <span>Palette</span>
            <span className="text-[10px] text-slate-600">Click to add</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {AVAILABLE_BLOCKS.map(block => (
              <button
                key={block.type}
                onClick={() => handleAddBlock(block)}
                title={block.description}
                className={`group flex items-center justify-between px-2.5 py-2 text-xs text-left rounded-lg shadow-sm transition-transform hover:scale-[1.02] active:scale-95 ${BLOCK_COLORS[block.category]}`}
              >
                <span className="truncate pr-1 font-medium">{block.label}</span>
                <Plus className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Workspace Sequence */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-900/60 flex flex-col justify-between">
          {blocks.length === 0 ? (
            <div className="my-auto flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl p-8 text-center text-xs">
              <Sparkles className="w-6 h-6 text-slate-600 mb-2 animate-bounce" />
              Click blocks on the left palette to build your autonomous mission sequence.<br/>
              Or load a Preset above for a one-click flight program!
            </div>
          ) : (
            <div className="flex flex-col items-center py-2">
              {blocks.map((block, index) => {
                const template = AVAILABLE_BLOCKS.find(b => b.type === block.type) || AVAILABLE_BLOCKS[0];
                const isActive = index === activeStep;
                const hasValue = ['takeoff', 'forward', 'backward', 'left', 'right', 'up', 'down', 'turn_left', 'turn_right', 'hover', 'wait'].includes(block.type);

                return (
                  <div key={block.id} className="relative flex flex-col items-center group w-full max-w-[360px]">
                    {index > 0 && <div className="w-0.5 h-3 bg-slate-700" />}
                    
                    <div className={`
                      w-full flex items-center justify-between gap-2 px-3 py-2.5 shadow-md rounded-xl
                      ${BLOCK_COLORS[template.category]}
                      ${isActive ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-slate-900 scale-105 shadow-yellow-500/30' : ''}
                      transition-all
                    `}>
                      <div className="flex items-center gap-2 min-w-0">
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-white animate-ping flex-shrink-0" />
                        )}
                        <span className="text-xs font-semibold truncate">
                          {template.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {hasValue && (
                          <div className="flex items-center bg-black/30 rounded-lg px-2 py-0.5 border border-white/10">
                            <input 
                              type="number"
                              value={block.value}
                              onChange={(e) => {
                                 const newBlocks = [...blocks];
                                 newBlocks[index].value = Number(e.target.value);
                                 setBlocks(newBlocks);
                              }}
                              className="w-12 bg-transparent text-white font-mono text-xs text-center focus:outline-none"
                              min={0.1}
                              step={block.type.startsWith('turn') ? 15 : 0.5}
                              disabled={isRunning}
                            />
                            {template.unit && (
                              <span className="text-[10px] text-white/70 font-mono pl-1">
                                {template.unit}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          {index > 0 && (
                            <button
                              onClick={() => moveBlock(block.id, -1)}
                              disabled={isRunning}
                              className="text-white/80 hover:text-white p-1 rounded hover:bg-black/25 transition-colors disabled:opacity-0"
                              title="Move block up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {index < blocks.length - 1 && (
                            <button
                              onClick={() => moveBlock(block.id, 1)}
                              disabled={isRunning}
                              className="text-white/80 hover:text-white p-1 rounded hover:bg-black/25 transition-colors disabled:opacity-0"
                              title="Move block down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={() => removeBlock(block.id)}
                            disabled={isRunning}
                            className="text-white/80 hover:text-rose-300 p-1 rounded hover:bg-black/25 transition-colors disabled:opacity-0"
                            title="Remove block"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Autonomous Real-Time Console & Telemetry */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/90 text-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Navigation className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span className="text-slate-400 font-mono truncate">
            {lastScannedQR || 'Standby. Click Run Sequence to start.'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono flex-shrink-0">
          <span>Spd: {Math.hypot(autoVelocity.forward, autoVelocity.right).toFixed(1)}m/s</span>
          <span className="flex items-center gap-1">
            <Box className="w-3 h-3 text-emerald-400" />
            {hasCargo ? 'Cargo: Loaded' : 'Cargo: Empty'}
          </span>
        </div>
      </div>
    </div>
  );
}
