import { create } from 'zustand';
import { AppMode, CodeBlock, Analytics, PilotTrackType, AutonomousTrackType, TrackElement, DroneSpeedMode, GamepadMapping } from '../types';

export type CameraView = 'tpp' | 'free';

export const DEFAULT_CUSTOM_TRACK_ELEMENTS: TrackElement[] = [
  { id: 'elem-start', type: 'start_pad', label: 'Starting Pad', x: -3, z: 3 },
  { id: 'elem-qr1', type: 'qr_pad_1', label: 'QR Pad 1', x: -3, z: -1 },
  { id: 'elem-cargo', type: 'cargo_station', label: 'Chains for Cargo', x: 0, z: -3 },
  { id: 'elem-qr2', type: 'qr_pad_2', label: 'QR Pad 2', x: 3, z: -1 },
  { id: 'elem-qr3', type: 'qr_pad_3', label: 'QR Pad 3', x: 3, z: 2 },
  { id: 'elem-land', type: 'landing_pad', label: 'Landing Pad', x: 0, z: 3 },
];

function getStartingCoordinates(
  mode: AppMode,
  pilotTrackType: PilotTrackType,
  autonomousTrackType: AutonomousTrackType,
  customElements: TrackElement[]
): [number, number, number] {
  if (mode === 'manual') {
    if (pilotTrackType === 'target_shooting') {
      return [0, 0, 5.5];
    }
    return [-4, 0, 6];
  }
  if (autonomousTrackType === 'custom') {
    const startElem = customElements.find(e => e.type === 'start_pad');
    return startElem ? [startElem.x, 0, startElem.z] : [-3, 0, 3];
  }
  return [-2, 0, 2];
}

interface AppState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  
  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isTrackDesignerOpen: boolean;
  setIsTrackDesignerOpen: (open: boolean) => void;
  
  // Camera State
  cameraView: CameraView;
  setCameraView: (view: CameraView) => void;
  
  // Drone State
  targetPosition: [number, number, number];
  targetRotation: [number, number, number];
  setTargetPosition: (pos: [number, number, number] | ((prev: [number, number, number]) => [number, number, number])) => void;
  setTargetRotation: (rot: [number, number, number] | ((prev: [number, number, number]) => [number, number, number])) => void;
  isFlying: boolean;
  setIsFlying: (isFlying: boolean) => void;
  health: number;
  setHealth: (health: number) => void;
  resetSignal: number;
  resetDrone: () => void;

  // Speed Mode (Pilot sensitivity & speed control)
  speedMode: DroneSpeedMode;
  setSpeedMode: (mode: DroneSpeedMode) => void;

  // Laser Sight & Shooting
  isLaserEnabled: boolean;
  setIsLaserEnabled: (enabled: boolean) => void;
  toggleLaser: () => void;
  shootSignal: number;
  triggerShoot: () => void;
  shootingScore: number;
  shotsFired: number;
  targetsHit: number;
  bullseyeHits: number;
  recordHit: (points: number, isBullseye: boolean) => void;
  resetShootingStats: () => void;
  
  // Autonomous Motion Dynamics (Smooth & Continuous LiteBee Wing)
  targetAltitude: number;
  setTargetAltitude: (alt: number) => void;
  autoVelocity: { forward: number; right: number; up: number };
  setAutoVelocity: (vel: { forward: number; right: number; up: number }) => void;

  // Cargo & Mission State
  hasCargo: boolean;
  setHasCargo: (has: boolean) => void;
  cargoDroppedPosition: [number, number, number] | null;
  setCargoDroppedPosition: (pos: [number, number, number] | null) => void;
  lastScannedQR: string | null;
  setLastScannedQR: (qr: string | null) => void;
  notification: string | null;
  showNotification: (msg: string) => void;

  // Coding State
  blocks: CodeBlock[];
  addBlock: (block: CodeBlock) => void;
  removeBlock: (id: string) => void;
  moveBlock: (id: string, direction: -1 | 1) => void;
  setBlocks: (blocks: CodeBlock[]) => void;
  isRunning: boolean;
  setIsRunning: (isRunning: boolean) => void;
  
  // Analytics
  analytics: Analytics;
  updateAnalytics: (data: Partial<Analytics>) => void;
  leaderboard: import('../types').LeaderboardEntry[];
  
  // Gamepad & Controls
  controlMode: 1 | 2;
  setControlMode: (mode: 1 | 2) => void;
  gamepadMapping: GamepadMapping;
  setGamepadMapping: (mapping: GamepadMapping) => void;
  isCalibrating: boolean;
  setIsCalibrating: (calibrating: boolean) => void;

  // Independent Track Settings
  pilotTrackType: PilotTrackType;
  setPilotTrackType: (type: PilotTrackType) => void;
  clearedRings: number[];
  clearRing: (ringId: number) => void;
  resetRings: () => void;
  autonomousTrackType: AutonomousTrackType;
  setAutonomousTrackType: (type: AutonomousTrackType) => void;
  customTrackElements: TrackElement[];
  updateCustomTrackElement: (id: string, x: number, z: number) => void;
  resetCustomTrackElements: () => void;
  setCustomTrackPreset: (preset: 'standard' | 'linear' | 'triangle') => void;
}

