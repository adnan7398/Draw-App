import { motion } from "framer-motion";
import {
    Circle,
    Pencil,
    RectangleHorizontalIcon,
    Eraser,
    Type,
    PenLine,
    Pipette,
    Triangle,
} from "lucide-react";
import { Tool } from "./types";

interface FloatingToolbarProps {
    selectedTool: Tool;
    onToolSelect: (tool: Tool) => void;
}

export function FloatingToolbar({ selectedTool, onToolSelect }: FloatingToolbarProps) {
    const tools: { id: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
        { id: "pencil", icon: <Pencil size={20} />, label: "Pencil", shortcut: "P" },
        { id: "rect", icon: <RectangleHorizontalIcon size={20} />, label: "Rectangle", shortcut: "R" },
        { id: "ellipse", icon: <Circle size={20} />, label: "Ellipse", shortcut: "O" },
        { id: "triangle", icon: <Triangle size={20} />, label: "Triangle", shortcut: "T" },
        { id: "circle", icon: <Circle size={20} />, label: "Circle", shortcut: "C" },
        { id: "line", icon: <PenLine size={20} />, label: "Line", shortcut: "L" },
        { id: "text", icon: <Type size={20} />, label: "Text", shortcut: "T" },
        { id: "erase", icon: <Eraser size={20} />, label: "Eraser", shortcut: "E" },
        { id: "colorpicker", icon: <Pipette size={20} />, label: "Color Picker", shortcut: "I" },
    ];

    return (
        <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-xl rounded-2xl p-2 border border-gray-700/50 shadow-2xl flex items-center gap-1 z-50"
        >
            {tools.map((tool) => (
                <div key={tool.id} className="relative group">
                    <button
                        onClick={() => onToolSelect(tool.id)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${selectedTool === tool.id
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105"
                                : "text-gray-400 hover:text-white hover:bg-white/10"
                            }`}
                    >
                        {tool.icon}
                    </button>

                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none border border-gray-700 shadow-xl transform translate-y-2 group-hover:translate-y-0">
                        {tool.label} <span className="text-gray-400 ml-1">({tool.shortcut})</span>
                        {/* Arrow */}
                        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-b border-r border-gray-700 transform rotate-45"></div>
                    </div>
                </div>
            ))}
        </motion.div>
    );
}
