import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current?: boolean;
}

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
}

export default function OnboardingModal({ open, onOpenChange, trigger }: OnboardingModalProps) {
  const [, setLocation] = useLocation();
  const progress = useOnboardingProgress();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  useEffect(() => {
    // Create dynamic steps based on actual user progress
    const dynamicSteps: OnboardingStep[] = [
      {
        id: 'survey',
        title: 'Realice la encuesta de incorporación',
        description: 'Responda nuestra breve encuesta para personalizar su experiencia de aprendizaje de IA',
        completed: progress.surveyCompleted,
        current: !progress.surveyCompleted
      },
      {
        id: 'first-course',
        title: 'Toma tu primer curso',
        description: 'Comience con un curso adaptado a su área de enfoque y nivel de habilidad.',
        completed: progress.firstCourseStarted,
        current: progress.surveyCompleted && !progress.firstCourseStarted
      },
      {
        id: 'guides',
        title: 'Explora nuestras guías',
        description: 'Complete una guía de aprendizaje personalizada para su ruta de desarrollo.',
        completed: progress.guidesExplored,
        current: progress.surveyCompleted && progress.firstCourseStarted && !progress.guidesExplored
      }
    ];
    
    setSteps(dynamicSteps);
  }, [progress]);

  const completedSteps = progress.completedSteps;
  const totalSteps = 3;

  const handleStepClick = (stepId: string) => {
    switch (stepId) {
      case 'survey':
        onOpenChange(false); // Close the popup
        setLocation('/onboarding'); // Navigate to onboarding page
        break;
      case 'first-course':
        onOpenChange(false);
        setLocation('/courses'); // Navigate to courses page
        break;
      case 'guides':
        onOpenChange(false);
        // Mark guides as visited when user clicks
        localStorage.setItem('guides-visited', 'true');
        setLocation('/guides'); // Navigate to guides page
        break;
      default:
        break;
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent 
        className="bg-gray-900 border-gray-700 text-white w-96 p-0 gap-0" 
        side="right" 
        align="start"
        sideOffset={8}
        alignOffset={-8}
      >
        <div className="p-6 pb-4">
          <div className="text-lg font-medium">
            ¡Empieza ahora! {completedSteps}/{totalSteps}
          </div>
        </div>
        
        <div className="px-6 pb-6 space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              onClick={() => handleStepClick(step.id)}
              className={cn(
                "flex items-start space-x-4 p-4 rounded-lg transition-colors cursor-pointer hover:bg-gray-800",
                step.current ? "bg-gray-800" : "bg-transparent"
              )}
            >
              {/* Check icon */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                step.completed 
                  ? "bg-purple-500" 
                  : step.current 
                    ? "bg-gray-600 border-2 border-gray-500" 
                    : "bg-gray-700"
              )}>
                {step.completed ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    "font-medium text-sm",
                    step.completed ? "text-white" : "text-gray-300"
                  )}>
                    {step.title}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-6">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.totalProgress}%` }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}