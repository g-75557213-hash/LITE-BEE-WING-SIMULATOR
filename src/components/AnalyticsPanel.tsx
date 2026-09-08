import React from 'react';
import { useStore } from '../store/useStore';
import { Activity, Clock, Target, AlertTriangle, Trophy } from 'lucide-react';

export function AnalyticsPanel() {
  const analytics = useStore(state => state.analytics);
  const leaderboard = useStore(state => state.leaderboard);
  const mode = useStore(state => state.mode);

  return (
    <div className="h-full bg-white border-l border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Performance Analytics
        </h2>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4 border-b border-slate-200">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-center justify-center text-center">
           <Clock className="w-5 h-5 text-slate-400 mb-1" />
           <div className="text-2xl font-bold text-slate-700">{analytics.flightTime.toFixed(1)}s</div>
           <div className="text-xs text-slate-500">Flight Time</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-center justify-center text-center">
           <Target className="w-5 h-5 text-emerald-400 mb-1" />
           <div className="text-2xl font-bold text-slate-700">{analytics.accuracy}%</div>
           <div className="text-xs text-slate-500">Accuracy</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-center justify-center text-center">
           <Trophy className="w-5 h-5 text-yellow-400 mb-1" />
           <div className="text-2xl font-bold text-slate-700">{analytics.checkpointsCleared}</div>
           <div className="text-xs text-slate-500">Checkpoints</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-center justify-center text-center">
           <AlertTriangle className="w-5 h-5 text-red-400 mb-1" />
           <div className="text-2xl font-bold text-slate-700">{analytics.crashes}</div>
           <div className="text-xs text-slate-500">Crashes</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-yellow-500" />
          Leaderboard
        </h3>
        
        <div className="flex flex-col gap-2">
          {leaderboard.map((entry, idx) => (
            <div key={entry.id} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                  ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-600' : 'bg-slate-300'}
                `}>
                  {idx + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-700">{entry.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{entry.mode}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-700">{entry.time}s</div>
                <div className="text-xs text-emerald-500">{entry.accuracy}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
