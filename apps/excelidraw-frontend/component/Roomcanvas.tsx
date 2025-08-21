"use client";

import { WS_URL } from "@/config";
import { initDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";
import {Canvas } from "./Canvas";

export function RoomCanvas({roomId}: {roomId: string}) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    const connectWebSocket = () => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            setConnectionError("No authentication token found. Please sign in again.");
            return;
        }

        setIsConnecting(true);
        setConnectionError(null);

        try {
            const ws = new WebSocket(`${WS_URL}?token=${token}`);
            
            ws.onopen = () => {
                console.log("WebSocket connected successfully");
                setSocket(ws);
                setIsConnecting(false);
                
                // Join the room
                const data = JSON.stringify({
                    type: "join_room",
                    roomId
                });
                console.log("Joining room:", data);
                ws.send(data);
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                setConnectionError("Failed to connect to server. Please check your connection.");
                setIsConnecting(false);
            };

            ws.onclose = (event) => {
                console.log("WebSocket closed:", event.code, event.reason);
                setSocket(null);
                setIsConnecting(false);
                
                // Attempt to reconnect after a delay
                if (event.code !== 1000) { // Don't reconnect if closed normally
                    setTimeout(() => {
                        console.log("Attempting to reconnect...");
                        connectWebSocket();
                    }, 3000);
                }
            };

        } catch (error) {
            console.error("Error creating WebSocket:", error);
            setConnectionError("Failed to create WebSocket connection.");
            setIsConnecting(false);
        }
    };

    useEffect(() => {
        connectWebSocket();
        
        // Cleanup function
        return () => {
            if (socket) {
                socket.close(1000, "Component unmounting");
            }
        };
    }, [roomId]); // Add roomId to dependencies
   
    if (connectionError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full space-y-4 bg-white p-8 rounded-xl shadow-lg text-center">
                    <div className="text-red-500 text-lg font-semibold">Connection Error</div>
                    <p className="text-gray-600">{connectionError}</p>
                    <button 
                        onClick={connectWebSocket}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    if (isConnecting) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full space-y-4 bg-white p-8 rounded-xl shadow-lg text-center">
                    <div className="text-blue-500 text-lg font-semibold">Connecting to server...</div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            </div>
        );
    }

    if (!socket) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full space-y-4 bg-white p-8 rounded-xl shadow-lg text-center">
                    <div className="text-gray-500 text-lg font-semibold">No connection</div>
                    <button 
                        onClick={connectWebSocket}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Connect
                    </button>
                </div>
            </div>
        );
    }

    return <div>
        <Canvas roomId={roomId} socket={socket} />
    </div>
}