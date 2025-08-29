import { CanvasRefactored } from "./CanvasRefactored";

export function Canvas({
    roomId,
    socket
}: {
    socket: WebSocket;
    roomId: string;
}) {
    return <CanvasRefactored roomId={roomId} socket={socket} />;
}