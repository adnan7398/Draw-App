"use client"
import React from 'react';
import { Github, Twitter, Heart, Share2, Lock, Users2, Sparkles, PenTool, Router } from 'lucide-react';
import { useRouter } from "next/navigation";

function App() {
  const Router = useRouter();
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <PenTool className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold">ExcileDraw</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="https://github.com/adnan7398" className="text-gray-600 hover:text-gray-900">
              <Github className="h-5 w-5" />
            </a>
            <a href="https://x.com/?lang=en&mx=2" className="text-gray-600 hover:text-gray-900">
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Virtual whiteboard for
              <br />
              sketching and planning
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              ExcileDraw is a virtual whiteboard that lets you easily sketch diagrams that have a hand-drawn feel to them.
            </p>
            <button  onClick = {()=>{
              Router.push("/signup");
            }} className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              Start Drawing...
            </button>
          </div>

          {/* Feature Preview */}
          <div className="mt-16 bg-gray-50 rounded-xl p-4 shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=2000&q=80"
              alt="Whiteboard Preview"
              className="rounded-lg w-full object-cover"
              style={{ height: '500px' }}
            />
          </div>

          {/* Features Grid */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Collaboration</h3>
              <p className="text-gray-600">Work together with your team in real-time, anywhere in the world.</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">End-to-End Encryption</h3>
              <p className="text-gray-600">Your drawings are secure with end-to-end encryption.</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Beautiful Hand-drawn Style</h3>
              <p className="text-gray-600">Create diagrams that look like they were drawn by hand.</p>
            </div>
          </div>

          {/* AI Features Section */}
          <div className="mt-24 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">AI-Powered Drawing Tools</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Experience the future of drawing with our advanced AI integration. Analyze, enhance, and generate drawings with cutting-edge machine learning.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Smart Analysis</h3>
                <p className="text-gray-600 text-sm">AI-powered analysis of your drawings for composition, style, and technical insights.</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Style Transfer</h3>
                <p className="text-gray-600 text-sm">Transform your drawings with artistic styles using advanced neural networks.</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Smart Enhancement</h3>
                <p className="text-gray-600 text-sm">Automatically enhance image quality with upscaling, denoising, and sharpening.</p>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <button 
                onClick={() => Router.push("/ai-tools")}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
              >
                Try AI Tools
              </button>
            </div>
          </div>
        </div>

        {/* Community Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
              <p className="text-gray-600 mb-8">
                ExcileDraw is used by millions of people around the world
              </p>
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">2M+</div>
                  <div className="text-gray-600">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">10M+</div>
                  <div className="text-gray-600">Drawings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">150+</div>
                  <div className="text-gray-600">Countries</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-gray-600">Made with love for the community</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-600 hover:text-gray-900">About</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Blog</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Terms</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;