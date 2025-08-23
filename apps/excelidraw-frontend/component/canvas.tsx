import { initDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon, Eraser, Users, Settings, Download, Undo2, Redo2, Palette, X, Minus, Brain, Sparkles, Upload, Shapes, Layout, Type, Wand2, Download as DownloadIcon } from "lucide-react";
import { Game } from "@/draw/Game";
import { getMLBackendUrl } from "@/config";

export type Tool = "circle" | "rect" | "line" | "erase" | "pencil" | "text";

interface AIAnalysisResult {
  shapes?: any;
  diagram?: any;
  text?: any;
  suggestions?: any;
}

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
    
    // AI Tools State
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiOperation, setAiOperation] = useState('');
    const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
    const [aiError, setAiError] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiContext, setAiContext] = useState('');
    
    // Text Tool State
    const [textInput, setTextInput] = useState('');
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
    const [isTyping, setIsTyping] = useState(false);
    const [textElements, setTextElements] = useState<Array<{id: string, text: string, x: number, y: number, fontSize: number, color: string}>>([]);
    const [textIdCounter, setTextIdCounter] = useState(0);
    const [currentTextElement, setCurrentTextElement] = useState<{id: string, text: string, x: number, y: number, fontSize: number, color: string} | null>(null);
    
    // Live AI Shape Recognition
    const [liveAIShape, setLiveAIShape] = useState(false);
    const [shapeDetectionTimeout, setShapeDetectionTimeout] = useState<NodeJS.Timeout | null>(null);
    const [lastDrawnShape, setLastDrawnShape] = useState<any>(null);
    const [isConvertingShape, setIsConvertingShape] = useState(false);

    const mlBackendUrl = getMLBackendUrl();

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);

            // Initialize canvas with text rendering
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.font = '16px Arial';
                ctx.fillStyle = '#FFFFFF';
            }

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

    // Add keyboard event listener for text typing
    useEffect(() => {
        if (isTyping) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isTyping, currentTextElement]);

    // Redraw canvas whenever text elements change
    useEffect(() => {
        redrawCanvas();
    }, [textElements]);

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

    // AI Tools Functions
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setAiError('');
        }
    };

    const runCompleteAIAnalysis = async () => {
        if (!selectedFile) {
            setAiError('Please select an image first');
            return;
        }

        setAiLoading(true);
        setAiOperation('Running complete AI analysis...');
        setAiError('');

        try {
            const formData = new FormData();
            formData.append('image', selectedFile);
            formData.append('include_ocr', 'true');
            formData.append('include_shape_recognition', 'true');
            formData.append('include_diagram_detection', 'true');

            const response = await fetch(`${mlBackendUrl}/ai/complete-analysis`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Complete analysis failed: ${response.statusText}`);
            }

            const result = await response.json();
            setAiResult(result.analysis);
            
        } catch (err) {
            setAiError(err instanceof Error ? err.message : 'Complete analysis failed');
        } finally {
            setAiLoading(false);
            setAiOperation('');
        }
    };

    const suggestDiagram = async () => {
        if (!aiPrompt.trim()) {
            setAiError('Please enter a description');
            return;
        }

        setAiLoading(true);
        setAiOperation('Getting diagram suggestions...');
        setAiError('');

        try {
            const formData = new FormData();
            formData.append('description', aiPrompt);

            const response = await fetch(`${mlBackendUrl}/ai/suggest-diagram`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Suggestion failed: ${response.statusText}`);
            }

            const result = await response.json();
            setAiResult({ suggestions: result });
            
        } catch (err) {
            setAiError(err instanceof Error ? err.message : 'Suggestion failed');
        } finally {
            setAiLoading(false);
            setAiOperation('');
        }
    };

    const downloadImage = (base64Data: string, filename: string) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64Data}`;
        link.download = filename;
        link.click();
    };

    // Live AI Shape Recognition Functions
    const enableLiveAIShape = () => {
        setLiveAIShape(true);
        // Add event listener to canvas for drawing detection
        if (canvasRef.current) {
            canvasRef.current.addEventListener('mouseup', handleDrawingComplete);
            canvasRef.current.addEventListener('touchend', handleDrawingComplete);
        }
    };

    const disableLiveAIShape = () => {
        setLiveAIShape(false);
        if (canvasRef.current) {
            canvasRef.current.removeEventListener('mouseup', handleDrawingComplete);
            canvasRef.current.removeEventListener('touchend', handleDrawingComplete);
        }
        if (shapeDetectionTimeout) {
            clearTimeout(shapeDetectionTimeout);
        }
    };

    const handleDrawingComplete = () => {
        if (!liveAIShape || selectedTool !== 'pencil') return;
        
        // Clear previous timeout
        if (shapeDetectionTimeout) {
            clearTimeout(shapeDetectionTimeout);
        }
        
        // Wait a bit for the drawing to complete, then analyze
        const timeout = setTimeout(() => {
            analyzeAndConvertShape();
        }, 1000); // 1 second delay
        
        setShapeDetectionTimeout(timeout);
    };

    const analyzeAndConvertShape = async () => {
        if (!canvasRef.current || !liveAIShape) return;
        
        setIsConvertingShape(true);
        
        try {
            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve) => {
                canvasRef.current!.toBlob((blob) => {
                    resolve(blob!);
                }, 'image/png');
            });
            
            // Create file from blob
            const file = new File([blob], 'drawn-shape.png', { type: 'image/png' });
            
            // Send to AI backend for shape recognition
            const formData = new FormData();
            formData.append('image', file);
            formData.append('clean_shapes', 'true');
            
            const response = await fetch(`${mlBackendUrl}/ai/shape-recognition`, {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                throw new Error('Shape recognition failed');
            }
            
            const result = await response.json();
            
            if (result.shapes && result.shapes.length > 0 && result.cleaned_image) {
                // Replace the rough drawing with the cleaned shape
                replaceCanvasWithCleanedShape(result.cleaned_image);
                setLastDrawnShape(result);
                
                // Show success message
                setAiError('');
                
                // Show success notification
                setTimeout(() => {
                    setAiError('Shape converted successfully! ✨');
                    setTimeout(() => setAiError(''), 3000);
                }, 100);
            }
            
        } catch (err) {
            console.error('Live shape recognition failed:', err);
            setAiError('Shape conversion failed. Try drawing more clearly.');
        } finally {
            setIsConvertingShape(false);
        }
    };

    const replaceCanvasWithCleanedShape = (cleanedImageBase64: string) => {
        if (!canvasRef.current) return;
        
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        // Create a new image from the cleaned base64
        const img = new Image();
        img.onload = () => {
            // Clear the canvas area where the shape was drawn
            // For simplicity, we'll clear the entire canvas and redraw
            ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
            
            // Draw the cleaned shape
            img.src = `data:image/png;base64,${cleanedImageBase64}`;
            
            // Notify the game about the change
            if (game) {
                // The canvas has been updated with the cleaned shape
                console.log('Canvas updated with cleaned shape');
            }
        };
        img.src = `data:image/png;base64,${cleanedImageBase64}`;
    };

    // Text Tool Functions
    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (selectedTool === 'text') {
            const rect = canvasRef.current!.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            setTextPosition({ x, y });
            setIsTyping(true);
            
            // Create a new text element
            const newTextElement = {
                id: `text-${textIdCounter}`,
                text: '',
                x: x,
                y: y,
                fontSize: 16,
                color: '#FFFFFF'
            };
            
            setCurrentTextElement(newTextElement);
            setTextElements(prev => [...prev, newTextElement]);
            setTextIdCounter(prev => prev + 1);
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (!isTyping || !currentTextElement) return;
        
        if (event.key === 'Enter') {
            // Finish typing
            setIsTyping(false);
            setCurrentTextElement(null);
        } else if (event.key === 'Escape') {
            // Cancel typing and remove the text element
            setIsTyping(false);
            setTextElements(prev => prev.filter(text => text.id !== currentTextElement.id));
            setCurrentTextElement(null);
        } else if (event.key === 'Backspace') {
            // Remove last character
            setTextElements(prev => prev.map(text => 
                text.id === currentTextElement.id 
                    ? { ...text, text: text.text.slice(0, -1) }
                    : text
            ));
        } else if (event.key.length === 1) {
            // Add character
            setTextElements(prev => prev.map(text => 
                text.id === currentTextElement.id 
                    ? { ...text, text: text.text + event.key }
                    : text
            ));
        }
    };

    const removeText = (id: string) => {
        setTextElements(prev => prev.filter(text => text.id !== id));
    };

    const drawTextElements = () => {
        if (!canvasRef.current) return;
        
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        textElements.forEach(textElement => {
            if (textElement.text.trim()) { // Only draw if text has content
                ctx.font = `${textElement.fontSize}px Arial`;
                ctx.fillStyle = textElement.color;
                ctx.fillText(textElement.text, textElement.x, textElement.y);
            }
        });
    };

    // Function to redraw canvas with all elements
    const redrawCanvas = () => {
        if (!canvasRef.current) return;
        
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Redraw all text elements
        drawTextElements();
        
        // Trigger game redraw if available
        if (game) {
            // Force a redraw of the game canvas
            console.log('Canvas redrawn with text elements');
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
                            onClick={() => setShowAIPanel(!showAIPanel)}
                            className={`p-2 rounded-lg transition-colors flex items-center space-x-2 ${
                                showAIPanel 
                                    ? 'bg-purple-600 text-white' 
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                            title="AI Tools"
                        >
                            <Brain size={18} />
                            <span className="text-sm font-medium">AI</span>
                        </button>
                        <button
                            onClick={() => {
                                if (liveAIShape) {
                                    disableLiveAIShape();
                                } else {
                                    enableLiveAIShape();
                                }
                            }}
                            className={`p-2 rounded-lg transition-colors flex items-center space-x-2 ${
                                liveAIShape 
                                    ? 'bg-green-600 text-white' 
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                            title="Live AI Shape Recognition"
                        >
                            <Sparkles size={18} />
                            <span className="text-sm font-medium">Live AI</span>
                        </button>
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
                    className="cursor-crosshair touch-none select-none"
                    style={{
                        touchAction: 'none',
                        userSelect: 'none',
                        WebkitUserSelect: 'none'
                    }}
                    onClick={handleCanvasClick}
                />
                
                {/* Live AI Shape Conversion Notification */}
                {isConvertingShape && (
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40">
                        <div className="bg-blue-500/90 backdrop-blur-md rounded-lg px-6 py-3 border border-blue-400/30 shadow-xl">
                            <div className="flex items-center space-x-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span className="text-white font-medium">Converting rough shape to perfect geometry...</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Text Typing Indicator */}
                {isTyping && (
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40">
                        <div className="bg-blue-500/90 backdrop-blur-md rounded-lg px-6 py-3 border border-blue-400/30 shadow-xl">
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span className="text-white font-medium">Type your text now! Press Enter to finish, Escape to cancel</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Text Cursor Indicator */}
                {isTyping && currentTextElement && (
                    <div 
                        className="absolute w-0.5 h-6 bg-white animate-pulse z-30"
                        style={{
                            left: currentTextElement.x + 6,
                            top: currentTextElement.y - 20
                        }}
                    />
                )}

                {/* AI Tools Panel */}
                {showAIPanel && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-10 h-10 rounded-xl flex items-center justify-center">
                                        <Brain className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-white text-2xl font-bold">AI Drawing Assistant</h2>
                                        <p className="text-white/70 text-sm">Powered by Machine Learning</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAIPanel(false)}
                                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* AI Loading State */}
                            {aiLoading && (
                                <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                                        <span className="text-blue-300">{aiOperation}</span>
                                    </div>
                                </div>
                            )}

                            {/* AI Error Display */}
                            {aiError && (
                                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                                    <p className="text-red-300">{aiError}</p>
                                </div>
                            )}

                            {/* File Upload Section */}
                            <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                                <h3 className="text-white font-medium mb-3 flex items-center">
                                    <Upload className="w-5 h-5 mr-2" />
                                    Upload Image for AI Analysis
                                </h3>
                                
                                <div className="flex items-center space-x-4 mb-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                                    />
                                    {selectedFile && (
                                        <span className="text-white/70 text-sm">
                                            Selected: {selectedFile.name}
                                        </span>
                                    )}
                                </div>

                                {selectedFile && (
                                    <button
                                        onClick={runCompleteAIAnalysis}
                                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center"
                                    >
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        Run Complete AI Analysis
                                    </button>
                                )}
                            </div>

                            {/* AI Features Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Shape Recognition */}
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex items-center mb-3">
                                        <Shapes className="w-6 h-6 text-blue-400 mr-2" />
                                        <h4 className="text-white font-medium">Shape Recognition</h4>
                                    </div>
                                    <p className="text-white/70 text-sm mb-3">
                                        Convert rough sketches to neat geometric shapes
                                    </p>
                                    {aiResult?.shapes && (
                                        <div className="space-y-2 text-sm text-white/80">
                                            <div>Shapes Detected: <span className="font-semibold">{aiResult.shapes.shapes_detected}</span></div>
                                            {aiResult.shapes.cleaned_image && (
                                                <div className="flex items-center space-x-2">
                                                    <img 
                                                        src={`data:image/png;base64,${aiResult.shapes.cleaned_image}`} 
                                                        alt="Cleaned shapes" 
                                                        className="w-16 h-16 rounded border"
                                                    />
                                                    <button
                                                        onClick={() => downloadImage(aiResult.shapes.cleaned_image!, 'cleaned_shapes.png')}
                                                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                                    >
                                                        Download
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Diagram Detection */}
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex items-center mb-3">
                                        <Layout className="w-6 h-6 text-green-400 mr-2" />
                                        <h4 className="text-white font-medium">Diagram Detection</h4>
                                    </div>
                                    <p className="text-white/70 text-sm mb-3">
                                        Detect flowchart, UML, mindmap types
                                    </p>
                                    {aiResult?.diagram && (
                                        <div className="space-y-2 text-sm text-white/80">
                                            <div>Type: <span className="font-semibold capitalize">{aiResult.diagram.diagram_type}</span></div>
                                            <div>Confidence: <span className="font-semibold">{(aiResult.diagram.confidence * 100).toFixed(0)}%</span></div>
                                            {aiResult.diagram.cleaned_image && (
                                                <div className="flex items-center space-x-2">
                                                    <img 
                                                        src={`data:image/png;base64,${aiResult.diagram.cleaned_image}`} 
                                                        alt="Cleaned diagram" 
                                                        className="w-16 h-16 rounded border"
                                                    />
                                                    <button
                                                        onClick={() => downloadImage(aiResult.diagram.cleaned_image!, 'cleaned_diagram.png')}
                                                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                                                    >
                                                        Download
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Handwriting OCR */}
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex items-center mb-3">
                                        <Type className="w-6 h-6 text-purple-400 mr-2" />
                                        <h4 className="text-white font-medium">Handwriting OCR</h4>
                                    </div>
                                    <p className="text-white/70 text-sm mb-3">
                                        Convert handwritten notes to text
                                    </p>
                                    {aiResult?.text && (
                                        <div className="space-y-2 text-sm text-white/80">
                                            <div>Extracted: <span className="font-semibold">{aiResult.text.extracted_text}</span></div>
                                            <div>Confidence: <span className="font-semibold">{(aiResult.text.confidence * 100).toFixed(0)}%</span></div>
                                        </div>
                                    )}
                                </div>

                                {/* AI Assistant */}
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex items-center mb-3">
                                        <Brain className="w-6 h-6 text-indigo-400 mr-2" />
                                        <h4 className="text-white font-medium">AI Assistant</h4>
                                    </div>
                                    <p className="text-white/70 text-sm mb-3">
                                        Get intelligent suggestions
                                    </p>
                                    
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Describe diagram you want..."
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <button
                                            onClick={suggestDiagram}
                                            className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                        >
                                            Get Suggestion
                                        </button>
                                    </div>

                                    {aiResult?.suggestions && (
                                        <div className="mt-3 p-3 bg-purple-500/20 rounded-lg">
                                            <div className="text-sm text-white/90">
                                                <span className="font-medium">Suggested: </span>
                                                <span className="capitalize text-purple-300">{aiResult.suggestions.suggested_diagram}</span>
                                                {aiResult.suggestions.confidence && (
                                                    <span className="ml-2 text-white/70">
                                                        ({(aiResult.suggestions.confidence * 100).toFixed(0)}% confidence)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Text Management Section */}
                            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                                <h4 className="text-white font-medium mb-3 flex items-center">
                                    <Type className="w-5 h-5 mr-2" />
                                    Text Elements ({textElements.length})
                                </h4>
                                
                                {textElements.length === 0 ? (
                                    <p className="text-white/50 text-sm">No text elements added yet. Use the Text tool to add labels.</p>
                                ) : (
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {textElements.map((textElement) => (
                                            <div key={textElement.id} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
                                                <div className="flex-1">
                                                    <span className="text-white text-sm">{textElement.text}</span>
                                                    <span className="text-white/50 text-xs ml-2">
                                                        ({textElement.x.toFixed(0)}, {textElement.y.toFixed(0)})
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => removeText(textElement.id)}
                                                    className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs hover:bg-red-500/30 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => setShowAIPanel(false)}
                                    className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    Close AI Panel
                                </button>
                                <button
                                    onClick={() => window.open('/ai-tools', '_blank')}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                                >
                                    Open Full AI Tools
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
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
                                    <p>• <strong>Text Tool:</strong> Click and type directly on canvas</p>
                                    <p>• <strong>AI Tools:</strong> Click the AI button for smart features</p>
                                    <p>• <strong>Live AI:</strong> Enable to auto-convert rough shapes to perfect ones</p>
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
                                {liveAIShape && (
                                    <div className="mb-3 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
                                        <div className="flex items-center justify-center space-x-1">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            <span className="text-green-300 text-xs font-medium">Live AI Active</span>
                                        </div>
                                    </div>
                                )}
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
                            <IconButton 
                                onClick={() => setSelectedTool("text")}
                                activated={selectedTool === "text"}
                                icon={<Type size={20} />}
                                label="Text"
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
                    <div className="flex space-x-3">
                        <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                            isConnected 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </div>
                        
                        {liveAIShape && (
                            <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 ${
                                isConvertingShape 
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                            }`}>
                                <div className={`w-2 h-2 rounded-full ${
                                    isConvertingShape ? 'bg-blue-400 animate-pulse' : 'bg-green-400'
                                }`}></div>
                                <span>
                                    {isConvertingShape ? 'Converting Shape...' : 'Live AI Active'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-6 right-6">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-xl max-w-xs">
                        <h4 className="text-white font-medium mb-2">Quick Tips</h4>
                        <ul className="text-white/70 text-sm space-y-1">
                            <li>• Click and drag to draw shapes</li>
                            <li>• Use Pencil for freehand sketching</li>
                            <li>• Click Text tool, then click canvas and type</li>
                            <li>• Hold Space or right-drag to pan</li>
                            <li>• Scroll to zoom, Ctrl/Cmd+0 to reset</li>
                            <li>• Click AI button for smart features</li>
                            <li>• Enable Live AI to auto-convert rough shapes</li>
                            <li>• Upload images for AI analysis</li>
                        </ul>
                        
                        {/* Debug Info */}
                        {textElements.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/20">
                                <h5 className="text-white/70 text-xs font-medium mb-1">Text Elements: {textElements.length}</h5>
                                <div className="text-white/50 text-xs space-y-1">
                                    {textElements.map((text, index) => (
                                        <div key={text.id}>
                                            "{text.text}" at ({text.x.toFixed(0)}, {text.y.toFixed(0)})
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}