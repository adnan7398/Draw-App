"use client"
import React from 'react';
import { ArrowLeft, PenTool } from 'lucide-react';
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
            <PenTool className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold">ExcileDraw AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">AI-Powered Drawing Tools</span>
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
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Leverage the power of artificial intelligence to analyze, enhance, and generate drawings. 
              Our advanced ML models provide insights and tools to take your artwork to the next level.
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

          {/* Additional Information */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">How It Works</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">1</div>
                  <p>Upload your drawing or describe what you want to create</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">2</div>
                  <p>Our AI analyzes your input and processes it using advanced ML models</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">3</div>
                  <p>Receive insights, enhancements, or generated content to improve your work</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">AI Capabilities</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Image analysis and classification</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Style transfer and artistic effects</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Image enhancement and upscaling</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Text-to-drawing generation</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Composition and balance analysis</span>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Drawing */}
          <div className="text-center mt-12">
            <button
              onClick={() => router.push("/room")}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Drawing Room
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
