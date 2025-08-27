import { Tool } from "@/component/canvas";
import { getExistingShapes } from "./http";

// Styling types
type GradientType = "linear" | "radial" | "none";
type StrokePattern = "solid" | "dashed" | "dotted" | "dash-dot";

interface Gradient {
  type: GradientType;
  colors: string[];
  stops: number[];
  angle?: number; // For linear gradients
  centerX?: number; // For radial gradients
  centerY?: number; // For radial gradients
}

interface StrokeStyle {
  type: StrokePattern;
  width: number;
  dashArray?: number[]; // For custom patterns
}

interface ShapeStyle {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  opacity: number;
  gradient?: Gradient;
  textColor?: string;
  designColor?: string;
}

type Shape =
  | {
      id: string;
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      style?: ShapeStyle;
    }
  | {
      id: string;
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
      style?: ShapeStyle;
    }
  | {
      id: string;
      type: "line";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      style?: ShapeStyle;
    }
  | {
      id: string;
      type: "path";
      points: { x: number; y: number }[];
      style?: ShapeStyle;
    }
  | {
      id: string;
      type: "text";
      x: number;
      y: number;
      text: string;
      fontSize: number;
      color: string;
      style?: ShapeStyle;
    };

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public existingShapes: Shape[];
  private historyStack: Shape[][] = [];
  private roomId: string;
  private clicked: boolean;
  private startX = 0;
  private startY = 0;
  private selectedTool: Tool = "circle";
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private selectedShape: Shape | null = null;
  private isDragging: boolean = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private isDraggingShape = false;
  private resizingHandle: string | null = null;
  private isResizing: boolean = false;
  private resizeStartX: number = 0;
  private resizeStartY: number = 0;
  private originalShape: Shape | null = null;
  
  // Performance optimizations
  private animationFrameId: number | null = null;
  private needsRedraw: boolean = false;
  private lastDrawTime: number = 0;
  private drawThrottle: number = 16; // ~60fps
  
  // Text rendering improvements
  private textFonts: { [key: string]: string } = {
    'default': '16px Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    'heading': '20px Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    'large': '24px Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    'small': '14px Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    'mono': '14px "Roboto Mono", "SF Mono", Monaco, monospace'
  };
  
  // Smooth drawing optimizations
  private drawingBuffer: { x: number; y: number }[] = [];
  private smoothingFactor: number = 0.3;
  private lastPoint: { x: number; y: number } | null = null;
  private cursorBlink: boolean = true;
  private cursorBlinkInterval: NodeJS.Timeout | null = null;
  
  // Infinite scrolling properties
  private isPanning: boolean = false;
  private lastPanX: number = 0;
  private lastPanY: number = 0;
  private minScale = 0.1;
  private maxScale = 5;
  private viewportWidth: number = 0;
  private viewportHeight: number = 0;

  // Stable keyboard handlers for add/removeEventListener
  private keyDownHandler!: (e: KeyboardEvent) => void;
  private keyUpHandler!: (e: KeyboardEvent) => void;

  // Freehand drawing state
  private isDrawingPath: boolean = false;
  private currentPathPoints: { x: number; y: number }[] = [];
  private currentTouchX: number = 0;
  private currentTouchY: number = 0;
  
  // Touch drawing state
  private isDrawingShape: boolean = false;
  
  // Palm scrolling and clipboard state
  private isPalmScrolling: boolean = false;
  private palmScrollStartX: number = 0;
  private palmScrollStartY: number = 0;
  private clipboardShapes: Shape[] = [];
  private clipboardOffsetX: number = 0;
  private clipboardOffsetY: number = 0;
  private isPasting: boolean = false;
  
  // Touch handling properties
  private panStartX: number = 0;
  private panStartY: number = 0;
  private panStartOffsetX: number = 0;
  private panStartOffsetY: number = 0;
  
  // Styling state
  private currentStyle: ShapeStyle = {
    fillColor: "#E3F2FD",
    strokeColor: "#1976D2",
    strokeWidth: 2,
    strokeStyle: { type: "solid", width: 2 },
    opacity: 1
  };
  private layers: { id: string; name: string; visible: boolean; shapes: Shape[] }[] = [];
  private activeLayerId: string = "default";

  socket: WebSocket;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.roomId = roomId;
    this.socket = socket;
    this.clicked = false;
    
    // Enable canvas optimizations for smoother rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
    this.initTouchHandlers();
    this.initKeyboardHandlers();
  }

  destroy() {
    // Cancel any pending animation frames
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
    }
    
    // Remove mouse events
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.removeEventListener("wheel", this.wheelHandler);
    this.canvas.removeEventListener("contextmenu", this.contextMenuHandler);
    
    // Remove touch events
    this.canvas.removeEventListener("touchstart", this.touchStartHandler);
    this.canvas.removeEventListener("touchmove", this.touchMoveHandler);
    this.canvas.removeEventListener("touchend", this.touchEndHandler);
    
    // Remove keyboard events
    document.removeEventListener("keydown", this.keyDownHandler);
    document.removeEventListener("keyup", this.keyUpHandler);
  }
  private generateShapeId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  private getResizeHandles(shape: Shape): { x: number; y: number; width: number; height: number; handle: string }[] {
    const handles: { x: number; y: number; width: number; height: number; handle: string }[] = [];
    const handleSize = 16; // Larger handle size for easier clicking
    
    if (shape.type === "rect") {
      const screenPos = this.worldToScreen(shape.x, shape.y);
      const screenWidth = shape.width * this.scale;
      const screenHeight = shape.height * this.scale;
      
      // Corner handles
      handles.push({ x: screenPos.x - handleSize/2, y: screenPos.y - handleSize/2, width: handleSize, height: handleSize, handle: "nw" });
      handles.push({ x: screenPos.x + screenWidth - handleSize/2, y: screenPos.y - handleSize/2, width: handleSize, height: handleSize, handle: "ne" });
      handles.push({ x: screenPos.x - handleSize/2, y: screenPos.y + screenHeight - handleSize/2, width: handleSize, height: handleSize, handle: "sw" });
      handles.push({ x: screenPos.x + screenWidth - handleSize/2, y: screenPos.y + screenHeight - handleSize/2, width: handleSize, height: handleSize, handle: "se" });
      
      // Edge handles
      handles.push({ x: screenPos.x + screenWidth/2 - handleSize/2, y: screenPos.y - handleSize/2, width: handleSize, height: handleSize, handle: "n" });
      handles.push({ x: screenPos.x + screenWidth/2 - handleSize/2, y: screenPos.y + screenHeight - handleSize/2, width: handleSize, height: handleSize, handle: "s" });
      handles.push({ x: screenPos.x - handleSize/2, y: screenPos.y + screenHeight/2 - handleSize/2, width: handleSize, height: handleSize, handle: "w" });
      handles.push({ x: screenPos.x + screenWidth - handleSize/2, y: screenPos.y + screenHeight/2 - handleSize/2, width: handleSize, height: handleSize, handle: "e" });
      
    } else if (shape.type === "circle") {
      const screenPos = this.worldToScreen(shape.centerX, shape.centerY);
      const screenRadius = shape.radius * this.scale;
      
      // Circle resize handles (8 points around the circle)
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x = screenPos.x + Math.cos(angle) * screenRadius - handleSize/2;
        const y = screenPos.y + Math.sin(angle) * screenRadius - handleSize/2;
        handles.push({ x, y, width: handleSize, height: handleSize, handle: `circle-${i}` });
      }
      
    } else if (shape.type === "text") {
      const screenPos = this.worldToScreen(shape.x, shape.y);
      
      // Create a temporary canvas to measure text
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.font = `${shape.fontSize * this.scale}px Arial`;
      const metrics = tempCtx.measureText(shape.text);
      const textWidth = metrics.width;
      const textHeight = shape.fontSize * this.scale;
      
      // Corner handles for text
      handles.push({ x: screenPos.x - handleSize/2, y: screenPos.y - textHeight - handleSize/2, width: handleSize, height: handleSize, handle: "nw" });
      handles.push({ x: screenPos.x + textWidth - handleSize/2, y: screenPos.y - textHeight - handleSize/2, width: handleSize, height: handleSize, handle: "ne" });
      handles.push({ x: screenPos.x - handleSize/2, y: screenPos.y - handleSize/2, width: handleSize, height: handleSize, handle: "sw" });
      handles.push({ x: screenPos.x + textWidth - handleSize/2, y: screenPos.y - handleSize/2, width: handleSize, height: handleSize, handle: "se" });
    }
    
    return handles;
  }

  // Check if a point is over a resize handle
  private getResizeHandleAtPosition(x: number, y: number): { shape: Shape; handle: string } | null {
    if (!this.selectedShape) return null;
    
    const handles = this.getResizeHandles(this.selectedShape);
    
    for (const handle of handles) {
      if (x >= handle.x && x <= handle.x + handle.width &&
          y >= handle.y && y <= handle.y + handle.height) {
        return { shape: this.selectedShape, handle: handle.handle };
      }
    }
    
    return null;
  }

  // Resize a shape based on handle and new position
  private resizeShape(shape: Shape, handle: string, newX: number, newY: number) {
    if (!this.originalShape) return;
    
    console.log('Resizing shape:', shape.type, 'handle:', handle, 'newPos:', newX, newY);
    
    if (shape.type === "rect") {
      const originalRect = this.originalShape as any;
      const totalDeltaX = newX - this.resizeStartX;
      const totalDeltaY = newY - this.resizeStartY;
      
      switch (handle) {
        case "nw":
          shape.x = originalRect.x + totalDeltaX;
          shape.y = originalRect.y + totalDeltaY;
          shape.width = originalRect.width - totalDeltaX;
          shape.height = originalRect.height - totalDeltaY;
          break;
        case "ne":
          shape.x = originalRect.x;
          shape.y = originalRect.y + totalDeltaY;
          shape.width = originalRect.width + totalDeltaX;
          shape.height = originalRect.height - totalDeltaY;
          break;
        case "sw":
          shape.x = originalRect.x + totalDeltaX;
          shape.y = originalRect.y;
          shape.width = originalRect.width - totalDeltaX;
          shape.height = originalRect.height + totalDeltaY;
          break;
        case "se":
          shape.x = originalRect.x;
          shape.y = originalRect.y;
          shape.width = originalRect.width + totalDeltaX;
          shape.height = originalRect.height + totalDeltaY;
          break;
        case "n":
          shape.x = originalRect.x;
          shape.y = originalRect.y + totalDeltaY;
          shape.width = originalRect.width;
          shape.height = originalRect.height - totalDeltaY;
          break;
        case "s":
          shape.x = originalRect.x;
          shape.y = originalRect.y;
          shape.width = originalRect.width;
          shape.height = originalRect.height + totalDeltaY;
          break;
        case "w":
          shape.x = originalRect.x + totalDeltaX;
          shape.y = originalRect.y;
          shape.width = originalRect.width - totalDeltaX;
          shape.height = originalRect.height;
          break;
        case "e":
          shape.x = originalRect.x;
          shape.y = originalRect.y;
          shape.width = originalRect.width + totalDeltaX;
          shape.height = originalRect.height;
          break;
      }
      
      // Ensure minimum size
      shape.width = Math.max(10, shape.width);
      shape.height = Math.max(10, shape.height);
      
    } else if (shape.type === "circle") {
      const originalCircle = this.originalShape as any;
      const totalDeltaX = newX - this.resizeStartX;
      const totalDeltaY = newY - this.resizeStartY;
      
      // Determine which direction to resize based on handle
      const handleIndex = parseInt(handle.split('-')[1]);
      const angle = (handleIndex * Math.PI) / 4;
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      
      // Calculate new radius based on handle position
      const radiusDelta = (cosAngle * totalDeltaX + sinAngle * totalDeltaY);
      shape.radius = Math.max(5, originalCircle.radius + radiusDelta);
      
    } else if (shape.type === "text") {
      const originalText = this.originalShape as any;
      const totalDeltaX = newX - this.resizeStartX;
      const totalDeltaY = newY - this.resizeStartY;
      
      // Resize text by changing font size
      const scaleFactor = 1 + (totalDeltaX + totalDeltaY) / 200; // Adjust sensitivity
      const newFontSize = Math.max(8, Math.min(72, originalText.fontSize * scaleFactor));
      shape.fontSize = newFontSize;
    }
  }

  cleanupShapes() {
    // Remove any invalid shapes that might have slipped through
    const originalLength = this.existingShapes.length;
    this.existingShapes = this.existingShapes.filter(shape => 
      shape && typeof shape === 'object' && shape.type && (shape as any).id
    );
    if (this.existingShapes.length !== originalLength) {
      console.log(`Cleaned up ${originalLength - this.existingShapes.length} invalid shapes`);
      this.clearCanvas();
    }
  }

  setTool(tool: Tool) {
    this.selectedTool = tool;
  }

  // Debug method to test resize handles
  debugResizeHandles() {
    if (this.selectedShape) {
      const handles = this.getResizeHandles(this.selectedShape);
      console.log('Debug: Selected shape:', this.selectedShape.type);
      console.log('Debug: Resize handles:', handles);
    } else {
      console.log('Debug: No shape selected');
    }
  }

  // Create a test shape for debugging
  createTestShape() {
    const testShape: Shape = {
      id: this.generateShapeId(),
      type: "rect",
      x: 100,
      y: 100,
      width: 150,
      height: 100
    };
    
    this.existingShapes.push(testShape);
    this.selectedShape = testShape;
    this.clearCanvas();
    console.log('Created test shape:', testShape);
  }

  // Start cursor blinking
  startCursorBlink() {
    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
    }
    this.cursorBlink = true;
    this.cursorBlinkInterval = setInterval(() => {
      this.cursorBlink = !this.cursorBlink;
      this.clearCanvas();
    }, 500); // Blink every 500ms
  }

  // Stop cursor blinking
  stopCursorBlink() {
    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
      this.cursorBlinkInterval = null;
    }
    this.cursorBlink = false;
  }

  // Copy selected shapes to clipboard
  copyShapes() {
    if (this.selectedShape) {
      this.clipboardShapes = [JSON.parse(JSON.stringify(this.selectedShape))];
      console.log('Copied shape to clipboard:', this.selectedShape.type);
    }
  }

  // Cut selected shapes (copy and delete)
  cutShapes() {
    if (this.selectedShape) {
      this.copyShapes();
      this.existingShapes = this.existingShapes.filter(shape => shape.id !== this.selectedShape!.id);
      this.selectedShape = null;
      this.clearCanvas();
      console.log('Cut shape from canvas');
    }
  }

  // Paste shapes from clipboard
  pasteShapes(x: number, y: number) {
    if (this.clipboardShapes.length === 0) return;
    
    this.isPasting = true;
    const pastedShapes: Shape[] = [];
    
    this.clipboardShapes.forEach(shape => {
      const newShape = JSON.parse(JSON.stringify(shape));
      newShape.id = this.generateShapeId();
      
      // Calculate offset for pasting
      if (pastedShapes.length === 0) {
        if (shape.type === "rect" || shape.type === "text") {
          this.clipboardOffsetX = x - (shape as any).x;
          this.clipboardOffsetY = y - (shape as any).y;
        } else if (shape.type === "circle") {
          this.clipboardOffsetX = x - (shape as any).centerX;
          this.clipboardOffsetY = y - (shape as any).centerY;
        } else if (shape.type === "line") {
          this.clipboardOffsetX = x - (shape as any).startX;
          this.clipboardOffsetY = y - (shape as any).startY;
        } else if (shape.type === "path") {
          this.clipboardOffsetX = x - (shape as any).points[0].x;
          this.clipboardOffsetY = y - (shape as any).points[0].y;
        }
      }
      
      // Apply offset
      if (shape.type === "rect") {
        newShape.x = x - this.clipboardOffsetX;
        newShape.y = y - this.clipboardOffsetY;
      } else if (shape.type === "circle") {
        newShape.centerX = x - this.clipboardOffsetX;
        newShape.centerY = y - this.clipboardOffsetY;
      } else if (shape.type === "line") {
        const dx = x - this.clipboardOffsetX - shape.startX;
        const dy = y - this.clipboardOffsetY - shape.startY;
        newShape.startX += dx;
        newShape.startY += dy;
        newShape.endX += dx;
        newShape.endY += dy;
      } else if (shape.type === "text") {
        newShape.x = x - this.clipboardOffsetX;
        newShape.y = y - this.clipboardOffsetY;
      } else if (shape.type === "path") {
        const dx = x - this.clipboardOffsetX - shape.points[0].x;
        const dy = y - this.clipboardOffsetY - shape.points[0].y;
        newShape.points = shape.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
      }
      
      pastedShapes.push(newShape);
      this.existingShapes.push(newShape);
    });
    
    this.selectedShape = pastedShapes[0];
    this.clearCanvas();
    
    // Send pasted shapes to other users
    pastedShapes.forEach(shape => {
      this.socket.send(JSON.stringify({
        type: "draw",
        shape: shape,
        roomId: this.roomId
      }));
    });
    
    console.log('Pasted', pastedShapes.length, 'shapes');
    this.isPasting = false;
  }

  // Detect palm gesture (3+ fingers)
  private isPalmGesture(touches: TouchList): boolean {
    return touches.length >= 3;
  }

  // Styling methods
  setFillColor(color: string) {
    this.currentStyle.fillColor = color;
  }

  setStrokeColor(color: string) {
    this.currentStyle.strokeColor = color;
  }

  setStrokeWidth(width: number) {
    this.currentStyle.strokeWidth = width;
    this.currentStyle.strokeStyle.width = width;
  }

  setStrokeStyle(pattern: StrokePattern, dashArray?: number[]) {
    this.currentStyle.strokeStyle = {
      type: pattern,
      width: this.currentStyle.strokeWidth,
      dashArray
    };
  }

  setOpacity(opacity: number) {
    this.currentStyle.opacity = Math.max(0, Math.min(1, opacity));
  }

  setGradient(gradient: Gradient | undefined) {
    this.currentStyle.gradient = gradient;
  }

  setTextColor(color: string) {
    // Update text color for new text shapes
    this.currentStyle.textColor = color;
  }

  setDesignColor(color: string) {
    // Update design color for UI elements
    this.currentStyle.designColor = color;
  }

  getCurrentStyle(): ShapeStyle {
    return { ...this.currentStyle };
  }

  // Layer management methods
  createLayer(name: string): string {
    const layerId = `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.layers.push({
      id: layerId,
      name,
      visible: true,
      shapes: []
    });
    return layerId;
  }

  deleteLayer(layerId: string) {
    this.layers = this.layers.filter(layer => layer.id !== layerId);
    if (this.activeLayerId === layerId) {
      this.activeLayerId = this.layers[0]?.id || "default";
    }
  }

  setLayerVisibility(layerId: string, visible: boolean) {
    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      layer.visible = visible;
    }
  }

  setActiveLayer(layerId: string) {
    this.activeLayerId = layerId;
  }

  getLayers() {
    return this.layers.map(layer => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      shapeCount: layer.shapes.length
    }));
  }

  // Apply gradient to canvas context
  private applyGradient(ctx: CanvasRenderingContext2D, shape: Shape, gradient: Gradient): CanvasGradient | null {
    if (gradient.type === "linear" && gradient.angle !== undefined) {
      const angle = gradient.angle * Math.PI / 180;
      const x1 = Math.cos(angle) * -50;
      const y1 = Math.sin(angle) * -50;
      const x2 = Math.cos(angle) * 50;
      const y2 = Math.sin(angle) * 50;
      
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.colors.forEach((color, index) => {
        grad.addColorStop(gradient.stops[index] || 0, color);
      });
      return grad;
    } else if (gradient.type === "radial") {
      const centerX = gradient.centerX || 0;
      const centerY = gradient.centerY || 0;
      const radius = 50;
      
      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.colors.forEach((color, index) => {
        grad.addColorStop(gradient.stops[index] || 0, color);
      });
      return grad;
    }
    return null;
  }

  // Apply stroke style to canvas context
  private applyStrokeStyle(ctx: CanvasRenderingContext2D, strokeStyle: StrokeStyle) {
    ctx.lineWidth = strokeStyle.width;
    
    switch (strokeStyle.type) {
      case "dashed":
        ctx.setLineDash([strokeStyle.width * 2, strokeStyle.width]);
        break;
      case "dotted":
        ctx.setLineDash([strokeStyle.width, strokeStyle.width]);
        break;
      case "dash-dot":
        ctx.setLineDash([strokeStyle.width * 3, strokeStyle.width, strokeStyle.width, strokeStyle.width]);
        break;
      default:
        ctx.setLineDash([]);
    }
  }

  async init() {
    try {
      this.existingShapes = await getExistingShapes(this.roomId);
      // Filter out any invalid shapes that might have been loaded
      this.existingShapes = this.existingShapes.filter(shape => 
        shape && typeof shape === 'object' && shape.type && (shape as any).id
      );
      this.cleanupShapes(); // Additional cleanup
      this.clearCanvas();
      
      // Initialize viewport
      this.viewportWidth = this.canvas.width;
      this.viewportHeight = this.canvas.height;
      
      // Center the viewport initially
      this.offsetX = this.viewportWidth / 2;
      this.offsetY = this.viewportHeight / 2;
      
    } catch (error) {
      console.error("Error loading existing shapes:", error);
      this.existingShapes = [];
    }
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupShapes();
    }, 10000); // Clean up every 10 seconds
  }

  // Convert screen coordinates to world coordinates
  public screenToWorld(screenX: number, screenY: number): { x: number, y: number } {
    return {
      x: (screenX - this.offsetX) / this.scale,
      y: (screenY - this.offsetY) / this.scale
    };
  }

  // Convert world coordinates to screen coordinates
  private worldToScreen(worldX: number, worldY: number): { x: number, y: number } {
    return {
      x: worldX * this.scale + this.offsetX,
      y: worldY * this.scale + this.offsetY
    };
  }

  // Pan the viewport
  private pan(deltaX: number, deltaY: number) {
    this.offsetX += deltaX;
    this.offsetY += deltaY;
    this.clearCanvas();
  }

  // Zoom the viewport
  private zoom(factor: number, centerX: number, centerY: number) {
    const oldScale = this.scale;
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * factor));
    
    // Adjust offset to zoom towards the center point
    if (this.scale !== oldScale) {
      const scaleRatio = this.scale / oldScale;
      this.offsetX = centerX - (centerX - this.offsetX) * scaleRatio;
      this.offsetY = centerY - (centerY - this.offsetY) * scaleRatio;
      this.clearCanvas();
    }
  }

  // Reset view to show all shapes
  private resetView() {
    if (this.existingShapes.length === 0) {
      this.offsetX = this.viewportWidth / 2;
      this.offsetY = this.viewportHeight / 2;
      this.scale = 1;
    } else {
      // Calculate bounds of all shapes
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      this.existingShapes.forEach(shape => {
        if (shape.type === "rect") {
          minX = Math.min(minX, shape.x);
          minY = Math.min(minY, shape.y);
          maxX = Math.max(maxX, shape.x + shape.width);
          maxY = Math.max(maxY, shape.y + shape.height);
        } else if (shape.type === "circle") {
          minX = Math.min(minX, shape.centerX - shape.radius);
          minY = Math.min(minY, shape.centerY - shape.radius);
          maxX = Math.max(maxX, shape.centerX + shape.radius);
          maxY = Math.max(maxY, shape.centerY + shape.radius);
        } else if (shape.type === "line") {
          minX = Math.min(minX, Math.min(shape.startX, shape.endX));
          minY = Math.min(minY, Math.min(shape.startY, shape.endY));
          maxX = Math.max(maxX, Math.max(shape.startX, shape.endX));
          maxY = Math.max(maxY, Math.max(shape.startY, shape.endY));
        } else if (shape.type === "path") {
          shape.points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
          });
        }
      });
      
      // Add padding
      const padding = 100;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;
      
      // Calculate scale to fit everything
      const shapeWidth = maxX - minX;
      const shapeHeight = maxY - minY;
      const scaleX = this.viewportWidth / shapeWidth;
      const scaleY = this.viewportHeight / shapeHeight;
      this.scale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 1x
      
      // Center the view
      this.offsetX = this.viewportWidth / 2 - (minX + shapeWidth / 2) * this.scale;
      this.offsetY = this.viewportHeight / 2 - (minY + shapeHeight / 2) * this.scale;
    }
    
    this.clearCanvas();
  }

  initHandlers() {
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "chat") {
          try {
            const parsedData = JSON.parse(message.message);
            if (parsedData.type === "shape_create" && parsedData.shape && parsedData.shape.type && parsedData.shape.id) {
              // Check if shape already exists to prevent duplicates
              if (!this.existingShapes.find(s => s.id === parsedData.shape.id)) {
                this.existingShapes.push(parsedData.shape);
                this.clearCanvas();
              }
            }
          } catch (e) {
            // Handle non-shape chat messages
          }
        } else if (message.type === "edit_shape") {
          const updatedShape = message.shape;
          if (updatedShape && updatedShape.type && updatedShape.id) {
            const index = this.existingShapes.findIndex(s => s.id === updatedShape.id);
            if (index !== -1) {
              this.existingShapes[index] = updatedShape;
              this.clearCanvas();
            }
          }
        } else if (message.type === "draw") {
          const newShape = message.shape;
          if (newShape && newShape.type && newShape.id) {
            // Check if shape already exists to prevent duplicates
            if (!this.existingShapes.find(s => s.id === newShape.id)) {
              this.existingShapes.push(newShape);
              this.clearCanvas();
            }
          }
        } else if (message.type === "erase") {
          const shapeId = message.shapeId;
          if (typeof shapeId === 'string') {
            this.existingShapes = this.existingShapes.filter(s => s.id !== shapeId);
            this.clearCanvas();
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (this.historyStack.length > 0) {
          const previousState = this.historyStack.pop()!;
          // Ensure the previous state is valid
          if (Array.isArray(previousState)) {
            this.existingShapes = previousState.filter(shape => 
              shape && typeof shape === 'object' && shape.type && (shape as any).id
            );
            this.clearCanvas();
          }
        }
      }
    });
  }

  initKeyboardHandlers() {
    this.keyDownHandler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "0":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.resetView();
          }
          break;
        case "=":
        case "+":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.zoom(1.2, this.viewportWidth / 2, this.viewportHeight / 2);
          }
          break;
        case "-":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.zoom(0.8, this.viewportWidth / 2, this.viewportHeight / 2);
          }
          break;
        case " ":
          e.preventDefault();
          this.isPanning = true;
          this.canvas.style.cursor = "grab";
          break;
        case "r":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.debugResizeHandles();
          }
          break;
        case "t":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.createTestShape();
          }
          break;
        case "h":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Dispatch custom event to toggle quick tips
            this.canvas.dispatchEvent(new CustomEvent('toggleQuickTips'));
          }
          break;
        case "c":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.copyShapes();
          }
          break;
        case "x":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.cutShapes();
          }
          break;
        case "v":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Paste at center of viewport
            const centerX = this.viewportWidth / 2;
            const centerY = this.viewportHeight / 2;
            const worldPos = this.screenToWorld(centerX, centerY);
            this.pasteShapes(worldPos.x, worldPos.y);
          }
          break;
      }
    };

    this.keyUpHandler = (e: KeyboardEvent) => {
      if (e.key === " ") {
        this.isPanning = false;
        this.canvas.style.cursor = "crosshair";
      }
    };

    document.addEventListener("keydown", this.keyDownHandler);
    document.addEventListener("keyup", this.keyUpHandler);
  }

  initTouchHandlers() {
    // Prevent scrolling on the canvas
    this.canvas.style.touchAction = 'none';
    this.canvas.style.userSelect = 'none';
    this.canvas.style.webkitUserSelect = 'none';
    
    this.canvas.addEventListener("touchstart", this.touchStartHandler, { passive: false });
    this.canvas.addEventListener("touchmove", this.touchMoveHandler, { passive: false });
    this.canvas.addEventListener("touchend", this.touchEndHandler, { passive: false });
  }

  touchStartHandler = (e: TouchEvent) => {
    e.preventDefault();
    console.log('Touch start:', e.touches.length, 'touches');
    
    // Handle palm scrolling (3+ fingers)
    if (this.isPalmGesture(e.touches)) {
      this.isPalmScrolling = true;
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.palmScrollStartX = touch.clientX - rect.left;
      this.palmScrollStartY = touch.clientY - rect.top;
      this.canvas.style.cursor = "grab";
      console.log('Palm scrolling started');
      return;
    }
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      console.log('Touch position:', x, y, 'Tool:', this.selectedTool);
      
      this.startX = x;
      this.startY = y;
      this.currentTouchX = x;
      this.currentTouchY = y;
      this.clicked = true;
      
      const worldPos = this.screenToWorld(x, y);
      
      // Start freehand path if pencil selected
      if (this.selectedTool === "pencil") {
        console.log('Starting pencil drawing');
        this.isDrawingPath = true;
        this.currentPathPoints = [{ x: worldPos.x, y: worldPos.y }];
        this.clearCanvas();
        return;
      }
      
      // Handle erase tool
      if (this.selectedTool === "erase") {
        const shape = this.getShapeAtPosition(worldPos.x, worldPos.y);
        if (shape) {
          console.log('Erasing shape:', shape.type);
          this.existingShapes = this.existingShapes.filter(s => s.id !== shape.id);
          this.clearCanvas();
          this.socket.send(JSON.stringify({ type: "erase", shapeId: shape.id, roomId: this.roomId }));
        }
        return;
      }

      // Handle text tool
      if (this.selectedTool === "text" as Tool) {
        // Create a new text shape
        const textShape: Shape = {
          id: this.generateShapeId(),
          type: "text",
          x: worldPos.x,
          y: worldPos.y,
          text: "",
          fontSize: 16,
          color: this.currentStyle.textColor || "#1565C0",
          style: { ...this.currentStyle }
        };
        
        this.historyStack.push([...this.existingShapes]);
        this.existingShapes.push(textShape);
        this.selectedShape = textShape;
        this.clearCanvas();
        
        // Send to other users
        this.socket.send(JSON.stringify({ 
          type: "draw", 
          shape: textShape, 
          roomId: this.roomId 
        }));
        
        // Emit event for text editing
        this.canvas.dispatchEvent(new CustomEvent('textEdit', { 
          detail: { shapeId: textShape.id, text: "" } 
        }));
        
        // Start cursor blinking
        this.startCursorBlink();
        
        return;
      }
      
      // Check for resize handles first
      const resizeHandle = this.getResizeHandleAtPosition(x, y);
      if (resizeHandle) {
        this.isResizing = true;
        this.resizingHandle = resizeHandle.handle;
        this.resizeStartX = worldPos.x;
        this.resizeStartY = worldPos.y;
        this.originalShape = JSON.parse(JSON.stringify(resizeHandle.shape)); // Deep copy
        return;
      }

      const shape = this.getShapeAtPosition(worldPos.x, worldPos.y);
      
      if (shape) {
        console.log('Touching existing shape:', shape.type);
        this.selectedShape = shape;
        this.isDragging = true;
        this.isDraggingShape = true;
        
        if (shape.type === "rect") {
          this.dragOffsetX = worldPos.x - shape.x;
          this.dragOffsetY = worldPos.y - shape.y;
        } else if (shape.type === "circle") {
          this.dragOffsetX = worldPos.x - shape.centerX;
          this.dragOffsetY = worldPos.y - shape.centerY;
        } else if (shape.type === "line") {
          this.dragOffsetX = worldPos.x - shape.startX;
          this.dragOffsetY = worldPos.y - shape.startY;
        } else if (shape.type === "path") {
          this.dragOffsetX = worldPos.x - shape.points[0].x;
          this.dragOffsetY = worldPos.y - shape.points[0].y;
        } else if (shape.type === "text") {
          this.dragOffsetX = worldPos.x - shape.x;
          this.dragOffsetY = worldPos.y - shape.y;
          
          // If text tool is selected, allow editing
          if (this.selectedTool === "text" as Tool) {
            this.canvas.dispatchEvent(new CustomEvent('textEdit', { 
              detail: { shapeId: shape.id, text: shape.text } 
            }));
          }
        }
      } else if (this.selectedTool === "rect" || this.selectedTool === "circle" || this.selectedTool === "line" || this.selectedTool === "text") {
        // For drawing tools, don't start panning - allow drawing
        console.log('Starting drawing with tool:', this.selectedTool);
        this.isDrawingShape = true;
        // Don't set isPanning = true for drawing tools
      } else {
        console.log('Starting panning');
        this.isPanning = true;
      }
    }
  };

  touchMoveHandler = (e: TouchEvent) => {
    e.preventDefault();
    
    // Handle palm scrolling
    if (this.isPalmScrolling && this.isPalmGesture(e.touches)) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      const deltaX = x - this.palmScrollStartX;
      const deltaY = y - this.palmScrollStartY;
      this.pan(deltaX, deltaY);
      this.palmScrollStartX = x;
      this.palmScrollStartY = y;
      return;
    }
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Handle resizing on touch
      if (this.isResizing && this.selectedShape && this.resizingHandle) {
        const worldPos = this.screenToWorld(x, y);
        this.resizeShape(this.selectedShape, this.resizingHandle, worldPos.x, worldPos.y);
        this.clearCanvas();
        
        // Send resize update to other users
        this.socket.send(JSON.stringify({
          type: "edit_shape",
          shape: this.selectedShape,
          roomId: this.roomId,
          isDragging: true
        }));
        return;
      }
      
      if (this.isDrawingPath) {
        // Continue drawing the path
        const worldPos = this.screenToWorld(x, y);
        this.currentPathPoints.push({ x: worldPos.x, y: worldPos.y });
        console.log('Drawing path, points:', this.currentPathPoints.length);
        this.clearCanvas();
        return;
      }
      
      if (this.isPanning) {
        const deltaX = x - this.startX;
        const deltaY = y - this.startY;
        this.pan(deltaX, deltaY);
        this.startX = x;
        this.startY = y;
      } else if (this.isDraggingShape && this.selectedShape) {
        const worldPos = this.screenToWorld(x, y);
        
        if (this.selectedShape.type === "rect") {
          this.selectedShape.x = worldPos.x - this.dragOffsetX;
          this.selectedShape.y = worldPos.y - this.dragOffsetY;
        } else if (this.selectedShape.type === "circle") {
          this.selectedShape.centerX = worldPos.x - this.dragOffsetX;
          this.selectedShape.centerY = worldPos.y - this.dragOffsetY;
        } else if (this.selectedShape.type === "line") {
          const dx = worldPos.x - this.dragOffsetX - this.selectedShape.startX;
          const dy = worldPos.y - this.dragOffsetY - this.selectedShape.startY;
          this.selectedShape.startX += dx;
          this.selectedShape.startY += dy;
          this.selectedShape.endX += dx;
          this.selectedShape.endY += dy;
        } else if (this.selectedShape.type === "path") {
          const dx = worldPos.x - this.dragOffsetX - this.selectedShape.points[0].x;
          const dy = worldPos.y - this.dragOffsetY - this.selectedShape.points[0].y;
          this.selectedShape.points = this.selectedShape.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        } else if (this.selectedShape.type === "text") {
          this.selectedShape.x = worldPos.x - this.dragOffsetX;
          this.selectedShape.y = worldPos.y - this.dragOffsetY;
        }
        
        this.socket.send(JSON.stringify({
          type: "edit_shape",
          shape: this.selectedShape,
          roomId: this.roomId,
          isDragging: true
        }));
        
        this.clearCanvas();
      } else if (this.isDrawingShape && !this.isPanning && !this.isDraggingShape) {
        // Update the current touch position for shape drawing
        this.currentTouchX = x;
        this.currentTouchY = y;
        
        console.log('Drawing shape preview, tool:', this.selectedTool, 'from', this.startX, this.startY, 'to', x, y);
        
        // Redraw canvas to show preview of the shape being drawn
        this.clearCanvas();
        this.drawShapePreview();
      }
    }
  };

  touchEndHandler = (e: TouchEvent) => {
    e.preventDefault();
    console.log('Touch end, isDrawingPath:', this.isDrawingPath, 'isDraggingShape:', this.isDraggingShape, 'isDrawingShape:', this.isDrawingShape);
    
    this.clicked = false;
    this.isPanning = false;
    
    // Finish palm scrolling
    if (this.isPalmScrolling) {
      this.isPalmScrolling = false;
      this.canvas.style.cursor = "crosshair";
      console.log('Palm scrolling ended');
      return;
    }
    
    // Finish resizing
    if (this.isResizing) {
      this.isResizing = false;
      this.resizingHandle = null;
      
      // Send final resize update
      if (this.selectedShape) {
        this.socket.send(JSON.stringify({
          type: "edit_shape",
          shape: this.selectedShape,
          roomId: this.roomId,
          isDragging: false
        }));
      }
      return;
    }
    
    // Finish freehand drawing
    if (this.isDrawingPath) {
      this.isDrawingPath = false;
      if (this.currentPathPoints.length > 1) {
        const shape: Shape = {
          id: this.generateShapeId(),
          type: "path",
          points: [...this.currentPathPoints]
        };
        console.log('Finished drawing path with', this.currentPathPoints.length, 'points');
        this.historyStack.push([...this.existingShapes]);
        this.existingShapes.push(shape);
        this.clearCanvas();
        this.socket.send(JSON.stringify({ type: "draw", shape, roomId: this.roomId }));
      }
      this.currentPathPoints = [];
      return;
    }
    
    if (this.isDraggingShape) {
      this.isDragging = false;
      this.isDraggingShape = false;
      
      if (this.selectedShape) {
        this.socket.send(JSON.stringify({
          type: "edit_shape",
          shape: this.selectedShape,
          roomId: this.roomId,
          isDragging: false
        }));
      }
      return;
    }
    
    // Create shapes with other tools (rect, circle, line)
    if (this.isDrawingShape && !this.isPanning && !this.isDraggingShape) {
      const rect = this.canvas.getBoundingClientRect();
      const endX = this.currentTouchX || this.startX; // Use current touch position if available
      const endY = this.currentTouchY || this.startY;
      
      const startWorldPos = this.screenToWorld(this.startX, this.startY);
      const endWorldPos = this.screenToWorld(endX, endY);
      
      const width = endWorldPos.x - startWorldPos.x;
      const height = endWorldPos.y - startWorldPos.y;
      
      let shape: Shape | null = null;
      
      if (this.selectedTool === "rect") {
        shape = {
          id: this.generateShapeId(),
          type: "rect",
          x: startWorldPos.x,
          y: startWorldPos.y,
          width: Math.abs(width),
          height: Math.abs(height),
          style: { ...this.currentStyle }
        };
      } else if (this.selectedTool === "circle") {
        const radius = Math.sqrt(width * width + height * height) / 2;
        shape = {
          id: this.generateShapeId(),
          type: "circle",
          centerX: startWorldPos.x + width / 2,
          centerY: startWorldPos.y + height / 2,
          radius,
          style: { ...this.currentStyle }
        };
      } else if (this.selectedTool === "line") {
        shape = {
          id: this.generateShapeId(),
          type: "line",
          startX: startWorldPos.x,
          startY: startWorldPos.y,
          endX: endWorldPos.x,
          endY: endWorldPos.y,
          style: { ...this.currentStyle }
        };
      }
      
      if (shape) {
        console.log('Created shape:', shape.type, shape);
        this.historyStack.push([...this.existingShapes]);
        this.existingShapes.push(shape);
        this.clearCanvas();
        
        this.socket.send(JSON.stringify({
          type: "draw",
          shape,
          roomId: this.roomId
        }));
      }
      this.isDrawingShape = false;
    }
  };

  private distancePointToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;

    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getShapeAtPosition(x: number, y: number): Shape | null {
    for (let i = this.existingShapes.length - 1; i >= 0; i--) {
      const shape = this.existingShapes[i];
      if (!shape || !shape.type || !(shape as any).id) continue; // Skip invalid shapes
      
      if (shape.type === "rect") {
        if (x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height)
          return shape;
      } else if (shape.type === "circle") {
        const dx = x - shape.centerX;
        const dy = y - shape.centerY;
        if (Math.sqrt(dx * dx + dy * dy) <= shape.radius)
          return shape;
      } else if (shape.type === "line") {
        const dist = this.distancePointToSegment(x, y, shape.startX, shape.startY, shape.endX, shape.endY);
        if (dist <= 5 / this.scale) return shape;
      } else if (shape.type === "path") {
        for (let j = 0; j < shape.points.length - 1; j++) {
          const p1 = shape.points[j];
          const p2 = shape.points[j + 1];
          const dist = this.distancePointToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
          if (dist <= 6 / this.scale) return shape;
        }
      } else if (shape.type === "text") {
        // Check if click is within text bounds
        // Create a temporary canvas context to measure text
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.font = `${shape.fontSize}px Arial`;
        const metrics = tempCtx.measureText(shape.text);
        const textWidth = metrics.width;
        const textHeight = shape.fontSize;
        
        if (x >= shape.x && 
            x <= shape.x + textWidth && 
            y >= shape.y - textHeight && 
            y <= shape.y) {
          return shape;
        }
      }
    }
    return null;
  }

  // Smooth drawing optimization
  private requestRedraw() {
    if (!this.needsRedraw) {
      this.needsRedraw = true;
      this.animationFrameId = requestAnimationFrame(() => {
        this.clearCanvas();
        this.needsRedraw = false;
      });
    }
  }

  // Improved text rendering with better fonts
  private renderText(text: string, x: number, y: number, fontSize: number, color: string, fontFamily: string = 'default') {
    this.ctx.save();
    
    // Set font with better rendering
    const font = this.textFonts[fontFamily] || this.textFonts['default'];
    this.ctx.font = font.replace('16px', `${fontSize}px`);
    this.ctx.fillStyle = color;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
    
    // Enable text rendering optimizations
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    // Add subtle text shadow for better readability
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    this.ctx.shadowBlur = 1;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 1;
    
    // Render text
    this.ctx.fillText(text, x, y);
    
    this.ctx.restore();
  }

  // Smooth path drawing with interpolation
  private drawSmoothPath(points: { x: number; y: number }[], style: ShapeStyle) {
    if (points.length < 2) return;
    
    this.ctx.save();
    this.ctx.strokeStyle = style.strokeColor;
    this.ctx.lineWidth = style.strokeWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    // Apply stroke style
    this.applyStrokeStyle(this.ctx, style.strokeStyle);
    
    this.ctx.beginPath();
    
    // Start with first point
    const firstPoint = this.worldToScreen(points[0].x, points[0].y);
    this.ctx.moveTo(firstPoint.x, firstPoint.y);
    
    // Draw smooth curve through points
    for (let i = 1; i < points.length - 1; i++) {
      const current = this.worldToScreen(points[i].x, points[i].y);
      const next = this.worldToScreen(points[i + 1].x, points[i + 1].y);
      
      // Calculate control points for smooth curve
      const cp1x = current.x + (next.x - (i > 0 ? this.worldToScreen(points[i - 1].x, points[i - 1].y).x : current.x)) * 0.3;
      const cp1y = current.y + (next.y - (i > 0 ? this.worldToScreen(points[i - 1].x, points[i - 1].y).y : current.y)) * 0.3;
      const cp2x = next.x - (next.x - current.x) * 0.3;
      const cp2y = next.y - (next.y - current.y) * 0.3;
      
      this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y);
    }
    
    // Handle last point
    if (points.length > 1) {
      const lastPoint = this.worldToScreen(points[points.length - 1].x, points[points.length - 1].y);
      this.ctx.lineTo(lastPoint.x, lastPoint.y);
    }
    
    this.ctx.stroke();
    this.ctx.restore();
  }

  clearCanvas() {
    // Cancel any pending animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Create a subtle grid background
    this.ctx.fillStyle = "#ffffff"; // White background for whiteboard
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw subtle grid lines with better performance
    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
    this.ctx.lineWidth = 1;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    const gridSize = 50 * this.scale;
    const startX = Math.floor(this.offsetX / gridSize) * gridSize;
    const startY = Math.floor(this.offsetY / gridSize) * gridSize;
    
    // Batch grid drawing for better performance
    this.ctx.beginPath();
    for (let x = startX; x <= this.canvas.width + gridSize; x += gridSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
    }
    for (let y = startY; y <= this.canvas.height + gridSize; y += gridSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
    }
    this.ctx.stroke();

    // Filter out any undefined or null shapes
    const validShapes = this.existingShapes.filter(shape => 
      shape && typeof shape === 'object' && shape.type && (shape as any).id
    );
    
    validShapes.forEach((shape) => {
      // Apply shape styling
      const style = shape.style || this.currentStyle;
      this.ctx.globalAlpha = style.opacity;
      
      // Apply stroke style
      if (this.selectedShape === shape) {
        this.ctx.strokeStyle = "#FCD34D"; // Yellow for selected
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
      } else {
        this.ctx.strokeStyle = style.strokeColor;
        this.ctx.lineWidth = style.strokeWidth;
        this.applyStrokeStyle(this.ctx, style.strokeStyle);
      }

      if (shape.type === "rect") {
        const screenPos = this.worldToScreen(shape.x, shape.y);
        const screenWidth = shape.width * this.scale;
        const screenHeight = shape.height * this.scale;
        
        // Apply gradient or solid fill
        if (style.gradient && style.gradient.type !== "none") {
          const gradient = this.applyGradient(this.ctx, shape, style.gradient);
          if (gradient) {
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
          }
        } else {
          this.ctx.fillStyle = style.fillColor;
          this.ctx.fillRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
        }
        
        this.ctx.strokeRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
      } else if (shape.type === "circle") {
        const screenPos = this.worldToScreen(shape.centerX, shape.centerY);
        const screenRadius = Math.abs(shape.radius) * this.scale;
        
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
        
        // Apply gradient or solid fill
        if (style.gradient && style.gradient.type !== "none") {
          const gradient = this.applyGradient(this.ctx, shape, style.gradient);
          if (gradient) {
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
          }
        } else {
          this.ctx.fillStyle = style.fillColor;
          this.ctx.fill();
        }
        
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "line") {
        const startPos = this.worldToScreen(shape.startX, shape.startY);
        const endPos = this.worldToScreen(shape.endX, shape.endY);
        this.ctx.beginPath();
        this.ctx.moveTo(startPos.x, startPos.y);
        this.ctx.lineTo(endPos.x, endPos.y);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "path") {
        if (shape.points.length > 1) {
          // Use smooth path drawing for better quality
          this.drawSmoothPath(shape.points, style);
        }
      } else if (shape.type === "text") {
        const screenPos = this.worldToScreen(shape.x, shape.y);
        // Keep text size consistent regardless of zoom level
        const baseFontSize = shape.fontSize || 16;
        const adjustedFontSize = Math.max(12, baseFontSize / this.scale);
        
        // Use text color from style or fallback to shape color
        const textColor = shape.style?.textColor || shape.color || "#000000";
        
        // Use improved text rendering
        this.renderText(shape.text, screenPos.x, screenPos.y, adjustedFontSize, textColor, 'default');
        
        // Draw selection border for text
        if (this.selectedShape === shape) {
          const metrics = this.ctx.measureText(shape.text);
          const textWidth = metrics.width;
          const textHeight = shape.fontSize * this.scale;
          
          this.ctx.strokeStyle = "#FCD34D";
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(
            screenPos.x - 2, 
            screenPos.y - 2, 
            textWidth + 4, 
            textHeight + 4
          );
          
          // Draw text cursor if typing and blinking
          if (this.selectedTool === "text" && this.cursorBlink) {
            const cursorX = screenPos.x + metrics.width;
            const cursorY = screenPos.y;
            const cursorHeight = textHeight;
            
            this.ctx.strokeStyle = "#FFFFFF"; // White cursor
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([]); // Solid line
            this.ctx.beginPath();
            this.ctx.moveTo(cursorX, cursorY);
            this.ctx.lineTo(cursorX, cursorY + cursorHeight);
            this.ctx.stroke();
          }
        }
      }
    });

    // If drawing a freehand path, render the preview with smooth drawing
    if (this.isDrawingPath && this.currentPathPoints.length > 1) {
      const previewStyle: ShapeStyle = {
        ...this.currentStyle,
        strokeColor: "#9CA3AF", // Gray for preview
        strokeWidth: 2
      };
      this.drawSmoothPath(this.currentPathPoints, previewStyle);
    }

    // Draw resize handles for selected shape
    if (this.selectedShape && (this.selectedShape.type === "rect" || this.selectedShape.type === "circle" || this.selectedShape.type === "text")) {
      const handles = this.getResizeHandles(this.selectedShape);
      
      console.log('Drawing', handles.length, 'resize handles for', this.selectedShape.type);
      
      this.ctx.fillStyle = "#4ECDC4"; // Teal handles for better visibility (less pinkish)
      this.ctx.strokeStyle = "#FFFFFF"; // White border
      this.ctx.lineWidth = 2;
      
      handles.forEach(handle => {
        this.ctx.fillRect(handle.x, handle.y, handle.width, handle.height);
        this.ctx.strokeRect(handle.x, handle.y, handle.width, handle.height);
      });
    }

    // Draw palm scrolling indicator
    if (this.isPalmScrolling) {
          this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
              this.ctx.fillStyle = "#000000";
      this.ctx.font = "24px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("Palm Scrolling Active", this.canvas.width / 2, this.canvas.height / 2);
    }

    // Draw clipboard indicator
    if (this.clipboardShapes.length > 0) {
      this.ctx.fillStyle = "rgba(76, 205, 196, 0.2)";
      this.ctx.fillRect(10, 10, 200, 40);
      
      this.ctx.fillStyle = "#3B82F6";
      this.ctx.font = "14px Arial";
      this.ctx.textAlign = "left";
      this.ctx.fillText(`Clipboard: ${this.clipboardShapes.length} shape(s)`, 20, 30);
      this.ctx.fillText("Ctrl+V to paste", 20, 50);
    }
  }

  // Note: touchStartHandler, touchMoveHandler, and touchEndHandler are already defined above - removing duplicates

  mouseDownHandler = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.startX = x;
    this.startY = y;

    if (e.button === 0) { // Left click
      const worldPos = this.screenToWorld(x, y);

      // Start freehand path if pencil selected
      if (this.selectedTool === "pencil") {
        this.isDrawingPath = true;
        this.clicked = true;
        this.currentPathPoints = [{ x: worldPos.x, y: worldPos.y }];
        this.clearCanvas();
        return;
      }

      // Handle color picker tool
      if (this.selectedTool === "colorpicker" as Tool) {
        const shape = this.getShapeAtPosition(worldPos.x, worldPos.y);
        if (shape && shape.style) {
          // Copy the shape's colors to current style
          this.currentStyle.fillColor = shape.style.fillColor;
          this.currentStyle.strokeColor = shape.style.strokeColor;
          this.currentStyle.textColor = shape.style.textColor;
          
          // Emit event to update UI
          this.canvas.dispatchEvent(new CustomEvent('colorPicked', { 
            detail: { 
              fillColor: shape.style.fillColor,
              strokeColor: shape.style.strokeColor,
              textColor: shape.style.textColor
            } 
          }));
          
          console.log('Color picked from shape:', {
            fillColor: shape.style.fillColor,
            strokeColor: shape.style.strokeColor,
            textColor: shape.style.textColor
          });
        }
        return;
      }

      // Handle text tool
      if (this.selectedTool === "text" as Tool) {
        // Create a new text shape
        const textShape: Shape = {
          id: this.generateShapeId(),
          type: "text",
          x: worldPos.x,
          y: worldPos.y,
          text: "",
          fontSize: 16,
          color: this.currentStyle.textColor || "#1565C0",
          style: { ...this.currentStyle }
        };
        
        this.historyStack.push([...this.existingShapes]);
        this.existingShapes.push(textShape);
        this.selectedShape = textShape;
        this.clearCanvas();
        
        // Send to other users
        this.socket.send(JSON.stringify({ 
          type: "draw", 
          shape: textShape, 
          roomId: this.roomId 
        }));
        
        // Emit event for text editing
        this.canvas.dispatchEvent(new CustomEvent('textEdit', { 
          detail: { shapeId: textShape.id, text: "" } 
        }));
        
        // Start cursor blinking
        this.startCursorBlink();
        
        return;
      }

      // Check for resize handles first
      const resizeHandle = this.getResizeHandleAtPosition(x, y);
      if (resizeHandle) {
        console.log('Starting resize:', resizeHandle.handle, 'on shape:', resizeHandle.shape.type);
        this.isResizing = true;
        this.resizingHandle = resizeHandle.handle;
        this.resizeStartX = worldPos.x;
        this.resizeStartY = worldPos.y;
        this.originalShape = JSON.parse(JSON.stringify(resizeHandle.shape)); // Deep copy
        this.canvas.style.cursor = "nw-resize";
        return;
      }

      const shape = this.getShapeAtPosition(worldPos.x, worldPos.y);
      
      if (shape) {
        this.selectedShape = shape;
        this.isDragging = true;
        this.isDraggingShape = true;

        // Calculate drag offset from the click position to the shape's reference point
        if (shape.type === "rect") {
          this.dragOffsetX = worldPos.x - shape.x;
          this.dragOffsetY = worldPos.y - shape.y;
        } else if (shape.type === "circle") {
          this.dragOffsetX = worldPos.x - shape.centerX;
          this.dragOffsetY = worldPos.y - shape.centerY;
        } else if (shape.type === "line") {
          // For lines, use the start point as reference
          this.dragOffsetX = worldPos.x - shape.startX;
          this.dragOffsetY = worldPos.y - shape.startY;
        } else if (shape.type === "path") {
          this.dragOffsetX = worldPos.x - shape.points[0].x;
          this.dragOffsetY = worldPos.y - shape.points[0].y;
        } else if (shape.type === "text") {
          this.dragOffsetX = worldPos.x - shape.x;
          this.dragOffsetY = worldPos.y - shape.y;
          
          // If text tool is selected, allow editing
          if (this.selectedTool === "text" as Tool) {
            this.canvas.dispatchEvent(new CustomEvent('textEdit', { 
              detail: { shapeId: shape.id, text: shape.text } 
            }));
          }
        }
      } else {
        this.isDraggingShape = false;
        this.selectedShape = null;
      }

      this.clicked = true;
    } else if (e.button === 2) { // Right click
      e.preventDefault();
      this.isPanning = true;
      this.canvas.style.cursor = "grab";
    }
  };

  mouseUpHandler = (e: MouseEvent) => {
    this.clicked = false;

    if (e.button === 0) { // Left click
      // Finish resizing
      if (this.isResizing) {
        this.isResizing = false;
        this.resizingHandle = null;
        this.canvas.style.cursor = "crosshair";
        
        // Send final resize update
        if (this.selectedShape) {
          this.socket.send(JSON.stringify({
            type: "edit_shape",
            shape: this.selectedShape,
            roomId: this.roomId,
            isDragging: false
          }));
        }
        return;
      }

      // Finish freehand drawing
      if (this.isDrawingPath) {
        this.isDrawingPath = false;
        if (this.currentPathPoints.length > 1) {
          const shape: Shape = {
            id: this.generateShapeId(),
            type: "path",
            points: [...this.currentPathPoints],
            style: { ...this.currentStyle }
          };
          this.historyStack.push([...this.existingShapes]);
          this.existingShapes.push(shape);
          this.clearCanvas();
          this.socket.send(JSON.stringify({ type: "draw", shape, roomId: this.roomId }));
        }
        this.currentPathPoints = [];
        return;
      }

      if (this.isDraggingShape) {
        this.isDragging = false;
        this.isDraggingShape = false;
        
        // Send final position update when dragging stops
        if (this.selectedShape) {
          this.socket.send(JSON.stringify({
            type: "edit_shape",
            shape: this.selectedShape,
            roomId: this.roomId,
            isDragging: false
          }));
        }
        return;
      }

      const endX = e.clientX - this.canvas.getBoundingClientRect().left;
      const endY = e.clientY - this.canvas.getBoundingClientRect().top;
      
      const startWorldPos = this.screenToWorld(this.startX, this.startY);
      const endWorldPos = this.screenToWorld(endX, endY);
      
      const width = endWorldPos.x - startWorldPos.x;
      const height = endWorldPos.y - startWorldPos.y;

      let shape: Shape | null = null;

      if (this.selectedTool === "rect") {
        shape = {
          id: this.generateShapeId(),
          type: "rect",
          x: startWorldPos.x,
          y: startWorldPos.y,
          width,
          height,
          style: { ...this.currentStyle }
        };
      } else if (this.selectedTool === "circle") {
        const radius = Math.sqrt(width * width + height * height) / 2;
        shape = {
          id: this.generateShapeId(),
          type: "circle",
          centerX: startWorldPos.x + width / 2,
          centerY: startWorldPos.y + height / 2,
          radius,
          style: { ...this.currentStyle }
        };
      } else if (this.selectedTool === "line") {
        shape = {
          id: this.generateShapeId(),
          type: "line",
          startX: startWorldPos.x,
          startY: startWorldPos.y,
          endX: endWorldPos.x,
          endY: endWorldPos.y,
          style: { ...this.currentStyle }
        };
      }

      if (!shape) return;

      this.historyStack.push([...this.existingShapes]);
      this.existingShapes.push(shape);
      this.clearCanvas();

      this.socket.send(JSON.stringify({
        type: "draw",
        shape,
        roomId: this.roomId
      }));
    } else if (e.button === 2) { // Right click
      this.isPanning = false;
      this.canvas.style.cursor = "crosshair";
    }
  };

  mouseMoveHandler = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle resizing
    if (this.isResizing && this.selectedShape && this.resizingHandle) {
      const worldPos = this.screenToWorld(x, y);
      this.resizeShape(this.selectedShape, this.resizingHandle, worldPos.x, worldPos.y);
      this.clearCanvas();
      
      // Send resize update to other users
      this.socket.send(JSON.stringify({
        type: "edit_shape",
        shape: this.selectedShape,
        roomId: this.roomId,
        isDragging: true
      }));
      return;
    }

    if (this.isPanning) {
      const deltaX = x - this.startX;
      const deltaY = y - this.startY;
      this.pan(deltaX, deltaY);
      this.startX = x;
      this.startY = y;
      return;
    }

    // Freehand drawing in progress
    if (this.isDrawingPath && this.clicked) {
      const worldPos = this.screenToWorld(x, y);
      this.currentPathPoints.push({ x: worldPos.x, y: worldPos.y });
      this.clearCanvas();
      return;
    }

    if (this.clicked && this.isDragging && this.selectedShape) {
      // Update shape position during drag
      const worldPos = this.screenToWorld(x, y);
      
      if (this.selectedShape.type === "rect") {
        this.selectedShape.x = worldPos.x - this.dragOffsetX;
        this.selectedShape.y = worldPos.y - this.dragOffsetY;
      } else if (this.selectedShape.type === "circle") {
        this.selectedShape.centerX = worldPos.x - this.dragOffsetX;
        this.selectedShape.centerY = worldPos.y - this.dragOffsetY;
      } else if (this.selectedShape.type === "line") {
        const dx = worldPos.x - this.dragOffsetX - this.selectedShape.startX;
        const dy = worldPos.y - this.dragOffsetY - this.selectedShape.startY;
        this.selectedShape.startX += dx;
        this.selectedShape.startY += dy;
        this.selectedShape.endX += dx;
        this.selectedShape.endY += dy;
      } else if (this.selectedShape.type === "path") {
        const dx = worldPos.x - this.dragOffsetX - this.selectedShape.points[0].x;
        const dy = worldPos.y - this.dragOffsetY - this.selectedShape.points[0].y;
        this.selectedShape.points = this.selectedShape.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
      }
      this.socket.send(JSON.stringify({
        type: "edit_shape",
        shape: this.selectedShape,
        roomId: this.roomId,
        isDragging: true
      }));

      this.clearCanvas();
      return;
    }

    if (this.clicked && !this.isDragging) {
      const startWorldPos = this.screenToWorld(this.startX, this.startY);
      const currentWorldPos = this.screenToWorld(x, y);
      
      const width = currentWorldPos.x - startWorldPos.x;
      const height = currentWorldPos.y - startWorldPos.y;
      
      this.clearCanvas();
      
      // Set preview color based on selected tool
      if (this.selectedTool === "line") {
        this.ctx.strokeStyle = "#4ECDC4"; // Teal for lines
      } else if (this.selectedTool === "rect") {
        this.ctx.strokeStyle = "#FF6B6B"; // Red for rectangles
      } else if (this.selectedTool === "circle") {
        this.ctx.strokeStyle = "#96CEB4"; // Green for circles
      } else if (this.selectedTool === "pencil") {
        this.ctx.strokeStyle = "#9CA3AF"; // Gray for pencil preview
      }
      
      this.ctx.lineWidth = 2;

      if (this.selectedTool === "rect") {
        const screenPos = this.worldToScreen(startWorldPos.x, startWorldPos.y);
        const screenWidth = width * this.scale;
        const screenHeight = height * this.scale;
        this.ctx.strokeRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
      } else if (this.selectedTool === "circle") {
        const radius = Math.sqrt(width * width + height * height) / 2;
        const centerWorldX = startWorldPos.x + width / 2;
        const centerWorldY = startWorldPos.y + height / 2;
        const screenPos = this.worldToScreen(centerWorldX, centerWorldY);
        const screenRadius = radius * this.scale;
        
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (this.selectedTool === "line") {
        const startPos = this.worldToScreen(startWorldPos.x, startWorldPos.y);
        const endPos = this.worldToScreen(currentWorldPos.x, currentWorldPos.y);
        
        this.ctx.beginPath();
        this.ctx.moveTo(startPos.x, startPos.y);
        this.ctx.lineTo(endPos.x, endPos.y);
        this.ctx.stroke();
        this.ctx.closePath();
      }
    }
  };

  wheelHandler = (e: WheelEvent) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;
    
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoom(factor, centerX, centerY);
  };

  contextMenuHandler = (e: Event) => {
    e.preventDefault();
  };

  initMouseHandlers() {
    // Mouse events
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.addEventListener("wheel", this.wheelHandler);
    this.canvas.addEventListener("contextmenu", this.contextMenuHandler);

    // Touch events for mobile
    this.canvas.addEventListener("touchstart", this.touchStartHandler, { passive: false });
    this.canvas.addEventListener("touchend", this.touchEndHandler, { passive: false });
    this.canvas.addEventListener("touchmove", this.touchMoveHandler, { passive: false });

    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const worldPos = this.screenToWorld(x, y);
      const shape = this.getShapeAtPosition(worldPos.x, worldPos.y);
      
      if (shape) {
        if (this.selectedTool === "erase") {
          // Erase the shape
          this.existingShapes = this.existingShapes.filter(s => s.id !== shape.id);
          this.clearCanvas();
          
          // Send erase message to other users
          this.socket.send(JSON.stringify({
            type: "erase",
            shapeId: shape.id,
            roomId: this.roomId
          }));
        } else {
          // Select the shape for editing
          this.selectedShape = shape;
          if (shape.type === "rect") {
            this.dragOffsetX = worldPos.x - shape.x;
            this.dragOffsetY = worldPos.y - shape.y;
          } else if (shape.type === "circle") {
            this.dragOffsetX = worldPos.x - shape.centerX;
            this.dragOffsetY = worldPos.y - shape.centerY;
          } else if (shape.type === "line") {
            this.dragOffsetX = worldPos.x - shape.startX;
            this.dragOffsetY = worldPos.y - shape.startY;
          } else if (shape.type === "path") {
            this.dragOffsetX = worldPos.x - shape.points[0].x;
            this.dragOffsetY = worldPos.y - shape.points[0].y;
          }
          this.clearCanvas();
        }
      } else {
        this.selectedShape = null;
        this.clearCanvas();
      }
    });
  }

  // Draw preview of shape being drawn
  private drawShapePreview() {
    if (!this.isDrawingShape || this.isPanning || this.isDraggingShape) return;
    
    const startWorldPos = this.screenToWorld(this.startX, this.startY);
    const endWorldPos = this.screenToWorld(this.currentTouchX, this.currentTouchY);
    
    this.ctx.save();
    this.ctx.strokeStyle = '#4ECDC4';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    
    if (this.selectedTool === "rect") {
      const width = endWorldPos.x - startWorldPos.x;
      const height = endWorldPos.y - startWorldPos.y;
      const screenStart = this.worldToScreen(startWorldPos.x, startWorldPos.y);
      const screenEnd = this.worldToScreen(startWorldPos.x + width, startWorldPos.y + height);
      
      this.ctx.strokeRect(screenStart.x, screenStart.y, screenEnd.x - screenStart.x, screenEnd.y - screenStart.y);
    } else if (this.selectedTool === "circle") {
      const width = endWorldPos.x - startWorldPos.x;
      const height = endWorldPos.y - startWorldPos.y;
      const radius = Math.sqrt(width * width + height * height) / 2;
      const centerX = startWorldPos.x + width / 2;
      const centerY = startWorldPos.y + height / 2;
      const screenCenter = this.worldToScreen(centerX, centerY);
      const screenRadius = radius * this.scale;
      
      this.ctx.beginPath();
      this.ctx.arc(screenCenter.x, screenCenter.y, screenRadius, 0, 2 * Math.PI);
      this.ctx.stroke();
    } else if (this.selectedTool === "line") {
      const screenStart = this.worldToScreen(startWorldPos.x, startWorldPos.y);
      const screenEnd = this.worldToScreen(endWorldPos.x, endWorldPos.y);
      
      this.ctx.beginPath();
      this.ctx.moveTo(screenStart.x, screenStart.y);
      this.ctx.lineTo(screenEnd.x, screenEnd.y);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }
}