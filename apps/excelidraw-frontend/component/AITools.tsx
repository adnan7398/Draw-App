'use client';

import React, { useState, useRef } from 'react';
import { getMLBackendUrl } from '../config';

interface AIToolsProps {
  onImageGenerated?: (imageData: string) => void;
  onImageEnhanced?: (imageData: string) => void;
}

interface AnalysisResult {
  dimensions: [number, number];
  mode: string;
  brightness: number;
  contrast: number;
  dominant_colors?: {
    red: number;
    green: number;
    blue: number;
  };
  classification?: Array<{
    label: string;
    score: number;
  }>;
}

const AITools: React.FC<AIToolsProps> = ({ onImageGenerated, onImageEnhanced }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  const mlBackendUrl = getMLBackendUrl();

  const analyzeDrawing = async (file: File, analysisType: string = 'general') => {
    setIsLoading(true);
    setCurrentOperation('Analyzing drawing...');
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('analysis_type', analysisType);

      const response = await fetch(`${mlBackendUrl}/analyze-drawing`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      setAnalysisResult(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
      setCurrentOperation('');
    }
  };

  const generateDrawing = async (prompt: string, style: string = 'realistic') => {
    setIsLoading(true);
    setCurrentOperation('Generating drawing...');
    setError('');

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('style', style);
      formData.append('size', '512x512');

      const response = await fetch(`${mlBackendUrl}/generate-drawing`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      setGeneratedText(result.generated_description || result.error || 'No description generated');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsLoading(false);
      setCurrentOperation('');
    }
  };

  const enhanceDrawing = async (file: File, enhancementType: string = 'upscale') => {
    setIsLoading(true);
    setCurrentOperation('Enhancing drawing...');
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('enhancement_type', enhancementType);

      const response = await fetch(`${mlBackendUrl}/enhance-drawing`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Enhancement failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.enhanced_image_b64 && onImageEnhanced) {
        onImageEnhanced(result.enhanced_image_b64);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enhancement failed');
    } finally {
      setIsLoading(false);
      setCurrentOperation('');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      analyzeDrawing(file);
    }
  };

  const handlePromptSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const prompt = promptInputRef.current?.value;
    if (prompt) {
      generateDrawing(prompt);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">AI Drawing Tools</h2>
      
      {/* Loading State */}
      {isLoading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">{currentOperation}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Drawing Analysis */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Analyze Drawing</h3>
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        
        {analysisResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Analysis Results:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Dimensions: {analysisResult.dimensions[0]} x {analysisResult.dimensions[1]}</div>
              <div>Mode: {analysisResult.mode}</div>
              <div>Brightness: {analysisResult.brightness.toFixed(2)}</div>
              <div>Contrast: {analysisResult.contrast.toFixed(2)}</div>
              {analysisResult.dominant_colors && (
                <div className="col-span-2">
                  <span className="font-medium">Dominant Colors:</span>
                  <div className="flex space-x-2 mt-1">
                    <div className="w-4 h-4 bg-red-500 rounded" title={`Red: ${analysisResult.dominant_colors.red.toFixed(0)}`}></div>
                    <div className="w-4 h-4 bg-green-500 rounded" title={`Green: ${analysisResult.dominant_colors.green.toFixed(0)}`}></div>
                    <div className="w-4 h-4 bg-blue-500 rounded" title={`Blue: ${analysisResult.dominant_colors.blue.toFixed(0)}`}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Drawing Generation */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Generate Drawing</h3>
        <form onSubmit={handlePromptSubmit} className="space-y-3">
          <input
            ref={promptInputRef}
            type="text"
            placeholder="Describe the drawing you want to create..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Generate
            </button>
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="realistic">Realistic</option>
              <option value="cartoon">Cartoon</option>
              <option value="abstract">Abstract</option>
              <option value="impressionist">Impressionist</option>
            </select>
          </div>
        </form>
        
        {generatedText && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium mb-2">Generated Description:</h4>
            <p className="text-green-800">{generatedText}</p>
          </div>
        )}
      </div>

      {/* Image Enhancement */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Enhance Drawing</h3>
        <div className="space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) enhanceDrawing(file, 'upscale');
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const file = fileInputRef.current?.files?.[0];
                if (file) enhanceDrawing(file, 'upscale');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Upscale
            </button>
            <button
              onClick={() => {
                const file = fileInputRef.current?.files?.[0];
                if (file) enhanceDrawing(file, 'sharpen');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Sharpen
            </button>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="text-sm text-gray-500 text-center">
        ML Backend: {mlBackendUrl}
      </div>
    </div>
  );
};

export default AITools;
