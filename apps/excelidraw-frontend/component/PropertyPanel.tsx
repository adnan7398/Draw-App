import { Palette, X, Sliders } from "lucide-react";
import { StylingState } from "./types";
import { useState } from "react";

interface PropertyPanelProps {
    stylingState: StylingState;
    showColorPopup: boolean;
    onShowColorPopup: (show: boolean) => void;
    onColorChange: (color: string) => void;
    onColorTypeChange: (type: 'stroke' | 'fill' | 'text') => void;
    onStrokeWidthChange: (width: number) => void;
    onOpacityChange: (opacity: number) => void;
    onStrokeStyleChange: (style: "solid" | "dashed" | "dotted" | "dash-dot") => void;
    getCurrentColor: () => string;
    getCurrentColorPalette: () => string[];
    onClose?: () => void;
}

export function PropertyPanel({
    stylingState,
    showColorPopup,
    onShowColorPopup,
    onColorChange,
    onColorTypeChange,
    onStrokeWidthChange,
    onOpacityChange,
    onStrokeStyleChange,
    getCurrentColor,
    getCurrentColorPalette,
    onClose
}: PropertyPanelProps) {
    const [activeTab, setActiveTab] = useState<'colors' | 'style'>('colors');

    return (
        <>
            <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-md rounded-2xl p-3 border border-gray-700/50 shadow-2xl z-50">
                <div className="flex items-center space-x-2 mb-2">
                    {/* Toggle between Colors and Style */}
                    <div className="flex bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('colors')}
                            className={`p-2 rounded-md transition-colors ${activeTab === 'colors' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                            title="Colors"
                        >
                            <Palette size={16} />
                        </button>
                        <button
                            onClick={() => setActiveTab('style')}
                            className={`p-2 rounded-md transition-colors ${activeTab === 'style' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                            title="Style Properties"
                        >
                            <Sliders size={16} />
                        </button>
                    </div>

                    {!showColorPopup && activeTab === 'colors' && (
                        <div className="flex items-center space-x-1 ml-2">
                            <div
                                className="w-5 h-5 rounded-full border border-gray-600 bg-white"
                                style={{ backgroundColor: stylingState.strokeColor }}
                                title="Stroke"
                            ></div>
                            <div
                                className="w-5 h-5 rounded-full border border-gray-600 relative overflow-hidden bg-white"
                                style={{ backgroundColor: stylingState.fillColor === "transparent" ? "#eee" : stylingState.fillColor }}
                                title="Fill"
                            >
                                {stylingState.fillColor === "transparent" && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-full h-0.5 bg-red-500 rotate-45"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Close Button (Optional) */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="ml-auto p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            title="Close Panel"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Colors Tab Content (Quick Palette) */}
                {activeTab === 'colors' && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                        {['#1976D2', '#1565C0', '#0D47A1', '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A1A1A', '#FFFFFF'].map((color, index) => (
                            <button
                                key={`quick-${color}-${index}`}
                                onClick={() => onColorChange(color)}
                                className={`w-6 h-6 rounded-full border transition-all duration-200 hover:scale-110 ${stylingState.strokeColor === color ? 'border-white ring-2 ring-white/50' : 'border-gray-600 hover:border-gray-400'
                                    }`}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                        <button
                            onClick={() => onShowColorPopup(!showColorPopup)}
                            className="col-span-4 mt-2 text-xs text-blue-400 hover:text-blue-300 underline text-center"
                        >
                            {showColorPopup ? 'Close Picker' : 'More Colors...'}
                        </button>
                    </div>
                )}

                {/* Style Tab Content */}
                {activeTab === 'style' && (
                    <div className="w-48 mt-2 space-y-4">
                        {/* Stroke Width */}
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block flex justify-between">
                                <span>Stroke Width</span>
                                <span>{stylingState.strokeWidth}px</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={stylingState.strokeWidth}
                                onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Opacity */}
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block flex justify-between">
                                <span>Opacity</span>
                                <span>{Math.round(stylingState.opacity * 100)}%</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={stylingState.opacity * 100}
                                onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Stroke Style */}
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Stroke Style</label>
                            <div className="flex gap-2">
                                {(["solid", "dashed", "dotted"] as const).map(style => (
                                    <button
                                        key={style}
                                        onClick={() => onStrokeStyleChange(style)}
                                        className={`flex-1 py-1 rounded text-xs border ${stylingState.strokeStyle === style ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'border-gray-600 text-gray-400 hover:border-gray-500'}`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Expanded Color Popup (if showColorPopup is true) */}
            {showColorPopup && (
                <div
                    className="absolute bg-gray-900/95 backdrop-blur-xl rounded-2xl p-4 border border-gray-700 shadow-2xl z-50"
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        maxWidth: '320px',
                        width: '90vw'
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-medium">Color Picker</h3>
                        <button
                            onClick={() => onShowColorPopup(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Color Type Selector */}
                    <div className="bg-gray-800 p-1 rounded-lg flex mb-4">
                        {[
                            { key: 'stroke', label: 'Stroke' },
                            { key: 'fill', label: 'Fill' },
                            { key: 'text', label: 'Text' }
                        ].map((type) => (
                            <button
                                key={type.key}
                                onClick={() => onColorTypeChange(type.key as any)}
                                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${stylingState.selectedColorType === type.key
                                    ? 'bg-gray-700 text-white shadow-sm'
                                    : 'text-gray-400 hover:text-gray-200'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-6 gap-2 mb-4">
                        {getCurrentColorPalette().slice(0, 24).map((color, index) => (
                            <button
                                key={`${stylingState.selectedColorType}-${color}-${index}`}
                                onClick={() => onColorChange(color)}
                                className={`w-8 h-8 rounded-full border transition-all duration-200 hover:scale-110 ${getCurrentColor() === color ? 'border-white ring-2 ring-white/30' : 'border-gray-600 hover:border-gray-400'
                                    }`}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>

                    {stylingState.selectedColorType === 'fill' && (
                        <button
                            onClick={() => onColorChange("transparent")}
                            className={`w-full py-2 rounded-lg text-sm font-medium border mb-2 ${stylingState.fillColor === "transparent"
                                ? 'bg-red-500/10 border-red-500 text-red-400'
                                : 'border-gray-700 text-gray-400 hover:border-gray-600'
                                }`}
                        >
                            No Fill
                        </button>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={getCurrentColor() === 'transparent' ? '#000000' : getCurrentColor()}
                            onChange={(e) => onColorChange(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                            style={{ padding: 0 }}
                        />
                        <input
                            type="text"
                            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                            value={getCurrentColor()}
                            onChange={(e) => onColorChange(e.target.value)}
                        />
                    </div>

                </div>
            )}
        </>
    );
}
