"use client"
import { useEffect, useState } from "react"
import { useSocket } from "../hook/useSocket";


export function ChatRoomClient({
    messages,
    id
}:{
    messages :{message:string}[],
    id:string
}){
    const [Chats,setChats] = useState(messages)
    const [currentMessages,setcurrentMessages]  = useState("");
    const {socket,loading} = useSocket();

    useEffect(()=>{
        if(socket&&!loading){
            socket.send(JSON.stringify({
                type:"join_room",
                roomId :id
            }))
            socket.onmessage=(event)=>{
                const parsedData = JSON.parse(event.data)
                if(parsedData.type==="chat"){
                    setChats(c => [...c, { message: parsedData.message }]);
                }
        }
        
        }
    },[socket,loading,id])
    return <div>
        {Chats.map(m => <div>{m.message}</div>)}
        <input type="text" value = {currentMessages} onChange={e =>{
            setcurrentMessages(e.target.value);
        }} />
        <button onClick={()=>{
            socket?.send(JSON.stringify({
                type:"chat",
                roomId:id,
                meassages :currentMessages
            }))
            setcurrentMessages("");
        }} >Send message</button>
    </div>
}