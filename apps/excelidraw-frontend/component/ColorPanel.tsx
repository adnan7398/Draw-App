import { Palette, X } from "lucide-react";
import { StylingState } from "./types";

interface ColorPanelProps {
  stylingState: StylingState;
  showColorPopup: boolean;
  onShowColorPopup: (show: boolean) => void;
  onColorChange: (color: string) => void;
  onColorTypeChange: (type: 'stroke' | 'fill' | 'text') => void;
  onStrokeWidthChange: (width: number) => void;
  getCurrentColor: () => string;
  getCurrentColorPalette: () => string[];
}

export function ColorPanel({
  stylingState,
  showColorPopup,
  onShowColorPopup,
  onColorChange,
  onColorTypeChange,
  onStrokeWidthChange,
  getCurrentColor,
  getCurrentColorPalette
}: ColorPanelProps) {
  return (
    <>
      {/* Mobile Color Panel - Top Right */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-gray-200/60 shadow-lg">
        <div className="flex items-center space-x-2 mb-2">
          <button
            onClick={() => onShowColorPopup(!showColorPopup)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Colors"
          >
            <Palette size={16} />
          </button>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: stylingState.strokeColor }}></div>
            <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: stylingState.fillColor }}></div>
          </div>
        </div>
        
        {/* Quick Color Palette */}
        <div className="grid grid-cols-4 gap-1">
          {['#1976D2', '#1565C0', '#0D47A1', '#1E88E5', '#2196F3', '#42A5F5', '#64B5F6', '#90CAF9'].map((color, index) => (
            <button
              key={`quick-${color}-${index}`}
              onClick={() => onColorChange(color)}
              className={`w-6 h-6 rounded border transition-all duration-200 hover:scale-110 ${
                stylingState.strokeColor === color ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-1' : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Color Popup - Mobile Optimized */}
      {showColorPopup && (
        <div 
          className="absolute bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-gray-200/60 shadow-lg"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflow: 'auto'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-medium">Colors</h3>
            <button
              onClick={() => onShowColorPopup(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Color Type Selector */}
          <div className="mb-4">
            <label className="text-gray-600 text-xs mb-2 block">Color Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'stroke', label: 'Stroke' },
                { key: 'fill', label: 'Fill' },
                { key: 'text', label: 'Text' }
              ].map((type) => (
                <button
                  key={type.key}
                  onClick={() => onColorTypeChange(type.key as 'stroke' | 'fill' | 'text')}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    stylingState.selectedColorType === type.key
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className="mb-4">
            <label className="text-gray-600 text-xs mb-2 block capitalize">
              {stylingState.selectedColorType} Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={getCurrentColor()}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={getCurrentColor()}
                onChange={(e) => onColorChange(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-800 text-sm"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Color Palette */}
          <div className="mb-4">
            <label className="text-gray-600 text-xs mb-2 block">Quick Colors</label>
            <div className="grid grid-cols-6 gap-2">
              {getCurrentColorPalette().slice(0, 24).map((color, index) => (
                <button
                  key={`${stylingState.selectedColorType}-${color}-${index}`}
                  onClick={() => onColorChange(color)}
                  className={`w-8 h-8 rounded border transition-all duration-200 hover:scale-110 ${
                    getCurrentColor() === color ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-1' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Stroke Width */}
          <div className="mb-4">
            <label className="text-gray-600 text-xs mb-2 block">Stroke Width: {stylingState.strokeWidth}px</label>
            <input
              type="range"
              min="1"
              max="20"
              value={stylingState.strokeWidth}
              onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Close Button */}
          <button
            onClick={() => onShowColorPopup(false)}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </>
  );
}
