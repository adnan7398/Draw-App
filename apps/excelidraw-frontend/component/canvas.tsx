"use client"
import { initDraw } from "@/draw";
import { useEffect, useRef } from "react";

export default function Canvas({roomId}:{roomId:string}){
    const canvasRef = useRef<HTMLCanvasElement>(null);
        useEffect(()=>{
            if(canvasRef.current){
                const canvas = canvasRef.current;
                initDraw(canvas,roomId);
            }
        },[canvasRef])
        return <div>
            <canvas height= {2000}  width={2000} ref= {canvasRef}></canvas>
        </div>
}