import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Code, 
  TrendingUp, 
  Users, 
  Lightbulb, 
  Globe,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function Onboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    profession: "",
    experience: "",
    interests: [] as string[],
    goals: "",
    companySize: "",
    industry: "",
  });

  const professions = [
    { value: "consultant", label: "Consultor/a", icon: Briefcase },
    { value: "developer", label: "Desarrollador/a", icon: Code },
    { value: "marketer", label: "Marketing", icon: TrendingUp },
    { value: "manager", label: "Gerente/Director", icon: Users },
    { value: "entrepreneur", label: "Emprendedor/a", icon: Lightbulb },
    { value: "freelancer", label: "Freelancer", icon: Globe },
    { value: "other", label: "Otro", icon: Users },
  ];

  const experienceLevels = [
    { value: "beginner", label: "Principiante - Primera vez con IA" },
    { value: "basic", label: "Básico - He usado herramientas como ChatGPT" },
    { value: "intermediate", label: "Intermedio - Implementé IA en algunos proyectos" },
    { value: "advanced", label: "Avanzado - Trabajo profesionalmente con IA" },
  ];

  const interestOptions = [
    "Automatización de procesos",
    "ChatGPT y LLMs",
    "IA para Marketing",
    "Análisis de datos",
    "Desarrollo de aplicaciones",
    "Consultoría en IA",
    "IA para ventas",
    "Productividad personal",
    "Machine Learning",
    "Computer Vision",
  ];

  const companySizes = [
    { value: "solo", label: "Solo/Freelancer" },
    { value: "small", label: "Pequeña (2-10 empleados)" },
    { value: "medium", label: "Mediana (11-50 empleados)" },
    { value: "large", label: "Grande (50+ empleados)" },
  ];

  const industries = [
    "Tecnología", "Marketing", "Consultoría", "E-commerce", 
    "Educación", "Salud", "Finanzas", "Retail", "Manufactura", "Otro"
  ];

  const onboardingMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar el perfil');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Perfil completado!",
        description: "Ahora puedes acceder a todos los cursos",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo completar el perfil. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = () => {
    onboardingMutation.mutate(formData);
  };

  const isStepComplete = () => {
    switch (step) {
      case 1: return formData.profession && formData.experience;
      case 2: return formData.interests.length > 0;
      case 3: return formData.goals && formData.companySize && formData.industry;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">
              ¡Hola {user?.firstName || ""}! 👋
            </h1>
            <div className="text-sm text-gray-400">
              Paso {step} de 3
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">
              {step === 1 && "Cuéntanos sobre ti"}
              {step === 2 && "¿En qué estás interesado?"}
              {step === 3 && "Últimos detalles"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {step === 1 && "Personalicemos tu experiencia de aprendizaje"}
              {step === 2 && "Selecciona los temas que más te interesan"}
              {step === 3 && "Información adicional para recomendarte mejor"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Profession & Experience */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-white mb-4 block">¿Cuál es tu profesión principal?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {professions.map((prof) => {
                      const Icon = prof.icon;
                      return (
                        <button
                          key={prof.value}
                          onClick={() => setFormData(prev => ({ ...prev, profession: prof.value }))}
                          className={`p-4 rounded-lg border transition-colors text-left ${
                            formData.profession === prof.value
                              ? 'border-purple-500 bg-purple-500/20'
                              : 'border-slate-600 bg-slate-800/50 hover:bg-slate-700/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-purple-400" />
                            <span className="text-white text-sm">{prof.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label className="text-white">¿Cuál es tu nivel de experiencia con IA?</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Selecciona tu nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2: Interests */}
            {step === 2 && (
              <div className="space-y-4">
                <Label className="text-white">Selecciona los temas que más te interesan (máximo 5):</Label>
                <div className="grid grid-cols-2 gap-3">
                  {interestOptions.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      disabled={formData.interests.length >= 5 && !formData.interests.includes(interest)}
                      className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                        formData.interests.includes(interest)
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-slate-600 bg-slate-800/50 hover:bg-slate-700/50'
                      } ${formData.interests.length >= 5 && !formData.interests.includes(interest) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="text-white">{interest}</span>
                      {formData.interests.includes(interest) && (
                        <CheckCircle className="h-4 w-4 text-purple-400 float-right mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="text-sm text-gray-400">
                  Seleccionados: {formData.interests.length}/5
                </div>
              </div>
            )}

            {/* Step 3: Additional Details */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="goals" className="text-white">¿Cuáles son tus objetivos con IA?</Label>
                  <Textarea
                    id="goals"
                    value={formData.goals}
                    onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
                    placeholder="Ej: Automatizar procesos en mi empresa, mejorar productividad, crear nuevos servicios..."
                    className="bg-slate-800 border-slate-600 text-white"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Tamaño de tu empresa/equipo</Label>
                    <Select onValueChange={(value) => setFormData(prev => ({ ...prev, companySize: value }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {companySizes.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white">Industria</Label>
                    <Select onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Interests Preview */}
            {step === 2 && formData.interests.length > 0 && (
              <div className="space-y-2">
                <Label className="text-white">Temas seleccionados:</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="bg-purple-500/20 text-purple-400">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                onClick={() => setStep(step - 1)}
                variant="outline"
                disabled={step === 1}
                className="border-slate-600 text-white"
              >
                Anterior
              </Button>

              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!isStepComplete()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isStepComplete() || onboardingMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {onboardingMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      Completar Registro
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}