import {WebSocketServer, WebSocket} from "ws";
import jwt, { decode, JwtPayload }  from "jsonwebtoken";
import {JWT_SECRET} from "@repo/backend-common/config"
import {prismaClient} from "@repo/db/client"
const wss  = new WebSocketServer({port:8080});
interface user {
    ws:WebSocket,
    rooms:string[],
    userId:string
}
const users : user[] = [];
function checkUser (token:string):string| null{
    try {
        const decoded = jwt.verify(token,JWT_SECRET);
    if(typeof decoded == "string"){
        return null;
    }
    if(!decoded || !(decoded as JwtPayload).userId){
        return null;
    }
        return decoded.userId;
    } catch (e) {
        return null
    }
}
wss.on("connection",function connection(ws,request){
    const url = request.url;
    if(!url){
        return ;
    }
    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get('token')||"";
    const userId = checkUser(token);
    if(!userId){
        ws.close();
        return null
    }
    users.push({
        userId,
        rooms:[],
        ws
    })

    ws.on("message", async (data) => {
        const parsedData = JSON.parse(data as unknown as string);   
        const user = users.find(x => x.ws === ws);
        if (!user) return;
      
        if (parsedData.type === "join_room") {
          user.rooms.push(parsedData.roomId);
        }
      
        if (parsedData.type === "leave_room") {
          user.rooms = user.rooms.filter(x => x !== parsedData.roomId);
        }
      
        if (parsedData.type === "chat") {
          const { roomId, message } = parsedData;
      
          await prismaClient.chat.create({
            data: {
              roomId: Number(roomId),
              message,
              userId
            }
          });
          if (parsedData.type === "edit_shape") {
            const { roomId, shape } = parsedData;
          
            await prismaClient.chat.create({
              data: {
                roomId: Number(roomId),
                message: JSON.stringify({ shape }),  // Save updated shape to DB
                userId
              }
            });
          
            users.forEach(u => {
              if (u.rooms.includes(roomId) && u.ws.readyState === WebSocket.OPEN) {
                u.ws.send(JSON.stringify({
                  type: "edit_shape",
                  shape,
                  roomId
                }));
              }
            });
          }
      
          users.forEach(u => {
            if (u.rooms.includes(roomId) && u.ws.readyState === WebSocket.OPEN) {
              u.ws.send(JSON.stringify({
                type: "chat",
                message,
                roomId
              }));
            }
          });
        }
      });
      
      ws.on("close", () => {
        const index = users.findIndex(user => user.ws === ws);
        if (index !== -1) {
          users.splice(index, 1);
        }
      });      
})