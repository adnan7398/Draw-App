"use client"
import React from 'react';
import { ArrowLeft, PenTool, Brain, Shapes, Layout, Type, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AITools from '../../component/AITools';

export default function AIToolsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Brain className="h-8 w-8 text-purple-600" />
            <span className="ml-2 text-xl font-bold">Draw-App AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">AI-Powered Drawing Intelligence</span>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Drawing Assistant
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Transform your drawings with cutting-edge AI technology. From shape recognition to handwriting conversion, 
              our intelligent tools help you create, analyze, and enhance your artwork like never before.
            </p>
          </div>

          {/* AI Tools Component */}
          <AITools 
            onImageGenerated={(imageData) => {
              console.log('Image generated:', imageData);
              // Handle generated image
            }}
            onImageEnhanced={(imageData) => {
              console.log('Image enhanced:', imageData);
              // Handle enhanced image
            }}
          />

          {/* AI Features Overview */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center mb-3">
                <Shapes className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">Shape Recognition</h3>
              </div>
              <p className="text-sm text-gray-600">
                Convert rough sketches to neat geometric shapes with AI-powered detection and cleaning
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center mb-3">
                <Layout className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">Diagram Detection</h3>
              </div>
              <p className="text-sm text-gray-600">
                Smart whiteboard that detects flowchart, UML, mindmap types and automatically cleans them up
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center mb-3">
                <Type className="h-8 w-8 text-purple-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">Handwriting OCR</h3>
              </div>
              <p className="text-sm text-gray-600">
                Convert handwritten notes to editable text with advanced AI recognition and image enhancement
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center mb-3">
                <Brain className="h-8 w-8 text-indigo-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">AI Assistant</h3>
              </div>
              <p className="text-sm text-gray-600">
                Get intelligent suggestions for diagrams, icons, and automatic drawing organization
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-16 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Upload & Analyze</h3>
                <p className="text-gray-600">Upload your drawing or handwritten notes and let our AI analyze the content</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">AI Processing</h3>
                <p className="text-gray-600">Our advanced ML models process your image using computer vision and AI techniques</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Smart Results</h3>
                <p className="text-gray-600">Receive intelligent insights, cleaned images, and AI-powered suggestions</p>
              </div>
            </div>
          </div>

          {/* Use Cases */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Perfect For</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Students taking handwritten notes</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Designers creating wireframes</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Engineers sketching diagrams</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Business professionals brainstorming</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Anyone wanting to digitize sketches</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Key Benefits</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Save time with automated analysis</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Improve drawing quality instantly</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Convert sketches to editable formats</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Get intelligent design suggestions</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Professional-grade results</span>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Drawing */}
          <div className="text-center mt-16">
            <button
              onClick={() => router.push("/room")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center mx-auto"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Back to Drawing Room
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
