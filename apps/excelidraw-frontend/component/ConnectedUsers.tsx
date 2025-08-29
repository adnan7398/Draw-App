import { Users, User, Activity } from "lucide-react";
import { ConnectedUser } from "./types";

interface ConnectedUsersProps {
  connectedUsers: ConnectedUser[];
  currentUser: ConnectedUser | null;
  participantCount: number;
}

export function ConnectedUsers({ 
  connectedUsers, 
  currentUser, 
  participantCount 
}: ConnectedUsersProps) {
  const getStatusColor = (user: ConnectedUser) => {
    if (user.isDrawing) return "text-green-500";
    if (user.lastActivity && Date.now() - user.lastActivity < 30000) return "text-blue-500";
    return "text-gray-400";
  };

  const getStatusText = (user: ConnectedUser) => {
    if (user.isDrawing) return "Drawing";
    if (user.lastActivity && Date.now() - user.lastActivity < 30000) return "Active";
    return "Idle";
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return "Long ago";
  };

  return (
    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-gray-200/60 shadow-lg max-w-xs">
      <div className="flex items-center space-x-2 mb-3">
        <Users className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">
          Connected Users ({participantCount})
        </span>
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {connectedUsers.length === 0 ? (
          <div className="text-center py-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <User className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500">No other users connected</p>
          </div>
        ) : (
          connectedUsers.map((user) => (
            <div 
              key={user.userId} 
              className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                currentUser?.userId === user.userId 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex-shrink-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  user.isDrawing ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <User className={`w-3 h-3 ${
                    user.isDrawing ? 'text-green-600' : 'text-gray-500'
                  }`} />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-medium text-gray-900 truncate">
                    {user.userName || `User ${user.userId.slice(0, 8)}`}
                  </span>
                  {currentUser?.userId === user.userId && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-1 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(user)}`}></div>
                  <span className={`text-xs ${getStatusColor(user)}`}>
                    {getStatusText(user)}
                  </span>
                  {user.lastActivity && (
                    <span className="text-xs text-gray-400">
                      • {formatTimeAgo(user.lastActivity)}
                    </span>
                  )}
                </div>
              </div>
              
              {user.isDrawing && (
                <div className="flex-shrink-0">
                  <Activity className="w-3 h-3 text-green-500 animate-pulse" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {connectedUsers.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Total connected</span>
            <span className="font-medium">{participantCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
