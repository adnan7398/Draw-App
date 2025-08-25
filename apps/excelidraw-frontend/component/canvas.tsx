import { initDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon, Eraser, Users, Settings, Download, Undo2, Redo2, Palette, X, Minus, Brain, Sparkles, Upload, Shapes, Layout, Type, Wand2, Download as DownloadIcon, Copy, Trash2, Layers, Eye, EyeOff, Droplets, Pipette, PenLine } from "lucide-react";
import { Game } from "@/draw/Game";
import { getMLBackendUrl } from "@/config";
import { PerformanceMonitor } from "./PerformanceMonitor";

export type Tool = "circle" | "rect" | "line" | "erase" | "pencil" | "text" | "colorpicker";

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
    
    // Text Tool State - Now integrated with Game.ts
    const [isTyping, setIsTyping] = useState(false);
    const [currentTextShapeId, setCurrentTextShapeId] = useState<string | null>(null);
    const [textInput, setTextInput] = useState('');
    
    // Live AI Shape Recognition
    const [liveAIShape, setLiveAIShape] = useState(false);
    const [shapeDetectionTimeout, setShapeDetectionTimeout] = useState<NodeJS.Timeout | null>(null);
    const [lastDrawnShape, setLastDrawnShape] = useState<any>(null);
    const [isConvertingShape, setIsConvertingShape] = useState(false);
    
    // UI State
    const [showQuickTips, setShowQuickTips] = useState(true);
    
    // Styling State
    const [showStylingPanel, setShowStylingPanel] = useState(false);
    const [showLayersPanel, setShowLayersPanel] = useState(false);
    const [showColorPopup, setShowColorPopup] = useState(false);
    const [colorPopupPosition, setColorPopupPosition] = useState({ x: 0, y: 0 });
    const [selectedColorType, setSelectedColorType] = useState<'stroke' | 'fill' | 'text'>('stroke');
    const [fillColor, setFillColor] = useState("#E3F2FD");
    const [strokeColor, setStrokeColor] = useState("#1976D2");
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [opacity, setOpacity] = useState(1);
    const [strokeStyle, setStrokeStyle] = useState<"solid" | "dashed" | "dotted" | "dash-dot">("solid");
    const [gradientType, setGradientType] = useState<"none" | "linear" | "radial">("none");
    const [gradientColors, setGradientColors] = useState(["#FF6B6B", "#4ECDC4"]);
    const [textColor, setTextColor] = useState("#1565C0");
    const [designColor, setDesignColor] = useState("#1E293B");

    const mlBackendUrl = getMLBackendUrl();

    // Color helper functions
    const getCurrentColor = () => {
        switch (selectedColorType) {
            case 'stroke': return strokeColor;
            case 'fill': return fillColor;
            case 'text': return textColor;
            default: return strokeColor;
        }
    };

    const setCurrentColor = (color: string) => {
        switch (selectedColorType) {
            case 'stroke': setStrokeColor(color); break;
            case 'fill': setFillColor(color); break;
            case 'text': setTextColor(color); break;
        }
    };

    const getCurrentColorPalette = () => {
        switch (selectedColorType) {
            case 'stroke':
                return [
                    '#1976D2', '#1565C0', '#0D47A1', '#1E88E5', '#2196F3', '#42A5F5',
                    '#64B5F6', '#90CAF9', '#BBDEFB', '#E3F2FD', '#00BCD4', '#00ACC1',
                    '#2E7D32', '#388E3C', '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7',
                    '#F57C00', '#FF9800', '#FFA726', '#FFB74D', '#FFCC80', '#FFE0B2',
                    '#7B1FA2', '#8E24AA', '#9C27B0', '#AB47BC', '#BA68C8', '#CE93D8',
                    '#D32F2F', '#E53935', '#F44336', '#EF5350', '#E57373', '#FFCDD2'
                ];
            case 'fill':
                return [
                    '#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3',
                    '#1E88E5', '#1976D2', '#1565C0', '#0D47A1', '#E1F5FE', '#B3E5FC',
                    '#81D4FA', '#4FC3F7', '#29B6F6', '#03A9F4', '#00BCD4', '#00ACC1',
                    '#E8F5E8', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50',
                    '#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800',
                    '#FCE4EC', '#F8BBD9', '#F48FB1', '#F06292', '#EC407A', '#E91E63',
                    '#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0'
                ];
            case 'text':
                return [
                    '#0D47A1', '#1565C0', '#1976D2', '#1E88E5', '#2196F3', '#42A5F5',
                    '#64B5F6', '#90CAF9', '#BBDEFB', '#E3F2FD', '#000000', '#424242',
                    '#616161', '#757575', '#9E9E9E', '#BDBDBD', '#E0E0E0', '#F5F5F5',
                    '#2E7D32', '#388E3C', '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7',
                    '#D84315', '#E64A19', '#F4511E', '#FF5722', '#FF7043', '#FF8A65',
                    '#6A1B9A', '#7B1FA2', '#8E24AA', '#9C27B0', '#AB47BC', '#BA68C8',
                    '#1565C0', '#1976D2', '#1E88E5', '#2196F3', '#42A5F5', '#64B5F6'
                ];
            default:
                return [];
        }
    };

    useEffect(() => {
        game?.setTool(selectedTool);
        
        // Update cursor style based on selected tool
        if (canvasRef.current) {
            switch (selectedTool) {
                case "colorpicker":
                    canvasRef.current.style.cursor = "crosshair";
                    break;
                case "text":
                    canvasRef.current.style.cursor = "text";
                    break;
                case "pencil":
                    canvasRef.current.style.cursor = "crosshair";
                    break;
                default:
                    canvasRef.current.style.cursor = "crosshair";
                    break;
            }
        }
    }, [selectedTool, game]);

    // Styling effects
    useEffect(() => {
        if (game) {
            game.setFillColor(fillColor);
            game.setStrokeColor(strokeColor);
            game.setStrokeWidth(strokeWidth);
            game.setOpacity(opacity);
            game.setStrokeStyle(strokeStyle);
            game.setTextColor(textColor);
            game.setDesignColor(designColor);
            
            if (gradientType !== "none") {
                game.setGradient({
                    type: gradientType,
                    colors: gradientColors,
                    stops: [0, 1],
                    angle: 45
                });
            } else {
                game.setGradient(undefined);
            }
        }
    }, [game, fillColor, strokeColor, strokeWidth, opacity, strokeStyle, gradientType, gradientColors, textColor, designColor]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);

            // Initialize canvas with text rendering
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.font = '16px Arial';
                ctx.fillStyle = '#1565C0';
            }

            // Add event listener for quick tips toggle
            const handleToggleQuickTips = () => {
                setShowQuickTips(prev => !prev);
            };
            
            canvasRef.current.addEventListener('toggleQuickTips', handleToggleQuickTips);

            return () => {
                g.destroy();
                g.stopCursorBlink();
                canvasRef.current?.removeEventListener('toggleQuickTips', handleToggleQuickTips);
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
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isTyping && currentTextShapeId && game) {
                if (event.key === 'Enter') {
                    setIsTyping(false);
                    setCurrentTextShapeId(null);
                    setTextInput('');
                    if (game) {
                        game.stopCursorBlink();
                    }
                } else if (event.key === 'Escape') {
                    setIsTyping(false);
                    setCurrentTextShapeId(null);
                    setTextInput('');
                    if (game) {
                        game.stopCursorBlink();
                    }
                    // Remove the text shape if it's empty
                    if (textInput.trim() === '') {
                        // Find and remove the empty text shape
                        const textShape = game.existingShapes.find(shape => 
                            shape.type === 'text' && shape.id === currentTextShapeId
                        );
                        if (textShape) {
                            game.existingShapes = game.existingShapes.filter(s => s.id !== currentTextShapeId);
                            game.clearCanvas();
                            game.socket.send(JSON.stringify({ 
                                type: "erase", 
                                shapeId: currentTextShapeId, 
                                roomId: roomId 
                            }));
                        }
                    }
                } else if (event.key === 'Backspace') {
                    setTextInput(prev => prev.slice(0, -1));
                } else if (event.key.length === 1) {
                    setTextInput(prev => prev + event.key);
                }
            }
        };

        if (isTyping) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isTyping, currentTextShapeId, textInput, game, roomId]);

    // Update text shape when typing
    useEffect(() => {
        if (isTyping && currentTextShapeId && game) {
            const textShape = game.existingShapes.find(shape => 
                shape.type === 'text' && shape.id === currentTextShapeId
            ) as any;
            
            if (textShape) {
                textShape.text = textInput;
                game.clearCanvas();
                game.socket.send(JSON.stringify({
                    type: "edit_shape",
                    shape: textShape,
                    roomId: roomId,
                    isDragging: false
                }));
            }
        }
    }, [textInput, isTyping, currentTextShapeId, game, roomId]);

    // Listen for text edit events from Game.ts
    useEffect(() => {
        const handleTextEdit = (event: CustomEvent) => {
            const { shapeId, text } = event.detail;
            setCurrentTextShapeId(shapeId);
            setTextInput(text || '');
            setIsTyping(true);
            if (game) {
                game.startCursorBlink();
            }
        };

        const handleColorPicked = (event: CustomEvent) => {
            const { fillColor, strokeColor, textColor } = event.detail;
            setFillColor(fillColor);
            setStrokeColor(strokeColor);
            if (textColor) {
                setTextColor(textColor);
            }
        };

        if (canvasRef.current) {
            canvasRef.current.addEventListener('textEdit', handleTextEdit as EventListener);
            canvasRef.current.addEventListener('colorPicked', handleColorPicked as EventListener);
            return () => {
                canvasRef.current?.removeEventListener('textEdit', handleTextEdit as EventListener);
                canvasRef.current?.removeEventListener('colorPicked', handleColorPicked as EventListener);
            };
        }
    }, [game]);

    // Close color popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showColorPopup) {
                setShowColorPopup(false);
            }
        };

        if (showColorPopup) {
            document.addEventListener('click', handleClickOutside);
            return () => {
                document.removeEventListener('click', handleClickOutside);
            };
        }
    }, [showColorPopup]);

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
        const img = new Image();
        img.onload = () => {
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

    // Text Tool Functions - Now handled by Game.ts
    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        // Text tool is now handled by Game.ts
        // This function is kept for compatibility but doesn't handle text anymore
    };

    // Text handling is now integrated with Game.ts
    // Old text functions removed - text is now handled as shapes

    // Text functions removed - now handled by Game.ts as shapes

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden">
            {/* Mobile Header */}
            <div className="bg-white border-b border-gray-200 px-3 py-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
                                <PenLine className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-base font-semibold text-gray-900">Draw-App</h1>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-gray-600 text-xs font-medium">
                                Room: {roomId}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 text-gray-600 text-xs">
                            <Users size={14} />
                            <span>{participantCount}</span>
                        </div>
                        <button
                            onClick={() => setShowAIPanel(!showAIPanel)}
                            className={`p-1.5 rounded transition-all duration-200 ${
                                showAIPanel 
                                    ? 'bg-gray-900 text-white' 
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                            title="AI Tools"
                        >
                            <Brain size={16} />
                        </button>
                        <button
                            onClick={() => setShowQuickTips(!showQuickTips)}
                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-all duration-200"
                            title="Quick Tips"
                        >
                            <Sparkles size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 relative overflow-hidden">
                {/* Canvas */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full touch-none"
                    style={{
                        cursor: selectedTool === 'pencil' ? 'crosshair' : 'default',
                        touchAction: 'none',
                    }}
                />

                {/* Mobile Toolbar - Bottom */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-gray-200/60 shadow-lg">
                    <div className="flex items-center space-x-2">
                        <IconButton
                            icon={<Pencil size={16} />}
                            activated={selectedTool === "pencil"}
                            onClick={() => setSelectedTool("pencil")}
                            label="Pencil"
                        />
                        <IconButton
                            icon={<RectangleHorizontalIcon size={16} />}
                            activated={selectedTool === "rect"}
                            onClick={() => setSelectedTool("rect")}
                            label="Rectangle"
                        />
                        <IconButton
                            icon={<Circle size={16} />}
                            activated={selectedTool === "circle"}
                            onClick={() => setSelectedTool("circle")}
                            label="Circle"
                        />
                        <IconButton
                            icon={<PenLine size={16} />}
                            activated={selectedTool === "line"}
                            onClick={() => setSelectedTool("line")}
                            label="Line"
                        />
                        <IconButton
                            icon={<Type size={16} />}
                            activated={selectedTool === "text"}
                            onClick={() => setSelectedTool("text")}
                            label="Text"
                        />
                        <IconButton
                            icon={<Eraser size={16} />}
                            activated={selectedTool === "erase"}
                            onClick={() => setSelectedTool("erase")}
                            label="Eraser"
                        />
                        <IconButton
                            icon={<Pipette size={16} />}
                            activated={selectedTool === "colorpicker"}
                            onClick={() => setSelectedTool("colorpicker")}
                            label="Color Picker"
                        />
                    </div>
                </div>

                {/* Mobile Color Panel - Top Right */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-gray-200/60 shadow-lg">
                    <div className="flex items-center space-x-2 mb-2">
                        <button
                            onClick={() => setShowColorPopup(!showColorPopup)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Colors"
                        >
                            <Palette size={16} />
                        </button>
                        <div className="flex items-center space-x-1">
                            <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: strokeColor }}></div>
                            <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: fillColor }}></div>
                        </div>
                    </div>
                    
                    {/* Quick Color Palette */}
                    <div className="grid grid-cols-4 gap-1">
                        {['#1976D2', '#1565C0', '#0D47A1', '#1E88E5', '#2196F3', '#42A5F5', '#64B5F6', '#90CAF9'].map((color, index) => (
                            <button
                                key={`quick-${color}-${index}`}
                                onClick={() => setStrokeColor(color)}
                                className={`w-6 h-6 rounded border transition-all duration-200 hover:scale-110 ${
                                    strokeColor === color ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-1' : 'border-gray-300 hover:border-gray-400'
                                }`}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>

                {/* Mobile Action Buttons - Top Left */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-2xl p-2 border border-gray-200/60 shadow-lg">
                    <div className="flex flex-col space-y-2">
                        <button
                            onClick={handleUndo}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                            title="Undo"
                        >
                            <Undo2 size={16} />
                        </button>
                        <button
                            onClick={handleRedo}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                            title="Redo"
                        >
                            <Redo2 size={16} />
                        </button>
                        <button
                            onClick={handleDownload}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                            title="Download"
                        >
                            <Download size={16} />
                        </button>
                    </div>
                </div>

                {/* Mobile Status Indicators - Bottom Left */}
                <div className="absolute bottom-4 left-4">
                    <div className="flex flex-col space-y-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                            isConnected 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </div>
                        
                        {liveAIShape && (
                            <div className={`px-2 py-1 rounded text-xs font-medium flex items-center space-x-2 ${
                                isConvertingShape 
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                    : 'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                    isConvertingShape ? 'bg-blue-600 animate-pulse' : 'bg-green-600'
                                }`}></div>
                                <span>
                                    {isConvertingShape ? 'Converting...' : 'Live AI'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Color Popup - Mobile Optimized */}
                {showColorPopup && (
                    <div 
                        className="absolute bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-gray-200/60 shadow-lg"
                        style={{
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            maxWidth: '90vw',
                            maxHeight: '80vh',
                            overflow: 'auto'
                        }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-900 font-medium">Colors</h3>
                            <button
                                onClick={() => setShowColorPopup(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Color Type Selector */}
                        <div className="mb-4">
                            <label className="text-gray-600 text-xs mb-2 block">Color Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { key: 'stroke', label: 'Stroke' },
                                    { key: 'fill', label: 'Fill' },
                                    { key: 'text', label: 'Text' }
                                ].map((type) => (
                                    <button
                                        key={type.key}
                                        onClick={() => setSelectedColorType(type.key as 'stroke' | 'fill' | 'text')}
                                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                                            selectedColorType === type.key
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color Picker */}
                        <div className="mb-4">
                            <label className="text-gray-600 text-xs mb-2 block capitalize">
                                {selectedColorType} Color
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="color"
                                    value={getCurrentColor()}
                                    onChange={(e) => setCurrentColor(e.target.value)}
                                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={getCurrentColor()}
                                    onChange={(e) => setCurrentColor(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-800 text-sm"
                                    placeholder="#000000"
                                />
                            </div>
                        </div>

                        {/* Color Palette */}
                        <div className="mb-4">
                            <label className="text-gray-600 text-xs mb-2 block">Quick Colors</label>
                            <div className="grid grid-cols-6 gap-2">
                                {getCurrentColorPalette().slice(0, 24).map((color, index) => (
                                    <button
                                        key={`${selectedColorType}-${color}-${index}`}
                                        onClick={() => setCurrentColor(color)}
                                        className={`w-8 h-8 rounded border transition-all duration-200 hover:scale-110 ${
                                            getCurrentColor() === color ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-1' : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Stroke Width */}
                        <div className="mb-4">
                            <label className="text-gray-600 text-xs mb-2 block">Stroke Width: {strokeWidth}px</label>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={strokeWidth}
                                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowColorPopup(false)}
                            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                )}

                {/* AI Panel - Mobile Optimized */}
                {showAIPanel && (
                    <div 
                        className="absolute bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-gray-200/60 shadow-lg"
                        style={{
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            maxWidth: '95vw',
                            maxHeight: '90vh',
                            overflow: 'auto'
                        }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                                <Brain className="w-5 h-5 text-gray-900" />
                                <h3 className="text-gray-900 font-medium">AI Tools</h3>
                            </div>
                            <button
                                onClick={() => setShowAIPanel(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* AI Loading State */}
                        {aiLoading && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                                    <span className="text-blue-700 text-sm">{aiOperation}</span>
                                </div>
                            </div>
                        )}

                        {/* AI Error Display */}
                        {aiError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700 text-sm">{aiError}</p>
                            </div>
                        )}

                        {/* File Upload */}
                        <div className="mb-4">
                            <label className="text-gray-600 text-xs mb-2 block">Upload Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                            />
                            {selectedFile && (
                                <p className="text-gray-500 text-xs mt-1">Selected: {selectedFile.name}</p>
                            )}
                        </div>

                        {selectedFile && (
                            <button
                                onClick={runCompleteAIAnalysis}
                                className="w-full mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Run AI Analysis
                            </button>
                        )}

                        {/* Live AI Toggle */}
                        <button
                            onClick={() => {
                                if (liveAIShape) {
                                    disableLiveAIShape();
                                } else {
                                    enableLiveAIShape();
                                }
                            }}
                            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center ${
                                liveAIShape 
                                    ? 'bg-green-600 text-white hover:bg-green-700' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {liveAIShape ? 'Live AI Active' : 'Enable Live AI'}
                        </button>
                    </div>
                )}

                {/* Quick Tips - Mobile Optimized */}
                {showQuickTips && (
                    <div className="absolute bottom-20 left-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-4 border border-gray-200/60 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-gray-800 font-medium text-sm">Quick Tips</h4>
                            <button
                                onClick={() => setShowQuickTips(false)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div className="text-gray-600 text-xs space-y-1 max-h-32 overflow-y-auto">
                            <p>• <strong>Touch and drag</strong> to draw shapes</p>
                            <p>• <strong>Pinch to zoom</strong>, <strong>two-finger pan</strong></p>
                            <p>• <strong>Tap text tool</strong>, then tap canvas to type</p>
                            <p>• <strong>Tap color palette</strong> for styling options</p>
                            <p>• <strong>Tap AI button</strong> for smart features</p>
                        </div>
                    </div>
                )}

                {/* Welcome Modal - Mobile Optimized */}
                {showWelcome && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <PenLine className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Draw-App!</h2>
                                <p className="text-gray-600 text-sm">Start drawing and collaborating in real-time</p>
                            </div>
                            
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Pencil className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">Drawing Tools</h3>
                                        <p className="text-xs text-gray-500">Pencil, shapes, text, and more</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <Users className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">Real-time Collaboration</h3>
                                        <p className="text-xs text-gray-500">Draw together with friends</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Brain className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">AI Features</h3>
                                        <p className="text-xs text-gray-500">Smart shape recognition and more</p>
                                    </div>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => setShowWelcome(false)}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Performance Monitor */}
            <PerformanceMonitor />
        </div>
    );
}