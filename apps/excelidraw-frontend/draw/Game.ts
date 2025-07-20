import { Tool } from "@/component/Canvas";
import { getExistingShapes } from "./http";

type Shape = {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
} | {
  type: "circle";
  centerX: number;
  centerY: number;
  radius: number;
} | {
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

  setTool(tool: Tool) {
    this.selectedTool = tool;
  }

  async init() {
    this.existingShapes = await getExistingShapes(this.roomId);
    this.clearCanvas();
  }

  initHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "chat") {
        const parsedShape = JSON.parse(message.message);
        this.existingShapes.push(parsedShape.shape);
        this.clearCanvas();
      } else if (message.type === "edit_shape") {
        const updatedShape = message.shape;
        const index = this.existingShapes.findIndex(s => s === this.selectedShape);
        if (index !== -1) {
          this.existingShapes[index] = updatedShape;
          this.clearCanvas();
        }
      }
    };

    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (this.historyStack.length > 0) {
          this.existingShapes = this.historyStack.pop()!;
          this.clearCanvas();
        }
      }
    });
  }

  getShapeAtPosition(x: number, y: number): Shape | null {
    for (let i = this.existingShapes.length - 1; i >= 0; i--) {
      const shape = this.existingShapes[i];
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
    this.ctx.fillStyle = "rgba(0, 0, 0)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.existingShapes.forEach((shape) => {
      this.ctx.strokeStyle = this.selectedShape === shape ? "yellow" : "white";
      this.ctx.lineWidth = this.selectedShape === shape ? 2 : 1;

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
  
    this.startX = e.clientX;
    this.startY = e.clientY;
  
    const shape = this.getShapeAtPosition(x, y);
    if (shape) {
      this.selectedShape = shape;
      this.isDragging = true;
      this.isDraggingShape = true;
  
      this.dragOffsetX = x - (shape.type === "rect" ? shape.x : shape.type === "circle" ? shape.centerX : shape.startX);
      this.dragOffsetY = y - (shape.type === "rect" ? shape.y : shape.type === "circle" ? shape.centerY : shape.startY);
    } else {
      this.isDraggingShape = false;
      this.selectedShape = null;
    }
  
    this.clicked = true;
  };
  
  mouseUpHandler = (e: MouseEvent) => {
    this.clicked = false;
    const endX = e.clientX;
    const endY = e.clientY;
    const width = endX - this.startX;
    const height = endY - this.startY;

    let shape: Shape | null = null;

    if (this.selectedTool === "rect") {
      shape = {
        type: "rect",
        x: this.startX,
        y: this.startY,
        height,
        width
      };
    } else if (this.selectedTool === "circle") {
      const radius = Math.max(width, height) / 2;
      shape = {
        type: "circle",
        radius: radius,
        centerX: this.startX + radius,
        centerY: this.startY + radius
      };
    } else if (this.selectedTool === "line") {
      shape = {
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
      type: "chat",
      message: JSON.stringify({ shape }),
      roomId: this.roomId
    }));
  };

  mouseMoveHandler = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.offsetX) / this.scale;
    const y = (e.clientY - rect.top - this.offsetY) / this.scale;
  
    if (this.clicked && this.isDragging && this.selectedShape) {
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
  
      this.socket.send(JSON.stringify({
        type: "edit_shape",
        shape: this.selectedShape,
        roomId: this.roomId
      }));
  
      this.clearCanvas();
      return;
    }
  
    // Drawing preview
    if (this.clicked && !this.isDragging) {
      const width = x - this.startX;
      const height = y - this.startY;
      this.clearCanvas();
      this.ctx.strokeStyle = "white";
  
      if (this.selectedTool === "rect") {
        this.ctx.strokeRect(this.startX, this.startY, width, height);
      } else if (this.selectedTool === "circle") {
        const radius = Math.max(width, height) / 2;
        const centerX = this.startX + radius;
        const centerY = this.startY + radius;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
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
        this.selectedShape = shape;
        this.dragOffsetX = x - (shape.type === "rect" ? shape.x : shape.type === "circle" ? shape.centerX : shape.startX);
        this.dragOffsetY = y - (shape.type === "rect" ? shape.y : shape.type === "circle" ? shape.centerY : shape.startY);
        console.log("Selected for editing", shape);
      } else {
        this.selectedShape = null;
      }

      this.clearCanvas();
    });
  }
}
