import { X } from "lucide-react";

interface QuickTipsProps {
  showQuickTips: boolean;
  onClose: () => void;
}

export function QuickTips({ showQuickTips, onClose }: QuickTipsProps) {
  if (!showQuickTips) return null;

  return (
    <div className="absolute bottom-20 left-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-4 border border-gray-200/60 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-gray-800 font-medium text-sm">Quick Tips</h4>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <div className="text-gray-600 text-xs space-y-1 max-h-32 overflow-y-auto">
        <p>• <strong>Touch and drag</strong> to draw shapes</p>
        <p>• <strong>Pinch to zoom</strong>, <strong>two-finger pan</strong></p>
        <p>• <strong>Tap text tool</strong>, then tap canvas to type</p>
        <p>• <strong>Tap color palette</strong> for styling options</p>
        <p>• <strong>Tap AI button</strong> for smart features</p>
      </div>
    </div>
  );
}
