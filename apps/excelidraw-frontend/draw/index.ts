import { BACKEND_URL } from "@/config";
import axios from "axios";

const generateId = () =>
  typeof window.crypto?.randomUUID === "function"
    ? window.crypto.randomUUID()
    : Math.random().toString(36).substr(2, 9);

type Shape = {
  type: "rect";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export async function initDraw(
  canvas: HTMLCanvasElement,
  roomId: string,
  socket: WebSocket
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  let existingShapes: Shape[] = await getExistingShapes(roomId);
  let historyStack: Shape[][] = [];
  let selectedShape: Shape | null = null;
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let clicked = false;
  let startX = 0;
  let startY = 0;

  function drawAllShapes() {
    context!.clearRect(0, 0, canvas.width, canvas.height);
    context!.fillStyle = "black";
    context!.fillRect(0, 0, canvas.width, canvas.height);

    for (const shape of existingShapes) {
      context!.strokeStyle = shape === selectedShape ? "yellow" : "white";
      context!.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }
  }

  function getShapeAtPosition(x: number, y: number): Shape | null {
    for (let i = existingShapes.length - 1; i >= 0; i--) {
      const shape = existingShapes[i];
      if (
        x >= shape.x &&
        x <= shape.x + shape.width &&
        y >= shape.y &&
        y <= shape.y + shape.height
      ) {
        return shape;
      }
    }
    return null;
  }

  drawAllShapes();

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type === "chat") {
      const parsed = JSON.parse(message.message);
      existingShapes.push(parsed.shape);
      drawAllShapes();
    }

    if (message.type === "edit_shape") {
      const updated = message.shape as Shape;
      const index = existingShapes.findIndex((s) => s.id === updated.id);
      if (index !== -1) {
        existingShapes[index] = updated;
        drawAllShapes();
      }
    }
  };

  canvas.addEventListener("mousedown", (e) => {
    const mouseX = e.clientX - canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - canvas.getBoundingClientRect().top;

    const hitShape = getShapeAtPosition(mouseX, mouseY);
    if (hitShape) {
      selectedShape = hitShape;
      isDragging = true;
      dragOffsetX = mouseX - hitShape.x;
      dragOffsetY = mouseY - hitShape.y;
    } else {
      selectedShape = null;
      clicked = true;
      startX = mouseX;
      startY = mouseY;
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    const mouseX = e.clientX - canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - canvas.getBoundingClientRect().top;

    if (isDragging && selectedShape) {
      selectedShape.x = mouseX - dragOffsetX;
      selectedShape.y = mouseY - dragOffsetY;
      drawAllShapes();
    } else if (clicked) {
      const width = mouseX - startX;
      const height = mouseY - startY;
      drawAllShapes();
      context!.strokeStyle = "white";
      context!.strokeRect(startX, startY, width, height);
    }
  });

  canvas.addEventListener("mouseup", (e) => {
    const mouseX = e.clientX - canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - canvas.getBoundingClientRect().top;

    if (isDragging && selectedShape) {
      isDragging = false;

      socket.send(
        JSON.stringify({
          type: "edit_shape",
          shape: selectedShape,
          roomId,
        })
      );

      return;
    }

    if (!clicked) return;
    clicked = false;

    const width = mouseX - startX;
    const height = mouseY - startY;

    const newShape: Shape = {
      id: generateId(),
      type: "rect",
      x: startX,
      y: startY,
      width,
      height,
    };

    historyStack.push([...existingShapes]);
    existingShapes.push(newShape);
    drawAllShapes();

    socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({ shape: newShape }),
        roomId,
      })
    );
  });

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      if (historyStack.length > 0) {
        existingShapes = historyStack.pop()!;
        drawAllShapes();
      }
    }
  });
}

async function getExistingShapes(roomId: string): Promise<Shape[]> {
  const res = await axios.get(`${BACKEND_URL}/chats/${roomId}`);
  return res.data.messages.map((x: { message: string }) => {
    const parsed = JSON.parse(x.message);
    return parsed.shape as Shape;
  });
}
