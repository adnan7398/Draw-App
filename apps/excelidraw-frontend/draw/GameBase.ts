import { Tool, Shape, ShapeStyle, Gradient } from "@/component/types";
import { getExistingShapes } from "./http";

export abstract class GameBase {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  public existingShapes: Shape[];
  protected historyStack: Shape[][] = [];
  protected roomId: string;
  protected socket: WebSocket;
  protected selectedTool: Tool = "circle";
  protected scale = 1;
  protected offsetX = 0;
  protected offsetY = 0;
  protected selectedShape: Shape | null = null;
  protected isDragging: boolean = false;
  protected dragOffsetX = 0;
  protected dragOffsetY = 0;
  protected isDraggingShape = false;
  protected resizingHandle: string | null = null;
  protected isResizing: boolean = false;
  protected resizeStartX: number = 0;
  protected resizeStartY: number = 0;
  protected originalShape: Shape | null = null;

  // Performance optimizations
  protected animationFrameId: number | null = null;
  protected needsRedraw: boolean = false;
  protected lastDrawTime: number = 0;
  protected drawThrottle: number = 16; // ~60fps

  // Text rendering improvements
  protected textFonts: { [key: string]: string } = {
    'default': '16px Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    'heading': '20px Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    'large': '24px Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    'small': '14px Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    'mono': '14px "Roboto Mono", "SF Mono", Monaco, monospace'
  };

  // Smooth drawing optimizations
  protected drawingBuffer: { x: number; y: number }[] = [];
  protected smoothingFactor: number = 0.3;
  protected lastPoint: { x: number; y: number } | null = null;
  protected cursorBlink: boolean = true;
  protected cursorBlinkInterval: NodeJS.Timeout | null = null;

  // Infinite scrolling properties
  protected isPanning: boolean = false;
  protected lastPanX: number = 0;
  protected lastPanY: number = 0;
  protected minScale = 0.1;
  protected maxScale = 5;
  protected viewportWidth: number = 0;
  protected viewportHeight: number = 0;

  // Styling state
  protected currentStyle: ShapeStyle = {
    fillColor: "#E3F2FD",
    strokeColor: "#1976D2",
    strokeWidth: 2,
    strokeStyle: { type: "solid", width: 2 },
    opacity: 1
  };

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.roomId = roomId;
    this.socket = socket;
    
    // Enable canvas optimizations for smoother rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  protected generateShapeId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this.offsetX) * this.scale,
      y: (worldY - this.offsetY) * this.scale
    };
  }

  protected screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX / this.scale + this.offsetX,
      y: screenY / this.scale + this.offsetY
    };
  }

  protected clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  protected saveToHistory(): void {
    this.historyStack.push(JSON.parse(JSON.stringify(this.existingShapes)));
    if (this.historyStack.length > 50) {
      this.historyStack.shift();
    }
  }

  protected undo(): void {
    if (this.historyStack.length > 0) {
      this.existingShapes = this.historyStack.pop()!;
      this.clearCanvas();
      this.socket.send(JSON.stringify({
        type: "undo",
        roomId: this.roomId,
        shapes: this.existingShapes
      }));
    }
  }

  protected redo(): void {
    // Implementation for redo functionality
  }

  public setTool(tool: Tool): void {
    this.selectedTool = tool;
  }

  public setFillColor(color: string): void {
    this.currentStyle.fillColor = color;
  }

  public setStrokeColor(color: string): void {
    this.currentStyle.strokeColor = color;
  }

  public setStrokeWidth(width: number): void {
    this.currentStyle.strokeWidth = width;
    this.currentStyle.strokeStyle.width = width;
  }

  public setOpacity(opacity: number): void {
    this.currentStyle.opacity = opacity;
  }

  public setStrokeStyle(style: "solid" | "dashed" | "dotted" | "dash-dot"): void {
    this.currentStyle.strokeStyle.type = style;
  }

  public setGradient(gradient: Gradient | undefined): void {
    // Implementation for gradient setting
  }

  public setTextColor(color: string): void {
    // Implementation for text color setting
  }

  public setDesignColor(color: string): void {
    // Implementation for design color setting
  }

  public startCursorBlink(): void {
    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
    }
    this.cursorBlinkInterval = setInterval(() => {
      this.cursorBlink = !this.cursorBlink;
      this.needsRedraw = true;
    }, 500);
  }

  public stopCursorBlink(): void {
    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
      this.cursorBlinkInterval = null;
    }
    this.cursorBlink = false;
  }

  public destroy(): void {
    // Cancel any pending animation frames
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
    }
  }

  protected abstract init(): void;
  protected abstract initHandlers(): void;
  protected abstract initMouseHandlers(): void;
  protected abstract initTouchHandlers(): void;
  protected abstract initKeyboardHandlers(): void;
}
