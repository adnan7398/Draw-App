
import { RoomCanvas } from "@/component/Roomcanvas";

export default async function CanvasPage({params}:{
   params: Promise<{
    roomId:string
   }>
}){
    const roomId = (await params).roomId;
    console.log(roomId);
     return <RoomCanvas roomId = {roomId} />
}