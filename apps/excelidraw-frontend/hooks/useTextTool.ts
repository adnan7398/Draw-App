import { useState, useEffect } from 'react';
import { TextToolState } from '@/component/types';
import { Game } from '@/draw/Game';

export function useTextTool(game: Game | undefined, roomId: string) {
  const [textToolState, setTextToolState] = useState<TextToolState>({
    isTyping: false,
    currentTextShapeId: null,
    textInput: ''
  });

  // Removed global keydown listener in favor of TextEditor overlay

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
      const shape = game?.existingShapes.find(s => s.id === shapeId) || null;

      setTextToolState(prev => ({
        ...prev,
        currentTextShapeId: shapeId,
        textInput: text || '',
        isTyping: true,
        editingShape: shape
      }));
      // We don't need cursor blink from game anymore
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

  const updateTextInput = (text: string) => {
    setTextToolState(prev => ({
      ...prev,
      textInput: text
    }));
  };

  return {
    textToolState,
    startTextEditing,
    stopTextEditing,
    updateTextInput
  };
}
