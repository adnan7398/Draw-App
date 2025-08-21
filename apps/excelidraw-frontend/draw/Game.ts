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
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
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
    } catch (error) {
      console.error("Error loading existing shapes:", error);
      this.existingShapes = [];
    }
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupShapes();
    }, 10000); // Clean up every 10 seconds
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
    
    const gridSize = 50;
    for (let x = 0; x <= this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= this.canvas.height; y += gridSize) {
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
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === "circle") {
        this.ctx.beginPath();
        this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "line") {
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
        this.ctx.closePath();
      }
    });
  }

  mouseDownHandler = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.offsetX) / this.scale;
    const y = (e.clientY - rect.top - this.offsetY) / this.scale;

    this.startX = x;
    this.startY = y;

    const shape = this.getShapeAtPosition(x, y);
    if (shape) {
      this.selectedShape = shape;
      this.isDragging = true;
      this.isDraggingShape = true;

      // Calculate drag offset from the click position to the shape's reference point
      if (shape.type === "rect") {
        this.dragOffsetX = x - shape.x;
        this.dragOffsetY = y - shape.y;
      } else if (shape.type === "circle") {
        this.dragOffsetX = x - shape.centerX;
        this.dragOffsetY = y - shape.centerY;
      } else if (shape.type === "line") {
        // For lines, use the start point as reference
        this.dragOffsetX = x - shape.startX;
        this.dragOffsetY = y - shape.startY;
      }
    } else {
      this.isDraggingShape = false;
      this.selectedShape = null;
    }

    this.clicked = true;
  };

  mouseUpHandler = (e: MouseEvent) => {
    this.clicked = false;

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

    const endX = (e.clientX - this.canvas.getBoundingClientRect().left - this.offsetX) / this.scale;
    const endY = (e.clientY - this.canvas.getBoundingClientRect().top - this.offsetY) / this.scale;
    const width = endX - this.startX;
    const height = endY - this.startY;

    let shape: Shape | null = null;

    if (this.selectedTool === "rect") {
      shape = {
        id: this.generateShapeId(),
        type: "rect",
        x: this.startX,
        y: this.startY,
        width,
        height
      };
    } else if (this.selectedTool === "circle") {
      const radius = Math.sqrt(width * width + height * height) / 2;
      shape = {
        id: this.generateShapeId(),
        type: "circle",
        centerX: this.startX + width / 2,
        centerY: this.startY + height / 2,
        radius
      };
    } else if (this.selectedTool === "line") {
      shape = {
        id: this.generateShapeId(),
        type: "line",
        startX: this.startX,
        startY: this.startY,
        endX,
        endY
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
  };

  mouseMoveHandler = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.offsetX) / this.scale;
    const y = (e.clientY - rect.top - this.offsetY) / this.scale;

    if (this.clicked && this.isDragging && this.selectedShape) {
      // Update shape position during drag
      if (this.selectedShape.type === "rect") {
        this.selectedShape.x = x - this.dragOffsetX;
        this.selectedShape.y = y - this.dragOffsetY;
      } else if (this.selectedShape.type === "circle") {
        this.selectedShape.centerX = x - this.dragOffsetX;
        this.selectedShape.centerY = y - this.dragOffsetY;
      } else if (this.selectedShape.type === "line") {
        const dx = x - this.dragOffsetX - this.selectedShape.startX;
        const dy = y - this.dragOffsetY - this.selectedShape.startY;
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
      const width = x - this.startX;
      const height = y - this.startY;
      this.clearCanvas();
      this.ctx.strokeStyle = "white";

      if (this.selectedTool === "rect") {
        this.ctx.strokeRect(this.startX, this.startY, width, height);
      } else if (this.selectedTool === "circle") {
        const radius = Math.sqrt(width * width + height * height) / 2;
        const centerX = this.startX + width / 2;
        const centerY = this.startY + height / 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (this.selectedTool === "line") {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.closePath();
      }
    }
  };

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);

    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - this.offsetX) / this.scale;
      const y = (e.clientY - rect.top - this.offsetY) / this.scale;

      const shape = this.getShapeAtPosition(x, y);
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
          this.dragOffsetX = x - (shape.type === "rect" ? shape.x : shape.type === "circle" ? shape.centerX : shape.startX);
          this.dragOffsetY = y - (shape.type === "rect" ? shape.y : shape.type === "circle" ? shape.centerY : shape.startY);
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