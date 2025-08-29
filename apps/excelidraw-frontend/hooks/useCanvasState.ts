import { useState, useEffect, useRef } from 'react';
import { CanvasState, Tool } from '@/component/types';
import { Game } from '@/draw/Game';

interface ConnectedUser {
  userId: string;
  userName?: string;
  isDrawing?: boolean;
  lastActivity?: number;
}

export function useCanvasState(roomId: string, socket: WebSocket) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game>();
  const [canvasState, setCanvasState] = useState<CanvasState>({
    selectedTool: "line",
    isConnected: false,
    participantCount: 1,
    showWelcome: true,
    canvasSize: { width: 0, height: 0 },
    isPanning: false
  });
  
  // Enhanced user tracking
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [currentUser, setCurrentUser] = useState<ConnectedUser | null>(null);

  // Initialize canvas and game
  useEffect(() => {
    if (canvasRef.current) {
      const g = new Game(canvasRef.current, roomId, socket);
      setGame(g);

      // Initialize canvas with text rendering
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#1565C0';
      }

      // Add event listener for quick tips toggle
      const handleToggleQuickTips = () => {
        setCanvasState(prev => ({ ...prev, showQuickTips: !prev.showQuickTips }));
      };
      
      // Add event listener for panning state
      const handlePanningState = (e: Event) => {
        const customEvent = e as CustomEvent;
        setCanvasState(prev => ({ ...prev, isPanning: customEvent.detail.isPanning }));
      };
      
      canvasRef.current.addEventListener('toggleQuickTips', handleToggleQuickTips);
      canvasRef.current.addEventListener('panningState', handlePanningState);

      return () => {
        g.destroy();
        g.stopCursorBlink();
        canvasRef.current?.removeEventListener('toggleQuickTips', handleToggleQuickTips);
        canvasRef.current?.removeEventListener('panningState', handlePanningState);
      }
    }
  }, [canvasRef, roomId, socket]);

  // Handle tool changes
  useEffect(() => {
    game?.setTool(canvasState.selectedTool);
    
    // Update cursor style based on selected tool
    if (canvasRef.current) {
      switch (canvasState.selectedTool) {
        case "colorpicker":
          canvasRef.current.style.cursor = "crosshair";
          break;
        case "text":
          canvasRef.current.style.cursor = "text";
          break;
        case "pencil":
          canvasRef.current.style.cursor = "crosshair";
          break;
        default:
          canvasRef.current.style.cursor = "crosshair";
          break;
      }
    }
  }, [canvasState.selectedTool, game]);

  // Handle socket connection
  useEffect(() => {
    if (socket) {
      setCanvasState(prev => ({ ...prev, isConnected: socket.readyState === WebSocket.OPEN }));
      
      const handleOpen = () => {
        setCanvasState(prev => ({ ...prev, isConnected: true }));
        
        // Get current user info from localStorage
        const token = localStorage.getItem("authToken");
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentUserInfo: ConnectedUser = {
              userId: payload.userId,
              userName: payload.name || payload.email || `User ${payload.userId.slice(0, 8)}`,
              lastActivity: Date.now()
            };
            setCurrentUser(currentUserInfo);
          } catch (error) {
            console.error("Error parsing user token:", error);
          }
        }
        
        // Request current participant count when connection opens
        socket.send(JSON.stringify({
          type: "get_participant_count",
          roomId: roomId
        }));
        
        // Send user activity to update user list
        if (currentUser) {
          socket.send(JSON.stringify({
            type: "user_activity",
            roomId: roomId,
            activity: "joined",
            userName: currentUser.userName
          }));
        }
      };
      
      const handleClose = () => setCanvasState(prev => ({ ...prev, isConnected: false }));
      
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "participant_count_update" && data.roomId === roomId) {
            console.log(`Participant count updated: ${data.count} users in room ${roomId}`);
            setCanvasState(prev => ({ ...prev, participantCount: data.count }));
            
            // Update connected users list if participants data is provided
            if (data.participants) {
              // Handle enhanced participant data from backend
              const users: ConnectedUser[] = data.participants.map((participant: any) => ({
                userId: participant.userId,
                userName: participant.userName || `User ${participant.userId.slice(0, 8)}`,
                lastActivity: participant.lastActivity || Date.now(),
                isDrawing: participant.isDrawing || false
              }));
              setConnectedUsers(users);
            }
          }
          
          if (data.type === "user_activity_update" && data.roomId === roomId) {
            console.log(`User activity: ${data.userName} - ${data.activity}`);
            
            setConnectedUsers(prev => {
              const existingUserIndex = prev.findIndex(u => u.userId === data.userId);
              
              if (existingUserIndex >= 0) {
                // Update existing user
                const updatedUsers = [...prev];
                updatedUsers[existingUserIndex] = {
                  ...updatedUsers[existingUserIndex],
                  userName: data.userName,
                  lastActivity: data.timestamp,
                  isDrawing: data.activity === 'drawing'
                };
                return updatedUsers;
              } else {
                // Add new user
                return [...prev, {
                  userId: data.userId,
                  userName: data.userName,
                  lastActivity: data.timestamp,
                  isDrawing: data.activity === 'drawing'
                }];
              }
            });
          }
          
          if (data.type === "draw" && data.roomId === roomId) {
            // Update drawing status for the user who is drawing
            if (data.drawingUser) {
              setConnectedUsers(prev => {
                return prev.map(user => ({
                  ...user,
                  isDrawing: user.userId === data.drawingUser.userId
                }));
              });
            }
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      socket.addEventListener('open', handleOpen);
      socket.addEventListener('close', handleClose);
      socket.addEventListener('message', handleMessage);
      
      return () => {
        socket.removeEventListener('open', handleOpen);
        socket.removeEventListener('close', handleClose);
        socket.removeEventListener('message', handleMessage);
      };
    }
  }, [socket, roomId, currentUser]);

  // Handle canvas size updates
  useEffect(() => {
    const updateCanvasSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight - 80; // Account for top bar
      setCanvasState(prev => ({ ...prev, canvasSize: { width, height } }));
      
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const setSelectedTool = (tool: Tool) => {
    setCanvasState(prev => ({ ...prev, selectedTool: tool }));
  };

  const setShowWelcome = (show: boolean) => {
    setCanvasState(prev => ({ ...prev, showWelcome: show }));
  };

  const setShowQuickTips = (show: boolean) => {
    setCanvasState(prev => ({ ...prev, showQuickTips: show }));
  };

  return {
    canvasRef,
    game,
    canvasState,
    connectedUsers,
    currentUser,
    setSelectedTool,
    setShowWelcome,
    setShowQuickTips
  };
}
