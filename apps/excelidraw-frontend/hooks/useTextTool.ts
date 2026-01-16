import { useState, useEffect } from 'react';
import { TextToolState } from '@/component/types';
import { Game } from '@/draw/Game';

export function useTextTool(game: Game | undefined, roomId: string) {
  const [textToolState, setTextToolState] = useState<TextToolState>({
    isTyping: false,
    currentTextShapeId: null,
    textInput: ''
  });

  // Add keyboard event listener for text typing
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (textToolState.isTyping && textToolState.currentTextShapeId && game) {
        if (event.key === 'Enter') {
          // Shift+Enter -> newline, Enter -> finish editing
          if (event.shiftKey) {
            event.preventDefault();
            setTextToolState(prev => ({
              ...prev,
              textInput: prev.textInput + '\n'
            }));
          } else {
            event.preventDefault();
            setTextToolState(prev => ({
              ...prev,
              isTyping: false,
              currentTextShapeId: null,
              textInput: ''
            }));
            if (game) {
              game.stopCursorBlink();
            }
          }
        } else if (event.key === 'Escape') {
          setTextToolState(prev => ({
            ...prev,
            isTyping: false,
            currentTextShapeId: null,
            textInput: ''
          }));
          if (game) {
            game.stopCursorBlink();
          }
          // Remove the text shape if it's empty
          if (textToolState.textInput.trim() === '') {
            // Find and remove the empty text shape
            const textShape = game.existingShapes.find(shape => 
              shape.type === 'text' && shape.id === textToolState.currentTextShapeId
            );
            if (textShape) {
              game.existingShapes = game.existingShapes.filter(s => s.id !== textToolState.currentTextShapeId);
              game.clearCanvas();
              game.socket.send(JSON.stringify({ 
                type: "erase", 
                shapeId: textToolState.currentTextShapeId, 
                roomId: roomId 
              }));
            }
          }
        } else if (event.key === 'Backspace') {
          setTextToolState(prev => ({
            ...prev,
            textInput: prev.textInput.slice(0, -1)
          }));
        } else if (event.key.length === 1) {
          setTextToolState(prev => ({
            ...prev,
            textInput: prev.textInput + event.key
          }));
        }
      }
    };

    if (textToolState.isTyping) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [textToolState.isTyping, textToolState.currentTextShapeId, textToolState.textInput, game, roomId]);

  // Update text shape when typing
  useEffect(() => {
    if (textToolState.isTyping && textToolState.currentTextShapeId && game) {
      const textShape = game.existingShapes.find(shape => 
        shape.type === 'text' && shape.id === textToolState.currentTextShapeId
      ) as any;
      
      if (textShape) {
        textShape.text = textToolState.textInput;
        game.clearCanvas();
        game.socket.send(JSON.stringify({
          type: "edit_shape",
          shape: textShape,
          roomId: roomId,
          isDragging: false
        }));
      }
    }
  }, [textToolState.textInput, textToolState.isTyping, textToolState.currentTextShapeId, game, roomId]);

  // Listen for text edit events from Game.ts
  useEffect(() => {
    const handleTextEdit = (event: CustomEvent) => {
      const { shapeId, text } = event.detail;
      setTextToolState(prev => ({
        ...prev,
        currentTextShapeId: shapeId,
        textInput: text || '',
        isTyping: true
      }));
      if (game) {
        game.startCursorBlink();
      }
    };

    const handleColorPicked = (event: CustomEvent) => {
      const { fillColor, strokeColor, textColor } = event.detail;
      // This will be handled by the styling hook
    };

    const canvas = game?.getCanvas();
    if (canvas) {
      canvas.addEventListener('textEdit', handleTextEdit as EventListener);
      canvas.addEventListener('colorPicked', handleColorPicked as EventListener);
      return () => {
        canvas.removeEventListener('textEdit', handleTextEdit as EventListener);
        canvas.removeEventListener('colorPicked', handleColorPicked as EventListener);
      };
    }
  }, [game]);

  const startTextEditing = (shapeId: string, text: string) => {
    setTextToolState(prev => ({
      ...prev,
      currentTextShapeId: shapeId,
      textInput: text || '',
      isTyping: true
    }));
    if (game) {
      game.startCursorBlink();
    }
  };

  const stopTextEditing = () => {
    setTextToolState(prev => ({
      ...prev,
      isTyping: false,
      currentTextShapeId: null,
      textInput: ''
    }));
    if (game) {
      game.stopCursorBlink();
    }
  };

  return {
    textToolState,
    startTextEditing,
    stopTextEditing
  };
}
