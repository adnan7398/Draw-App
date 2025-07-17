import { BACKEND_URL } from "@/config";
import axios from "axios";

type Shape = {
  type: "rect";
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
  if (!context) {
    console.error("Canvas context is null");
    return;
  }

  let existingShapes: Shape[] = await getExistingShapes(roomId);
  let historyStack: Shape[][] = [];


  function drawAllShapes() {
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (const shape of existingShapes) {
      if (shape.type === "rect") {
        context.strokeStyle = "white";
        context.strokeRect(shape.x, shape.y, shape.width, shape.height);
      }
    }
  }

  drawAllShapes();

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "chat") {
      const parsedShape = JSON.parse(message.message);
      existingShapes.push(parsedShape.shape);
      drawAllShapes();
    }
  };

  let clicked = false;
  let startX = 0;
  let startY = 0;

  canvas.addEventListener("mousedown", (e) => {
    clicked = true;
    startX = e.clientX - canvas.getBoundingClientRect().left;
    startY = e.clientY - canvas.getBoundingClientRect().top;
  });

  canvas.addEventListener("mouseup", (e) => {
    if (!clicked) return;
    clicked = false;

    const endX = e.clientX - canvas.getBoundingClientRect().left;
    const endY = e.clientY - canvas.getBoundingClientRect().top;
    const width = endX - startX;
    const height = endY - startY;

    const shape: Shape = {
      type: "rect",
      x: startX,
      y: startY,
      width,
      height,
    };

    historyStack.push([...existingShapes]); // Save for undo
    existingShapes.push(shape);
    drawAllShapes();

    socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({ shape }),
        roomId,
      })
    );
  });

  canvas.addEventListener("mousemove", (e) => {
    if (clicked) {
      const currentX = e.clientX - canvas.getBoundingClientRect().left;
      const currentY = e.clientY - canvas.getBoundingClientRect().top;
      const width = currentX - startX;
      const height = currentY - startY;

      drawAllShapes();
      context.strokeStyle = "white";
      context.strokeRect(startX, startY, width, height); // live preview
    }
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

async function getExistingShapes(roomId: string) {
  const res = await axios.get(`${BACKEND_URL}/chats/${roomId}`);
  const messages = res.data.messages;
  const shapes = messages.map((x: { message: string }) => {
    const messageData = JSON.parse(x.message);
    return messageData.shape;
  });
  return shapes;
}
