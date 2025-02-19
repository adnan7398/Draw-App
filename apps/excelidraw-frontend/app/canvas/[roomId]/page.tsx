 
"use client"
import initDraw from "@/draw";
import { useEffect ,useRef} from "react"

export default function Canvas (){
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(()=>{
        if(canvasRef.current){
            const canvas = canvasRef.current;
            initDraw(canvas);
        }
    },[canvasRef])
    return <div>
        <canvas height= {2000}  width={2000} ref= {canvasRef}></canvas>
    </div>

}