export const useStore = create<AppState>((set, get) => ({
  mode: 'manual',
  setMode: (mode) => {
    const state = get();
    const startPos = getStartingCoordinates(mode, state.pilotTrackType, state.autonomousTrackType, state.customTrackElements);
    set({
      mode,
      isRunning: false,
      isFlying: false,
      targetPosition: startPos,
      targetRotation: [0, 0, 0],
      autoVelocity: { forward: 0, right: 0, up: 0 },
      health: 100,
      resetSignal: state.resetSignal + 1
    });
  },
  
  isSidebarOpen: true,
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
  isTrackDesignerOpen: false,
  setIsTrackDesignerOpen: (isTrackDesignerOpen) => set({ isTrackDesignerOpen }),

  cameraView: 'tpp',
  setCameraView: (cameraView) => set({ cameraView }),
  
  targetPosition: [-4, 0, 6],
  targetRotation: [0, 0, 0],
  setTargetPosition: (pos) => set((state) => ({ 
    targetPosition: typeof pos === 'function' ? pos(state.targetPosition) : pos 
  })),
  setTargetRotation: (rot) => set((state) => ({ 
    targetRotation: typeof rot === 'function' ? rot(state.targetRotation) : rot 
  })),
  isFlying: false,
  setIsFlying: (isFlying) => set({ isFlying }),
  health: 100,
  setHealth: (health) => set({ health }),

  // Speed Mode
  speedMode: 'normal',
  setSpeedMode: (speedMode) => set({ speedMode }),

  // Laser Sight & Shooting
  isLaserEnabled: true,
  setIsLaserEnabled: (isLaserEnabled) => set({ isLaserEnabled }),
  toggleLaser: () => set(state => ({ isLaserEnabled: !state.isLaserEnabled })),
  shootSignal: 0,
  triggerShoot: () => set(state => ({ 
    shootSignal: state.shootSignal + 1,
    shotsFired: state.shotsFired + 1 
  })),
  shootingScore: 0,
  shotsFired: 0,
  targetsHit: 0,
  bullseyeHits: 0,
  recordHit: (points, isBullseye) => set(state => ({
    shootingScore: state.shootingScore + points,
    targetsHit: state.targetsHit + 1,
    bullseyeHits: isBullseye ? state.bullseyeHits + 1 : state.bullseyeHits
  })),
  resetShootingStats: () => set({
    shootingScore: 0,
    shotsFired: 0,
    targetsHit: 0,
    bullseyeHits: 0
  }),
  
  targetAltitude: 0,
  setTargetAltitude: (targetAltitude) => set({ targetAltitude }),
  autoVelocity: { forward: 0, right: 0, up: 0 },
  setAutoVelocity: (autoVelocity) => set({ autoVelocity }),

  resetSignal: 0,
  resetDrone: () => set(state => {
    const startPos = getStartingCoordinates(state.mode, state.pilotTrackType, state.autonomousTrackType, state.customTrackElements);
    return { 
      targetPosition: startPos, 
      targetRotation: [0, 0, 0], 
      targetAltitude: 0,
      hasCargo: false, 
      cargoDroppedPosition: null,
      lastScannedQR: null, 
      health: 100, 
      isFlying: false,
      isRunning: false,
      autoVelocity: { forward: 0, right: 0, up: 0 },
      clearedRings: [],
      resetSignal: state.resetSignal + 1
    };
  }),
  
  hasCargo: false,
  setHasCargo: (hasCargo) => set({ hasCargo }),
  cargoDroppedPosition: null,
  setCargoDroppedPosition: (cargoDroppedPosition) => set({ cargoDroppedPosition }),
  lastScannedQR: null,
  setLastScannedQR: (lastScannedQR) => set({ lastScannedQR }),
  notification: null,
  showNotification: (msg: string) => {
    set({ notification: msg });
    setTimeout(() => {
      if (get().notification === msg) {
        set({ notification: null });
      }
    }, 3500);
  },

  blocks: [
    { id: 'b1', type: 'when_run', value: 0 },
    { id: 'b2', type: 'takeoff', value: 1.2 },
    { id: 'b3', type: 'forward', value: 1.2 },
    { id: 'b4', type: 'wait', value: 2.5 },
    { id: 'b5', type: 'scan_qr', value: 0 },
    { id: 'b6', type: 'turn_right', value: 90 },
    { id: 'b7', type: 'forward', value: 1.2 },
    { id: 'b8', type: 'wait', value: 3.3 },
    { id: 'b9', type: 'scan_qr', value: 0 },
    { id: 'b10', type: 'turn_right', value: 90 },
    { id: 'b11', type: 'forward', value: 1.2 },
    { id: 'b12', type: 'wait', value: 2.5 },
    { id: 'b13', type: 'scan_qr', value: 0 },
    { id: 'b14', type: 'turn_right', value: 90 },
    { id: 'b15', type: 'forward', value: 1.2 },
    { id: 'b16', type: 'wait', value: 1.7 },
    { id: 'b17', type: 'land', value: 0 },
  ],
  addBlock: (block) => set((state) => ({ blocks: [...state.blocks, block] })),
  removeBlock: (id) => set((state) => ({ blocks: state.blocks.filter(b => b.id !== id) })),
  moveBlock: (id, direction) => set((state) => {
    const index = state.blocks.findIndex(b => b.id === id);
    if (index === -1) return state;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= state.blocks.length) return state;
    const newBlocks = [...state.blocks];
    const [moved] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, moved);
    return { blocks: newBlocks };
  }),
  setBlocks: (blocks) => set({ blocks }),
  isRunning: false,
  setIsRunning: (isRunning) => set({ isRunning }),
  
  analytics: { flightTime: 0, accuracy: 100, commandsExecuted: 0, crashes: 0, checkpointsCleared: 0 },
  updateAnalytics: (data) => set((state) => ({ analytics: { ...state.analytics, ...data } })),
  leaderboard: [
    { id: '1', name: 'AlphaPilot', time: 45, accuracy: 98, mode: 'manual' },
    { id: '2', name: 'AutoDrone', time: 52, accuracy: 100, mode: 'autonomous' },
    { id: '3', name: 'SkyRacer', time: 55, accuracy: 95, mode: 'manual' }
  ],
  
  controlMode: 1,
  setControlMode: (controlMode) => set({ controlMode }),
  // Default mappings: takeoff: button 0 (A/Cross), reset: button 8 (Back/Select), calibrate: button 1 (B/Circle), laser: button 4 (LB/L1), shoot: button 5 (RB/R1)
  gamepadMapping: { takeoff: 0, reset: 8, calibrate: 1, laser: 4, shoot: 5 },
  setGamepadMapping: (mapping) => set({ gamepadMapping: mapping }),
  isCalibrating: false,
  setIsCalibrating: (isCalibrating) => set({ isCalibrating }),

  // Independent Tracks
  pilotTrackType: 'slalom',
  setPilotTrackType: (pilotTrackType) => {
    set({ pilotTrackType, clearedRings: [] });
    get().resetDrone();
  },
  clearedRings: [],
  clearRing: (ringId) => set(state => {
    if (state.clearedRings.includes(ringId)) return state;
    return { clearedRings: [...state.clearedRings, ringId] };
  }),
  resetRings: () => set({ clearedRings: [] }),

  autonomousTrackType: 'qr_pad',
  setAutonomousTrackType: (autonomousTrackType) => {
    set({ autonomousTrackType });
    get().resetDrone();
  },

  customTrackElements: DEFAULT_CUSTOM_TRACK_ELEMENTS,
  updateCustomTrackElement: (id, x, z) => {
    set(state => {
      const updated = state.customTrackElements.map(elem => 
        elem.id === id ? { ...elem, x: Math.max(-6.5, Math.min(6.5, x)), z: Math.max(-6.5, Math.min(6.5, z)) } : elem
      );
      return { customTrackElements: updated };
    });
  },
  resetCustomTrackElements: () => set({ customTrackElements: DEFAULT_CUSTOM_TRACK_ELEMENTS }),
  setCustomTrackPreset: (preset) => {
    if (preset === 'standard') {
      set({ customTrackElements: DEFAULT_CUSTOM_TRACK_ELEMENTS });
    } else if (preset === 'linear') {
      set({
        customTrackElements: [
          { id: 'elem-start', type: 'start_pad', label: 'Starting Pad', x: -5, z: 0 },
          { id: 'elem-qr1', type: 'qr_pad_1', label: 'QR Pad 1', x: -2.5, z: 0 },
          { id: 'elem-cargo', type: 'cargo_station', label: 'Chains for Cargo', x: 0, z: 0 },
          { id: 'elem-qr2', type: 'qr_pad_2', label: 'QR Pad 2', x: 2, z: 0 },
          { id: 'elem-qr3', type: 'qr_pad_3', label: 'QR Pad 3', x: 3.8, z: 0 },
          { id: 'elem-land', type: 'landing_pad', label: 'Landing Pad', x: 5.2, z: 0 },
        ]
      });
    } else if (preset === 'triangle') {
      set({
        customTrackElements: [
          { id: 'elem-start', type: 'start_pad', label: 'Starting Pad', x: -4, z: -3 },
          { id: 'elem-qr1', type: 'qr_pad_1', label: 'QR Pad 1', x: -4, z: 3 },
          { id: 'elem-cargo', type: 'cargo_station', label: 'Chains for Cargo', x: 0, z: 4 },
          { id: 'elem-qr2', type: 'qr_pad_2', label: 'QR Pad 2', x: 4, z: 3 },
          { id: 'elem-qr3', type: 'qr_pad_3', label: 'QR Pad 3', x: 4, z: -3 },
          { id: 'elem-land', type: 'landing_pad', label: 'Landing Pad', x: 0, z: -3 },
        ]
      });
    }
    get().resetDrone();
  }
}));

