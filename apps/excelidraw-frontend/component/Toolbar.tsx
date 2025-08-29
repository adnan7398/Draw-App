import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon, Eraser, Type, PenLine, Pipette } from "lucide-react";
import { Tool } from "./types";

interface ToolbarProps {
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
}

export function Toolbar({ selectedTool, onToolSelect }: ToolbarProps) {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-gray-200/60 shadow-lg">
      <div className="flex items-center space-x-2">
        <IconButton
          icon={<Pencil size={16} />}
          activated={selectedTool === "pencil"}
          onClick={() => onToolSelect("pencil")}
          label="Pencil"
        />
        <IconButton
          icon={<RectangleHorizontalIcon size={16} />}
          activated={selectedTool === "rect"}
          onClick={() => onToolSelect("rect")}
          label="Rectangle"
        />
        <IconButton
          icon={<Circle size={16} />}
          activated={selectedTool === "circle"}
          onClick={() => onToolSelect("circle")}
          label="Circle"
        />
        <IconButton
          icon={<PenLine size={16} />}
          activated={selectedTool === "line"}
          onClick={() => onToolSelect("line")}
          label="Line"
        />
        <IconButton
          icon={<Type size={16} />}
          activated={selectedTool === "text"}
          onClick={() => onToolSelect("text")}
          label="Text"
        />
        <IconButton
          icon={<Eraser size={16} />}
          activated={selectedTool === "erase"}
          onClick={() => onToolSelect("erase")}
          label="Eraser"
        />
        <IconButton
          icon={<Pipette size={16} />}
          activated={selectedTool === "colorpicker"}
          onClick={() => onToolSelect("colorpicker")}
          label="Color Picker"
        />
      </div>
    </div>
  );
}
