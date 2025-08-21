"use client";

import { getWsUrl } from "@/config";
import { initDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";
import {Canvas } from "./Canvas";
import { Wifi, WifiOff, RefreshCw, AlertCircle } from "lucide-react";

export function RoomCanvas({roomId}: {roomId: string}) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connectWebSocket = () => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            setConnectionError("No authentication token found. Please sign in again.");
            return;
        }

        setIsConnecting(true);
        setConnectionError(null);

        try {
            const wsUrl = `${getWsUrl()}?token=${token}`;
            console.log("Attempting to connect to WebSocket:", wsUrl);
            const ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log("WebSocket connected successfully");
                setSocket(ws);
                setIsConnecting(false);
                setRetryCount(0);
                
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
                // Don't set error immediately, let onclose handle it
            };

            ws.onclose = (event) => {
                console.log("WebSocket closed:", event.code, event.reason);
                setSocket(null);
                setIsConnecting(false);
                
                if (retryTimeoutRef.current) {
                    clearTimeout(retryTimeoutRef.current);
                }
                
                if (event.code !== 1000 && event.code !== 1001) {
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
                    console.log(`Attempting to reconnect in ${delay}ms... (attempt ${retryCount + 1})`);
                    
                    retryTimeoutRef.current = setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                        connectWebSocket();
                    }, delay);
                } else {
                    setConnectionError("Connection closed by server");
                }
            };

        } catch (error) {
            console.error("Error creating WebSocket:", error);
            setConnectionError("Failed to create WebSocket connection.");
            setIsConnecting(false);
        }
    };

    useEffect(() => {
        const initTimeout = setTimeout(() => {
            connectWebSocket();
        }, 500);
        
        return () => {
            clearTimeout(initTimeout);
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            if (socket) {
                socket.close(1000, "Component unmounting");
            }
        };
    }, [roomId]);
   
    if (connectionError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full space-y-6 bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl text-center">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-white text-xl font-semibold">Connection Error</h2>
                        <p className="text-white/70">{connectionError}</p>
                    </div>
                    <div className="space-y-3">
                        <button 
                            onClick={() => {
                                setConnectionError(null);
                                setRetryCount(0);
                                connectWebSocket();
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Retry Connection</span>
                        </button>
                        <button 
                            onClick={() => window.location.href = '/signin'}
                            className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
                        >
                            Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isConnecting) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full space-y-6 bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl text-center">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <Wifi className="w-8 h-8 text-blue-400 animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-white text-xl font-semibold">Connecting to server...</h2>
                        <p className="text-white/70">Establishing secure connection</p>
                    </div>
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                    </div>
                    {retryCount > 0 && (
                        <p className="text-white/50 text-sm">Retry attempt {retryCount}</p>
                    )}
                </div>
            </div>
        );
    }

    if (!socket) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full space-y-6 bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl text-center">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center">
                            <WifiOff className="w-8 h-8 text-gray-400" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-white text-xl font-semibold">No connection</h2>
                        <p className="text-white/70">Unable to establish connection</p>
                    </div>
                    <button 
                        onClick={() => {
                            setRetryCount(0);
                            connectWebSocket();
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                        <Wifi className="w-4 h-4" />
                        <span>Connect</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen">
            <Canvas roomId={roomId} socket={socket} />
        </div>
    );
}