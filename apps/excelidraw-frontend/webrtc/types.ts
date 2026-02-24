export interface SignalMessage {
    type: 'user-joined' | 'signal' | 'user-left';
    userId: string;
    payload?: any;
    target?: string; // For signal messages targeting a specific user
}

export interface PeerState {
    id: string; // userId
    connection: RTCPeerConnection;
    stream?: MediaStream;
    isMuted: boolean;
    isVideoOff: boolean;
    userName?: string;
    color?: string; // Cursor color for border
    isConnecting?: boolean;
}

export interface WebRTCState {
    localStream: MediaStream | null;
    peers: Map<string, PeerState>; // Reactive map? Or just use an array in state
    isMuted: boolean;
    isVideoEnabled: boolean;
}
