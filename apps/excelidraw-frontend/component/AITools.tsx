'use client';

import React, { useState, useRef } from 'react';
import { getMLBackendUrl } from '../config';
import { 
  Upload, 
  Brain, 
  Shapes, 
  FileText, 
  Lightbulb, 
  Wand2, 
  Download,
  Image as ImageIcon,
  Type,
  Layout,
  Sparkles
} from 'lucide-react';

interface AIToolsProps {
  onImageGenerated?: (imageData: string) => void;
  onImageEnhanced?: (imageData: string) => void;
}

interface ShapeAnalysis {
  shapes_detected: number;
  shapes: Array<{
    type: string;
    confidence: number;
    bbox: [number, number, number, number];
    vertices: number;
  }>;
  total_contours: number;
  cleaned_shapes: boolean;
  cleaned_image?: string;
}

interface DiagramAnalysis {
  diagram_type: string;
  confidence: number;
  analysis: {
    structure_score: number;
    connection_score: number;
    text_density: number;
  };
  cleaned_diagram: boolean;
  cleaned_image?: string;
}

interface OCRResult {
  extracted_text: string;
  confidence: number;
  word_count: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: number[][];
  }>;
  enhanced_image: boolean;
  enhanced_image_b64?: string;
}

interface AIAssistantResult {
  suggested_diagram?: string;
  confidence?: number;
  suggested_icons?: string[];
  arranged_shapes?: any[];
}

