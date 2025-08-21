import { initDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon, Eraser, Users, Settings, Download, Undo2, Redo2, Palette, X, Minus } from "lucide-react";
import { Game } from "@/draw/Game";

export type Tool = "circle" | "rect" | "line" | "erase" | "pencil";

export function Canvas({
    roomId,
    socket
}: {
    socket: WebSocket;
    roomId: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("line");
    const [isConnected, setIsConnected] = useState(false);
    const [participantCount, setParticipantCount] = useState(1);
    const [showWelcome, setShowWelcome] = useState(true);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);

            return () => {
                g.destroy();
            }
        }
    }, [canvasRef]);

    useEffect(() => {
        if (socket) {
            setIsConnected(socket.readyState === WebSocket.OPEN);
            
            const handleOpen = () => setIsConnected(true);
            const handleClose = () => setIsConnected(false);
            
            socket.addEventListener('open', handleOpen);
            socket.addEventListener('close', handleClose);
            
            return () => {
                socket.removeEventListener('open', handleOpen);
                socket.removeEventListener('close', handleClose);
            };
        }
    }, [socket]);

    useEffect(() => {
        const updateCanvasSize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight - 80; // Account for top bar
            setCanvasSize({ width, height });
            
            if (canvasRef.current) {
                canvasRef.current.width = width;
                canvasRef.current.height = height;
            }
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, []);

    const handleUndo = () => {
        if (game) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
        }
    };

    const handleRedo = () => {
        if (game) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }));
        }
    };

    const handleDownload = () => {
        if (canvasRef.current) {
            const link = document.createElement('a');
            link.download = `drawing-${roomId}.png`;
            link.href = canvasRef.current.toDataURL();
            link.click();
        }
    };

    return (
        <div className="h-screen bg-gray-900 flex flex-col">
            <div className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <span className="text-white text-sm font-medium">
                                Room: {roomId}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2 text-white/70 text-sm">
                            <Users size={16} />
                            <span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
                        </div>
    </div>
                    
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleUndo}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo2 size={18} />
                        </button>
                        <button
                            onClick={handleRedo}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo2 size={18} />
                        </button>
                        <button
                            onClick={handleDownload}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Download Drawing"
                        >
                            <Download size={18} />
                        </button>
                        <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <Settings size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
                <canvas 
                    ref={canvasRef} 
                    width={canvasSize.width} 
                    height={canvasSize.height}
                    className="cursor-crosshair"
                />
                
                {showWelcome && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl max-w-md mx-4">
                            <div className="text-center space-y-4">
                                <h2 className="text-white text-2xl font-bold">Welcome to the Drawing Room!</h2>
                                <p className="text-white/70">
                                    Start creating amazing drawings with your team. Use the tools on the left to draw shapes, 
                                    and collaborate in real-time with others in the room.
                                </p>
                                <div className="space-y-2 text-white/60 text-sm">
                                    <p>• <strong>Line Tool:</strong> Draw straight lines</p>
                                    <p>• <strong>Pencil:</strong> Freehand sketching</p>
                                    <p>• <strong>Rectangle Tool:</strong> Create rectangles</p>
                                    <p>• <strong>Circle Tool:</strong> Draw circles</p>
                                    <p>• <strong>Eraser:</strong> Remove shapes</p>
                                </div>
                                <button
                                    onClick={() => setShowWelcome(false)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto"
                                >
                                    <span>Get Started</span>
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="absolute left-6 top-1/2 transform -translate-y-1/2">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-xl">
                        <div className="space-y-3">
                            <div className="text-center">
                                <h3 className="text-white/70 text-xs font-medium uppercase tracking-wider mb-3">
                                    Tools
                                </h3>
                            </div>
                            
                            <IconButton 
                                onClick={() => setSelectedTool("pencil")}
                                activated={selectedTool === "pencil"}
                                icon={<Pencil size={20} />}
                                label="Pencil"
                            />
                            <IconButton 
                                onClick={() => setSelectedTool("line")}
                                activated={selectedTool === "line"}
                                icon={<Minus size={20} />}
                                label="Line"
                            />
                            <IconButton 
                                onClick={() => setSelectedTool("rect")}
                                activated={selectedTool === "rect"}
                                icon={<RectangleHorizontalIcon size={20} />}
                                label="Rectangle"
                            />
                            <IconButton 
                                onClick={() => setSelectedTool("circle")}
                                activated={selectedTool === "circle"}
                                icon={<Circle size={20} />}
                                label="Circle"
                            />
                            <IconButton 
                                onClick={() => setSelectedTool("erase")}
                                activated={selectedTool === "erase"}
                                icon={<Eraser size={20} />}
                                label="Eraser"
                            />
                        </div>
                    </div>
                </div>

                <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-xl">
                        <div className="text-center mb-3">
                            <h3 className="text-white/70 text-xs font-medium uppercase tracking-wider">
                                Colors
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {['#FFFFFF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'].map((color) => (
                                <button
                                    key={color}
                                    className="w-8 h-8 rounded-lg border-2 border-white/20 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-6 left-6">
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                        isConnected 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>

                <div className="absolute bottom-6 right-6">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-xl max-w-xs">
                        <h4 className="text-white font-medium mb-2">Quick Tips</h4>
                        <ul className="text-white/70 text-sm space-y-1">
                            <li>• Click and drag to draw shapes</li>
                            <li>• Use Pencil for freehand sketching</li>
                            <li>• Hold Space or right-drag to pan</li>
                            <li>• Scroll to zoom, Ctrl/Cmd+0 to reset</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}