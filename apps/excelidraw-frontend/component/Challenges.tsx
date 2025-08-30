"use client"
import React, { useEffect, useState } from 'react';
import { useChallenges } from '../hooks/useChallenges';
import { Challenge, ChallengeSubmission } from './types';
import { 
  Calendar, 
  Clock, 
  Star, 
  Filter, 
  Trophy, 
  Palette, 
  Camera, 
  Heart,
  Eye,
  Share2,
  Download,
  Award,
  Target,
  Zap,
  Users,
  TrendingUp
} from 'lucide-react';

interface ChallengesProps {
  userId?: string;
  onStartDrawing?: (challengeId: string) => void;
}

export const Challenges: React.FC<ChallengesProps> = ({ userId, onStartDrawing }) => {
  const {
    challenges,
    currentChallenge,
    userSubmissions,
    isLoading,
    error,
    selectedCategory,
    selectedDifficulty,
    showChallengeModal,
    showSubmissionModal,
    submissionForm,
    fetchChallenges,
    fetchCurrentChallenge,
    fetchUserSubmissions,
    submitChallenge,
    likeSubmission,
    updateSubmissionForm,
    toggleChallengeModal,
    toggleSubmissionModal,
    setFilters,
    clearError,
  } = useChallenges();

  const [activeTab, setActiveTab] = useState<'current' | 'all' | 'submissions'>('current');

  useEffect(() => {
    fetchCurrentChallenge();
    if (userId) {
      fetchUserSubmissions(userId);
    }
  }, [fetchCurrentChallenge, fetchUserSubmissions, userId]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Calendar className="w-4 h-4" />;
      case 'weekly': return <Clock className="w-4 h-4" />;
      case 'monthly': return <Trophy className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading challenges</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <div className="ml-auto pl-3">
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full">
            <Trophy className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Drawing Challenges</h1>
        <p className="text-xl text-gray-600">Daily, weekly, and monthly prompts to inspire your creativity</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'current'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Current</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>All Challenges</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'submissions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Gallery</span>
            </div>
          </button>
        </div>
      </div>

      {/* Current Challenge Tab */}
      {activeTab === 'current' && currentChallenge && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {getTypeIcon(currentChallenge.type)}
              <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                {currentChallenge.type} Challenge
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {getTimeRemaining(currentChallenge.endDate)}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentChallenge.difficulty)}`}>
                {currentChallenge.difficulty}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{currentChallenge.title}</h2>
              <p className="text-gray-600 mb-6">{currentChallenge.description}</p>
              
              <div className="bg-white rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Palette className="w-5 h-5 mr-2 text-purple-600" />
                  Your Challenge
                </h3>
                <p className="text-gray-700 text-lg italic">"{currentChallenge.prompt}"</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {currentChallenge.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white rounded-full text-sm text-gray-600 border border-gray-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => onStartDrawing?.(currentChallenge.id)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
                >
                  Start Drawing
                </button>
                <button
                  onClick={toggleSubmissionModal}
                  className="bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Submit Entry
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {currentChallenge.imageUrl && (
                <div className="bg-white rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Reference Image</h3>
                  <img
                    src={currentChallenge.imageUrl}
                    alt={currentChallenge.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="bg-white rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Challenge Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {currentChallenge._count?.submissions || 0}
                    </div>
                    <div className="text-sm text-gray-600">Submissions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {getTimeRemaining(currentChallenge.endDate).includes('Expired') ? '0' : '1'}
                    </div>
                    <div className="text-sm text-gray-600">Days Left</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Challenges Tab */}
      {activeTab === 'all' && (
        <div>
          {/* Filters */}
          <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Filters:</span>
              
              <select
                value={selectedCategory || ''}
                onChange={(e) => setFilters(e.target.value || undefined, selectedDifficulty || undefined)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Categories</option>
                <option value="nature">Nature</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
                <option value="abstract">Abstract</option>
                <option value="fantasy">Fantasy</option>
              </select>

              <select
                value={selectedDifficulty || ''}
                onChange={(e) => setFilters(selectedCategory || undefined, e.target.value || undefined)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              <button
                onClick={() => fetchChallenges({ category: selectedCategory || undefined, difficulty: selectedDifficulty || undefined })}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Challenges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {challenge.imageUrl && (
                  <img
                    src={challenge.imageUrl}
                    alt={challenge.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(challenge.type)}
                      <span className="text-sm text-gray-600 uppercase tracking-wide">
                        {challenge.type}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                      {challenge.difficulty}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{challenge.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{challenge.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {challenge.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
                    </span>
                    <button
                      onClick={() => onStartDrawing?.(challenge.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Start
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submissions Gallery Tab */}
      {activeTab === 'submissions' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userSubmissions.map((submission) => (
              <div key={submission.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={submission.imageUrl}
                    alt={submission.title || 'Submission'}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all">
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all">
                      <Share2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <img
                        src={submission.user.photo || '/default-avatar.png'}
                        alt={submission.user.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="font-medium text-gray-900">{submission.user.name}</span>
                    </div>
                    <button
                      onClick={() => likeSubmission(submission.id)}
                      className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">{submission.likes}</span>
                    </button>
                  </div>

                  {submission.title && (
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{submission.title}</h3>
                  )}
                  
                  {submission.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{submission.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{formatDate(submission.submittedAt)}</span>
                    <span className="text-purple-600 font-medium">{submission.challenge.title}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {showSubmissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit Your Drawing</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={submissionForm.title}
                  onChange={(e) => updateSubmissionForm('title', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Give your drawing a title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={submissionForm.description}
                  onChange={(e) => updateSubmissionForm('description', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Tell us about your drawing..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={submissionForm.isPublic}
                  onChange={(e) => updateSubmissionForm('isPublic', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                  Make this submission public
                </label>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={toggleSubmissionModal}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={toggleSubmissionModal}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
