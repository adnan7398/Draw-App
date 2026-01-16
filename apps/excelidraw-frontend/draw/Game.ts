import { Tool } from "@/component/types";
import { getExistingShapes } from "./http";

type GradientType = "linear" | "radial" | "none";
type StrokePattern = "solid" | "dashed" | "dotted" | "dash-dot";

interface Gradient {
  type: GradientType;
  colors: string[];
  stops: number[];
  angle?: number;
  centerX?: number;
  centerY?: number;
}

interface StrokeStyle {
  type: StrokePattern;
  width: number;
  dashArray?: number[];
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
      type: "ellipse";
      x: number;
      y: number;
      width: number;
      height: number;
      style?: ShapeStyle;
    }
  | {
      id: string;
      type: "triangle";
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
  
  private animationFrameId: number | null = null;
  private needsRedraw: boolean = false;
  private lastDrawTime: number = 0;
  private drawThrottle: number = 16;
  
  private textFonts: { [key: string]: string } = {
    'default': '16px Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    'heading': '20px Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    'large': '24px Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    'small': '14px Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    'mono': '14px "Roboto Mono", "SF Mono", Monaco, monospace'
  };
  
  private drawingBuffer: { x: number; y: number }[] = [];
  private smoothingFactor: number = 0.3;
  private lastPoint: { x: number; y: number } | null = null;
  private cursorBlink: boolean = true;
  private cursorBlinkInterval: NodeJS.Timeout | null = null;
  
  private isPanning: boolean = false;
  private lastPanX: number = 0;
  private lastPanY: number = 0;
  private minScale = 0.1;
  private maxScale = 5;
  private viewportWidth: number = 0;
  private viewportHeight: number = 0;

  
  private keyDownHandler!: (e: KeyboardEvent) => void;
  private keyUpHandler!: (e: KeyboardEvent) => void;

  
  private isDrawingPath: boolean = false;
  private currentPathPoints: { x: number; y: number }[] = [];
  private currentTouchX: number = 0;
  private currentTouchY: number = 0;
  
  
  private isDrawingShape: boolean = false;
  
  
  private isPalmScrolling: boolean = false;
  private palmScrollStartX: number = 0;
  private palmScrollStartY: number = 0;
  private clipboardShapes: Shape[] = [];
  private clipboardOffsetX: number = 0;
  private clipboardOffsetY: number = 0;
  private isPasting: boolean = false;
  
  
  private panStartX: number = 0;
  private panStartY: number = 0;
  private panStartOffsetX: number = 0;
  private panStartOffsetY: number = 0;
  
  
  private currentStyle: ShapeStyle = {
    fillColor: "transparent",
    strokeColor: "#1976D2",
    strokeWidth: 2,
    strokeStyle: { type: "solid", width: 2 },
    opacity: 1
  };
  private layers: { id: string; name: string; visible: boolean; shapes: Shape[] }[] = [];
  private activeLayerId: string = "default";

  socket: WebSocket;

  
  private currentUserId!: string;
  private remoteCursors: Map<string, { x: number; y: number; username: string; color: string; lastUpdate: number; isDrawing: boolean }> = new Map();
  private lastCursorUpdate: number = 0;
  private cursorUpdateThrottle: number = 50; 

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.roomId = roomId;
    this.socket = socket;
    this.clicked = false;
    
    
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
    this.initTouchHandlers();
    this.initKeyboardHandlers();
  }

  destroy() {
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
    }
    
    
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.removeEventListener("wheel", this.wheelHandler);
    this.canvas.removeEventListener("contextmenu", this.contextMenuHandler);
    
    
    this.canvas.removeEventListener("touchstart", this.touchStartHandler);
    this.canvas.removeEventListener("touchmove", this.touchMoveHandler);
    this.canvas.removeEventListener("touchend", this.touchEndHandler);
    
    
    document.removeEventListener("keydown", this.keyDownHandler);
    document.removeEventListener("keyup", this.keyUpHandler);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  private generateShapeId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  private getResizeHandles(shape: Shape): { x: number; y: number; width: number; height: number; handle: string }[] {
    const handles: { x: number; y: number; width: number; height: number; handle: string }[] = [];
    const handleSize = 16;
    
    if (shape.type === "rect" || shape.type === "ellipse" || shape.type === "triangle") {
      const screenPos = this.worldToScreen(shape.x, shape.y);
      const screenWidth = shape.width * this.scale;
      const screenHeight = shape.height * this.scale;
      
      
      handles.push({ x: screenPos.x - handleSize/2, y: screenPos.y - handleSize/2, width: handleSize, height: handleSize, handle: "nw" });
      handles.push({ x: screenPos.x + screenWidth - handleSize/2, y: screenPos.y - handleSize/2, width: handleSize, height: handleSize, handle: "ne" });
      handles.push({ x: screenPos.x - handleSize/2, y: screenPos.y + screenHeight - handleSize/2, width: handleSize, height: handleSize, handle: "sw" });
      handles.push({ x: screenPos.x + screenWidth - handleSize/2, y: screenPos.y + screenHeight - handleSize/2, width: handleSize, height: handleSize, handle: "se" });
      
      
      handles.push({ x: screenPos.x + screenWidth/2 - handleSize/2, y: screenPos.y - handleSize/2, width: handleSize, height: handleSize, handle: "n" });
      handles.push({ x: screenPos.x + screenWidth/2 - handleSize/2, y: screenPos.y + screenHeight - handleSize/2, width: handleSize, height: handleSize, handle: "s" });
      handles.push({ x: screenPos.x - handleSize/2, y: screenPos.y + screenHeight/2 - handleSize/2, width: handleSize, height: handleSize, handle: "w" });
      handles.push({ x: screenPos.x + screenWidth - handleSize/2, y: screenPos.y + screenHeight/2 - handleSize/2, width: handleSize, height: handleSize, handle: "e" });
      
    } else if (shape.type === "circle") {
      const screenPos = this.worldToScreen(shape.centerX, shape.centerY);
      const screenRadius = shape.radius * this.scale;
      
      
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x = screenPos.x + Math.cos(angle) * screenRadius - handleSize/2;
        const y = screenPos.y + Math.sin(angle) * screenRadius - handleSize/2;
        handles.push({ x, y, width: handleSize, height: handleSize, handle: `circle-${i}` });
      }
      
    } else if (shape.type === "text") {
      const screenPos = this.worldToScreen(shape.x, shape.y);
      
      
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.font = `${shape.fontSize * this.scale}px Arial`;
      const metrics = tempCtx.measureText(shape.text);
      const textWidth = metrics.width;
      const textHeight = shape.fontSize * this.scale;
      
      
      handles.push({ x: screenPos.x - handleSize/2, y: screenPos.y - textHeight - handleSize/2, width: handleSize, height: handleSize, handle: "nw" });
      handles.push({ x: screenPos.x + textWidth - handleSize/2, y: screenPos.y - textHeight - handleSize/2, width: handleSize, height: handleSize, handle: "ne" });
      handles.push({ x: screenPos.x - handleSize/2, y: screenPos.y - handleSize/2, width: handleSize, height: handleSize, handle: "sw" });
      handles.push({ x: screenPos.x + textWidth - handleSize/2, y: screenPos.y - handleSize/2, width: handleSize, height: handleSize, handle: "se" });
    }
    
    return handles;
  }

  
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

  
  private resizeShape(shape: Shape, handle: string, newX: number, newY: number) {
    if (!this.originalShape) return;
    
    console.log('Resizing shape:', shape.type, 'handle:', handle, 'newPos:', newX, newY);
    
    if (shape.type === "rect" || shape.type === "ellipse" || shape.type === "triangle") {
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
      
      
      shape.width = Math.max(10, shape.width);
      shape.height = Math.max(10, shape.height);
      
    } else if (shape.type === "circle") {
      const originalCircle = this.originalShape as any;
      const totalDeltaX = newX - this.resizeStartX;
      const totalDeltaY = newY - this.resizeStartY;
      
      
      const handleIndex = parseInt(handle.split('-')[1]);
      const angle = (handleIndex * Math.PI) / 4;
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      
      
      const radiusDelta = (cosAngle * totalDeltaX + sinAngle * totalDeltaY);
      shape.radius = Math.max(5, originalCircle.radius + radiusDelta);
      
    } else if (shape.type === "text") {
      const originalText = this.originalShape as any;
      const totalDeltaX = newX - this.resizeStartX;
      const totalDeltaY = newY - this.resizeStartY;
      
      
      const scaleFactor = 1 + (totalDeltaX + totalDeltaY) / 200; 
      const newFontSize = Math.max(8, Math.min(72, originalText.fontSize * scaleFactor));
      shape.fontSize = newFontSize;
    }
  }

  cleanupShapes() {
    
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

  
  debugResizeHandles() {
    if (this.selectedShape) {
      const handles = this.getResizeHandles(this.selectedShape);
      console.log('Debug: Selected shape:', this.selectedShape.type);
      console.log('Debug: Resize handles:', handles);
    } else {
      console.log('Debug: No shape selected');
    }
  }

  
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

  
  startCursorBlink() {
    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
    }
    this.cursorBlink = true;
    this.cursorBlinkInterval = setInterval(() => {
      this.cursorBlink = !this.cursorBlink;
      this.clearCanvas();
    }, 500); 
  }

  
  stopCursorBlink() {
    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
      this.cursorBlinkInterval = null;
    }
    this.cursorBlink = false;
  }

  
  copyShapes() {
    if (this.selectedShape) {
      this.clipboardShapes = [JSON.parse(JSON.stringify(this.selectedShape))];
      console.log('Copied shape to clipboard:', this.selectedShape.type);
    }
  }

  
  cutShapes() {
    if (this.selectedShape) {
      this.copyShapes();
      this.existingShapes = this.existingShapes.filter(shape => shape.id !== this.selectedShape!.id);
      this.selectedShape = null;
      this.clearCanvas();
      console.log('Cut shape from canvas');
    }
  }

  
  pasteShapes(x: number, y: number) {
    if (this.clipboardShapes.length === 0) return;
    
    this.isPasting = true;
    const pastedShapes: Shape[] = [];
    
    this.clipboardShapes.forEach(shape => {
      const newShape = JSON.parse(JSON.stringify(shape));
      newShape.id = this.generateShapeId();
      
      
      if (pastedShapes.length === 0) {
        if (shape.type === "rect" || shape.type === "ellipse" || shape.type === "triangle" || shape.type === "text") {
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
      
      
      if (shape.type === "rect" || shape.type === "ellipse" || shape.type === "triangle") {
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

  
  private isPalmGesture(touches: TouchList): boolean {
    return touches.length >= 3;
  }

  
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
    
    this.currentStyle.textColor = color;
  }

  setDesignColor(color: string) {
    
    this.currentStyle.designColor = color;
  }

  getCurrentStyle(): ShapeStyle {
    return { ...this.currentStyle };
  }

  
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
      
      this.existingShapes = this.existingShapes.filter(shape => 
        shape && typeof shape === 'object' && shape.type && (shape as any).id
      );
      this.cleanupShapes(); 
      this.clearCanvas();
      
      
      this.viewportWidth = this.canvas.width;
      this.viewportHeight = this.canvas.height;
      
      
      this.offsetX = this.viewportWidth / 2;
      this.offsetY = this.viewportHeight / 2;
      
    } catch (error) {
      console.error("Error loading existing shapes:", error);
      this.existingShapes = [];
    }
    
    
    setInterval(() => {
      this.cleanupShapes();
    }, 10000); 
  }

  
  public screenToWorld(screenX: number, screenY: number): { x: number, y: number } {
    return {
      x: (screenX - this.offsetX) / this.scale,
      y: (screenY - this.offsetY) / this.scale
    };
  }

  
  private worldToScreen(worldX: number, worldY: number): { x: number, y: number } {
    return {
      x: worldX * this.scale + this.offsetX,
      y: worldY * this.scale + this.offsetY
    };
  }

  
  private pan(deltaX: number, deltaY: number) {
    this.offsetX += deltaX;
    this.offsetY += deltaY;
    this.clearCanvas();
  }

  
  private zoom(factor: number, centerX: number, centerY: number) {
    const oldScale = this.scale;
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * factor));
    
    
    if (this.scale !== oldScale) {
      const scaleRatio = this.scale / oldScale;
      this.offsetX = centerX - (centerX - this.offsetX) * scaleRatio;
      this.offsetY = centerY - (centerY - this.offsetY) * scaleRatio;
      this.clearCanvas();
    }
  }

  
  private resetView() {
    if (this.existingShapes.length === 0) {
      this.offsetX = this.viewportWidth / 2;
      this.offsetY = this.viewportHeight / 2;
      this.scale = 1;
    } else {
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      this.existingShapes.forEach(shape => {
        if (shape.type === "rect" || shape.type === "ellipse" || shape.type === "triangle") {
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
      
      
      const padding = 100;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;
      
      
      const shapeWidth = maxX - minX;
      const shapeHeight = maxY - minY;
      const scaleX = this.viewportWidth / shapeWidth;
      const scaleY = this.viewportHeight / shapeHeight;
      this.scale = Math.min(scaleX, scaleY, 1); 
      
      
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
              
              if (!this.existingShapes.find(s => s.id === parsedData.shape.id)) {
                this.existingShapes.push(parsedData.shape);
                this.clearCanvas();
              }
            }
          } catch (e) {
            
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
        } else if (message.type === "cursor_update") {
          const { userId, userName, x, y, color, isDrawing } = message;
          this.updateRemoteCursor(userId, x, y, userName, color, isDrawing);
        } else if (message.type === "participant_count_update") {
          
          console.log("Participant count updated:", message.count);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (this.historyStack.length > 0) {
          const previousState = this.historyStack.pop()!;
          
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
        case "c":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.copyShapes();
          }
          break;
        case "p":
          if (!e.ctrlKey && !e.metaKey) {
            
            const x = this.canvas.width / 2;
            const y = this.canvas.height / 2;
            const worldPos = this.screenToWorld(x, y);
            this.updateRemoteCursor('test-user', worldPos.x, worldPos.y, 'Test User', '#FF0000', false);
            console.log('Added test cursor at center of canvas');
          }
          break;
        case "h":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            
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
      
      
      if (this.selectedTool === "pencil") {
        console.log('Starting pencil drawing');
        this.isDrawingPath = true;
        this.currentPathPoints = [{ x: worldPos.x, y: worldPos.y }];
        this.clearCanvas();
        return;
      }
      
      
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

      
      if (this.selectedTool === "text" as Tool) {
        
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
        
        
        this.socket.send(JSON.stringify({ 
          type: "draw", 
          shape: textShape, 
          roomId: this.roomId 
        }));
        
        
        this.canvas.dispatchEvent(new CustomEvent('textEdit', { 
          detail: { shapeId: textShape.id, text: "" } 
        }));
        
        
        this.startCursorBlink();
        
        return;
      }
      
      
      const resizeHandle = this.getResizeHandleAtPosition(x, y);
      if (resizeHandle) {
        this.isResizing = true;
        this.resizingHandle = resizeHandle.handle;
        this.resizeStartX = worldPos.x;
        this.resizeStartY = worldPos.y;
        this.originalShape = JSON.parse(JSON.stringify(resizeHandle.shape)); 
        return;
      }

      const shape = this.getShapeAtPosition(worldPos.x, worldPos.y);
      
      if (shape) {
        console.log('Touching existing shape:', shape.type);
        this.selectedShape = shape;
        this.isDragging = true;
        this.isDraggingShape = true;
        
        if (shape.type === "rect" || shape.type === "ellipse" || shape.type === "triangle") {
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
          
          
          if (this.selectedTool === "text" as Tool) {
            this.canvas.dispatchEvent(new CustomEvent('textEdit', { 
              detail: { shapeId: shape.id, text: shape.text } 
            }));
          }
        }
      } else if (
        this.selectedTool === "rect" ||
        this.selectedTool === "ellipse" ||
        this.selectedTool === "triangle" ||
        this.selectedTool === "circle" ||
        this.selectedTool === "line" ||
        this.selectedTool === "text"
      ) {
        
        console.log('Starting drawing with tool:', this.selectedTool);
        this.isDrawingShape = true;
        
      } else {
        console.log('Starting panning');
        this.isPanning = true;
      }
    }
  };

  touchMoveHandler = (e: TouchEvent) => {
    e.preventDefault();
    
    
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
      
      
      if (this.isResizing && this.selectedShape && this.resizingHandle) {
        const worldPos = this.screenToWorld(x, y);
        this.resizeShape(this.selectedShape, this.resizingHandle, worldPos.x, worldPos.y);
        this.clearCanvas();
        
        
        this.socket.send(JSON.stringify({
          type: "edit_shape",
          shape: this.selectedShape,
          roomId: this.roomId,
          isDragging: true
        }));
        return;
      }
      
      if (this.isDrawingPath) {
        
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
        
        this.currentTouchX = x;
        this.currentTouchY = y;
        
        console.log('Drawing shape preview, tool:', this.selectedTool, 'from', this.startX, this.startY, 'to', x, y);
        
        
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
    
    
    if (this.isPalmScrolling) {
      this.isPalmScrolling = false;
      this.canvas.style.cursor = "crosshair";
      console.log('Palm scrolling ended');
      return;
    }
    
    
    if (this.isResizing) {
      this.isResizing = false;
      this.resizingHandle = null;
      
      
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
    
    
    if (this.isDrawingPath) {
      this.isDrawingPath = false;
      if (this.currentPathPoints.length > 1) {
        
        const recognizedShape = this.analyzeShape(this.currentPathPoints);
        
        let shape: Shape;
        
        if (recognizedShape && recognizedShape.confidence > 0.6) {
          
          shape = {
            id: this.generateShapeId(),
            type: recognizedShape.type as any,
            ...recognizedShape.shape,
            style: { ...this.currentStyle }
          };
          
          console.log(`Shape recognized as ${recognizedShape.type} with confidence ${recognizedShape.confidence}`);
          this.showShapeRecognitionNotification(recognizedShape.type, recognizedShape.confidence);
        } else {
          
          shape = {
            id: this.generateShapeId(),
            type: "path",
            points: [...this.currentPathPoints],
            style: { ...this.currentStyle }
          };
          console.log('No shape recognized, using path');
        }
        
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
    
    
      if (this.isDrawingShape && !this.isPanning && !this.isDraggingShape) {
      const rect = this.canvas.getBoundingClientRect();
      const endX = this.currentTouchX || this.startX; 
      const endY = this.currentTouchY || this.startY;
      
      const startWorldPos = this.screenToWorld(this.startX, this.startY);
      const endWorldPos = this.screenToWorld(endX, endY);
      
      const width = endWorldPos.x - startWorldPos.x;
      const height = endWorldPos.y - startWorldPos.y;
      
      let shape: Shape | null = null;
      
      if (this.selectedTool === "rect" || this.selectedTool === "ellipse" || this.selectedTool === "triangle") {
        shape = {
          id: this.generateShapeId(),
          type: this.selectedTool === "rect" ? "rect" : this.selectedTool === "ellipse" ? "ellipse" : "triangle",
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
      if (!shape || !shape.type || !(shape as any).id) continue; 
      
      if (shape.type === "rect" || shape.type === "ellipse" || shape.type === "triangle") {
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

  
  private requestRedraw() {
    if (!this.needsRedraw) {
      this.needsRedraw = true;
      this.animationFrameId = requestAnimationFrame(() => {
        this.clearCanvas();
        this.needsRedraw = false;
      });
    }
  }

  
  private renderText(
    text: string,
    x: number,
    y: number,
    fontSize: number,
    color: string,
    fontFamily: string = 'default'
  ) {
    this.ctx.save();

    const baseFont = this.textFonts[fontFamily] || this.textFonts['default'];
    this.ctx.font = baseFont.replace('16px', `${fontSize}px`);
    this.ctx.fillStyle = color;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    const lineHeight = fontSize * 1.3;
    const padding = 4;
    const lines = text.split('\n');

    // Measure max width
    let maxWidth = 0;
    for (const line of lines) {
      const metrics = this.ctx.measureText(line || ' ');
      maxWidth = Math.max(maxWidth, metrics.width);
    }

    // Draw subtle background box for better readability
    this.ctx.fillStyle = 'rgba(255,255,255,0.85)';
    this.ctx.strokeStyle = 'rgba(15,23,42,0.06)';
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.roundRect(
      x - padding,
      y - padding,
      maxWidth + padding * 2,
      lines.length * lineHeight + padding * 2,
      4
    );
    this.ctx.fill();
    this.ctx.stroke();

    // Draw text lines
    this.ctx.fillStyle = color;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] || ' ';
      this.ctx.fillText(line, x, y + i * lineHeight);
    }

    this.ctx.restore();
  }

  
  private drawSmoothPath(points: { x: number; y: number }[], style: ShapeStyle) {
    if (points.length < 2) return;
    
    this.ctx.save();
    this.ctx.strokeStyle = style.strokeColor;
    this.ctx.lineWidth = style.strokeWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    
    this.applyStrokeStyle(this.ctx, style.strokeStyle);
    
    this.ctx.beginPath();
    
    
    const firstPoint = this.worldToScreen(points[0].x, points[0].y);
    this.ctx.moveTo(firstPoint.x, firstPoint.y);
    
    
    for (let i = 1; i < points.length - 1; i++) {
      const current = this.worldToScreen(points[i].x, points[i].y);
      const next = this.worldToScreen(points[i + 1].x, points[i + 1].y);
      
      
      const cp1x = current.x + (next.x - (i > 0 ? this.worldToScreen(points[i - 1].x, points[i - 1].y).x : current.x)) * 0.3;
      const cp1y = current.y + (next.y - (i > 0 ? this.worldToScreen(points[i - 1].x, points[i - 1].y).y : current.y)) * 0.3;
      const cp2x = next.x - (next.x - current.x) * 0.3;
      const cp2y = next.y - (next.y - current.y) * 0.3;
      
      this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y);
    }
    
    
    if (points.length > 1) {
      const lastPoint = this.worldToScreen(points[points.length - 1].x, points[points.length - 1].y);
      this.ctx.lineTo(lastPoint.x, lastPoint.y);
    }
    
    this.ctx.stroke();
    this.ctx.restore();
  }

  clearCanvas() {
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    
    this.ctx.fillStyle = "#ffffff"; 
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    
    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
    this.ctx.lineWidth = 1;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    const gridSize = 50 * this.scale;
    const startX = Math.floor(this.offsetX / gridSize) * gridSize;
    const startY = Math.floor(this.offsetY / gridSize) * gridSize;
    
    
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

    
    const validShapes = this.existingShapes.filter(shape => 
      shape && typeof shape === 'object' && shape.type && (shape as any).id
    );
    
    validShapes.forEach((shape) => {
      
      const style = shape.style || this.currentStyle;
      this.ctx.globalAlpha = style.opacity;
      
      
      if (this.selectedShape === shape) {
        this.ctx.strokeStyle = "#FCD34D"; 
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
      } else {
        this.ctx.strokeStyle = style.strokeColor;
        this.ctx.lineWidth = style.strokeWidth;
        this.applyStrokeStyle(this.ctx, style.strokeStyle);
      }

      if (shape.type === "rect" || shape.type === "ellipse" || shape.type === "triangle") {
        const screenPos = this.worldToScreen(shape.x, shape.y);
        const screenWidth = shape.width * this.scale;
        const screenHeight = shape.height * this.scale;
        
        
        if (shape.type === "rect") {
          if (style.gradient && style.gradient.type !== "none") {
            const gradient = this.applyGradient(this.ctx, shape, style.gradient);
            if (gradient) {
              this.ctx.fillStyle = gradient;
              this.ctx.fillRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
            }
          } else if (style.fillColor && style.fillColor !== "transparent") {
            this.ctx.fillStyle = style.fillColor;
            this.ctx.fillRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
          }
          
          this.ctx.strokeRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
        } else if (shape.type === "ellipse") {
          const cx = screenPos.x + screenWidth / 2;
          const cy = screenPos.y + screenHeight / 2;
          const rx = Math.abs(screenWidth) / 2;
          const ry = Math.abs(screenHeight) / 2;

          this.ctx.beginPath();
          this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);

          if (style.gradient && style.gradient.type !== "none") {
            const gradient = this.applyGradient(this.ctx, shape, style.gradient);
            if (gradient) {
              this.ctx.fillStyle = gradient;
              this.ctx.fill();
            }
          } else if (style.fillColor && style.fillColor !== "transparent") {
            this.ctx.fillStyle = style.fillColor;
            this.ctx.fill();
          }

          this.ctx.stroke();
          this.ctx.closePath();
        } else if (shape.type === "triangle") {
          const x1 = screenPos.x + screenWidth / 2;
          const y1 = screenPos.y;
          const x2 = screenPos.x;
          const y2 = screenPos.y + screenHeight;
          const x3 = screenPos.x + screenWidth;
          const y3 = screenPos.y + screenHeight;

          this.ctx.beginPath();
          this.ctx.moveTo(x1, y1);
          this.ctx.lineTo(x2, y2);
          this.ctx.lineTo(x3, y3);
          this.ctx.closePath();

          if (style.gradient && style.gradient.type !== "none") {
            const gradient = this.applyGradient(this.ctx, shape, style.gradient);
            if (gradient) {
              this.ctx.fillStyle = gradient;
              this.ctx.fill();
            }
          } else if (style.fillColor && style.fillColor !== "transparent") {
            this.ctx.fillStyle = style.fillColor;
            this.ctx.fill();
          }

          this.ctx.stroke();
        }
      } else if (shape.type === "circle") {
        const screenPos = this.worldToScreen(shape.centerX, shape.centerY);
        const screenRadius = Math.abs(shape.radius) * this.scale;
        
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
        
        
        if (style.gradient && style.gradient.type !== "none") {
          const gradient = this.applyGradient(this.ctx, shape, style.gradient);
          if (gradient) {
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
          }
        } else if (style.fillColor && style.fillColor !== "transparent") {
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
          
          this.drawSmoothPath(shape.points, style);
        }
      } else if (shape.type === "text") {
        const screenPos = this.worldToScreen(shape.x, shape.y);
        
        const baseFontSize = shape.fontSize || 16;
        const adjustedFontSize = Math.max(12, baseFontSize / this.scale);
        
        
        const textColor = shape.style?.textColor || shape.color || "#000000";
        
        
        this.renderText(shape.text, screenPos.x, screenPos.y, adjustedFontSize, textColor, 'default');
        
        
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
          
          
          if (this.selectedTool === "text" && this.cursorBlink) {
            const cursorX = screenPos.x + metrics.width;
            const cursorY = screenPos.y;
            const cursorHeight = textHeight;
            
            this.ctx.strokeStyle = "#FFFFFF"; 
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([]); 
            this.ctx.beginPath();
            this.ctx.moveTo(cursorX, cursorY);
            this.ctx.lineTo(cursorX, cursorY + cursorHeight);
            this.ctx.stroke();
          }
        }
      }
    });

    
    if (this.isDrawingPath && this.currentPathPoints.length > 1) {
      const previewStyle: ShapeStyle = {
        ...this.currentStyle,
        strokeColor: "#9CA3AF", 
        strokeWidth: 2
      };
      this.drawSmoothPath(this.currentPathPoints, previewStyle);
    }

    
    if (
      this.selectedShape &&
      (this.selectedShape.type === "rect" ||
        this.selectedShape.type === "ellipse" ||
        this.selectedShape.type === "triangle" ||
        this.selectedShape.type === "circle" ||
        this.selectedShape.type === "text")
    ) {
      const handles = this.getResizeHandles(this.selectedShape);
      
      console.log('Drawing', handles.length, 'resize handles for', this.selectedShape.type);
      
      this.ctx.fillStyle = "#4ECDC4"; 
      this.ctx.strokeStyle = "#FFFFFF"; 
      this.ctx.lineWidth = 2;
      
      handles.forEach(handle => {
        this.ctx.fillRect(handle.x, handle.y, handle.width, handle.height);
        this.ctx.strokeRect(handle.x, handle.y, handle.width, handle.height);
      });
    }

    
    if (this.isPalmScrolling) {
          this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
              this.ctx.fillStyle = "#000000";
      this.ctx.font = "24px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("Palm Scrolling Active", this.canvas.width / 2, this.canvas.height / 2);
    }

    
    if (this.clipboardShapes.length > 0) {
      this.ctx.fillStyle = "rgba(76, 205, 196, 0.2)";
      this.ctx.fillRect(10, 10, 200, 40);
      
      this.ctx.fillStyle = "#3B82F6";
      this.ctx.font = "14px Arial";
      this.ctx.textAlign = "left";
      this.ctx.fillText(`Clipboard: ${this.clipboardShapes.length} shape(s)`, 20, 30);
      this.ctx.fillText("Ctrl+V to paste", 20, 50);
    }

    
    this.renderRemoteCursors();
  }

  

  mouseDownHandler = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.startX = x;
    this.startY = y;

    
    this.sendCursorUpdate(x, y, true);

    if (e.button === 0) { 
      const worldPos = this.screenToWorld(x, y);

      
      if (this.selectedTool === "pencil") {
        this.isDrawingPath = true;
        this.clicked = true;
        this.currentPathPoints = [{ x: worldPos.x, y: worldPos.y }];
        this.clearCanvas();
        return;
      }

      
      if (this.selectedTool === "colorpicker" as Tool) {
        const shape = this.getShapeAtPosition(worldPos.x, worldPos.y);
        if (shape && shape.style) {
          
          this.currentStyle.fillColor = shape.style.fillColor;
          this.currentStyle.strokeColor = shape.style.strokeColor;
          this.currentStyle.textColor = shape.style.textColor;
          
          
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

      
      if (this.selectedTool === "text" as Tool) {
        
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
        
        
        this.socket.send(JSON.stringify({ 
          type: "draw", 
          shape: textShape, 
          roomId: this.roomId 
        }));
        
        
        this.canvas.dispatchEvent(new CustomEvent('textEdit', { 
          detail: { shapeId: textShape.id, text: "" } 
        }));
        
        
        this.startCursorBlink();
        
        return;
      }

      
      const resizeHandle = this.getResizeHandleAtPosition(x, y);
      if (resizeHandle) {
        console.log('Starting resize:', resizeHandle.handle, 'on shape:', resizeHandle.shape.type);
        this.isResizing = true;
        this.resizingHandle = resizeHandle.handle;
        this.resizeStartX = worldPos.x;
        this.resizeStartY = worldPos.y;
        this.originalShape = JSON.parse(JSON.stringify(resizeHandle.shape)); 
        this.canvas.style.cursor = "nw-resize";
        return;
      }

      const shape = this.getShapeAtPosition(worldPos.x, worldPos.y);
      
      if (shape) {
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
    } else if (e.button === 2) { 
      e.preventDefault();
      this.isPanning = true;
      this.canvas.style.cursor = "grab";
    }
  };

  mouseUpHandler = (e: MouseEvent) => {
    this.clicked = false;

    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.sendCursorUpdate(x, y, false);

    if (e.button === 0) { 
      
      if (this.isResizing) {
        this.isResizing = false;
        this.resizingHandle = null;
        this.canvas.style.cursor = "crosshair";
        
        
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

      
      if (this.isDrawingPath) {
        this.isDrawingPath = false;
        if (this.currentPathPoints.length > 1) {
          
          const recognizedShape = this.analyzeShape(this.currentPathPoints);
          
          let shape: Shape;
          
          if (recognizedShape && recognizedShape.confidence > 0.6) {
            
            shape = {
              id: this.generateShapeId(),
              type: recognizedShape.type as any,
              ...recognizedShape.shape,
              style: { ...this.currentStyle }
            };
            
            console.log(`Shape recognized as ${recognizedShape.type} with confidence ${recognizedShape.confidence}`);
            this.showShapeRecognitionNotification(recognizedShape.type, recognizedShape.confidence);
          } else {
            
            shape = {
              id: this.generateShapeId(),
              type: "path",
              points: [...this.currentPathPoints],
              style: { ...this.currentStyle }
            };
            console.log('No shape recognized, using path');
          }
          
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

      const endX = e.clientX - this.canvas.getBoundingClientRect().left;
      const endY = e.clientY - this.canvas.getBoundingClientRect().top;
      
      const startWorldPos = this.screenToWorld(this.startX, this.startY);
      const endWorldPos = this.screenToWorld(endX, endY);
      
      const width = endWorldPos.x - startWorldPos.x;
      const height = endWorldPos.y - startWorldPos.y;

      let shape: Shape | null = null;

      if (this.selectedTool === "rect" || this.selectedTool === "ellipse" || this.selectedTool === "triangle") {
        shape = {
          id: this.generateShapeId(),
          type: this.selectedTool === "rect" ? "rect" : this.selectedTool === "ellipse" ? "ellipse" : "triangle",
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
    } else if (e.button === 2) { 
      this.isPanning = false;
      this.canvas.style.cursor = "crosshair";
    }
  };

  mouseMoveHandler = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    
    this.sendCursorUpdate(x, y, this.clicked);

    
    if (this.isResizing && this.selectedShape && this.resizingHandle) {
      const worldPos = this.screenToWorld(x, y);
      this.resizeShape(this.selectedShape, this.resizingHandle, worldPos.x, worldPos.y);
      this.clearCanvas();
      
      
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

    
    if (this.isDrawingPath && this.clicked) {
      const worldPos = this.screenToWorld(x, y);
      this.currentPathPoints.push({ x: worldPos.x, y: worldPos.y });
      this.clearCanvas();
      return;
    }

    if (this.clicked && this.isDragging && this.selectedShape) {
      
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
      
      
      if (this.selectedTool === "line") {
        this.ctx.strokeStyle = "#4ECDC4"; 
      } else if (this.selectedTool === "rect" || this.selectedTool === "triangle") {
        this.ctx.strokeStyle = "#FF6B6B"; 
      } else if (this.selectedTool === "circle" || this.selectedTool === "ellipse") {
        this.ctx.strokeStyle = "#96CEB4"; 
      } else if (this.selectedTool === "pencil") {
        this.ctx.strokeStyle = "#9CA3AF"; 
      }
      
      this.ctx.lineWidth = 2;

      if (this.selectedTool === "rect" || this.selectedTool === "triangle" || this.selectedTool === "ellipse") {
        const screenPos = this.worldToScreen(startWorldPos.x, startWorldPos.y);
        const screenWidth = width * this.scale;
        const screenHeight = height * this.scale;
        if (this.selectedTool === "rect") {
          this.ctx.strokeRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
        } else if (this.selectedTool === "ellipse") {
          const cx = screenPos.x + screenWidth / 2;
          const cy = screenPos.y + screenHeight / 2;
          const rx = Math.abs(screenWidth) / 2;
          const ry = Math.abs(screenHeight) / 2;

          this.ctx.beginPath();
          this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          this.ctx.stroke();
          this.ctx.closePath();
        } else if (this.selectedTool === "triangle") {
          const x1 = screenPos.x + screenWidth / 2;
          const y1 = screenPos.y;
          const x2 = screenPos.x;
          const y2 = screenPos.y + screenHeight;
          const x3 = screenPos.x + screenWidth;
          const y3 = screenPos.y + screenHeight;

          this.ctx.beginPath();
          this.ctx.moveTo(x1, y1);
          this.ctx.lineTo(x2, y2);
          this.ctx.lineTo(x3, y3);
          this.ctx.closePath();
          this.ctx.stroke();
        }
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
    
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.addEventListener("wheel", this.wheelHandler);
    this.canvas.addEventListener("contextmenu", this.contextMenuHandler);

    
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
          
          this.existingShapes = this.existingShapes.filter(s => s.id !== shape.id);
          this.clearCanvas();
          
          
          this.socket.send(JSON.stringify({
            type: "erase",
            shapeId: shape.id,
            roomId: this.roomId
          }));
        } else {
          
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

  
  private drawShapePreview() {
    if (!this.isDrawingShape || this.isPanning || this.isDraggingShape) return;
    
    const startWorldPos = this.screenToWorld(this.startX, this.startY);
    const endWorldPos = this.screenToWorld(this.currentTouchX, this.currentTouchY);
    
    this.ctx.save();
    this.ctx.strokeStyle = '#4ECDC4';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    
    if (this.selectedTool === "rect" || this.selectedTool === "ellipse" || this.selectedTool === "triangle") {
      const width = endWorldPos.x - startWorldPos.x;
      const height = endWorldPos.y - startWorldPos.y;
      const screenStart = this.worldToScreen(startWorldPos.x, startWorldPos.y);
      const screenEnd = this.worldToScreen(startWorldPos.x + width, startWorldPos.y + height);
      const w = screenEnd.x - screenStart.x;
      const h = screenEnd.y - screenStart.y;

      if (this.selectedTool === "rect") {
        this.ctx.strokeRect(screenStart.x, screenStart.y, w, h);
      } else if (this.selectedTool === "ellipse") {
        const cx = screenStart.x + w / 2;
        const cy = screenStart.y + h / 2;
        const rx = Math.abs(w) / 2;
        const ry = Math.abs(h) / 2;

        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        this.ctx.stroke();
      } else if (this.selectedTool === "triangle") {
        const x1 = screenStart.x + w / 2;
        const y1 = screenStart.y;
        const x2 = screenStart.x;
        const y2 = screenStart.y + h;
        const x3 = screenStart.x + w;
        const y3 = screenStart.y + h;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineTo(x3, y3);
        this.ctx.closePath();
        this.ctx.stroke();
      }
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

  
  private sendUserActivity(activity: string) {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userName = payload.name || payload.email || `User ${payload.userId.slice(0, 8)}`;
        
        this.socket.send(JSON.stringify({
          type: "user_activity",
          roomId: this.roomId,
          activity: activity,
          userName: userName
        }));
      }
    } catch (error) {
      console.error("Error sending user activity:", error);
    }
  }

  
  private drawShape(shape: Shape) {
    
    this.sendUserActivity("drawing");
    
    
    this.existingShapes.push(shape);
    
    
    this.socket.send(JSON.stringify({
      type: "draw",
      shape: shape,
      roomId: this.roomId
    }));
    
    this.clearCanvas();
  }

  
  private analyzeShape(points: { x: number; y: number }[]): { type: string; shape: any; confidence: number } | null {
    if (points.length < 3) return null;

    
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    const width = maxX - minX;
    const height = maxY - minY;

    
    const pathLength = this.calculatePathLength(points);
    const area = this.calculatePathArea(points);

    
    const aspectRatio = width / height;
    const circularity = this.calculateCircularity(points, area);
    const rectangularity = this.calculateRectangularity(points, width, height, area);
    const linearity = this.calculateLinearity(points);

    console.log('Shape analysis:', {
      circularity,
      rectangularity,
      linearity,
      aspectRatio,
      points: points.length
    });

    
    if (linearity > 0.85) {
      
      const startPoint = points[0];
      const endPoint = points[points.length - 1];
      return {
        type: "line",
        shape: {
          startX: startPoint.x,
          startY: startPoint.y,
          endX: endPoint.x,
          endY: endPoint.y
        },
        confidence: linearity
      };
    } else if (circularity > 0.5) { 
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      
      let totalRadius = 0;
      for (const point of points) {
        const distance = Math.sqrt(Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2));
        totalRadius += distance;
      }
      const radius = totalRadius / points.length;
      
      return {
        type: "circle",
        shape: {
          centerX,
          centerY,
          radius
        },
        confidence: circularity
      };
    } else if (rectangularity > 0.6) {
      
      return {
        type: "rect",
        shape: {
          x: minX,
          y: minY,
          width,
          height
        },
        confidence: rectangularity
      };
    }

    return null;
  }

  private calculatePathLength(points: { x: number; y: number }[]): number {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  private calculatePathArea(points: { x: number; y: number }[]): number {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  private calculateCircularity(points: { x: number; y: number }[], area: number): number {
    if (area === 0) return 0;
    
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    const width = maxX - minX;
    const height = maxY - minY;
    
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const perimeter = this.calculatePathLength(points);
    const idealRadius = Math.max(width, height) / 2;
    const idealPerimeter = 2 * Math.PI * idealRadius;
    
    
    const perimeterRatio = Math.min(perimeter, idealPerimeter) / Math.max(perimeter, idealPerimeter);
    
    
    const idealArea = Math.PI * idealRadius * idealRadius;
    const areaRatio = Math.min(area, idealArea) / Math.max(area, idealArea);
    
    
    let totalDistance = 0;
    let distanceVariance = 0;
    const distances: number[] = [];
    
    for (const point of points) {
      const distance = Math.sqrt(Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2));
      distances.push(distance);
      totalDistance += distance;
    }
    
    const avgDistance = totalDistance / points.length;
    
    
    for (const distance of distances) {
      distanceVariance += Math.pow(distance - avgDistance, 2);
    }
    distanceVariance /= points.length;
    
    
    const distanceConsistency = Math.max(0, 1 - (distanceVariance / (avgDistance * avgDistance)));
    
    
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const startEndDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
    );
    const closureRatio = Math.max(0, 1 - (startEndDistance / perimeter));
    
    
    const circularity = (
      perimeterRatio * 0.3 + 
      areaRatio * 0.3 + 
      distanceConsistency * 0.3 + 
      closureRatio * 0.1
    );
    
    console.log('Circle analysis:', {
      perimeterRatio,
      areaRatio,
      distanceConsistency,
      closureRatio,
      finalCircularity: circularity
    });
    
    return circularity;
  }

  private calculateRectangularity(points: { x: number; y: number }[], width: number, height: number, area: number): number {
    if (area === 0) return 0;
    
    const idealArea = width * height;
    const areaRatio = Math.min(area, idealArea) / Math.max(area, idealArea);
    
    
    const corners = this.findCorners(points);
    const cornerScore = Math.min(corners.length, 4) / 4;
    
    return (areaRatio + cornerScore) / 2;
  }

  private calculateLinearity(points: { x: number; y: number }[]): number {
    if (points.length < 2) return 0;
    
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const idealDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
    );
    
    const actualDistance = this.calculatePathLength(points);
    
    if (actualDistance === 0) return 0;
    
    return Math.min(idealDistance, actualDistance) / Math.max(idealDistance, actualDistance);
  }

  private findCorners(points: { x: number; y: number }[]): { x: number; y: number }[] {
    const corners: { x: number; y: number }[] = [];
    const threshold = 0.3; 
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      const angleDiff = Math.abs(angle1 - angle2);
      
      if (angleDiff > threshold) {
        corners.push(curr);
      }
    }
    
    return corners;
  }

  private showShapeRecognitionNotification(shapeType: string, confidence: number) {
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    const icon = document.createElement('span');
    icon.innerHTML = this.getShapeIcon(shapeType);
    icon.style.fontSize = '16px';
    
    const text = document.createElement('span');
    text.textContent = `Recognized as ${shapeType} (${Math.round(confidence * 100)}%)`;
    
    notification.appendChild(icon);
    notification.appendChild(text);
    document.body.appendChild(notification);
    
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  private getShapeIcon(shapeType: string): string {
    switch (shapeType) {
      case 'circle': return '⭕';
      case 'rect': return '⬜';
      case 'line': return '➖';
      default: return '✏️';
    }
  }

  
  setCurrentUserId(userId: string) {
    this.currentUserId = userId;
  }

  updateRemoteCursor(userId: string, x: number, y: number, username: string, color: string, isDrawing: boolean = false) {
    console.log(`Cursor update from ${username}: (${x}, ${y}), color: ${color}, drawing: ${isDrawing}`);
    this.remoteCursors.set(userId, {
      x,
      y,
      username,
      color,
      lastUpdate: Date.now(),
      isDrawing
    });
    this.requestRedraw();
  }

  removeRemoteCursor(userId: string) {
    this.remoteCursors.delete(userId);
    this.requestRedraw();
  }

  clearRemoteCursors() {
    this.remoteCursors.clear();
    this.requestRedraw();
  }

  getRemoteCursorCount(): number {
    return this.remoteCursors.size;
  }

  private sendCursorUpdate(x: number, y: number, isDrawing: boolean = false) {
    const now = Date.now();
    if (now - this.lastCursorUpdate < this.cursorUpdateThrottle) {
      return;
    }
    
    this.lastCursorUpdate = now;
    
    const worldPos = this.screenToWorld(x, y);
    console.log(`Sending cursor update: (${worldPos.x}, ${worldPos.y}), drawing: ${isDrawing}`);
    
    this.socket.send(JSON.stringify({
      type: "cursor_update",
      userId: this.currentUserId,
      x: worldPos.x,
      y: worldPos.y,
      isDrawing,
      roomId: this.roomId
    }));
  }

  private renderRemoteCursors() {
    const now = Date.now();
    const cursorTimeout = 10000; 
    
    console.log(`Rendering ${this.remoteCursors.size} remote cursors`);
    
    this.remoteCursors.forEach((cursor, userId) => {
      
      if (now - cursor.lastUpdate > cursorTimeout) {
        this.remoteCursors.delete(userId);
        return;
      }
      
      
      if (userId === this.currentUserId) {
        return;
      }
      
      const screenPos = this.worldToScreen(cursor.x, cursor.y);
      
      console.log(`Rendering cursor for ${cursor.username} at world (${cursor.x}, ${cursor.y}) -> screen (${screenPos.x}, ${screenPos.y})`);
      
      
      if (screenPos.x < -50 || screenPos.x > this.canvas.width + 50 || 
          screenPos.y < -50 || screenPos.y > this.canvas.height + 50) {
        console.log(`Cursor for ${cursor.username} is outside canvas bounds, skipping render`);
        return;
      }
      
      
      this.ctx.save();
      this.ctx.globalAlpha = 0.9;
      
      
      this.ctx.fillStyle = cursor.color;
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, 8, 0, 2 * Math.PI);
      this.ctx.fill();
      
      
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      
      
      if (cursor.isDrawing) {
        this.ctx.fillStyle = '#ff4444';
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, 3, 0, 2 * Math.PI);
        this.ctx.fill();
      }
      
      
      if (cursor.username) {
        this.ctx.fillStyle = cursor.color;
        this.ctx.font = '12px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(cursor.username, screenPos.x, screenPos.y - 15);
        
        
        const textMetrics = this.ctx.measureText(cursor.username);
        const labelWidth = textMetrics.width + 8;
        const labelHeight = 16;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(
          screenPos.x - labelWidth / 2,
          screenPos.y - 15 - labelHeight,
          labelWidth,
          labelHeight
        );
        
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(cursor.username, screenPos.x, screenPos.y - 15);
      }
      
      this.ctx.restore();
    });
  }
}