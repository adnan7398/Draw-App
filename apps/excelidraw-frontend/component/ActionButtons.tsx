import { Undo2, Redo2, Download } from "lucide-react";

interface ActionButtonsProps {
  onUndo: () => void;
  onRedo: () => void;
  onDownload: () => void;
}

export function ActionButtons({ onUndo, onRedo, onDownload }: ActionButtonsProps) {
  return (
    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-2xl p-2 border border-gray-200/60 shadow-lg">
      <div className="flex flex-col space-y-2">
        <button
          onClick={onUndo}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={onRedo}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
          title="Redo"
        >
          <Redo2 size={16} />
        </button>
        <button
          onClick={onDownload}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
          title="Download"
        >
          <Download size={16} />
        </button>
      </div>
    </div>
  );
}
