import React from 'react';
import { useStore } from './store/useStore';
import { SimulatorView } from './components/SimulatorView';
import { BlocklyEditor } from './components/BlocklyEditor';
import { InstructionsPanel } from './components/InstructionsPanel';
import { Plane, Gamepad2, Code2, PanelRightClose, PanelRightOpen } from 'lucide-react';

export default function App() {
  const mode = useStore(state => state.mode);
  const setMode = useStore(state => state.setMode);
  const isSidebarOpen = useStore(state => state.isSidebarOpen);
  const toggleSidebar = useStore(state => state.toggleSidebar);

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Gamified Header */}
      <header className="h-16 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 flex items-center justify-between px-6 shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-inner">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-wide drop-shadow-sm">
            LITEBEE <span className="font-medium opacity-90">WING SIMULATOR</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex bg-slate-900/40 backdrop-blur p-1.5 rounded-xl border border-white/10 shadow-inner">
              <button
                onClick={() => setMode('manual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                  mode === 'manual' 
                    ? 'bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-md transform scale-[1.02]' 
                    : 'text-indigo-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
                PILOT MODE
              </button>
              <button
                onClick={() => setMode('autonomous')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                  mode === 'autonomous' 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md transform scale-[1.02]' 
                    : 'text-indigo-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <Code2 className="w-4 h-4" />
                AUTONOMOUS MODE
              </button>
            </div>
            
            <button 
              onClick={toggleSidebar}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all shadow-sm"
              title={isSidebarOpen ? "Hide Panel" : "Show Panel"}
            >
                {isSidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {mode === 'manual' ? (
          <div className="flex-1 flex w-full h-full">
            {/* Simulator Full Area */}
            <div className={`transition-all duration-500 ease-in-out p-4 flex flex-col gap-4 ${isSidebarOpen ? 'w-[calc(100%-24rem)]' : 'w-full'}`}>
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
                  <SimulatorView />
              </div>
            </div>
            {/* Instructions Sidebar - Collapsible */}
            <div 
                className={`absolute right-0 top-0 h-full w-96 bg-white border-l border-slate-200 shadow-2xl transition-transform duration-500 ease-in-out z-10 ${
                    isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
              <InstructionsPanel />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex w-full h-full">
            {/* Left side: Simulator */}
            <div className={`transition-all duration-500 ease-in-out p-4 flex flex-col gap-4 ${isSidebarOpen ? 'w-1/2' : 'w-full'}`}>
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
                  <SimulatorView />
              </div>
            </div>
            {/* Right side: Blockly */}
            <div 
                className={`absolute right-0 top-0 h-full w-1/2 bg-white shadow-2xl z-10 border-l border-slate-200 transition-transform duration-500 ease-in-out ${
                    isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
              <BlocklyEditor />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
