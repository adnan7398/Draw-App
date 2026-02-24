import React, { useState } from 'react';
import { VideoTile } from './VideoTile';
import { PeerState } from '../../webrtc/types';
import { X, Users } from 'lucide-react';

interface VideoGridProps {
    localStream: MediaStream | null;
    peers: PeerState[];
    isMuted: boolean;
    isVideoEnabled: boolean;
    currentUserName: string;
    onToggleMute: () => void;
    onToggleVideo: () => void;
}

export function VideoGrid({
    localStream,
    peers,
    isMuted,
    isVideoEnabled,
    currentUserName,
    onToggleMute,
    onToggleVideo
}: VideoGridProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const totalUsers = peers.length + 1; // Peers + Local

    // Compact Mode: Render pinned user (Local for now, or could implement pinning logic)
    const renderCompact = () => {
        console.log("VideoGrid renderCompact peers:", peers.length);
        return (
            <div className="absolute top-5 left-5 pointer-events-auto z-50 flex items-start gap-2">
                {/* Pinned User (Local) */}
                <div className="relative transform-gpu transition-all duration-300 hover:scale-105">
                    <VideoTile
                        stream={localStream}
                        userName={currentUserName}
                        isMuted={isMuted}
                        isVideoEnabled={isVideoEnabled}
                        isLocal={true}
                        onToggleMute={onToggleMute}
                        onToggleVideo={onToggleVideo}
                        // Small size for compact
                        style={{ width: '160px', height: '120px' }}
                    />
                </div>

                {/* Counter Button */}
                {peers.length > 0 && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="flex items-center justify-center w-12 h-12 bg-gray-900 rounded-full border-2 border-gray-700 hover:border-white shadow-xl text-white font-bold transition-all hover:scale-110"
                    >
                        +{peers.length}
                    </button>
                )}
            </div>
        );

    };

    // Expanded Mode: Modal Grid
    const renderExpanded = () => (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative bg-gray-900/90 border border-gray-700 rounded-2xl p-6 shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Users className="text-blue-400" size={24} />
                        </div>
                        <h2 className="text-xl font-semibold text-white">
                            Live Session <span className="text-gray-400 text-sm ml-2">({totalUsers} participants)</span>
                        </h2>
                    </div>
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Local User */}
                    <div className="relative h-48 w-full">
                        <VideoTile
                            stream={localStream}
                            userName={currentUserName}
                            isMuted={isMuted}
                            isVideoEnabled={isVideoEnabled}
                            isLocal={true}
                            onToggleMute={onToggleMute}
                            onToggleVideo={onToggleVideo}
                            disableDrag={true} // Disable drag in grid
                            style={{ width: '100%', height: '100%', position: 'relative' }} // Use static flow layout
                        />
                    </div>

                    {/* Remote Peers */}
                    {peers.map((peer) => (
                        <div key={peer.id} className="relative h-48 w-full">
                            <VideoTile
                                stream={peer.stream || null}
                                userName={peer.userName || 'Unknown'}
                                isMuted={peer.isMuted}
                                isVideoEnabled={!peer.isVideoOff}
                                isLocal={false}
                                color={peer.color}
                                disableDrag={true}
                                style={{ width: '100%', height: '100%', position: 'relative' }}
                                isConnecting={peer.isConnecting}
                            />
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );

    return (
        <>
            {!isExpanded && renderCompact()}
            {isExpanded && renderExpanded()}
        </>
    );
}
