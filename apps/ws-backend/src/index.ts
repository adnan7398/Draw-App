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
    userId:string,
    userName?:string,
    isDrawing?:boolean,
    lastActivity?:number
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
                
                // Check if user is already in this room
                if (!user.rooms.includes(parsedData.roomId)) {
                    user.rooms.push(parsedData.roomId);
                }
                
                // Get only active users in this specific room
                const roomParticipants = users.filter(u => 
                    u.rooms.includes(parsedData.roomId) && 
                    u.ws.readyState === WebSocket.OPEN
                );
                const participantCount = roomParticipants.length;
                
                console.log(`Room ${parsedData.roomId} now has ${participantCount} active participants:`, 
                    roomParticipants.map(p => p.userId));
                
                // Broadcast updated participant count to all users in the room
                users.forEach(u => {
                    if (u.rooms.includes(parsedData.roomId) && u.ws.readyState === WebSocket.OPEN) {
                        u.ws.send(JSON.stringify({
                            type: "participant_count_update",
                            roomId: parsedData.roomId,
                            count: participantCount,
                            participants: roomParticipants.map(p => p.userId)
                        }));
                    }
                });
            }
            
            if (parsedData.type === "get_participant_count") {
                const { roomId } = parsedData;
                const roomParticipants = users.filter(u => 
                    u.rooms.includes(roomId) && 
                    u.ws.readyState === WebSocket.OPEN
                );
                const participantCount = roomParticipants.length;
                
                console.log(`User ${userId} requested participant count for room ${roomId}: ${participantCount} active users`);
                
                ws.send(JSON.stringify({
                    type: "participant_count_update",
                    roomId: roomId,
                    count: participantCount,
                    participants: roomParticipants.map(p => p.userId)
                }));
            }
            
            if (parsedData.type === "user_activity") {
                const { roomId, activity, userName } = parsedData;
                
                // Update user info
                user.userName = userName;
                user.lastActivity = Date.now();
                
                // Try to get user name from database if not provided
                if (!userName || userName.startsWith('User ')) {
                    try {
                        const dbUser = await prismaClient.user.findUnique({
                            where: { id: user.userId },
                            select: { name: true }
                        });
                        if (dbUser?.name) {
                            user.userName = dbUser.name;
                        }
                    } catch (error) {
                        console.error('Error fetching user name from database:', error);
                    }
                }
                
                // Broadcast user activity to all users in the room
                users.forEach(u => {
                    if (u.rooms.includes(roomId) && u.ws.readyState === WebSocket.OPEN) {
                        u.ws.send(JSON.stringify({
                            type: "user_activity_update",
                            roomId: roomId,
                            userId: user.userId,
                            userName: user.userName || userName,
                            activity: activity,
                            timestamp: Date.now()
                        }));
                    }
                });
            }
          
            if (parsedData.type === "leave_room") {
                console.log("User leaving room:", parsedData.roomId);
                user.rooms = user.rooms.filter(x => x !== parsedData.roomId);
                
                // Get only active users in this specific room
                const roomParticipants = users.filter(u => 
                    u.rooms.includes(parsedData.roomId) && 
                    u.ws.readyState === WebSocket.OPEN
                );
                const participantCount = roomParticipants.length;
                
                console.log(`Room ${parsedData.roomId} now has ${participantCount} active participants after user left`);
                
                // Broadcast updated participant count to all users in the room
                users.forEach(u => {
                    if (u.rooms.includes(parsedData.roomId) && u.ws.readyState === WebSocket.OPEN) {
                        u.ws.send(JSON.stringify({
                            type: "participant_count_update",
                            roomId: parsedData.roomId,
                            count: participantCount,
                            participants: roomParticipants.map(p => p.userId)
                        }));
                    }
                });
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
                
                // Update user's drawing status
                user.isDrawing = true;
                user.lastActivity = Date.now();
              
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
              
                // Try to get user name from database if not already set
                if (!user.userName || user.userName.startsWith('User ')) {
                    try {
                        const dbUser = await prismaClient.user.findUnique({
                            where: { id: user.userId },
                            select: { name: true }
                        });
                        if (dbUser?.name) {
                            user.userName = dbUser.name;
                        }
                    } catch (error) {
                        console.error('Error fetching user name from database:', error);
                    }
                }
                
                // Broadcast drawing activity to all users in the room
                users.forEach(u => {
                    if (u.rooms.includes(roomId) && u.ws.readyState === WebSocket.OPEN) {
                        u.ws.send(JSON.stringify({
                            type: "draw",
                            shape,
                            roomId,
                            drawingUser: {
                                userId: user.userId,
                                userName: user.userName || `User ${user.userId.slice(0, 8)}`
                            }
                        }));
                    }
                });
                
                // Clear drawing status after a short delay
                setTimeout(() => {
                    if (user) {
                        user.isDrawing = false;
                    }
                }, 2000);
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
        const user = users.find(user => user.ws === ws);
        if (user) {
            console.log(`User ${userId} was in rooms:`, user.rooms);
            
            // Broadcast participant count updates for all rooms the user was in
            user.rooms.forEach(roomId => {
                const roomParticipants = users.filter(u => 
                    u.ws !== ws && 
                    u.rooms.includes(roomId) && 
                    u.ws.readyState === WebSocket.OPEN
                );
                const participantCount = roomParticipants.length;
                
                console.log(`Room ${roomId} now has ${participantCount} active participants after disconnect`);
                
                users.forEach(u => {
                    if (u.ws !== ws && u.rooms.includes(roomId) && u.ws.readyState === WebSocket.OPEN) {
                        u.ws.send(JSON.stringify({
                            type: "participant_count_update",
                            roomId: roomId,
                            count: participantCount,
                            participants: roomParticipants.map(p => p.userId)
                        }));
                    }
                });
            });
            
            // Remove user from the array
            const index = users.findIndex(u => u.ws === ws);
            if (index !== -1) {
                users.splice(index, 1);
                console.log(`Removed user ${userId} from users array. Total users: ${users.length}`);
            }
        }
    });
      
    ws.on("error", (error) => {
        console.error("WebSocket error for user:", userId, error);
    });
})