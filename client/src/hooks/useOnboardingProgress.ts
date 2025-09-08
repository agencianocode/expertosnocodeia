import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface OnboardingProgress {
  surveyCompleted: boolean;
  firstCourseStarted: boolean;
  guidesExplored: boolean;
  totalProgress: number;
  completedSteps: number;
}

export function useOnboardingProgress() {
  const [progress, setProgress] = useState<OnboardingProgress>({
    surveyCompleted: false,
    firstCourseStarted: false,
    guidesExplored: false,
    totalProgress: 0,
    completedSteps: 0
  });

  // Check if user completed onboarding survey
  const { data: onboardingResponse } = useQuery({
    queryKey: ['/api/onboarding/response'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if user has started any course (dashboard data includes course progress)
  const { data: dashboardData } = useQuery({
    queryKey: ['/api/dashboard'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if user has viewed guides page (we'll use localStorage for this)
  const guidesExplored = localStorage.getItem('guides-visited') === 'true';

  useEffect(() => {
    // Calculate progress based on completed tasks
    const surveyCompleted = !!onboardingResponse;
    
    // Check if user has progress in any course from dashboard data
    const firstCourseStarted = !!(dashboardData as any)?.continueCourses?.length || false;
    
    // Count completed steps
    let completedSteps = 0;
    if (surveyCompleted) completedSteps++;
    if (firstCourseStarted) completedSteps++;
    if (guidesExplored) completedSteps++;

    // Calculate percentage (33.3% per step)
    const totalProgress = (completedSteps / 3) * 100;

    setProgress({
      surveyCompleted,
      firstCourseStarted,
      guidesExplored,
      totalProgress,
      completedSteps
    });
  }, [onboardingResponse, dashboardData, guidesExplored]);

  return progress;
}