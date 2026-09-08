export type AppMode = 'manual' | 'autonomous';

export type PilotTrackType = 'slalom' | 'precision_rings' | 'target_shooting';
export type DroneSpeedMode = 'slow' | 'normal' | 'fast';
export type AutonomousTrackType = 'qr_pad' | 'custom';

export type TrackElementType = 
  | 'start_pad' 
  | 'qr_pad_1' 
  | 'qr_pad_2' 
  | 'qr_pad_3' 
  | 'landing_pad' 
  | 'cargo_station';

export interface TrackElement {
  id: string;
  type: TrackElementType;
  label: string;
  x: number;
  z: number;
}

export type BlockType = 
  | 'when_run'
  | 'takeoff' 
  | 'land' 
  | 'forward' 
  | 'backward' 
  | 'left' 
  | 'right' 
  | 'up' 
  | 'down' 
  | 'turn_left'
  | 'turn_right'
  | 'hover'
  | 'wait'
  | 'repeat'
  | 'scan_qr' 
  | 'pickup_cargo'
  | 'drop_cargo';

export interface CodeBlock {
  id: string;
  type: BlockType;
  value: number; // Represents distance, duration, or speed
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Analytics {
  flightTime: number;
  accuracy: number;
  commandsExecuted: number;
  crashes: number;
  checkpointsCleared: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  time: number;
  accuracy: number;
  mode: AppMode;
}

export interface GamepadMapping {
  takeoff: number | null;
  reset: number | null;
  calibrate: number | null;
  laser: number | null;
  shoot: number | null;
}
