import { Brain, X, Sparkles } from "lucide-react";
import { AIToolsState } from "./types";

interface AIPanelProps {
  aiToolsState: AIToolsState;
  onShowAIPanel: (show: boolean) => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRunAIAnalysis: () => void;
  onSuggestDiagram: () => void;
  onEnableLiveAI: () => void;
  onDisableLiveAI: () => void;
  onAiPromptChange: (prompt: string) => void;
}

export function AIPanel({
  aiToolsState,
  onShowAIPanel,
  onFileSelect,
  onRunAIAnalysis,
  onSuggestDiagram,
  onEnableLiveAI,
  onDisableLiveAI,
  onAiPromptChange
}: AIPanelProps) {
  return (
    <div 
      className="absolute bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-gray-200/60 shadow-lg"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '95vw',
        maxHeight: '90vh',
        overflow: 'auto'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-gray-900" />
          <h3 className="text-gray-900 font-medium">AI Tools</h3>
        </div>
        <button
          onClick={() => onShowAIPanel(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* AI Loading State */}
      {aiToolsState.aiLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
            <span className="text-blue-700 text-sm">{aiToolsState.aiOperation}</span>
          </div>
        </div>
      )}

      {/* AI Error Display */}
      {aiToolsState.aiError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{aiToolsState.aiError}</p>
        </div>
      )}

      {/* File Upload */}
      <div className="mb-4">
        <label className="text-gray-600 text-xs mb-2 block">Upload Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
        {aiToolsState.selectedFile && (
          <p className="text-gray-500 text-xs mt-1">Selected: {aiToolsState.selectedFile.name}</p>
        )}
      </div>

      {aiToolsState.selectedFile && (
        <button
          onClick={onRunAIAnalysis}
          className="w-full mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Run AI Analysis
        </button>
      )}

      {/* AI Prompt Input */}
      <div className="mb-4">
        <label className="text-gray-600 text-xs mb-2 block">Describe your diagram</label>
        <textarea
          value={aiToolsState.aiPrompt}
          onChange={(e) => onAiPromptChange(e.target.value)}
          placeholder="Describe the diagram you want to create..."
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-800 text-sm resize-none"
          rows={3}
        />
        <button
          onClick={onSuggestDiagram}
          className="w-full mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Get Suggestions
        </button>
      </div>

      {/* Live AI Toggle */}
      <button
        onClick={() => {
          if (aiToolsState.liveAIShape) {
            onDisableLiveAI();
          } else {
            onEnableLiveAI();
          }
        }}
        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center ${
          aiToolsState.liveAIShape 
            ? 'bg-green-600 text-white hover:bg-green-700' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {aiToolsState.liveAIShape ? 'Live AI Active' : 'Enable Live AI'}
      </button>
    </div>
  );
}
