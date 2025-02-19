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
export default function initDraw(canvas:HTMLCanvasElement){

    const context = canvas.getContext("2d");
    let existingShapes :Shape[] = [];
            if(!context){
                return ;
            }
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
                existingShapes.push({
                    type:"rect",
                    x:startX,
                    y:startY,
                    width,
                    height
                })
                 
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

function getExistingShapes(){
    axios.get("`{}`")
}