import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { X, RotateCcw, Check, Sparkles, Move, Anchor, QrCode, PlaneTakeoff, Flag, Box } from 'lucide-react';
import { TrackElement } from '../types';

export function CustomTrackDesigner() {
  const isTrackDesignerOpen = useStore(state => state.isTrackDesignerOpen);
  const setIsTrackDesignerOpen = useStore(state => state.setIsTrackDesignerOpen);
  const customTrackElements = useStore(state => state.customTrackElements);
  const updateCustomTrackElement = useStore(state => state.updateCustomTrackElement);
  const resetCustomTrackElements = useStore(state => state.resetCustomTrackElements);
  const setCustomTrackPreset = useStore(state => state.setCustomTrackPreset);
  const resetDrone = useStore(state => state.resetDrone);

  const [selectedId, setSelectedId] = useState<string>('elem-start');
  const [isDragging, setIsDragging] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  if (!isTrackDesignerOpen) return null;

  // Arena is 16m x 16m (-8 to +8)
  const ARENA_SPAN = 14; // Visible span from -7 to +7
  const clampVal = (val: number, min = 0.05, max = 0.95) => Math.max(min, Math.min(max, val));
  
  const toMapPercent = (coord: number) => {
    return ((coord + ARENA_SPAN / 2) / ARENA_SPAN) * 100;
  };

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelectedId(id);
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const px = clampVal((e.clientX - rect.left) / rect.width);
    const py = clampVal((e.clientY - rect.top) / rect.height);
    
    // Map percent to world coordinates (-7 to +7)
    // X is left-right, Z is top-bottom (so Y on screen is Z in 3D)
    const worldX = Math.round(((px * ARENA_SPAN) - ARENA_SPAN / 2) * 10) / 10;
    const worldZ = Math.round(((py * ARENA_SPAN) - ARENA_SPAN / 2) * 10) / 10;

    updateCustomTrackElement(selectedId, worldX, worldZ);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const px = clampVal((e.clientX - rect.left) / rect.width);
    const py = clampVal((e.clientY - rect.top) / rect.height);
    const worldX = Math.round(((px * ARENA_SPAN) - ARENA_SPAN / 2) * 10) / 10;
    const worldZ = Math.round(((py * ARENA_SPAN) - ARENA_SPAN / 2) * 10) / 10;
    updateCustomTrackElement(selectedId, worldX, worldZ);
  };

  const selectedElement = customTrackElements.find(e => e.id === selectedId) || customTrackElements[0];

  const getElementIcon = (type: TrackElement['type']) => {
    switch (type) {
      case 'start_pad': return <PlaneTakeoff className="w-4 h-4 text-red-500" />;
      case 'qr_pad_1': return <QrCode className="w-4 h-4 text-blue-500" />;
      case 'qr_pad_2': return <QrCode className="w-4 h-4 text-emerald-500" />;
      case 'qr_pad_3': return <QrCode className="w-4 h-4 text-amber-500" />;
      case 'cargo_station': return <Box className="w-4 h-4 text-purple-500" />;
      case 'landing_pad': return <Flag className="w-4 h-4 text-teal-500" />;
    }
  };

  const getElementColor = (type: TrackElement['type']) => {
    switch (type) {
      case 'start_pad': return 'bg-red-500 border-red-300 text-white';
      case 'qr_pad_1': return 'bg-blue-600 border-blue-300 text-white';
      case 'qr_pad_2': return 'bg-emerald-600 border-emerald-300 text-white';
      case 'qr_pad_3': return 'bg-amber-500 border-amber-300 text-white';
      case 'cargo_station': return 'bg-purple-600 border-purple-300 text-white';
      case 'landing_pad': return 'bg-teal-600 border-teal-300 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Move className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Autonomous Track Layout Designer</h2>
              <p className="text-xs text-purple-200">
                Drag pads on the 2D arena or adjust coordinates below to design your custom mission track.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsTrackDesignerOpen(false);
              resetDrone();
            }}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50">
          
          {/* Left Column: Interactive 2D Arena Canvas */}
          <div className="md:col-span-7 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
              <span>2D Flight Arena (14m × 14m Top-Down)</span>
              <span>Click or drag items to place</span>
            </div>

            <div 
              ref={mapRef}
              onClick={handleMapClick}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative w-full aspect-square bg-purple-950 rounded-2xl border-2 border-purple-800 overflow-hidden shadow-inner cursor-crosshair select-none touch-none"
              style={{
                backgroundImage: `
                  radial-gradient(circle at center, rgba(168, 85, 247, 0.15) 0, transparent 70%),
                  linear-gradient(to right, rgba(168, 85, 247, 0.2) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(168, 85, 247, 0.2) 1px, transparent 1px)
                `,
                backgroundSize: '100% 100%, 25px 25px, 25px 25px'
              }}
            >
              {/* Boundary Zone line */}
              <div className="absolute inset-[15%] border-2 border-dashed border-purple-500/40 rounded-xl pointer-events-none flex items-start justify-end p-1">
                <span className="text-[10px] text-purple-400 font-mono">Flight Boundary (8m)</span>
              </div>

              {/* Grid origin crosshair */}
              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-purple-600/30 pointer-events-none" />
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-purple-600/30 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] text-purple-400/50 font-mono pointer-events-none">
                (0,0)
              </div>

              {/* Placed Elements */}
              {customTrackElements.map((elem) => {
                const isSelected = elem.id === selectedId;
                const left = toMapPercent(elem.x);
                const top = toMapPercent(elem.z);

                return (
                  <div
                    key={elem.id}
                    onPointerDown={(e) => handlePointerDown(elem.id, e)}
                    style={{ left: `${left}%`, top: `${top}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing transition-transform ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
                    }`}
                  >
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 font-bold text-xs ${getElementColor(elem.type)} ${
                        isSelected ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-purple-950' : ''
                      }`}
                    >
                      {elem.type === 'start_pad' && '🏁'}
                      {elem.type === 'qr_pad_1' && '1'}
                      {elem.type === 'qr_pad_2' && '2'}
                      {elem.type === 'qr_pad_3' && '3'}
                      {elem.type === 'cargo_station' && '⛓️'}
                      {elem.type === 'landing_pad' && 'H'}
                    </div>
                    <span className="mt-1 px-1.5 py-0.5 bg-slate-900/80 text-white rounded text-[10px] font-mono whitespace-nowrap shadow pointer-events-none">
                      {elem.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Presets */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Presets:
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCustomTrackPreset('standard')}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 transition-colors"
                >
                  Standard Mission
                </button>
                <button
                  onClick={() => setCustomTrackPreset('linear')}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 transition-colors"
                >
                  Linear Sprint
                </button>
                <button
                  onClick={() => setCustomTrackPreset('triangle')}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 transition-colors"
                >
                  Triangle Circuit
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Element Properties & Direct Coordinates */}
          <div className="md:col-span-5 flex flex-col gap-4">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Track Elements</h3>
              
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {customTrackElements.map(elem => {
                  const isSelected = elem.id === selectedId;
                  return (
                    <button
                      key={elem.id}
                      onClick={() => setSelectedId(elem.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected 
                          ? 'bg-purple-50 border border-purple-300 text-purple-900 shadow-sm' 
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getElementIcon(elem.type)}
                        <span>{elem.label}</span>
                      </div>
                      <span className="font-mono text-slate-400">
                        X: {elem.x.toFixed(1)}m, Z: {elem.z.toFixed(1)}m
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Element Fine Adjustment */}
            {selectedElement && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  {getElementIcon(selectedElement.type)}
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{selectedElement.label}</h4>
                    <p className="text-[11px] text-slate-500">Fine-tune coordinates (meters)</p>
                  </div>
                </div>

                {/* X Coordinate Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-600">X Position (West - East)</span>
                    <span className="font-mono font-bold text-purple-600">{selectedElement.x.toFixed(1)} m</span>
                  </div>
                  <input
                    type="range"
                    min="-6.0"
                    max="6.0"
                    step="0.2"
                    value={selectedElement.x}
                    onChange={(e) => updateCustomTrackElement(selectedElement.id, parseFloat(e.target.value), selectedElement.z)}
                    className="w-full accent-purple-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>-6.0m</span>
                    <span>0.0m</span>
                    <span>+6.0m</span>
                  </div>
                </div>

                {/* Z Coordinate Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-600">Z Position (North - South)</span>
                    <span className="font-mono font-bold text-purple-600">{selectedElement.z.toFixed(1)} m</span>
                  </div>
                  <input
                    type="range"
                    min="-6.0"
                    max="6.0"
                    step="0.2"
                    value={selectedElement.z}
                    onChange={(e) => updateCustomTrackElement(selectedElement.id, selectedElement.x, parseFloat(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>-6.0m</span>
                    <span>0.0m</span>
                    <span>+6.0m</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-auto pt-2 flex gap-3">
              <button
                onClick={() => {
                  resetCustomTrackElements();
                  resetDrone();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Default
              </button>

              <button
                onClick={() => {
                  setIsTrackDesignerOpen(false);
                  resetDrone();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md hover:shadow transition-all"
              >
                <Check className="w-4 h-4" /> Apply & Fly
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

function THREE_CLAMP(val: number) {
  return Math.max(0, Math.min(1, val));
}
