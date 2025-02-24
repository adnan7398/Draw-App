import { BACKEND_URL } from "@/config";
import axios from "axios";
type Shape = {
    type:"rect";
    x : number;
    y:number;
    width:number;
    height : number
} | {
    type:"circle";
    centerX : number;
    centerY : number;
    radius:number
}
export async   function initDraw(canvas:HTMLCanvasElement,roomId:string,socket:WebSocket){

    const context = canvas.getContext("2d");
    let existingShapes :Shape[] = await getExistingShapes(roomId);
            if(!context){
                return ;
            }

            socket.onmessage = (event)=>{
                const message = JSON.parse(event.data);
                if(message.type=="chat"){
                    const parsedShape = message.message;
                    existingShapes.push(parsedShape);
                }
                Clearcanvas(existingShapes,canvas,context);
            }

            Clearcanvas(existingShapes,canvas,context);
            let clicked = false;
            let startX = 0;
            let startY = 0;
            canvas.addEventListener("mousedown",(e)=>{
                clicked = true;
                startX = e.clientX;
                startY = e.clientY;
            })
            canvas.addEventListener("mouseup",(e)=>{
                clicked = false;
                const width = e.clientX - startX;
                const height = e.clientY - startY;
                const shape:Shape =  {
                    type:"rect",
                    x:startX,
                    y:startY,
                    width,
                    height
                }
                existingShapes.push(shape)
                socket.send(JSON.stringify({
                    type:"chat",
                    message:JSON.stringify({
                        shape
                    }),
                   // roomId
                }))
                 
            })
            canvas.addEventListener("mousemove",(e)=>{
                if(clicked){
                    const width = e.clientX - startX;
                    const height = e.clientY - startY;
                    Clearcanvas(existingShapes,canvas,context);
                    context.strokeStyle = "rgba(255,255,255,255)";
                    context.strokeRect(startX,startY,width,height);
                   
                }
            })
}

function Clearcanvas(existingShapes:Shape[],canvas:HTMLCanvasElement,context:CanvasRenderingContext2D){
    context.clearRect(0,0,canvas.width,canvas.height);
    context.fillStyle = "rgba(0,0,0)";
    context.fillRect(0,0,canvas.width,canvas.height);

    existingShapes.map((Shape)=>{
        if(Shape.type==="rect"){
            context.strokeStyle = "rgba(255,255,255,255)";
            context.strokeRect(Shape.x,Shape.y,Shape.width,Shape.height);
        }
    });
}

 async function getExistingShapes(roomId:string){
    const res = await axios.get(`${BACKEND_URL}/chats/${roomId}`);
    const messages = res.data.messages;
    const shapes = messages.map((x:{message:string})=>{
        const messageData = JSON.parse(x.message)
        return messageData;
    });
    return shapes;
    
}