import { useEffect, useState } from "react";
import { WS_URL } from "../app/config";

export function useSocket(){
    const [loading,setloading] = useState(true);
    const [socket,setsocket] = useState<WebSocket>();

    useEffect(()=>{
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYzRjOTVlZC0xOGFkLTQ5MGQtYmU4ZC0yZGNhODBlYmRhYmYiLCJpYXQiOjE3Mzk1MTc1NjN9.fMAplujgajb50OlkPWdsfZ7_2yn-5QjWFwvqwdOOeCw`);
        ws.onopen=()=>{
            setloading(false);
            setsocket(ws);
        }
    },[]);
    return {
        socket,loading
    }
}