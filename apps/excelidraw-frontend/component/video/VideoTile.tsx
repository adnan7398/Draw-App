import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Move } from 'lucide-react';

interface VideoTileProps {
    stream: MediaStream | null;
    userName: string;
    isMuted: boolean;
    isVideoEnabled: boolean;
    isLocal?: boolean;
    color?: string;
    onToggleMute?: () => void;
    onToggleVideo?: () => void;
    disableDrag?: boolean;
    style?: React.CSSProperties;
    isConnecting?: boolean;
}

export function VideoTile({
    stream,
    userName,
    isMuted,
    isVideoEnabled,
    isLocal,
    color = '#1976D2',
    onToggleMute,
    onToggleVideo,
    disableDrag = false,
    style,
    isConnecting = false
}: VideoTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRel = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Handle Dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        if (disableDrag) return;

        e.stopPropagation(); // Prevent canvas interaction
        setIsDragging(true);
        dragStartRel.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && !disableDrag) {
                setPosition({
                    x: e.clientX - dragStartRel.current.x,
                    y: e.clientY - dragStartRel.current.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, disableDrag]);


    // Determine styles: mix standard absolute/transform with custom overrides
    // If custom style is provided (like in Grid), we might prefer static positioning
    const finalStyle: React.CSSProperties = {
        width: '240px',
        height: '180px',
        borderColor: isDragging ? '#fff' : color,
        zIndex: 50,
        cursor: disableDrag ? 'default' : (isDragging ? 'grabbing' : 'auto'),
        // Only apply transform if NO custom positioning/style is passed OR if we are dragging
        // But if 'style' passes position:relative, we might not want absolute transform
        ...style
    };

    // If no custom style overrides positioning, apply the drag transform
    if (!style?.position) {
        finalStyle.transform = `translate(${position.x}px, ${position.y}px)`;
        finalStyle.position = 'absolute'; // Default to absolute if not specified
    }

    return (
        <div
            className="flex flex-col items-center bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 transition-shadow"
            style={finalStyle}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {/* Video Container */}
            <div className="relative w-full h-full bg-black">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className={`w-full h-full object-cover transform ${isLocal ? 'scale-x-[-1]' : ''}`}
                />

                {!isVideoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold text-white">
                            {userName.slice(0, 2).toUpperCase()}
                        </div>
                    </div>
                )}

                {/* Overlay Controls */}
                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                    <span className="text-white text-xs font-medium truncate max-w-[120px]">{userName} {isLocal ? '(You)' : ''}</span>

                    <div className="flex gap-2">
                        {isLocal && (
                            <>
                                <button
                                    onClick={onToggleMute}
                                    className={`p-1.5 rounded-full ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white transition-colors`}
                                >
                                    {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                                </button>
                                <button
                                    onClick={onToggleVideo}
                                    className={`p-1.5 rounded-full ${!isVideoEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white transition-colors`}
                                >
                                    {!isVideoEnabled ? <VideoOff size={14} /> : <Video size={14} />}
                                </button>
                            </>
                        )}
                        {!isLocal && isMuted && (
                            <div className="p-1.5 rounded-full bg-red-500/80 text-white">
                                <MicOff size={14} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Drag Handle - Only show if drag is enabled */}
                {!disableDrag && (
                    <div
                        className="absolute top-2 right-2 p-1 bg-black/40 hover:bg-black/60 rounded cursor-grab active:cursor-grabbing text-white/50 hover:text-white transition-colors"
                        onMouseDown={handleMouseDown}
                    >
                        <Move size={14} />
                    </div>
                )}
            </div>
        </div>
    );
}
