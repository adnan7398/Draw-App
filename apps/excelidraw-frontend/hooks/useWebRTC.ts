import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalMessage, PeerState } from '../webrtc/types';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ],
};

export function useWebRTC(roomId: string, socket: WebSocket | null, currentUser: { id: string, name: string }) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<PeerState[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

    // Refs for mutable state not needing re-renders or accessed in callbacks
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    // We need to keep track of user info to associate with streams
    const peerUserInfo = useRef<Map<string, { name: string, color?: string }>>(new Map());

    // Initialize Local Media
    useEffect(() => {
        const initMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 320 }, // Low res for tiles
                        height: { ideal: 240 },
                        frameRate: 15
                    },
                    audio: true,
                });
                setLocalStream(stream);
                localStreamRef.current = stream;
            } catch (err) {
                console.error("Failed to get local media:", err);
            }
        };

        initMedia();

        return () => {
            // Cleanup local stream
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Update peers state from refs (helper)
    const updatePeersState = useCallback(() => {
        // Convert Map to array for rendering
        // We need to match streams to connections.
        // NOTE: This implementation assumes we have a way to get streams.
        // In a real implementation, we'd listen to 'track' events.

        // This is tricky because RTCPeerConnection doesn't store "Remote User Name" natively.
        // We rely on the peerUserInfo map.
    }, []);

    // Handle incoming signals
    useEffect(() => {
        if (!socket) return;

        const handleMessage = async (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'user-joined') {
                    const { userId, userName } = data;
                    const myId = currentUser.id || 'anon';
                    if (userId === myId) return;

                    console.log(`User joined: ${userId}, awaiting local stream...`);
                    // We need to wait for local stream before offering
                    // In this simple effect, we might miss it if stream isn't ready.
                    // Better approach: check ref.

                    if (localStreamRef.current) {
                        console.log(`Initiating connection to ${userId}`);
                        const pc = createPeerConnection(userId);
                        peersRef.current.set(userId, pc);
                        peerUserInfo.current.set(userId, { name: userName });

                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);

                        socket.send(JSON.stringify({
                            type: 'signal',
                            target: userId,
                            payload: { type: 'offer', sdp: offer }
                        }));
                    } else {
                        console.warn("Local stream not ready, skipping offer (should handle queueing)");
                        // For Phase 1, we assume stream initializes fast. 
                        // If this happens, we could use a state to retry or just re-run effect when stream changes?
                        // But stream change acts on effect deps.
                        // Actually, if 'localStream' changes, this effect re-runs. 
                        // But 'user-joined' is a one-time event.
                        // Ideally: we prefer 'user-joined' to trigger adding to a 'pendingUsers' list.
                    }

                } else if (data.type === 'signal') {
                    const { userId, payload } = data;
                    if (!payload) return;

                    let pc = peersRef.current.get(userId);

                    // If we receive an offer but have no PC, we must create one
                    if (!pc && payload.type === 'offer') {
                        console.log(`Received offer from ${userId}, creating connection`);
                        pc = createPeerConnection(userId);
                        peersRef.current.set(userId, pc);
                    }

                    if (!pc) {
                        console.warn(`Received signal for unknown peer ${userId} and not an offer`);
                        return;
                    }

                    if (payload.type === 'offer') {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);

                        socket.send(JSON.stringify({
                            type: 'signal',
                            target: userId,
                            payload: { type: 'answer', sdp: answer }
                        }));
                    } else if (payload.type === 'answer') {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                    } else if (payload.candidate) {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                        } catch (e) {
                            console.error("Error adding ICE candidate", e);
                        }
                    }
                } else if (data.type === 'user-left') {
                    const { userId } = data;
                    if (peersRef.current.has(userId)) {
                        peersRef.current.get(userId)?.close();
                        peersRef.current.delete(userId);
                        peerUserInfo.current.delete(userId);
                        setPeers(prev => prev.filter(p => p.id !== userId));
                    }
                }
            } catch (e) {
                console.error("Signal handling error", e);
            }
        };

        socket.addEventListener('message', handleMessage);
        return () => {
            socket.removeEventListener('message', handleMessage);
        };
    }, [socket, localStream, currentUser.id]); // Re-binds when localStream is ready

    const createPeerConnection = (remoteUserId: string) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks
        if (localStreamRef.current) {
            console.log(`Adding local tracks to ${remoteUserId}`);
            localStreamRef.current.getTracks().forEach(track => {
                console.log(`Adding track: kind=${track.kind}, label=${track.label}, enabled=${track.enabled}`);
                pc.addTrack(track, localStreamRef.current!);
            });
        } else {
            console.warn(`No local stream available when creating connection for ${remoteUserId}`);
        }

        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.send(JSON.stringify({
                    type: 'signal',
                    target: remoteUserId,
                    payload: { candidate: event.candidate }
                }));
            }
        };

        pc.ontrack = (event) => {
            console.log(`Received remote stream from ${remoteUserId}`, event.streams);
            const [remoteStream] = event.streams;

            if (!remoteStream) {
                console.error(`No stream found in event for ${remoteUserId}`);
                return;
            }

            remoteStream.getTracks().forEach(t => {
                console.log(`Remote track from ${remoteUserId}: kind=${t.kind}, enabled=${t.enabled}, muted=${t.muted}`);
                t.onunmute = () => console.log(`Remote track unmuted: ${t.kind}`);
            });

            // Update state
            setPeers(prev => {
                const existing = prev.find(p => p.id === remoteUserId);
                if (existing) {
                    // Update existing
                    return prev.map(p => p.id === remoteUserId ? { ...p, stream: remoteStream, isConnecting: false } : p);
                } else {
                    // Add new
                    return [...prev, {
                        id: remoteUserId,
                        connection: pc,
                        stream: remoteStream,
                        isMuted: false, // Initial assumption
                        isVideoOff: false,
                        userName: peerUserInfo.current.get(remoteUserId)?.name || `User ${remoteUserId.slice(0, 4)}`,
                        isConnecting: false
                    }];
                }
            });
        };

        // Detect disconnection
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                setPeers(prev => prev.filter(p => p.id !== remoteUserId));
                peersRef.current.delete(remoteUserId);
            }
        };

        pc.onnegotiationneeded = async () => {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: 'signal',
                        target: remoteUserId,
                        payload: { type: 'offer', sdp: offer }
                    }));
                }
            } catch (err) {
                console.error("Negotiation error:", err);
            }
        };

        // Add to state immediately to show "Connecting..." UI
        setPeers(prev => {
            if (prev.find(p => p.id === remoteUserId)) return prev;
            return [...prev, {
                id: remoteUserId,
                connection: pc,
                isMuted: false,
                isVideoOff: false,
                userName: peerUserInfo.current.get(remoteUserId)?.name || `User ${remoteUserId.slice(0, 4)}`,
                isConnecting: true
            }];
        });

        return pc;
    };

    // Effect to add tracks to existing peers when local stream becomes ready
    useEffect(() => {
        if (localStream && peersRef.current.size > 0) {
            console.log("Local stream ready, adding to existing peers");
            peersRef.current.forEach((pc, userId) => {
                const senders = pc.getSenders();
                const hasVideo = senders.some(s => s.track?.kind === 'video');
                const hasAudio = senders.some(s => s.track?.kind === 'audio');

                if (!hasVideo || !hasAudio) {
                    localStream.getTracks().forEach(track => {
                        const alreadyAdded = senders.some(s => s.track === track);
                        if (!alreadyAdded) {
                            console.log(`Adding missing track ${track.kind} to ${userId}`);
                            pc.addTrack(track, localStream);
                        }
                    });
                }
            });
        }
    }, [localStream]);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = !isVideoEnabled);
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    return {
        localStream,
        peers,
        isMuted,
        isVideoEnabled,
        toggleMute,
        toggleVideo
    };
}
