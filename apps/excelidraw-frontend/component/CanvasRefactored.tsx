import React, { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCanvasState } from "@/hooks/useCanvasState";
import { useStylingState } from "@/hooks/useStylingState";
import { useAITools } from "@/hooks/useAITools";
import { useTextTool } from "@/hooks/useTextTool";
import { FloatingToolbar } from "./FloatingToolbar";
import { PropertyPanel } from "./PropertyPanel";
import { TextEditor } from "./TextEditor";
import { ActionButtons } from "./ActionButtons";
import { StatusIndicators } from "./StatusIndicators";
import { useWebRTC } from "@/hooks/useWebRTC";
import { VideoGrid } from "@/component/video/VideoGrid";
import { AIPanel } from "./AIPanel";
import { QuickTips } from "./QuickTips";
import { WelcomeModal } from "./WelcomeModal";
import { Header } from "./Header";
import { ConnectedUsers } from "./ConnectedUsers";
import { DrawingIndicator } from "./DrawingIndicator";

export function CanvasRefactored({
  roomId,
  socket
}: {
  socket: WebSocket;
  roomId: string;
}) {
  const router = useRouter();
  // Use custom hooks for state management
  const {
    canvasRef,
    game,
    canvasState,
    connectedUsers,
    currentUser,
    setSelectedTool,
    setShowWelcome,
    setShowQuickTips
  } = useCanvasState(roomId, socket);

  const {
    stylingState,
    getCurrentColor,
    setCurrentColor,
    getCurrentColorPalette,
    setSelectedColorType,
    setStrokeWidth,
    setOpacity,
    setStrokeStyle
  } = useStylingState(game, canvasState.selectedShape);

  const {
    aiToolsState,
    handleFileSelect,
    runCompleteAIAnalysis,
    suggestDiagram,
    enableLiveAIShape,
    disableLiveAIShape,
    setAiToolsState
  } = useAITools(canvasRef, roomId);

  const { textToolState, updateTextInput, stopTextEditing } = useTextTool(game, roomId);

  // WebRTC Interface
  const {
    localStream,
    peers,
    isMuted,
    isVideoEnabled,
    toggleMute,
    toggleVideo
  } = useWebRTC(roomId, socket, {
    id: currentUser?.userId || 'anon',
    name: currentUser?.userName || 'Anonymous'
  });

  // Local UI state
  const [showColorPopup, setShowColorPopup] = useState(false);
  const [forceShowPanel, setForceShowPanel] = useState(false);
  const [showConnectedUsers, setShowConnectedUsers] = useState(true);

  // Handle undo/redo
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

  // Exit room: close socket gracefully and navigate back to rooms page
  const handleExitRoom = () => {
    try {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "User left room");
      }
    } catch (e) {
      console.error("Error closing socket on exit:", e);
    } finally {
      router.push("/room");
    }
  };

  // Handle AI prompt changes
  const handleAiPromptChange = (prompt: string) => {
    setAiToolsState(prev => ({ ...prev, aiPrompt: prompt }));
  };

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

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <Header
        roomId={roomId}
        isConnected={canvasState.isConnected}
        participantCount={canvasState.participantCount}
        showAIPanel={aiToolsState.showAIPanel}
        showQuickTips={canvasState.showQuickTips}
        showConnectedUsers={showConnectedUsers}
        onToggleAIPanel={() => setAiToolsState(prev => ({ ...prev, showAIPanel: !prev.showAIPanel }))}
        onToggleQuickTips={() => setShowQuickTips(!canvasState.showQuickTips)}
        onToggleConnectedUsers={() => setShowConnectedUsers(!showConnectedUsers)}
        onExitRoom={handleExitRoom}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none"
          style={{
            cursor: canvasState.selectedTool === 'pencil' ? 'crosshair' : 'default',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none'
          }}
        />

        {/* Text Editor Overlay */}
        {textToolState.isTyping && textToolState.editingShape && (
          <TextEditor
            shape={textToolState.editingShape}
            text={textToolState.textInput}
            game={game}
            onChange={updateTextInput}
            onBlur={stopTextEditing}
          />
        )}



        {/* Video Conferencing Overlay */}
        <VideoGrid
          localStream={localStream}
          peers={peers}
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          currentUserName={currentUser?.name || 'You'}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
        />

        {/* Toolbar */}
        <FloatingToolbar
          selectedTool={canvasState.selectedTool}
          onToolSelect={setSelectedTool}
        />

        {/* Styles Toggle Button (when panel is hidden) */}
        {!canvasState.selectedShape && !showColorPopup && (
          <div className="absolute top-4 right-4 z-40">
            <button
              onClick={() => setShowColorPopup(true)} // Reusing showColorPopup state as a proxy for "Force Show Panel" isn't quite right, let's use a new state.
              className="bg-white p-2 rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition-all font-medium flex items-center gap-2"
            >
              <Palette size={20} />
              <span className="text-sm">Styles</span>
            </button>
          </div>
        )}

        {/* Property Panel */}
        {(canvasState.selectedShape || showColorPopup) && (
          <PropertyPanel
            stylingState={stylingState}
            showColorPopup={showColorPopup} // This prop controls the *expanded* color picker, not the panel itself.
            onShowColorPopup={setShowColorPopup}
            onColorChange={setCurrentColor}
            onColorTypeChange={setSelectedColorType}
            onStrokeWidthChange={setStrokeWidth}
            onOpacityChange={setOpacity}
            onStrokeStyleChange={setStrokeStyle}
            getCurrentColor={getCurrentColor}
            getCurrentColorPalette={getCurrentColorPalette}
            onClose={!canvasState.selectedShape ? () => setShowColorPopup(false) : undefined}
          />
        )}

        {/* Action Buttons */}
        <ActionButtons
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDownload={handleDownload}
        />

        {/* Status Indicators */}
        <StatusIndicators
          isConnected={canvasState.isConnected}
          isPanning={canvasState.isPanning}
          liveAIShape={aiToolsState.liveAIShape}
          isConvertingShape={aiToolsState.isConvertingShape}
        />

        {/* Connected Users Panel */}
        {showConnectedUsers && (
          <ConnectedUsers
            connectedUsers={connectedUsers}
            currentUser={currentUser}
            participantCount={canvasState.participantCount}
          />
        )}

        {/* AI Panel */}
        {aiToolsState.showAIPanel && (
          <AIPanel
            aiToolsState={aiToolsState}
            onShowAIPanel={(show) => setAiToolsState(prev => ({ ...prev, showAIPanel: show }))}
            onFileSelect={handleFileSelect}
            onRunAIAnalysis={runCompleteAIAnalysis}
            onSuggestDiagram={suggestDiagram}
            onEnableLiveAI={enableLiveAIShape}
            onDisableLiveAI={disableLiveAIShape}
            onAiPromptChange={handleAiPromptChange}
          />
        )}

        {/* Quick Tips */}
        <QuickTips
          showQuickTips={canvasState.showQuickTips}
          onClose={() => setShowQuickTips(false)}
        />

        {/* Welcome Modal */}
        <WelcomeModal
          showWelcome={canvasState.showWelcome}
          onClose={() => setShowWelcome(false)}
        />
      </div>

      {/* Drawing Indicator */}
      <DrawingIndicator roomId={roomId} socket={socket} />
    </div>
  );
}
