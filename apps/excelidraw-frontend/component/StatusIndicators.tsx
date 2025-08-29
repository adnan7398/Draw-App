interface StatusIndicatorsProps {
  isConnected: boolean;
  isPanning: boolean;
  liveAIShape: boolean;
  isConvertingShape: boolean;
}

export function StatusIndicators({ 
  isConnected, 
  isPanning, 
  liveAIShape, 
  isConvertingShape 
}: StatusIndicatorsProps) {
  return (
    <div className="absolute bottom-4 left-4">
      <div className="flex flex-col space-y-2">
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          isConnected 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        
        {/* Panning Hint */}
        <div className={`px-2 py-1 rounded text-xs font-medium border ${
          isPanning 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          {isPanning ? '🔄 Panning active' : '💡 Tap & drag to pan'}
        </div>
        
        {liveAIShape && (
          <div className={`px-2 py-1 rounded text-xs font-medium flex items-center space-x-2 ${
            isConvertingShape 
              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              isConvertingShape ? 'bg-blue-600 animate-pulse' : 'bg-green-600'
            }`}></div>
            <span>
              {isConvertingShape ? 'Converting...' : 'Live AI'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
