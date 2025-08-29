import { PenLine, Pencil, Users, Brain } from "lucide-react";

interface WelcomeModalProps {
  showWelcome: boolean;
  onClose: () => void;
}

export function WelcomeModal({ showWelcome, onClose }: WelcomeModalProps) {
  if (!showWelcome) return null;

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PenLine className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Draw-App!</h2>
          <p className="text-gray-600 text-sm">Start drawing and collaborating in real-time</p>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Pencil className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Drawing Tools</h3>
              <p className="text-xs text-gray-500">Pencil, shapes, text, and more</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Real-time Collaboration</h3>
              <p className="text-xs text-gray-500">Draw together with friends</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">AI Features</h3>
              <p className="text-xs text-gray-500">Smart shape recognition and more</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