const AITools: React.FC<AIToolsProps> = ({ onImageGenerated, onImageEnhanced }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'shapes' | 'diagrams' | 'ocr' | 'assistant'>('shapes');
  
  // Results state
  const [shapeResult, setShapeResult] = useState<ShapeAnalysis | null>(null);
  const [diagramResult, setDiagramResult] = useState<DiagramAnalysis | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [assistantResult, setAssistantResult] = useState<AIAssistantResult | null>(null);
  
  const [error, setError] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mlBackendUrl = getMLBackendUrl();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  // AI Shape Recognition
  const analyzeShapes = async (cleanShapes: boolean = false) => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setIsLoading(true);
    setCurrentOperation('Analyzing shapes...');
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('clean_shapes', cleanShapes.toString());

      const response = await fetch(`${mlBackendUrl}/ai/shape-recognition`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Shape recognition failed: ${response.statusText}`);
      }

      const result = await response.json();
      setShapeResult(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Shape recognition failed');
    } finally {
      setIsLoading(false);
      setCurrentOperation('');
    }
  };

  // Diagram Detection
  const detectDiagram = async (cleanDiagram: boolean = false) => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setIsLoading(true);
    setCurrentOperation('Detecting diagram type...');
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('clean_diagram', cleanDiagram.toString());

      const response = await fetch(`${mlBackendUrl}/ai/diagram-detection`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Diagram detection failed: ${response.statusText}`);
      }

      const result = await response.json();
      setDiagramResult(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diagram detection failed');
    } finally {
      setIsLoading(false);
      setCurrentOperation('');
    }
  };

  // Handwriting Recognition (OCR)
  const recognizeHandwriting = async (enhanceImage: boolean = false) => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setIsLoading(true);
    setCurrentOperation('Recognizing handwriting...');
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('enhance_image', enhanceImage.toString());

      const response = await fetch(`${mlBackendUrl}/ai/handwriting-recognition`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OCR failed: ${response.statusText}`);
      }

      const result = await response.json();
      setOcrResult(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR failed');
    } finally {
      setIsLoading(false);
      setCurrentOperation('');
    }
  };

  // AI Assistant - Diagram Suggestions
  const suggestDiagram = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description');
      return;
    }

    setIsLoading(true);
    setCurrentOperation('Getting diagram suggestions...');
    setError('');

    try {
      const formData = new FormData();
      formData.append('description', prompt);

      const response = await fetch(`${mlBackendUrl}/ai/suggest-diagram`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Suggestion failed: ${response.statusText}`);
      }

      const result = await response.json();
      setAssistantResult(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suggestion failed');
    } finally {
      setIsLoading(false);
      setCurrentOperation('');
    }
  };

  // AI Assistant - Icon Suggestions
  const suggestIcons = async () => {
    if (!context.trim()) {
      setError('Please enter a context');
      return;
    }

    setIsLoading(true);
    setCurrentOperation('Getting icon suggestions...');
    setError('');

    try {
      const formData = new FormData();
      formData.append('context', context);

      const response = await fetch(`${mlBackendUrl}/ai/suggest-icons`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Icon suggestion failed: ${response.statusText}`);
      }

      const result = await response.json();
      setAssistantResult(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Icon suggestion failed');
    } finally {
      setIsLoading(false);
      setCurrentOperation('');
    }
  };

  // Complete AI Analysis
  const runCompleteAnalysis = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setIsLoading(true);
    setCurrentOperation('Running complete AI analysis...');
    setError('');

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
      
      // Set results for each analysis type
      if (result.analysis.shapes) setShapeResult(result.analysis.shapes);
      if (result.analysis.diagram) setDiagramResult(result.analysis.diagram);
      if (result.analysis.text) setOcrResult(result.analysis.text);
      if (result.analysis.suggestions) setAssistantResult(result.analysis.suggestions);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Complete analysis failed');
    } finally {
      setIsLoading(false);
      setCurrentOperation('');
    }
  };

  const downloadImage = (base64Data: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Data}`;
    link.download = filename;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* File Upload Section */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
          <Upload className="w-5 h-5 mr-2" />
          Upload Image for AI Analysis
        </h3>
        
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {selectedFile && (
            <span className="text-sm text-gray-600">
              Selected: {selectedFile.name}
            </span>
          )}
        </div>

        {selectedFile && (
          <div className="mt-4">
            <button
              onClick={runCompleteAnalysis}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Run Complete AI Analysis
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">{currentOperation}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* AI Features Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'shapes', label: 'Shape Recognition', icon: Shapes },
              { id: 'diagrams', label: 'Diagram Detection', icon: Layout },
              { id: 'ocr', label: 'Handwriting OCR', icon: Type },
              { id: 'assistant', label: 'AI Assistant', icon: Brain }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Shape Recognition Tab */}
        {activeTab === 'shapes' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <Shapes className="w-5 h-5 mr-2" />
              AI Shape Recognition
            </h3>
            <p className="text-gray-600 mb-4">
              Convert rough sketches to neat shapes and detect geometric forms
            </p>
            
            {selectedFile && (
              <div className="flex space-x-3 mb-4">
                <button
                  onClick={() => analyzeShapes(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Detect Shapes
                </button>
                <button
                  onClick={() => analyzeShapes(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Clean & Detect
                </button>
              </div>
            )}

            {shapeResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Analysis Results:</h4>
                    <div className="space-y-2 text-sm">
                      <div>Shapes Detected: <span className="font-semibold">{shapeResult.shapes_detected}</span></div>
                      <div>Total Contours: <span className="font-semibold">{shapeResult.total_contours}</span></div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Detected Shapes:</h4>
                    <div className="space-y-1 text-sm">
                      {shapeResult.shapes.map((shape, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="capitalize">{shape.type}</span>
                          <span className="text-gray-600">{(shape.confidence * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {shapeResult.cleaned_image && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium mb-2 text-green-800">Cleaned Image:</h4>
                    <div className="flex items-center space-x-3">
                      <img 
                        src={`data:image/png;base64,${shapeResult.cleaned_image}`} 
                        alt="Cleaned shapes" 
                        className="max-w-xs rounded border"
                      />
                      <button
                        onClick={() => downloadImage(shapeResult.cleaned_image!, 'cleaned_shapes.png')}
                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Diagram Detection Tab */}
        {activeTab === 'diagrams' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <Layout className="w-5 h-5 mr-2" />
              Smart Whiteboard - Diagram Detection
            </h3>
            <p className="text-gray-600 mb-4">
              Detect diagram types (flowcharts, UMLs, mindmaps) and clean them up
            </p>
            
            {selectedFile && (
              <div className="flex space-x-3 mb-4">
                <button
                  onClick={() => detectDiagram(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Detect Diagram Type
                </button>
                <button
                  onClick={() => detectDiagram(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Clean Diagram
                </button>
              </div>
            )}

            {diagramResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Diagram Analysis:</h4>
                    <div className="space-y-2 text-sm">
                      <div>Type: <span className="font-semibold capitalize">{diagramResult.diagram_type}</span></div>
                      <div>Confidence: <span className="font-semibold">{(diagramResult.confidence * 100).toFixed(0)}%</span></div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Structure Scores:</h4>
                    <div className="space-y-2 text-sm">
                      <div>Structure: <span className="font-semibold">{(diagramResult.analysis.structure_score * 100).toFixed(0)}%</span></div>
                      <div>Connections: <span className="font-semibold">{(diagramResult.analysis.connection_score * 100).toFixed(0)}%</span></div>
                      <div>Text Density: <span className="font-semibold">{(diagramResult.analysis.text_density * 100).toFixed(0)}%</span></div>
                    </div>
                  </div>
                </div>

                {diagramResult.cleaned_image && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium mb-2 text-green-800">Cleaned Diagram:</h4>
                    <div className="flex items-center space-x-3">
                      <img 
                        src={`data:image/png;base64,${diagramResult.cleaned_image}`} 
                        alt="Cleaned diagram" 
                        className="max-w-xs rounded border"
                      />
                      <button
                        onClick={() => downloadImage(diagramResult.cleaned_image!, 'cleaned_diagram.png')}
                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* OCR Tab */}
        {activeTab === 'ocr' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <Type className="w-5 h-5 mr-2" />
              Handwriting Recognition (OCR)
            </h3>
            <p className="text-gray-600 mb-4">
              Convert handwritten notes to editable text with AI-powered recognition
            </p>
            
            {selectedFile && (
              <div className="flex space-x-3 mb-4">
                <button
                  onClick={() => recognizeHandwriting(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Extract Text
                </button>
                <button
                  onClick={() => recognizeHandwriting(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Enhance & Extract
                </button>
              </div>
            )}

            {ocrResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">OCR Results:</h4>
                    <div className="space-y-2 text-sm">
                      <div>Extracted Text: <span className="font-semibold">{ocrResult.extracted_text}</span></div>
                      <div>Confidence: <span className="font-semibold">{(ocrResult.confidence * 100).toFixed(0)}%</span></div>
                      <div>Word Count: <span className="font-semibold">{ocrResult.word_count}</span></div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Word Details:</h4>
                    <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                      {ocrResult.words.map((word, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{word.text}</span>
                          <span className="text-gray-600">{(word.confidence * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {ocrResult.enhanced_image_b64 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium mb-2 text-green-800">Enhanced Image:</h4>
                    <div className="flex items-center space-x-3">
                      <img 
                        src={`data:image/png;base64,${ocrResult.enhanced_image_b64}`} 
                        alt="Enhanced image" 
                        className="max-w-xs rounded border"
                      />
                      <button
                        onClick={() => downloadImage(ocrResult.enhanced_image_b64!, 'enhanced_image.png')}
                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI Assistant Tab */}
        {activeTab === 'assistant' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              AI Assistant
            </h3>
            <p className="text-gray-600 mb-4">
              Get AI-powered suggestions for diagrams, icons, and drawing organization
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Diagram Suggestions */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium mb-3 text-gray-800 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Diagram Suggestions
                </h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Describe the diagram you want to create..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={suggestDiagram}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Get Suggestion
                  </button>
                </div>
              </div>

              {/* Icon Suggestions */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium mb-3 text-gray-800 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Icon Suggestions
                </h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter context (e.g., business, technology)..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={suggestIcons}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Get Icons
                  </button>
                </div>
              </div>
            </div>

            {assistantResult && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium mb-3 text-blue-800">AI Suggestions:</h4>
                
                {assistantResult.suggested_diagram && (
                  <div className="mb-3">
                    <span className="font-medium">Suggested Diagram: </span>
                    <span className="capitalize text-blue-700">{assistantResult.suggested_diagram}</span>
                    {assistantResult.confidence && (
                      <span className="ml-2 text-sm text-gray-600">
                        ({(assistantResult.confidence * 100).toFixed(0)}% confidence)
                      </span>
                    )}
                  </div>
                )}

                {assistantResult.suggested_icons && (
                  <div>
                    <span className="font-medium">Suggested Icons: </span>
                    <div className="flex space-x-2 mt-2">
                      {assistantResult.suggested_icons.map((icon, index) => (
                        <span key={index} className="text-2xl" title={icon}>
                          {icon}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mt-8 text-sm text-gray-500 text-center">
        ML Backend: {mlBackendUrl}
      </div>
    </div>
  );
};

export default AITools;
