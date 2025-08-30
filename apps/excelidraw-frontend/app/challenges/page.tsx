"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { ChallengesMock } from '../../component/ChallengesMock';
import { ArrowLeft, PenTool } from 'lucide-react';

export default function ChallengesPage() {
  const router = useRouter();

  const handleStartDrawing = (challengeId: string) => {
    // Navigate to canvas with challenge context
    router.push(`/canvas/${challengeId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <PenTool className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold">ExcileDraw</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/room')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <ChallengesMock onStartDrawing={handleStartDrawing} />
      </main>
    </div>
  );
}
