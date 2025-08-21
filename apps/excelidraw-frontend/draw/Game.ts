import { Tool } from "@/component/Canvas";
import { getExistingShapes } from "./http";

type Shape =
  | {
      id: string;
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      id: string;
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
    }
  | {
      id: string;
      type: "line";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    };

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: Shape[];
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
  
  // Infinite scrolling properties
  private isPanning: boolean = false;
  private lastPanX: number = 0;
  private lastPanY: number = 0;
  private minScale = 0.1;
  private maxScale = 5;
  private viewportWidth: number = 0;
  private viewportHeight: number = 0;

  socket: WebSocket;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.roomId = roomId;
    this.socket = socket;
    this.clicked = false;
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
    this.initTouchHandlers();
    this.initKeyboardHandlers();
  }

  destroy() {
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
  }

  // Generate unique ID for shapes
  private generateShapeId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  cleanupShapes() {
    // Remove any invalid shapes that might have slipped through
    const originalLength = this.existingShapes.length;
    this.existingShapes = this.existingShapes.filter(shape => 
      shape && typeof shape === 'object' && shape.type && shape.id
    );
    if (this.existingShapes.length !== originalLength) {
      console.log(`Cleaned up ${originalLength - this.existingShapes.length} invalid shapes`);
      this.clearCanvas();
    }
  }

  setTool(tool: Tool) {
    this.selectedTool = tool;
  }

  async init() {
    try {
      this.existingShapes = await getExistingShapes(this.roomId);
      // Filter out any invalid shapes that might have been loaded
      this.existingShapes = this.existingShapes.filter(shape => 
        shape && typeof shape === 'object' && shape.type && shape.id
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
  private screenToWorld(screenX: number, screenY: number): { x: number, y: number } {
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
              shape && typeof shape === 'object' && shape.type && shape.id
            );
            this.clearCanvas();
          }
        }
      }
    });
  }

  initKeyboardHandlers() {
    document.addEventListener("keydown", (e) => {
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
      }
    });

    document.addEventListener("keyup", (e) => {
      if (e.key === " ") {
        this.isPanning = false;
        this.canvas.style.cursor = "crosshair";
      }
    });
  }

  initTouchHandlers() {
    this.canvas.addEventListener("touchstart", this.touchStartHandler);
    this.canvas.addEventListener("touchmove", this.touchMoveHandler);
    this.canvas.addEventListener("touchend", this.touchEndHandler);
  }

  touchStartHandler = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      if (e.touches.length === 1) {
        // Single touch - start drawing or panning
        this.startX = x;
        this.startY = y;
        this.clicked = true;
        
        const worldPos = this.screenToWorld(x, y);
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
          }
        } else {
          this.isPanning = true;
        }
      }
    }
  };

  touchMoveHandler = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
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
        }
        
        this.socket.send(JSON.stringify({
          type: "edit_shape",
          shape: this.selectedShape,
          roomId: this.roomId,
          isDragging: true
        }));
        
        this.clearCanvas();
      }
    }
  };

  touchEndHandler = (e: TouchEvent) => {
    e.preventDefault();
    this.clicked = false;
    this.isPanning = false;
    
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
    }
  };

  getShapeAtPosition(x: number, y: number): Shape | null {
    for (let i = this.existingShapes.length - 1; i >= 0; i--) {
      const shape = this.existingShapes[i];
      if (!shape || !shape.type || !shape.id) continue; // Skip invalid shapes
      
      if (shape.type === "rect") {
        if (x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height)
          return shape;
      } else if (shape.type === "circle") {
        const dx = x - shape.centerX;
        const dy = y - shape.centerY;
        if (Math.sqrt(dx * dx + dy * dy) <= shape.radius)
          return shape;
      } else if (shape.type === "line") {
        const buffer = 5;
        const minX = Math.min(shape.startX, shape.endX) - buffer;
        const maxX = Math.max(shape.startX, shape.endX) + buffer;
        const minY = Math.min(shape.startY, shape.endY) - buffer;
        const maxY = Math.max(shape.startY, shape.endY) + buffer;
        if (x >= minX && x <= maxX && y >= minY && y <= maxY)
          return shape;
      }
    }
    return null;
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Create a subtle grid background
    this.ctx.fillStyle = "rgba(15, 23, 42, 1)"; // Dark blue-gray background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw subtle grid lines
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    this.ctx.lineWidth = 1;
    
    const gridSize = 50 * this.scale;
    const startX = Math.floor(this.offsetX / gridSize) * gridSize;
    const startY = Math.floor(this.offsetY / gridSize) * gridSize;
    
    for (let x = startX; x <= this.canvas.width + gridSize; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = startY; y <= this.canvas.height + gridSize; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    // Filter out any undefined or null shapes
    const validShapes = this.existingShapes.filter(shape => 
      shape && typeof shape === 'object' && shape.type && shape.id
    );
    
    validShapes.forEach((shape) => {
      this.ctx.strokeStyle = this.selectedShape === shape ? "#FCD34D" : "#FFFFFF"; // Yellow for selected, white for others
      this.ctx.lineWidth = this.selectedShape === shape ? 3 : 2;

      if (shape.type === "rect") {
        const screenPos = this.worldToScreen(shape.x, shape.y);
        const screenWidth = shape.width * this.scale;
        const screenHeight = shape.height * this.scale;
        this.ctx.strokeRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
      } else if (shape.type === "circle") {
        const screenPos = this.worldToScreen(shape.centerX, shape.centerY);
        const screenRadius = Math.abs(shape.radius) * this.scale;
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
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
      }
    });
  }

  mouseDownHandler = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.startX = x;
    this.startY = y;

    if (e.button === 0) { // Left click
      const worldPos = this.screenToWorld(x, y);
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
          height
        };
      } else if (this.selectedTool === "circle") {
        const radius = Math.sqrt(width * width + height * height) / 2;
        shape = {
          id: this.generateShapeId(),
          type: "circle",
          centerX: startWorldPos.x + width / 2,
          centerY: startWorldPos.y + height / 2,
          radius
        };
      } else if (this.selectedTool === "line") {
        shape = {
          id: this.generateShapeId(),
          type: "line",
          startX: startWorldPos.x,
          startY: startWorldPos.y,
          endX: endWorldPos.x,
          endY: endWorldPos.y
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

    if (this.isPanning) {
      const deltaX = x - this.startX;
      const deltaY = y - this.startY;
      this.pan(deltaX, deltaY);
      this.startX = x;
      this.startY = y;
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
      }

      // Send edit message to other users with isDragging flag
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
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.addEventListener("wheel", this.wheelHandler);
    this.canvas.addEventListener("contextmenu", this.contextMenuHandler);

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
          this.dragOffsetX = worldPos.x - (shape.type === "rect" ? shape.x : shape.type === "circle" ? shape.centerX : shape.startX);
          this.dragOffsetY = worldPos.y - (shape.type === "rect" ? shape.y : shape.type === "circle" ? shape.centerY : shape.startY);
          console.log("Selected for editing", shape);
          this.clearCanvas();
        }
      } else {
        this.selectedShape = null;
        this.clearCanvas();
      }
    });
  }
}