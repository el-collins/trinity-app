"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { Question } from '@/types/question';

interface ApplicationState {
  appId: string | null;
  status: string | null;
  currentStage: string | null;
  underwritingReadiness: number;
  riskScore: number;
}

interface ApplicationContextType {
  state: ApplicationState;
  currentQuestions: Question[];
  isLoading: boolean;
  error: string | null;
  startApplication: (data: any) => Promise<void>;
  submitAnswer: (questionId: string, value: any) => Promise<void>;
  loadNextQuestions: () => Promise<void>;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export function ApplicationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ApplicationState>({
    appId: null,
    status: null,
    currentStage: null,
    underwritingReadiness: 0,
    riskScore: 0,
  });
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startApplication = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/applications', data);
      const { application, nextQuestions } = res.data;
      
      setState({
        appId: application.id,
        status: application.status,
        currentStage: application.currentStage,
        underwritingReadiness: application.underwritingReadiness,
        riskScore: 50, // Default start
      });
      setCurrentQuestions(nextQuestions || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start application');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async (questionId: string, value: any) => {
    if (!state.appId) return;
    
    // Optimistic update could go here
    setIsLoading(true);
    try {
      const res = await api.post(`/applications/${state.appId}/answers`, {
        questionId,
        value,
        answeredBy: 'current-user', // Should come from auth
      });
      
      const { application, nextQuestions } = res.data;
      
      setState(prev => ({
        ...prev,
        status: application.status,
        currentStage: application.currentStage,
        underwritingReadiness: application.underwritingReadiness,
        riskScore: application.riskScore,
      }));
      
      // Update questions list: remove answered, add new ones if needed
      // Logic: If we are in a loop, we might replace the current question
      // For now, let's just create a new fetch or replace logic in the UI
      setCurrentQuestions(nextQuestions || []);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit answer');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadNextQuestions = async () => {
    if (!state.appId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/applications/${state.appId}/next-questions`);
      setCurrentQuestions(res.data.questions || []);
      setState(prev => ({
        ...prev,
        underwritingReadiness: res.data.underwritingReadiness,
        riskScore: res.data.riskScore
      }));
    } catch (err: any) {
      setError('Failed to load next questions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ApplicationContext.Provider value={{
      state,
      currentQuestions,
      isLoading,
      error,
      startApplication,
      submitAnswer,
      loadNextQuestions
    }}>
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplication() {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error('useApplication must be used within an ApplicationProvider');
  }
  return context;
}
