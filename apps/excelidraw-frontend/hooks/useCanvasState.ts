import { useState, useEffect, useRef } from 'react';
import { CanvasState, Tool } from '@/component/types';
import { Game } from '@/draw/Game';

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
        // Request current participant count when connection opens
        socket.send(JSON.stringify({
          type: "get_participant_count",
          roomId: roomId
        }));
      };
      const handleClose = () => setCanvasState(prev => ({ ...prev, isConnected: false }));
      
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "participant_count_update" && data.roomId === roomId) {
            console.log(`Participant count updated: ${data.count} users in room ${roomId}`);
            setCanvasState(prev => ({ ...prev, participantCount: data.count }));
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
  }, [socket, roomId]);

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
    setSelectedTool,
    setShowWelcome,
    setShowQuickTips
  };
}
