import { useEffect, useState } from 'react';
import { Pencil, Users } from 'lucide-react';

interface DrawingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface DrawingIndicatorProps {
  roomId: string;
  socket: WebSocket | null;
}

export function DrawingIndicator({ roomId, socket }: DrawingIndicatorProps) {
  const [activeDrawers, setActiveDrawers] = useState<DrawingUser[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "draw" && data.roomId === roomId && data.drawingUser) {
          const newDrawer: DrawingUser = {
            userId: data.drawingUser.userId,
            userName: data.drawingUser.userName,
            timestamp: Date.now()
          };
          
          setActiveDrawers(prev => {
            // Remove existing entry for this user if exists
            const filtered = prev.filter(d => d.userId !== newDrawer.userId);
            // Add new entry
            return [...filtered, newDrawer];
          });
          
          setIsVisible(true);
          
          // Hide after 3 seconds
          setTimeout(() => {
            setActiveDrawers(prev => prev.filter(d => d.userId !== newDrawer.userId));
            if (activeDrawers.length <= 1) {
              setIsVisible(false);
            }
          }, 3000);
        }
        
        if (data.type === "user_activity_update" && data.roomId === roomId) {
          if (data.activity === "started_drawing") {
            const newDrawer: DrawingUser = {
              userId: data.userId,
              userName: data.userName,
              timestamp: data.timestamp
            };
            
            setActiveDrawers(prev => {
              const filtered = prev.filter(d => d.userId !== newDrawer.userId);
              return [...filtered, newDrawer];
            });
            
            setIsVisible(true);
          } else if (data.activity === "stopped_drawing") {
            setActiveDrawers(prev => prev.filter(d => d.userId !== data.userId));
            if (activeDrawers.length <= 1) {
              setIsVisible(false);
            }
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.addEventListener('message', handleMessage);
    
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, roomId, activeDrawers.length]);

  if (!isVisible || activeDrawers.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 bg-white/95 backdrop-blur-md rounded-xl p-4 border border-gray-200/60 shadow-lg max-w-xs">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <Pencil className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">Active Drawing</h3>
          <p className="text-xs text-gray-500">{activeDrawers.length} user{activeDrawers.length > 1 ? 's' : ''} drawing</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {activeDrawers.map((drawer, index) => (
          <div key={drawer.userId} className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-700 font-medium">
              {drawer.userName}
            </span>
            <span className="text-xs text-gray-400">
              {index === activeDrawers.length - 1 ? 'now' : ''}
            </span>
          </div>
        ))}
      </div>
      
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        ×
      </button>
    </div>
  );
}
