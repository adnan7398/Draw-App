import { PenLine, Users, Brain, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

interface HeaderProps {
  roomId: string;
  isConnected: boolean;
  participantCount: number;
  showAIPanel: boolean;
  showQuickTips: boolean;
  onToggleAIPanel: () => void;
  onToggleQuickTips: () => void;
  onToggleConnectedUsers?: () => void;
  showConnectedUsers?: boolean;
}

interface RoomInfo {
  id: number;
  name: string;
  slug: string;
  roomCode?: string;
  isPrivate?: boolean;
}

export function Header({ 
  roomId, 
  isConnected, 
  participantCount, 
  showAIPanel, 
  showQuickTips,
  onToggleAIPanel,
  onToggleQuickTips,
  onToggleConnectedUsers,
  showConnectedUsers = true
}: HeaderProps) {
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        setIsLoading(true);
        
        // Only try to fetch room info if we have a valid roomId
        if (!roomId || roomId === 'undefined' || roomId === 'null') {
          setIsLoading(false);
          return;
        }

        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }

        const token = localStorage.getItem("authToken");
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
        
        // Validate backend URL
        if (!backendUrl || backendUrl === 'undefined') {
          console.warn('Invalid backend URL, skipping room info fetch');
          setIsLoading(false);
          return;
        }
        
        // Check if axios is available
        if (!axios) {
          console.warn('Axios not available, skipping room info fetch');
          setIsLoading(false);
          return;
        }

        // First check if the backend is available
        try {
          await axios.get(`${backendUrl}/health`, { timeout: 3000 });
        } catch (healthError) {
          console.log("Backend not available, skipping room info fetch");
          setIsLoading(false);
          return;
        }

        const response = await axios.get(`${backendUrl}/room/id/${roomId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000, // 5 second timeout
        });

        if (response.data.success) {
          setRoomInfo(response.data.room);
        }
      } catch (error: any) {
        console.error("Failed to fetch room info:", error?.message || error);
        // If room info fetch fails, we'll just show the room ID
        // Don't throw the error, just log it
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomInfo();
  }, [roomId]);

  const getBackendUrl = () => {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Left side - App branding and room info */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <PenLine className="w-6 h-6 text-blue-600" />
          <span className="text-lg font-semibold text-gray-900">DrawApp</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Room:</span>
          {isLoading ? (
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">Loading...</span>
          ) : roomInfo ? (
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{roomInfo.name}</span>
              {roomInfo.isPrivate && roomInfo.roomCode && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  Code: {roomInfo.roomCode}
                </span>
              )}
            </div>
          ) : (
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
              {roomId && roomId !== 'undefined' && roomId !== 'null' ? roomId : 'No Room'}
            </span>
          )}
        </div>
      </div>

      {/* Center - Connection status */}
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm text-gray-600">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Right side - Actions and counts */}
      <div className="flex items-center space-x-3">
        {/* Connected Users Count */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{participantCount} users</span>
        </div>

        {/* Toggle Connected Users Panel */}
        {onToggleConnectedUsers && (
          <button
            onClick={onToggleConnectedUsers}
            className={`p-2 rounded-lg transition-colors ${
              showConnectedUsers 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={showConnectedUsers ? 'Hide connected users' : 'Show connected users'}
          >
            <Users className="w-4 h-4" />
          </button>
        )}

        {/* AI Panel Toggle */}
        <button
          onClick={onToggleAIPanel}
          className={`p-2 rounded-lg transition-colors ${
            showAIPanel 
              ? 'bg-purple-100 text-purple-600' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={showAIPanel ? 'Hide AI tools' : 'Show AI tools'}
        >
          <Brain className="w-4 h-4" />
        </button>

        {/* Quick Tips Toggle */}
        <button
          onClick={onToggleQuickTips}
          className={`p-2 rounded-lg transition-colors ${
            showQuickTips 
              ? 'bg-yellow-100 text-yellow-600' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={showQuickTips ? 'Hide quick tips' : 'Show quick tips'}
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
