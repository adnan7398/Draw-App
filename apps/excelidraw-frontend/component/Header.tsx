import { PenLine, Users, Brain, Sparkles } from "lucide-react";

interface HeaderProps {
  roomId: string;
  isConnected: boolean;
  participantCount: number;
  showAIPanel: boolean;
  showQuickTips: boolean;
  onToggleAIPanel: () => void;
  onToggleQuickTips: () => void;
}

export function Header({
  roomId,
  isConnected,
  participantCount,
  showAIPanel,
  showQuickTips,
  onToggleAIPanel,
  onToggleQuickTips
}: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-3 py-2 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
              <PenLine className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-semibold text-gray-900">Draw-App</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-600 text-xs font-medium">
              Room: {roomId}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-gray-600 text-xs">
            <Users size={14} />
            <span>{participantCount}</span>
          </div>
          <button
            onClick={onToggleAIPanel}
            className={`p-1.5 rounded transition-all duration-200 ${
              showAIPanel 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="AI Tools"
          >
            <Brain size={16} />
          </button>
          <button
            onClick={onToggleQuickTips}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-all duration-200"
            title="Quick Tips"
          >
            <Sparkles size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
