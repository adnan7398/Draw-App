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