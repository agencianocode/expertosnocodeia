import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export default function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const [steps] = useState<OnboardingStep[]>([
    {
      id: 'survey',
      title: 'Realice la encuesta de incorporación',
      description: 'Responda nuestra breve encuesta para personalizar su experiencia de aprendizaje de IA',
      completed: true
    },
    {
      id: 'first-course',
      title: 'Toma tu primer curso',
      description: 'Comience con un curso adaptado a su área de enfoque y nivel de habilidad.',
      completed: true
    },
    {
      id: 'guides',
      title: 'Explora nuestras guías',
      description: 'Complete una guía de aprendizaje personalizada para su ruta de desarrollo.',
      completed: false,
      current: true
    }
  ]);

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <div className="text-lg font-medium">
            ¡Empieza ahora! {completedSteps}/{totalSteps}
          </div>
        </DialogHeader>
        
        <div className="px-6 pb-6 space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-start space-x-4 p-4 rounded-lg transition-colors",
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
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}