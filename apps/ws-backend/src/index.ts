import {WebSocketServer, WebSocket} from "ws";
import jwt, { decode, JwtPayload }  from "jsonwebtoken";
import {JWT_SECRET} from "@repo/backend-common/config"
import {prismaClient} from "@repo/db/client"
const wss  = new WebSocketServer({port:8081, host: '0.0.0.0'});

// Add better error handling
wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
});

wss.on("listening", () => {
    console.log("WebSocket server is listening on port 8081");
});

interface user {
    ws:WebSocket,
    rooms:string[],
    userId:string
}
const users : user[] = [];

// Track pending shape updates to prevent spam during dragging
const pendingShapeUpdates = new Map<string, NodeJS.Timeout>();

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
        console.error("JWT verification failed:", e);
        return null
    }
}

wss.on("connection",function connection(ws,request){
    console.log("New WebSocket connection attempt");
    
    const url = request.url;
    if(!url){
        console.log("No URL provided, closing connection");
        ws.close();
        return ;
    }
    
    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get('token')||"";
    console.log("Token received:", token ? "Present" : "Missing");
    
    const userId = checkUser(token);
    if(!userId){
        console.log("Invalid token, closing connection");
        ws.close();
        return null
    }
    
    console.log("User authenticated:", userId);
    users.push({
        userId,
        rooms:[],
        ws
    })

    ws.on("message", async (data) => {
        try {
            const parsedData = JSON.parse(data as unknown as string);   
            console.log("Received message:", parsedData.type, "from user:", userId);
            
            const user = users.find(x => x.ws === ws);
            if (!user) {
                console.log("User not found in users array");
                return;
            }
          
            if (parsedData.type === "join_room") {
                console.log("User joining room:", parsedData.roomId);
                user.rooms.push(parsedData.roomId);
            }
          
            if (parsedData.type === "leave_room") {
                console.log("User leaving room:", parsedData.roomId);
                user.rooms = user.rooms.filter(x => x !== parsedData.roomId);
            }
          
            if (parsedData.type === "chat") {
                const { roomId, message } = parsedData;
                console.log("Chat message in room:", roomId);
          
                await prismaClient.chat.create({
                    data: {
                        roomId: Number(roomId),
                        message,
                        userId
                    }
                });
          
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

            if (parsedData.type === "edit_shape") {
                const { roomId, shape, isDragging } = parsedData;
                console.log("Edit shape in room:", roomId, "isDragging:", isDragging);
              
                // If this is a dragging update, debounce it to prevent spam
                if (isDragging) {
                    const key = `${roomId}-${shape.id || 'unknown'}`;
                    
                    // Clear existing timeout
                    if (pendingShapeUpdates.has(key)) {
                        clearTimeout(pendingShapeUpdates.get(key)!);
                    }
                    
                    // Set new timeout to batch the update
                    const timeout = setTimeout(async () => {
                        try {
                            // Only save to DB when dragging stops
                            await prismaClient.chat.create({
                                data: {
                                    roomId: Number(roomId),
                                    message: JSON.stringify({ 
                                        type: "shape_update",
                                        shape,
                                        timestamp: Date.now()
                                    }),
                                    userId
                                }
                            });
                            pendingShapeUpdates.delete(key);
                        } catch (error) {
                            console.error("Error saving shape update:", error);
                            pendingShapeUpdates.delete(key);
                        }
                    }, 100); // 100ms debounce
                    
                    pendingShapeUpdates.set(key, timeout);
                } else {
                    // Immediate save for non-dragging edits
                    await prismaClient.chat.create({
                        data: {
                            roomId: Number(roomId),
                            message: JSON.stringify({ 
                                type: "shape_update",
                                shape,
                                timestamp: Date.now()
                            }),
                            userId
                        }
                    });
                }
              
                // Broadcast to all users in the room
                users.forEach(u => {
                    if (u.rooms.includes(roomId) && u.ws.readyState === WebSocket.OPEN) {
                        u.ws.send(JSON.stringify({
                            type: "edit_shape",
                            shape,
                            roomId,
                            isDragging
                        }));
                    }
                });
            }

            if (parsedData.type === "draw") {
                const { roomId, shape } = parsedData;
                console.log("Draw shape in room:", roomId);
              
                await prismaClient.chat.create({
                    data: {
                        roomId: Number(roomId),
                        message: JSON.stringify({ 
                            type: "shape_create",
                            shape,
                            timestamp: Date.now()
                        }),
                        userId
                    }
                });
              
                users.forEach(u => {
                    if (u.rooms.includes(roomId) && u.ws.readyState === WebSocket.OPEN) {
                        u.ws.send(JSON.stringify({
                            type: "draw",
                            shape,
                            roomId
                        }));
                    }
                });
            }

            if (parsedData.type === "erase") {
                const { roomId, shapeId } = parsedData;
                console.log("Erase shape in room:", roomId, "shapeId:", shapeId);
              
                await prismaClient.chat.create({
                    data: {
                        roomId: Number(roomId),
                        message: JSON.stringify({ 
                            type: "shape_delete",
                            action: "erase", 
                            shapeId,
                            timestamp: Date.now()
                        }),
                        userId
                    }
                });
              
                users.forEach(u => {
                    if (u.rooms.includes(roomId) && u.ws.readyState === WebSocket.OPEN) {
                        u.ws.send(JSON.stringify({
                            type: "erase",
                            shapeId,
                            roomId
                        }));
                    }
                });
            }
        } catch (error) {
            console.error("Error processing message:", error);
        }
    });
      
    ws.on("close", () => {
        console.log("WebSocket connection closed for user:", userId);
        const index = users.findIndex(user => user.ws === ws);
        if (index !== -1) {
            users.splice(index, 1);
        }
    });
      
    ws.on("error", (error) => {
        console.error("WebSocket error for user:", userId, error);
    });
})