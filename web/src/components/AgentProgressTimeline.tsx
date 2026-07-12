import { Check, Loader2 } from 'lucide-react';
import type { AgentStage } from '../types/job';

interface Props {
  stages: AgentStage[];
  currentProgress: number;
}

export function AgentProgressTimeline({ stages, currentProgress }: Props) {
  return (
    <div className="flex flex-col gap-0">
      <div className="mb-6">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${currentProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-1 text-right">{currentProgress}%</p>
      </div>

      {stages.map((stage, i) => (
        <div key={stage.name} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 ${
              stage.status === 'completed' ? 'bg-green-500 border-green-500' :
              stage.status === 'active'    ? 'bg-blue-500 border-blue-500' :
              stage.status === 'failed'    ? 'bg-red-500 border-red-500' :
                                             'bg-white border-gray-300'
            }`}>
              {stage.status === 'completed' && <Check className="w-4 h-4 text-white" />}
              {stage.status === 'active' && <Loader2 className="w-4 h-4 text-white animate-spin" />}
              {(stage.status === 'pending' || stage.status === 'failed') && (
                <span className={`text-xs font-bold ${stage.status === 'failed' ? 'text-white' : 'text-gray-400'}`}>
                  {i + 1}
                </span>
              )}
            </div>
            {i < stages.length - 1 && (
              <div className={`w-0.5 h-12 mt-1 ${stage.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'}`} />
            )}
          </div>

          <div className="pb-8">
            <p className={`font-semibold text-sm ${
              stage.status === 'pending' ? 'text-gray-400' :
              stage.status === 'failed'  ? 'text-red-600' :
                                           'text-gray-900'
            }`}>
              {stage.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {stage.steps.map(s => s.replace(/_/g, ' ')).join(' · ')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
