import { useState, useEffect, useCallback } from 'react';
import { Challenge, ChallengeSubmission, ChallengeState } from '../component/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useChallenges = () => {
  const [state, setState] = useState<ChallengeState>({
    challenges: [],
    currentChallenge: null,
    userSubmissions: [],
    isLoading: false,
    error: null,
    selectedCategory: null,
    selectedDifficulty: null,
    showChallengeModal: false,
    showSubmissionModal: false,
    submissionForm: {
      title: '',
      description: '',
      isPublic: true,
    },
  });

  // Fetch all challenges
  const fetchChallenges = useCallback(async (filters?: {
    category?: string;
    difficulty?: string;
    type?: string;
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);
      if (filters?.type) params.append('type', filters.type);
      
      const response = await fetch(`${API_BASE_URL}/api/challenges?${params}`);
      if (!response.ok) throw new Error('Failed to fetch challenges');
      
      const challenges = await response.json();
      setState(prev => ({ 
        ...prev, 
        challenges, 
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to fetch challenges',
        isLoading: false 
      }));
    }
  }, []);

  // Fetch current challenge (daily/weekly)
  const fetchCurrentChallenge = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges/current`);
      if (!response.ok) throw new Error('Failed to fetch current challenge');
      
      const challenge = await response.json();
      setState(prev => ({ 
        ...prev, 
        currentChallenge: challenge, 
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to fetch current challenge',
        isLoading: false 
      }));
    }
  }, []);

  // Fetch user submissions
  const fetchUserSubmissions = useCallback(async (userId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges/submissions?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user submissions');
      
      const submissions = await response.json();
      setState(prev => ({ 
        ...prev, 
        userSubmissions: submissions, 
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to fetch user submissions',
        isLoading: false 
      }));
    }
  }, []);

  // Submit a challenge
  const submitChallenge = useCallback(async (
    challengeId: string,
    userId: string,
    imageUrl: string,
    canvasData?: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          userId,
          imageUrl,
          canvasData,
          title: state.submissionForm.title,
          description: state.submissionForm.description,
          isPublic: state.submissionForm.isPublic,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to submit challenge');
      
      const submission = await response.json();
      setState(prev => ({ 
        ...prev, 
        userSubmissions: [...prev.userSubmissions, submission],
        showSubmissionModal: false,
        submissionForm: { title: '', description: '', isPublic: true },
        isLoading: false 
      }));
      
      return submission;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to submit challenge',
        isLoading: false 
      }));
      throw error;
    }
  }, [state.submissionForm]);

  // Like a submission
  const likeSubmission = useCallback(async (submissionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges/submissions/${submissionId}/like`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to like submission');
      
      // Update the submission in the state
      setState(prev => ({
        ...prev,
        userSubmissions: prev.userSubmissions.map(sub => 
          sub.id === submissionId ? { ...sub, likes: sub.likes + 1 } : sub
        ),
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to like submission'
      }));
    }
  }, []);

  // Update submission form
  const updateSubmissionForm = useCallback((field: keyof typeof state.submissionForm, value: string | boolean) => {
    setState(prev => ({
      ...prev,
      submissionForm: {
        ...prev.submissionForm,
        [field]: value,
      },
    }));
  }, []);

  // Toggle modals
  const toggleChallengeModal = useCallback(() => {
    setState(prev => ({ ...prev, showChallengeModal: !prev.showChallengeModal }));
  }, []);

  const toggleSubmissionModal = useCallback(() => {
    setState(prev => ({ ...prev, showSubmissionModal: !prev.showSubmissionModal }));
  }, []);

  // Set filters
  const setFilters = useCallback((category?: string, difficulty?: string) => {
    setState(prev => ({
      ...prev,
      selectedCategory: category || null,
      selectedDifficulty: difficulty || null,
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
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
  };
};
