import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface OnboardingData {
  name: string;
  aiExperience: string;
  goal: string;
  workAreas: string[];
  learningMethods: string[];
  timeCommitment: string;
  aiTools: string[];
  jobLevel: string;
  teamInterest: string;
  companyUrl: string;
  teamSize: string;
  emailContact: string;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    aiExperience: '',
    goal: '',
    workAreas: [],
    learningMethods: [],
    timeCommitment: '',
    aiTools: [],
    jobLevel: '',
    teamInterest: '',
    companyUrl: '',
    teamSize: '',
    emailContact: ''
  });

  const totalSteps = 13;

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArraySelection = (field: keyof OnboardingData, value: string) => {
    setData(prev => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(value) 
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  };

  const nextStep = async () => {
    if (currentStep === 11) {
      // Start loading animation
      setIsLoading(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsLoading(false);
      }, 3000);
    } else if (currentStep === 12) {
      // Save onboarding data and then final loading before redirect
      setIsLoading(true);
      
      try {
        // Save onboarding data to backend
        console.log('Saving onboarding data:', data);
        
        const response = await fetch('/api/onboarding/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to save onboarding data');
        }

        const result = await response.json();
        console.log('Onboarding data saved successfully:', result);
      } catch (error) {
        console.error('Error saving onboarding data:', error);
        // Continue even if save fails
      }
      
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsLoading(false);
      }, 2000);
    } else if (currentStep === 13) {
      // Redirect to dashboard
      setLocation('/');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderProgressBar = () => {
    const progress = ((currentStep + 1) / totalSteps) * 100;
    return (
      <div className="w-full max-w-md mx-auto mb-8">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Pregunta {currentStep + 1} de {totalSteps}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1">
          <div 
            className="bg-white h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-white text-black text-xl font-bold flex items-center justify-center rounded-lg mx-auto mb-6">
              ENC
            </div>
            <div className="text-4xl font-bold mb-4">
              ¡Bienvenido a Expertos NoCode IA!
            </div>
            <p className="text-gray-400 mb-8">
              Complete nuestro formulario rápido y encontraremos las mejores herramientas y recursos de NoCode IA para sus necesidades.
            </p>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium mb-4">¿Cómo te llamas?</h3>
                <Input
                  value={data.name}
                  onChange={(e) => updateData('name', e.target.value)}
                  placeholder="Nombre de pila"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-center"
                />
              </div>
              <Button 
                onClick={nextStep}
                disabled={!data.name.trim()}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white"
              >
                Continuar
              </Button>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="text-center max-w-lg mx-auto">
            {renderProgressBar()}
            <h2 className="text-2xl font-medium mb-8">
              ¿Qué tan familiarizado está usted con la IA NoCode en estos momentos?
            </h2>
            <div className="space-y-3">
              {['Principiante', 'Intermedio', 'Avanzado'].map((option) => (
                <Button
                  key={option}
                  variant={data.aiExperience === option ? "default" : "outline"}
                  onClick={() => {
                    updateData('aiExperience', option);
                    setTimeout(nextStep, 300);
                  }}
                  className="w-full bg-gray-800 border-gray-600 hover:bg-gray-700 text-white"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center max-w-lg mx-auto">
            {renderProgressBar()}
            <h2 className="text-2xl font-medium mb-8">
              ¿Cuál es su objetivo principal al aprender NoCode IA?
            </h2>
            <div className="space-y-3">
              {[
                'Trabajar más rápido',
                'Ganar más dinero',
                'Crecimiento profesional',
                'Manténgase a la vanguardia de las tendencias',
                'Implementar NoCode IA en mi negocio'
              ].map((option) => (
                <Button
                  key={option}
                  variant={data.goal === option ? "default" : "outline"}
                  onClick={() => {
                    updateData('goal', option);
                    setTimeout(nextStep, 300);
                  }}
                  className="w-full bg-gray-800 border-gray-600 hover:bg-gray-700 text-white"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center max-w-2xl mx-auto">
            {renderProgressBar()}
            <h2 className="text-2xl font-medium mb-8">
              ¿En qué área de trabajo le gustaría que el NoCode IA le ayudara más?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '💻', text: 'Codificación' },
                { icon: '📱', text: 'Marketing' },
                { icon: '✍️', text: 'Creador de contenido' },
                { icon: '🎓', text: 'Educador' },
                { icon: '📊', text: 'Operaciones comerciales' },
                { icon: '📈', text: 'Ventas' },
                { icon: '💰', text: 'Finanzas' },
                { icon: '🎨', text: 'Diseño' },
                { icon: '👤', text: 'Consultante' },
                { icon: '🏛️', text: 'Gobierno' },
                { icon: '📊', text: 'Análisis de datos' },
                { icon: '📋', text: 'Gestión de proyectos' }
              ].map((option) => (
                <Button
                  key={option.text}
                  variant={data.workAreas.includes(option.text) ? "default" : "outline"}
                  onClick={() => {
                    toggleArraySelection('workAreas', option.text);
                    // Auto advance after selection
                    setTimeout(() => {
                      nextStep();
                    }, 1000);
                  }}
                  className="p-4 bg-gray-800 border-gray-600 hover:bg-gray-700 text-white flex items-center space-x-2"
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-sm">{option.text}</span>
                </Button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center max-w-lg mx-auto">
            {renderProgressBar()}
            <h2 className="text-2xl font-medium mb-8">
              Además de nuestro boletín, ¿de qué otra manera le gustaría aprender nuevas habilidades de NoCode IA?
            </h2>
            <div className="space-y-3">
              {[
                'Cursos de certificación',
                'Microlecciones paso a paso',
                'Talleres prácticos en vivo',
                'Orientación personalizada',
                'Una comunidad de entusiastas del NoCode IA'
              ].map((option) => (
                <Button
                  key={option}
                  variant={data.learningMethods.includes(option) ? "default" : "outline"}
                  onClick={() => {
                    toggleArraySelection('learningMethods', option);
                    // Auto advance after selection
                    setTimeout(() => {
                      nextStep();
                    }, 1000);
                  }}
                  className="w-full bg-gray-800 border-gray-600 hover:bg-gray-700 text-white"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center max-w-lg mx-auto">
            {renderProgressBar()}
            <h2 className="text-2xl font-medium mb-8">
              Siendo realistas, ¿cuánto tiempo tienes cada semana para aprender NoCode IA?
            </h2>
            <div className="space-y-3">
              {[
                'Menos de 30 minutos',
                '30-60 minutos',
                '1-3 horas',
                '3+ horas'
              ].map((option) => (
                <Button
                  key={option}
                  variant={data.timeCommitment === option ? "default" : "outline"}
                  onClick={() => {
                    updateData('timeCommitment', option);
                    setTimeout(nextStep, 300);
                  }}
                  className="w-full bg-gray-800 border-gray-600 hover:bg-gray-700 text-white"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center max-w-3xl mx-auto">
            {renderProgressBar()}
            <h2 className="text-2xl font-medium mb-8">
              ¿A qué herramientas de IA ya estás suscrito?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '🔮', text: 'ChatGPT' },
                { icon: '🎨', text: 'Microsoft Copilot' },
                { icon: '✨', text: 'Gemini' },
                { icon: '🤖', text: 'Claude' },
                { icon: '🔍', text: 'Perplexity' },
                { icon: '🎬', text: 'Midjourney' },
                { icon: '⚡', text: 'Zapier' },
                { icon: '🔗', text: 'n8n' },
                { icon: '📝', text: 'NotebookLM' },
                { icon: '💻', text: 'Cursor' },
                { icon: '🎞️', text: 'KLING' },
                { icon: '👤', text: 'HeyGen' },
                { icon: '🎥', text: 'Runway' },
                { icon: '📋', text: 'Notion AI' },
                { icon: '🎙️', text: 'ElevenLabs' },
                { icon: '🎨', text: 'Canva AI' },
                { icon: '💙', text: 'Lovable' },
                { icon: '🤷', text: 'None yet' }
              ].map((option) => (
                <Button
                  key={option.text}
                  variant="outline"
                  onClick={() => toggleArraySelection('aiTools', option.text)}
                  className={`p-4 flex items-center space-x-2 transition-all duration-200 ${
                    data.aiTools.includes(option.text) 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25' 
                      : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-sm">{option.text}</span>
                </Button>
              ))}
            </div>
            <Button 
              onClick={nextStep}
              disabled={data.aiTools.length === 0}
              className={`w-full mt-6 transition-all duration-200 ${
                data.aiTools.length > 0 
                  ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continuar
            </Button>
          </div>
        );

      case 7:
        return (
          <div className="text-center max-w-lg mx-auto">
            {renderProgressBar()}
            <h2 className="text-2xl font-medium mb-8">
              ¿Cuál es su nivel laboral actual?
            </h2>
            <div className="space-y-3">
              {[
                'Fundador',
                'Alta dirección',
                'Director/Vicepresidente',
                'Nivel medio o de entrada',
                'Estudiante o pasante',
                'Otro'
              ].map((option) => (
                <Button
                  key={option}
                  variant={data.jobLevel === option ? "default" : "outline"}
                  onClick={() => {
                    updateData('jobLevel', option);
                    setTimeout(nextStep, 300);
                  }}
                  className="w-full bg-gray-800 border-gray-600 hover:bg-gray-700 text-white"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="text-center max-w-lg mx-auto">
            {renderProgressBar()}
            <h2 className="text-2xl font-medium mb-8">
              ¿Quieres que tu equipo también se ponga al día con el NoCode IA?
            </h2>
            <div className="space-y-3">
              {['Sí', 'No'].map((option) => (
                <Button
                  key={option}
                  variant={data.teamInterest === option ? "default" : "outline"}
                  onClick={() => {
                    updateData('teamInterest', option);
                    setTimeout(nextStep, 300);
                  }}
                  className="w-full bg-gray-800 border-gray-600 hover:bg-gray-700 text-white"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 9:
        return (
          <div className="text-center max-w-lg mx-auto">
            {renderProgressBar()}
            <h2 className="text-2xl font-medium mb-8">
              ¿Cuál es el enlace de la página de inicio de su empresa?
            </h2>
            <div className="space-y-6">
              <Input
                value={data.companyUrl}
                onChange={(e) => updateData('companyUrl', e.target.value)}
                placeholder="https://suempresa.com"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
              <Button 
                onClick={nextStep}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white"
              >
                Continuar
              </Button>
            </div>
          </div>
        );

      case 10:
        return (
          <div className="text-center max-w-lg mx-auto">
            {renderProgressBar()}
            <h2 className="text-2xl font-medium mb-8">
              ¿Cuántos asientos tiene tu equipo?
            </h2>
            <div className="space-y-3">
              {[
                '2-5',
                '5-20',
                '50-100',
                'más de 100'
              ].map((option) => (
                <Button
                  key={option}
                  variant={data.teamSize === option ? "default" : "outline"}
                  onClick={() => {
                    updateData('teamSize', option);
                    setTimeout(nextStep, 300);
                  }}
                  className="w-full bg-gray-800 border-gray-600 hover:bg-gray-700 text-white"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 11:
        return (
          <div className="text-center max-w-lg mx-auto">
            {renderProgressBar()}
            <h2 className="text-2xl font-medium mb-8">
              ¿Quieres que nos comuniquemos contigo por correo electrónico con un paquete personalizado?
            </h2>
            <div className="space-y-3">
              {['Sí', 'No'].map((option) => (
                <Button
                  key={option}
                  variant={data.emailContact === option ? "default" : "outline"}
                  onClick={() => {
                    updateData('emailContact', option);
                    setTimeout(nextStep, 300);
                  }}
                  className="w-full bg-gray-800 border-gray-600 hover:bg-gray-700 text-white"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 12:
        return (
          <div className="text-center max-w-lg mx-auto">
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold">
                ¡Gracias! Nos pondremos en contacto contigo en 24 horas.
              </h2>
              <p className="text-gray-400 max-w-md mx-auto">
                Nuestro equipo le enviará por correo electrónico opciones empresariales personalizadas según sus necesidades. Mientras tanto, puede continuar con su página de inicio personalizada.
              </p>
              <Button 
                onClick={nextStep}
                className="w-full bg-white hover:bg-gray-100 text-black"
              >
                Continúa a tu página de inicio personalizada
              </Button>
            </div>
          </div>
        );

      case 13:
        return (
          <div className="text-center max-w-lg mx-auto">
            {isLoading ? (
              <div className="space-y-6">
                <div className="w-32 h-32 mx-auto relative">
                  <div className="w-32 h-32 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl font-bold">ENC</div>
                  </div>
                </div>
                <p className="text-gray-400">Analizando tus habilidades y objetivos...</p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">Jamal Reid • Líder de producto</div>
                      <div className="text-xs text-gray-400 flex">
                        {'⭐'.repeat(5)} "Los flujos de trabajo aquí ayudaron a nuestro equipo a automatizar las tareas aburridas y centrarse en los clientes"
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-32 h-32 mx-auto relative">
                  <div className="w-32 h-32 border-4 border-gray-600 rounded-full"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl font-bold">ENC</div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold">
                  ¡Listo! Te estamos redirigiendo a tu panel de control...
                </h2>
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div className="bg-blue-500 h-1 rounded-full w-full"></div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">Elena Petrova • Estratega de contenido</div>
                      <div className="text-xs text-gray-400 flex">
                        {'⭐'.repeat(5)} "Claros, prácticos y realmente divertidos. Uso estos manuales todas las semanas."
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => setLocation('/')}
                  className="w-full bg-white hover:bg-gray-100 text-black mt-6"
                >
                  Ir al Dashboard
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Back Button */}
        {currentStep > 0 && currentStep < 12 && (
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={prevStep}
              className="text-gray-400 hover:text-white flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Atrás</span>
            </Button>
          </div>
        )}
        
        {renderStep()}
      </div>
    </div>
  );
}