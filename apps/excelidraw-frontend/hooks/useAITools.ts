import { useState, useEffect, useRef } from 'react';
import { AIToolsState, AIAnalysisResult } from '@/component/types';
import { getMLBackendUrl } from '@/config';

export function useAITools(canvasRef: React.RefObject<HTMLCanvasElement>, roomId: string) {
  const [aiToolsState, setAiToolsState] = useState<AIToolsState>({
    showAIPanel: false,
    aiLoading: false,
    aiOperation: '',
    aiResult: null,
    aiError: '',
    selectedFile: null,
    aiPrompt: '',
    aiContext: '',
    liveAIShape: false,
    shapeDetectionTimeout: null,
    lastDrawnShape: null,
    isConvertingShape: false
  });

  const mlBackendUrl = getMLBackendUrl();

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAiToolsState(prev => ({ ...prev, selectedFile: file, aiError: '' }));
    }
  };

  // Run complete AI analysis
  const runCompleteAIAnalysis = async () => {
    if (!aiToolsState.selectedFile) {
      setAiToolsState(prev => ({ ...prev, aiError: 'Please select an image first' }));
      return;
    }

    setAiToolsState(prev => ({ 
      ...prev, 
      aiLoading: true, 
      aiOperation: 'Running complete AI analysis...',
      aiError: '' 
    }));

    try {
      const formData = new FormData();
      formData.append('image', aiToolsState.selectedFile);
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
      setAiToolsState(prev => ({ ...prev, aiResult: result.analysis }));
      
    } catch (err) {
      setAiToolsState(prev => ({ 
        ...prev, 
        aiError: err instanceof Error ? err.message : 'Complete analysis failed' 
      }));
    } finally {
      setAiToolsState(prev => ({ ...prev, aiLoading: false, aiOperation: '' }));
    }
  };

  // Suggest diagram
  const suggestDiagram = async () => {
    if (!aiToolsState.aiPrompt.trim()) {
      setAiToolsState(prev => ({ ...prev, aiError: 'Please enter a description' }));
      return;
    }

    setAiToolsState(prev => ({ 
      ...prev, 
      aiLoading: true, 
      aiOperation: 'Getting diagram suggestions...',
      aiError: '' 
    }));

    try {
      const formData = new FormData();
      formData.append('description', aiToolsState.aiPrompt);

      const response = await fetch(`${mlBackendUrl}/ai/suggest-diagram`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Suggestion failed: ${response.statusText}`);
      }

      const result = await response.json();
      setAiToolsState(prev => ({ ...prev, aiResult: { suggestions: result } }));
      
    } catch (err) {
      setAiToolsState(prev => ({ 
        ...prev, 
        aiError: err instanceof Error ? err.message : 'Suggestion failed' 
      }));
    } finally {
      setAiToolsState(prev => ({ ...prev, aiLoading: false, aiOperation: '' }));
    }
  };

  // Download image
  const downloadImage = (base64Data: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Data}`;
    link.download = filename;
    link.click();
  };

  // Enable live AI shape recognition
  const enableLiveAIShape = () => {
    setAiToolsState(prev => ({ ...prev, liveAIShape: true }));
    // Add event listener to canvas for drawing detection
    if (canvasRef.current) {
      canvasRef.current.addEventListener('mouseup', handleDrawingComplete);
      canvasRef.current.addEventListener('touchend', handleDrawingComplete);
    }
  };

  // Disable live AI shape recognition
  const disableLiveAIShape = () => {
    setAiToolsState(prev => ({ ...prev, liveAIShape: false }));
    if (canvasRef.current) {
      canvasRef.current.removeEventListener('mouseup', handleDrawingComplete);
      canvasRef.current.removeEventListener('touchend', handleDrawingComplete);
    }
    if (aiToolsState.shapeDetectionTimeout) {
      clearTimeout(aiToolsState.shapeDetectionTimeout);
    }
  };

  // Handle drawing completion for live AI
  const handleDrawingComplete = () => {
    if (!aiToolsState.liveAIShape) return;
    
    // Clear previous timeout
    if (aiToolsState.shapeDetectionTimeout) {
      clearTimeout(aiToolsState.shapeDetectionTimeout);
    }
    
    // Wait a bit for the drawing to complete, then analyze
    const timeout = setTimeout(() => {
      analyzeAndConvertShape();
    }, 1000); // 1 second delay
    
    setAiToolsState(prev => ({ ...prev, shapeDetectionTimeout: timeout }));
  };

  // Analyze and convert shape
  const analyzeAndConvertShape = async () => {
    if (!canvasRef.current || !aiToolsState.liveAIShape) return;
    
    setAiToolsState(prev => ({ ...prev, isConvertingShape: true }));
    
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
        setAiToolsState(prev => ({ ...prev, lastDrawnShape: result }));
        
        // Show success message
        setAiToolsState(prev => ({ ...prev, aiError: '' }));
        setTimeout(() => {
          setAiToolsState(prev => ({ ...prev, aiError: 'Shape converted successfully! ✨' }));
          setTimeout(() => setAiToolsState(prev => ({ ...prev, aiError: '' })), 3000);
        }, 100);
      }
      
    } catch (err) {
      console.error('Live shape recognition failed:', err);
      setAiToolsState(prev => ({ 
        ...prev, 
        aiError: 'Shape conversion failed. Try drawing more clearly.' 
      }));
    } finally {
      setAiToolsState(prev => ({ ...prev, isConvertingShape: false }));
    }
  };

  // Replace canvas with cleaned shape
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
      console.log('Canvas updated with cleaned shape');
    };
    img.src = `data:image/png;base64,${cleanedImageBase64}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (aiToolsState.shapeDetectionTimeout) {
        clearTimeout(aiToolsState.shapeDetectionTimeout);
      }
    };
  }, [aiToolsState.shapeDetectionTimeout]);

  return {
    aiToolsState,
    handleFileSelect,
    runCompleteAIAnalysis,
    suggestDiagram,
    downloadImage,
    enableLiveAIShape,
    disableLiveAIShape,
    setAiToolsState
  };
}
