import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLessonPosition } from "@/hooks/useLessonPosition";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import CourseSidebar from "@/components/layout/course-sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LessonResources } from "@/components/lesson-resources";
import { Award, Check, ChevronRight, ChevronLeft, Users, Bot, Code, Megaphone, Settings, DollarSign, Heart, Building, CheckSquare, Scale, BarChart, GraduationCap, PlayCircle, Clock, CheckCircle2, BookOpen, Play, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { generateCertificate, generateCertificateId, formatCertificateDate } from "@/lib/certificateGenerator";

// Helper function to convert YouTube URLs to embed format
const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return '';
  
  // Handle different YouTube URL formats
  let videoId = '';
  
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('youtube.com/embed/')) {
    return url; // Already in embed format
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

export default function Course() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { id, roomSlug } = useParams<{ id: string; roomSlug?: string }>();
  const isRoomContext = Boolean(roomSlug); // Detect if viewing from a room
  const [, setLocation] = useLocation();
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [hasCheckedSavedPosition, setHasCheckedSavedPosition] = useState(false);
  const queryClient = useQueryClient();
  const { getSavedLessonPosition, saveLessonPosition } = useLessonPosition();

  // Final Exam Modal State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [examScore, setExamScore] = useState(0);
  const [isExamFailed, setIsExamFailed] = useState(false);
  
  // Mobile Lessons Modal State
  const [isMobileLessonsOpen, setIsMobileLessonsOpen] = useState(false);
  
  // Collapsed modules state (stores module IDs that are collapsed)
  const [collapsedModules, setCollapsedModules] = useState<Set<number>>(new Set());

  // Sample exam questions
  const examQuestions = [
    {
      question: "¿Qué es la Inteligencia Artificial (IA)?",
      options: [
        "Un lenguaje de programación",
        "Un tipo de hardware de computadora",
        "Sistemas informáticos que realizan tareas que requieren inteligencia humana",
        "Una técnica de almacenamiento de datos"
      ],
      correctAnswer: 2
    },
    {
      question: "¿Qué permite hacer el aprendizaje automático (ML) a los sistemas informáticos?",
      options: [
        "Operar sin electricidad",
        "Mejorar y aprender sin programación explícita",
        "Función sin ningún dato",
        "Execute únicamente cálculos simples"
      ],
      correctAnswer: 1
    },
    {
      question: "¿Cuál es la principal diferencia entre la IA de código abierto y la de código cerrado?",
      options: [
        "La IA de código abierto siempre es gratuita; la IA de código cerrado, no.",
        "La IA de código abierto utiliza Internet; la de código cerrado, no.",
        "La IA de código abierto permite el acceso público al código fuente; el código cerrado lo mantiene privado.",
        "La IA de código abierto es menos avanzada que la IA de código cerrado."
      ],
      correctAnswer: 2
    },
    {
      question: "¿En qué año se lanzó ChatGPT?",
      options: [
        "2020",
        "2021",
        "2022",
        "2023"
      ],
      correctAnswer: 2
    },
    {
      question: "¿Cuál es una limitación conocida de las herramientas de IA?",
      options: [
        "Pueden operar sin ningún tipo de control o supervisión.",
        "Requieren inteligencia humana para funcionar.",
        "Son menos precisos que los procesos manuales.",
        "Pueden amplificar y perpetuar inadvertidamente los sesgos existentes."
      ],
      correctAnswer: 3
    },
    {
      question: "¿Cuál es la función principal de un chatbot de IA?",
      options: [
        "Procesar y analizar datos numéricos exclusivamente",
        "Simular conversaciones similares a las humanas utilizando inteligencia artificial",
        "Para mejorar las funciones físicas del robot",
        "Para monitorear y proteger redes informáticas"
      ],
      correctAnswer: 1
    },
    {
      question: "¿Para qué se utiliza principalmente ChatGPT?",
      options: [
        "Generar respuestas de texto similares a las humanas",
        "Cálculos numéricos",
        "Mejora de los gráficos de video",
        "Gestión de bases de datos"
      ],
      correctAnswer: 0
    },
    {
      question: "¿Qué características ofrece Fireflies AI para mejorar la productividad?",
      options: [
        "Edición de video",
        "Automatización del correo electrónico",
        "Gestión de redes sociales",
        "Transcripción y resumen de reuniones en tiempo real"
      ],
      correctAnswer: 3
    },
    {
      question: "¿Qué herramienta se destacó específicamente por su capacidad para crear presentaciones visualmente atractivas sin habilidades de diseño?",
      options: [
        "Notion",
        "Gamma",
        "Firefiles AI",
        "Rewind AI"
      ],
      correctAnswer: 1
    },
    {
      question: "¿Cuál es la función principal de una herramienta de automatización de IA como Zapier?",
      options: [
        "Proporcionar soluciones de ciberseguridad",
        "Para gestionar los horarios de los empleados",
        "Para mejorar las tareas de diseño gráfico",
        "Para conectar aplicaciones y automatizar flujos de trabajo"
      ],
      correctAnswer: 3
    },
    {
      question: "¿Cuál es un ejemplo de caso de uso de lo que las herramientas de automatización de IA pueden hacer en la gestión de proyectos?",
      options: [
        "Disminuir la colaboración en equipo",
        "Aumentar los costos del proyecto",
        "Crea tareas automáticamente a partir de correos electrónicos o eventos del calendario",
        "Eliminar la necesidad de gerentes de proyectos"
      ],
      correctAnswer: 2
    },
    {
      question: "¿Qué es un \"Zap\" en Zapier?",
      options: [
        "Un script de codificación",
        "Un término de marketing para promociones.",
        "Un plan para una tarea que desea automatizar",
        "Un tipo de moneda digital"
      ],
      correctAnswer: 2
    },
    {
      question: "¿Cuál es un caso de uso común de las herramientas de video de IA en entornos corporativos?",
      options: [
        "Cálculo de presupuestos financieros",
        "Creación de videos de formación personalizados",
        "Realización de reuniones virtuales",
        "Redacción de documentos legales"
      ],
      correctAnswer: 1
    },
    {
      question: "¿Qué herramienta de video de IA es conocida por generar avatares de IA realistas?",
      options: [
        "HeyGen",
        "Luma Dream Machine",
        "ChatGPT",
        "PikaLabs"
      ],
      correctAnswer: 0
    },
    {
      question: "Los sistemas de Inteligencia Artificial (IA) requieren una programación explícita para cada escenario que enfrentan.",
      options: [
        "Verdadero",
        "Falso"
      ],
      correctAnswer: 1
    },
    {
      question: "Los sistemas de IA de código abierto son aquellos cuyo código fuente se mantiene en secreto y no está disponible para el público.",
      options: [
        "Verdadero",
        "Falso"
      ],
      correctAnswer: 1
    },
    {
      question: "La IA generativa solo puede generar contenido de texto, no imágenes ni música.",
      options: [
        "Verdadero",
        "Falso"
      ],
      correctAnswer: 1
    },
    {
      question: "Las redes neuronales están diseñadas basándose en las redes neuronales biológicas que se encuentran en los cerebros humanos.",
      options: [
        "Verdadero",
        "Falso"
      ],
      correctAnswer: 0
    },
    {
      question: "Los AI Wrappers se pueden utilizar para especializar las capacidades de los modelos de IA para casos de uso específicos.",
      options: [
        "Verdadero",
        "Falso"
      ],
      correctAnswer: 0
    }
  ];

  // Allow non-authenticated users to view course content but locked
  // No automatic redirect - show locked content instead

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: [`/api/courses/${id}`],
    enabled: !!id, // Allow fetching for all users to show real course info
  });

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: [`/api/courses/${id}/lessons`],
    enabled: !!id, // Allow fetching for all users to show real lesson list
  });

  const { data: completedLessons = [] } = useQuery<string[]>({
    queryKey: [`/api/courses/${id}/progress`],
    enabled: isAuthenticated && !!id, // Only fetch progress if authenticated
  });

  // Ensure lessons is always an array
  const lessonsArray = Array.isArray(lessons) ? lessons : [];

  // Organize lessons into hierarchical structure (modules + sub-lessons)
  const modules = lessonsArray.filter((lesson: any) => !lesson.parentLessonId)
    .sort((a: any, b: any) => a.order - b.order);
  
  const subLessonsByParent = lessonsArray
    .filter((lesson: any) => lesson.parentLessonId)
    .reduce((acc: any, lesson: any) => {
      if (!acc[lesson.parentLessonId]) {
        acc[lesson.parentLessonId] = [];
      }
      acc[lesson.parentLessonId].push(lesson);
      return acc;
    }, {});
  
  // Sort sub-lessons within each parent
  Object.keys(subLessonsByParent).forEach(parentId => {
    subLessonsByParent[parentId].sort((a: any, b: any) => a.order - b.order);
  });
  
  // Toggle collapse state for a module
  const toggleModuleCollapse = (moduleId: number) => {
    setCollapsedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  // Verificar si hay una lección guardada y redirigir automáticamente
  useEffect(() => {
    // console.log('🔍 Checking saved position...', { 
    //   courseId: id, 
    //   lessonsCount: lessonsArray.length, 
    //   hasCheckedSavedPosition 
    // });
    
    if (id && lessonsArray.length > 0 && !hasCheckedSavedPosition) {
      const savedLessonId = getSavedLessonPosition(id);
      // console.log('📋 Got saved lesson ID:', savedLessonId);
      
      if (savedLessonId) {
        // Verificar que la lección guardada aún existe en este curso
        const savedLessonIndex = lessonsArray.findIndex((lesson: any) => lesson.id === savedLessonId);
        // console.log('🔍 Found lesson index:', savedLessonIndex);
        
        if (savedLessonIndex !== -1) {
          // console.log('🚀 Setting current lesson index to:', savedLessonIndex);
          // Establecer el índice de la lección guardada
          setCurrentLessonIndex(savedLessonIndex);
          setHasCheckedSavedPosition(true);
          return;
        } else {
          // console.log('❌ Saved lesson not found in current course lessons');
        }
      }
      
      // console.log('✅ Setting hasCheckedSavedPosition to true');
      setHasCheckedSavedPosition(true);
    }
  }, [id, lessonsArray, hasCheckedSavedPosition, getSavedLessonPosition, setLocation]);

  const markLessonCompleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      return await apiRequest('POST', `/api/lessons/${lessonId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}/progress`] });
      toast({
        title: "Lección completada",
        description: "Has marcado la lección como completada exitosamente.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo marcar la lección como completada. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const getIcon = (course: any) => {
    const title = course?.title?.toLowerCase() || '';
    if (title.includes('consultoría')) return Users;
    if (title.includes('inicio') || title.includes('kit')) return Bot;
    if (title.includes('codificación')) return Code;
    if (title.includes('marketing')) return Megaphone;
    if (title.includes('contenido')) return Bot;
    if (title.includes('diseño')) return Bot;
    if (title.includes('educación') || title.includes('aprendizaje')) return GraduationCap;
    if (title.includes('operaciones')) return Settings;
    if (title.includes('finanzas')) return DollarSign;
    if (title.includes('atención') || title.includes('médica')) return Heart;
    if (title.includes('gobierno')) return Building;
    if (title.includes('proyectos')) return CheckSquare;
    if (title.includes('legal')) return Scale;
    if (title.includes('recursos')) return Users;
    if (title.includes('ventas')) return BarChart;
    if (title.includes('datos')) return BarChart;
    return Bot;
  };

  const getTypeColor = (course: any) => {
    const title = course?.title?.toLowerCase() || '';
    if (title.includes('consultoría')) return 'purple';
    if (title.includes('inicio') || title.includes('kit')) return 'blue';
    if (title.includes('codificación')) return 'green';
    if (title.includes('marketing')) return 'orange';
    if (title.includes('contenido') || title.includes('diseño')) return 'pink';
    if (title.includes('educación') || title.includes('aprendizaje')) return 'green';
    if (title.includes('operaciones')) return 'purple';
    if (title.includes('finanzas')) return 'blue';
    if (title.includes('atención') || title.includes('médica')) return 'pink';
    if (title.includes('gobierno')) return 'green';
    if (title.includes('proyectos')) return 'pink';
    if (title.includes('legal')) return 'blue';
    if (title.includes('recursos')) return 'purple';
    if (title.includes('ventas')) return 'blue';
    if (title.includes('datos')) return 'orange';
    return 'purple';
  };

  if (authLoading || courseLoading || lessonsLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex">
        <div className="w-64 bg-dark-card border-r border-dark-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-dark-bg flex">
        <CourseSidebar />
        <div className="flex-1 flex items-center justify-center ml-64">
          <div className="text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Curso no encontrado</h2>
            <p className="text-gray-400">El curso que buscas no existe o ha sido eliminado.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!lessonsArray || lessonsArray.length === 0) {
    return (
      <div className="min-h-screen bg-dark-bg flex">
        <CourseSidebar />
        <div className="flex-1 flex items-center justify-center ml-64">
          <div className="text-white text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold mb-4">No hay lecciones disponibles</h2>
            <p className="text-gray-400 mb-6">Este curso aún no tiene lecciones publicadas.</p>
            <Link href="/courses">
              <Button>Volver a Cursos</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const Icon = getIcon(course);
  const typeColor = getTypeColor(course);

  const courseData = {
    introduction: (course as any)?.description || "Descripción del curso no disponible.",
    learningObjectives: [],
    courseIncludes: [],
    tools: [],
    lessons: lessonsArray
  };

  // Calculate progress based on leaf lessons only (sub-lessons or modules without children)
  const leafLessons = lessonsArray.filter((lesson: any) => {
    // Include if it's a sub-lesson OR a module without sub-lessons
    return lesson.parentLessonId || !subLessonsByParent[lesson.id]?.length;
  });
  const leafLessonIds = new Set(leafLessons.map((l: any) => l.id));
  const completedLeafLessons = completedLessons.filter((id: string) => leafLessonIds.has(id));
  const progressPercentage = leafLessons.length > 0 ? (completedLeafLessons.length / leafLessons.length) * 100 : 0;
  const currentLesson = lessonsArray[currentLessonIndex];

  const handleLessonClick = (lessonIndex: number) => {
    setCurrentLessonIndex(lessonIndex);
    // Guardar la posición de la nueva lección
    const lesson = lessonsArray[lessonIndex];
    if (lesson && id) {
      saveLessonPosition(id, lesson.id);
    }
  };

  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      const newIndex = currentLessonIndex - 1;
      setCurrentLessonIndex(newIndex);
      // Guardar la posición de la nueva lección
      const lesson = lessonsArray[newIndex];
      if (lesson && id) {
        saveLessonPosition(id, lesson.id);
      }
    }
  };

  const handleNextLesson = () => {
    if (currentLessonIndex < lessonsArray.length - 1) {
      const newIndex = currentLessonIndex + 1;
      setCurrentLessonIndex(newIndex);
      // Guardar la posición de la nueva lección
      const lesson = lessonsArray[newIndex];
      if (lesson && id) {
        saveLessonPosition(id, lesson.id);
      }
    }
  };

  const isLessonCompleted = (lessonId: string) => completedLessons.includes(lessonId);

  const handleMarkComplete = (lessonId: string) => {
    markLessonCompleteMutation.mutate(lessonId);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <MobileHeader />
      <div className="flex">
        {/* Course Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <CourseSidebar />
        </div>
        
      <div className="flex-1 flex bg-background lg:ml-[250px] lg:mr-[560px] h-screen overflow-y-auto hide-scrollbar">
        {/* Main Content - Center Column - Full width on mobile */}
        <main className="flex-1 lg:w-[920px] bg-background overflow-y-auto hide-scrollbar h-screen">
          {/* Top Navigation Bar */}
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/courses" className="flex-1 mt-[5px] mb-[5px]">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Volver a los cursos
              </Button>
            </Link>
            {/* Save Course Button - Only on mobile */}
            <div className="lg:hidden">
              <Button variant="outline" size="sm" className="border-border text-card-foreground">
                <span className="mr-1">🔖</span>
                Guardar curso
              </Button>
            </div>
          </div>

          {/* Course Title */}
          <div className="px-4 lg:px-8 pb-4">
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">{(course as any)?.title}</h1>
            {/* Progress bar - Only on mobile - Clickeable */}
            <div 
              className="lg:hidden mt-3 flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              onClick={() => setIsMobileLessonsOpen(true)}
            >
              <span className="w-2 h-2 bg-white rounded-full"></span>
              <span>Lecciones</span>
              <div className="flex-1 bg-muted rounded-full h-1">
                <div className="bg-white rounded-full h-1 transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
              </div>
              <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </div>

          <div className="px-4 lg:px-8 pb-24 lg:pb-8 lg:pl-[45px] lg:pr-[15px]">
            {/* Current Lesson Content */}
            {currentLesson && (
              <section>
                {!isAuthenticated ? (
                  // Blocked video/media for ALL lessons when not authenticated
                  (<>
                    {/* Media Area - Always blocked for non-authenticated users */}
                    <div className="relative rounded-lg overflow-hidden mb-6 lg:mb-8 bg-black" style={{ paddingBottom: '56.25%' }}>
                      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black">
                        <div className="text-center text-white">
                          <div className="mb-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-gray-800 flex items-center justify-center mb-4">
                              <Play className="h-8 w-8 text-gray-400" />
                            </div>
                          </div>
                          <p className="text-lg mb-4">Tu plan actual no incluye acceso a este curso.</p>
                          <Button 
                            onClick={() => window.location.href = "/planes"}
                            className="bg-white text-black hover:bg-gray-200"
                          >
                            Inscribirse
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>)
                ) : (
                  // Normal content for authenticated users
                  (<>
                    {/* Media Area - Video/Image/Empty based on lesson content */}
                    {currentLesson.videoUrl ? (
                      <div className="relative rounded-lg overflow-hidden mb-6 lg:mb-8" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          className="absolute top-0 left-0 w-full h-full"
                          src={getYouTubeEmbedUrl(currentLesson.videoUrl)}
                          title={currentLesson.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : currentLesson.imageUrl ? (
                      <div className="rounded-lg mb-6 lg:mb-8">
                        <img 
                          src={currentLesson.imageUrl} 
                          alt={currentLesson.title}
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                    ) : null}
                  </>)
                )}

                <div className="space-y-6 lg:space-y-8">
                  <div className="bg-card rounded-xl p-4 lg:p-8 font-satoshi font-normal text-[14px] lg:text-[16px] leading-[22px] lg:leading-[26px] text-card-foreground">
                    {/* Lesson Title inside content card */}
                    <div className="mb-4 lg:mb-6">
                      <h2 className="text-lg lg:text-xl font-bold text-foreground mb-3 flex items-center font-satoshi" style={{fontSize: '24px'}}>
                        <div className="w-8 h-8 rounded-lg mr-3 flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#363636'}}>
                          <GraduationCap className="h-4 w-4 text-foreground" />
                        </div>
                        {currentLesson.title}
                      </h2>
                      {currentLesson.description && (
                        <p className="text-muted-foreground text-sm lg:text-base">
                          {currentLesson.description}
                        </p>
                      )}
                    </div>
                    
                    {!isAuthenticated ? (
                      // Blocked content for non-authenticated users
                      currentLessonIndex === 0 ? (
                        // Primera lección: contenido completamente visible
                        <div className="prose prose-sm lg:prose-base max-w-none">
                          {currentLesson.content && (
                            <div className="markdown-content">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                              >
                                {currentLesson.content}
                              </ReactMarkdown>
                            </div>
                          )}
                          {!currentLesson.content && !currentLesson.videoUrl && !currentLesson.imageUrl && (
                            <p className="text-muted-foreground italic">Contenido de la lección no disponible.</p>
                          )}
                        </div>
                      ) : (
                        // Lecciones 2+: contenido bloqueado
                        <div className="py-8">
                          <p className="text-muted-foreground mb-6">Debes registrarte en Universidad Expertos NoCode IA para ver esta lección.</p>
                          <Button 
                            onClick={() => window.location.href = "/planes"}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            Inscribirse
                          </Button>
                        </div>
                      )
                    ) : (
                      // Normal content for authenticated users  
                      <div className="prose prose-sm lg:prose-base max-w-none">
                        {currentLesson.content && (
                          <div className="markdown-content">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight, rehypeRaw]}
                            >
                              {currentLesson.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        {!currentLesson.content && !currentLesson.videoUrl && !currentLesson.imageUrl && (
                          <p className="text-muted-foreground italic">Contenido de la lección no disponible.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>


                {/* Mobile & Tablet Lesson Navigation */}
                <div className="lg:hidden mt-6">
                  <div className="space-y-3">
                    {/* Next Lesson Button - White */}
                    <button 
                      onClick={handleNextLesson}
                      disabled={currentLessonIndex >= lessonsArray.length - 1}
                      className="w-full bg-primary text-primary-foreground font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      Próxima lección
                      <ChevronRight className="ml-2" size={16} />
                    </button>
                    
                    {/* Previous Lesson Button - Gray */}
                    <button 
                      onClick={handlePreviousLesson}
                      disabled={currentLessonIndex <= 0}
                      className="w-full bg-secondary text-secondary-foreground font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <ChevronLeft className="mr-2" size={16} />
                      Lección anterior
                    </button>
                  </div>
                </div>

                {/* Desktop Lesson Navigation */}
                <div className="hidden lg:flex gap-4 mt-8">
                  {/* Previous Lesson Button - Gray */}
                  <Button 
                    variant="secondary"
                    onClick={handlePreviousLesson}
                    disabled={currentLessonIndex <= 0}
                    className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium py-3 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-secondary"
                  >
                    <ChevronLeft className="mr-2" size={16} />
                    Lección anterior
                  </Button>
                  
                  {/* Next Lesson Button - White */}
                  <Button 
                    onClick={handleNextLesson}
                    disabled={currentLessonIndex >= lessonsArray.length - 1}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-primary"
                  >
                    Próxima lección
                    <ChevronRight className="ml-2" size={16} />
                  </Button>
                </div>
              </section>
            )}
          </div>
        </main>

        {/* Right Sidebar - Course Info & Lessons - Hidden on mobile */}
        <aside className="hidden lg:block w-[560px] bg-background fixed right-0 top-0 h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {/* Save Course Button - Aligned with top navigation */}
          <div className="pl-6 pr-12 py-4 flex justify-end">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-[16px] bg-muted hover:bg-muted/80 mt-[6px] mb-[6px]">
              <BookOpen className="h-4 w-4 mr-1" />
              Guardar curso
            </Button>
          </div>
          
          <div className="pl-6 pr-12 pt-12 space-y-6">
            {/* Progress Card - Aligned with video */}
            <div className="bg-card rounded-lg p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="font-satoshi font-medium text-[14px] leading-[20px] text-foreground">Progreso del curso</span>
                <span className="font-satoshi font-normal text-[14px] leading-[20px] text-muted-foreground">
                  {isAuthenticated ? `${Math.round(progressPercentage)}% Completado` : "0% Completado"}
                </span>
              </div>
              <Progress value={isAuthenticated ? progressPercentage : 0} className="h-2 bg-muted" />
            </div>

            {/* Lesson Resources Card - Show only if current lesson has resources */}
            {currentLesson && (
              <LessonResources lessonId={currentLesson.id} />
            )}

            {/* Lessons List Card - Separate card */}
            <div className="bg-card rounded-lg p-5">
              <h3 className="font-satoshi font-medium text-foreground mb-5 text-[20px]">Contenido del curso</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent pr-2">
                {modules.map((module: any) => {
                  const moduleIndex = lessonsArray.findIndex((l: any) => l.id === module.id);
                  const subLessons = subLessonsByParent[module.id] || [];
                  const isCollapsed = collapsedModules.has(module.id);
                  const hasSubLessons = subLessons.length > 0;

                  return (
                    <div key={module.id} className="space-y-1">
                      {/* Module Header */}
                      <div
                        className={cn(
                          "py-4 px-4 rounded-lg transition-colors",
                          isAuthenticated 
                            ? cn(
                                !hasSubLessons && "cursor-pointer",
                                moduleIndex === currentLessonIndex 
                                  ? "bg-muted text-foreground border border-border" 
                                  : "hover:bg-muted/50 hover:border hover:border-border text-muted-foreground"
                              )
                            : !hasSubLessons ? "cursor-pointer hover:bg-muted/30 text-muted-foreground" : "text-muted-foreground"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex items-start space-x-3 flex-1 cursor-pointer"
                            onClick={() => handleLessonClick(moduleIndex)}
                          >
                            <div className="w-6 h-6 rounded border flex items-center justify-center font-medium flex-shrink-0 bg-muted text-foreground border-border text-[14px]">
                              {!isAuthenticated ? (
                                <Lock size={10} className="text-muted-foreground" />
                              ) : isLessonCompleted(module.id) ? (
                                <Check size={10} />
                              ) : (
                                moduleIndex + 1
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-satoshi font-medium text-foreground text-[15px]">
                                {module.title}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!isAuthenticated ? (
                              <Lock size={14} className="text-muted-foreground mt-1" />
                            ) : moduleIndex === currentLessonIndex && !isLessonCompleted(module.id) && (
                              <div 
                                className="flex items-center border border-border rounded px-2 py-1 cursor-pointer hover:bg-muted/20 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkComplete(module.id);
                                }}
                              >
                                <Check size={12} className="mr-1.5 text-muted-foreground" />
                                <span className="text-muted-foreground font-satoshi text-[12px]">Marcar como completado</span>
                              </div>
                            )}
                            
                            {hasSubLessons && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleModuleCollapse(module.id);
                                }}
                                className="p-1 hover:bg-muted/30 rounded transition-colors"
                              >
                                <ChevronRight 
                                  size={16} 
                                  className={cn(
                                    "text-muted-foreground transition-transform",
                                    !isCollapsed && "rotate-90"
                                  )}
                                />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sub-lessons */}
                      {hasSubLessons && !isCollapsed && subLessons.map((subLesson: any) => {
                        const subIndex = lessonsArray.findIndex((l: any) => l.id === subLesson.id);
                        return (
                          <div
                            key={subLesson.id}
                            onClick={() => handleLessonClick(subIndex)}
                            className={cn(
                              "py-3 px-4 ml-6 rounded-lg transition-colors",
                              isAuthenticated 
                                ? cn(
                                    "cursor-pointer",
                                    subIndex === currentLessonIndex 
                                      ? "bg-muted text-foreground border border-border" 
                                      : "hover:bg-muted/50 hover:border hover:border-border text-muted-foreground"
                                  )
                                : "cursor-pointer hover:bg-muted/30 text-muted-foreground"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 rounded border flex items-center justify-center font-medium flex-shrink-0 bg-muted text-foreground border-border text-[12px]">
                                  {!isAuthenticated ? (
                                    <Lock size={8} className="text-muted-foreground" />
                                  ) : isLessonCompleted(subLesson.id) ? (
                                    <Check size={8} />
                                  ) : (
                                    subIndex + 1
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="font-satoshi font-normal text-foreground text-[14px]">
                                    {subLesson.title}
                                  </div>
                                </div>
                              </div>
                              {!isAuthenticated ? (
                                <Lock size={12} className="text-muted-foreground mt-1" />
                              ) : subIndex === currentLessonIndex && !isLessonCompleted(subLesson.id) && (
                                <div 
                                  className="flex items-center border border-border rounded px-2 py-1 ml-2 cursor-pointer hover:bg-muted/20 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkComplete(subLesson.id);
                                  }}
                                >
                                  <Check size={10} className="mr-1 text-muted-foreground" />
                                  <span className="text-muted-foreground font-satoshi text-[11px]">Marcar</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Final Exam Button - Only show when currently on last lesson (Desktop) */}
              {!isRoomContext && lessonsArray.length > 0 && currentLessonIndex >= lessonsArray.length - 1 && (
                <div className="mt-4">
                  <button 
                    className="w-full bg-white hover:bg-gray-100 text-black font-satoshi font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center text-[15px]"
                    data-testid="button-final-exam-desktop"
                    onClick={() => {
                      setIsExamModalOpen(true);
                      setCurrentQuestionIndex(0);
                      setSelectedAnswers({});
                    }}
                  >
                    🎓 Tomar el examen final
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>
        </div>
      </div>
      {/* Mobile Navigation */}
      <MobileNav />
      {/* Celebration Confetti */}
      {!isRoomContext && isExamCompleted && (
        <div className="fixed inset-0 pointer-events-none z-[60]">
          {/* Left side confetti */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            {[...Array(8)].map((_, i) => (
              <div
                key={`left-${i}`}
                className="absolute w-2 h-2 bg-yellow-400 animate-bounce"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  left: `${i * 10}px`,
                  top: `${Math.random() * 200 - 100}px`,
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            ))}
            {[...Array(8)].map((_, i) => (
              <div
                key={`left-blue-${i}`}
                className="absolute w-2 h-2 bg-blue-400 animate-bounce"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  left: `${i * 12}px`,
                  top: `${Math.random() * 200 - 100}px`,
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            ))}
          </div>
          
          {/* Right side confetti */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {[...Array(8)].map((_, i) => (
              <div
                key={`right-${i}`}
                className="absolute w-2 h-2 bg-purple-400 animate-bounce"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  right: `${i * 10}px`,
                  top: `${Math.random() * 200 - 100}px`,
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            ))}
            {[...Array(8)].map((_, i) => (
              <div
                key={`right-green-${i}`}
                className="absolute w-2 h-2 bg-green-400 animate-bounce"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  right: `${i * 12}px`,
                  top: `${Math.random() * 200 - 100}px`,
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            ))}
          </div>
        </div>
      )}
      {/* Exam Failed Modal */}
      {!isRoomContext && isExamFailed && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] rounded-lg p-8 max-w-md w-full mx-4 text-center relative">
            {/* Close Button */}
            <button 
              onClick={() => setIsExamFailed(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>

            {/* Trophy Icon */}
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="text-2xl">🏆</div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-white font-satoshi font-bold text-xl mb-4">
              Examen final
            </h2>

            {/* Failure Message */}
            <p className="text-red-400 font-satoshi mb-6">
              Obtuviste un {Math.round((examScore / examQuestions.length) * 100)} %. Necesitas al menos un 80 % para aprobar. Inténtalo de nuevo.
            </p>

            {/* Retry Button */}
            <button 
              onClick={() => {
                setIsExamFailed(false);
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
                setIsExamModalOpen(true);
              }}
              className="w-full bg-white text-black py-3 px-6 rounded-lg font-satoshi font-medium hover:bg-gray-100 transition-colors"
            >
              Intentar otra vez
            </button>
          </div>
        </div>
      )}
      {/* Course Completion Modal */}
      {!isRoomContext && isExamCompleted && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] rounded-lg p-8 max-w-md w-full mx-4 text-center relative">
            {/* Close Button */}
            <button 
              onClick={() => setIsExamCompleted(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>

            {/* Graduation Cap Icon */}
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="text-2xl">🎓</div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-white font-satoshi font-bold text-2xl mb-4">
              ¡Curso completado!
            </h2>

            {/* Score Message */}
            <p className="text-gray-300 font-satoshi mb-6">
              ¡Excelente trabajo! Obtuviste un {Math.round((examScore / examQuestions.length) * 100)}%.<br />
              Descarga tu certificado a continuación.
            </p>

            {/* Download Certificate Button */}
            <button 
              onClick={() => {
                if (!user || !course) return;
                
                const issueDate = new Date();
                const expiryDate = new Date();
                expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Expires in 1 year
                
                const certificateData = {
                  studentName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Estudiante',
                  courseName: (course as any)?.title || 'Curso de IA',
                  issueDate: formatCertificateDate(issueDate),
                  expiryDate: formatCertificateDate(expiryDate),
                  certificateId: generateCertificateId(),
                  score: Math.round((examScore / examQuestions.length) * 100)
                };
                
                generateCertificate(certificateData);
                
                toast({
                  title: "Certificado descargado",
                  description: "Tu certificado se ha generado correctamente",
                });
              }}
              className="w-full bg-white text-black py-3 px-6 rounded-lg font-satoshi font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              Descargar certificado
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
      {/* Final Exam Modal */}
      {!isRoomContext && isExamModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] rounded-lg p-8 max-w-2xl w-full mx-4 relative">
            {/* Close Button */}
            <button 
              onClick={() => setIsExamModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-satoshi font-bold text-xl flex items-center">
                🎓 Examen final
              </h2>
              <div className="text-gray-400 font-satoshi text-sm">
                {currentQuestionIndex + 1} / 20
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="text-gray-400 font-satoshi text-sm mb-2">Pregunta {currentQuestionIndex + 1}</div>
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-white h-1 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / examQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="mb-8">
              <h3 className="text-white font-satoshi font-medium text-lg mb-6">
                {examQuestions[currentQuestionIndex]?.question}
              </h3>
              
              {/* Answer Options */}
              <div className="space-y-3">
                {examQuestions[currentQuestionIndex]?.options.map((option, optionIndex) => (
                  <button
                    key={optionIndex}
                    onClick={() => {
                      setSelectedAnswers(prev => ({
                        ...prev,
                        [currentQuestionIndex]: optionIndex
                      }));
                      
                      // Auto-advance to next question after a short delay
                      setTimeout(() => {
                        if (currentQuestionIndex < examQuestions.length - 1) {
                          setCurrentQuestionIndex(prev => prev + 1);
                        } else {
                          // Finish exam automatically on last question
                          const score = Object.entries({
                            ...selectedAnswers,
                            [currentQuestionIndex]: optionIndex
                          }).reduce((acc, [questionIndex, answerIndex]) => {
                            return acc + (examQuestions[parseInt(questionIndex)]?.correctAnswer === answerIndex ? 1 : 0);
                          }, 0);
                          setTimeout(() => {
                            setExamScore(score);
                            const percentage = Math.round((score / examQuestions.length) * 100);
                            
                            if (percentage >= 80) {
                              setIsExamCompleted(true);
                            } else {
                              setIsExamFailed(true);
                            }
                            setIsExamModalOpen(false);
                          }, 300);
                        }
                      }, 300);
                    }}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border transition-all font-satoshi",
                      selectedAnswers[currentQuestionIndex] === optionIndex
                        ? "bg-white/10 border-white text-white"
                        : "bg-transparent border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-800/50"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Buttons - Only show "Atrás" */}
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-satoshi font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
              >
                Atrás
              </button>
              <button
                disabled
                className="px-6 py-3 bg-gray-600 text-gray-400 rounded-lg font-satoshi font-medium cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Lessons Sidebar */}
      {isMobileLessonsOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Background overlay - partial transparency to show content behind */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileLessonsOpen(false)}></div>
          {/* Sliding sidebar from right */}
          <div className="fixed right-0 top-0 h-full w-[85%] max-w-sm bg-[#171717] flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <h2 className="text-white font-bold text-lg">Lecciones</h2>
              </div>
              <button 
                onClick={() => setIsMobileLessonsOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Progress */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Progreso</span>
                <span className="text-gray-400 text-sm">{Math.round(progressPercentage)}% completado</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Course Title */}
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-bold text-lg">{(course as any)?.title}</h3>
            </div>

            {/* Lessons List */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2 p-4">
                {modules.map((module: any) => {
                  const moduleIndex = lessonsArray.findIndex((l: any) => l.id === module.id);
                  const subLessons = subLessonsByParent[module.id] || [];
                  const isCollapsed = collapsedModules.has(module.id);
                  const hasSubLessons = subLessons.length > 0;

                  return (
                    <div key={module.id} className="space-y-1">
                      {/* Module Header */}
                      <div
                        className={cn(
                          "p-4 rounded-lg transition-all",
                          moduleIndex === currentLessonIndex 
                            ? "bg-[#262626] border border-[#404040]" 
                            : "bg-transparent hover:bg-[#262626]/50"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex items-start space-x-3 flex-1 cursor-pointer"
                            onClick={() => {
                              handleLessonClick(moduleIndex);
                              setIsMobileLessonsOpen(false);
                            }}
                          >
                            <div className="w-8 h-8 rounded-lg border flex items-center justify-center font-medium flex-shrink-0 bg-gray-600 text-white border-gray-600 text-sm">
                              {isLessonCompleted(module.id) ? (
                                <Check size={16} className="text-green-400" />
                              ) : (
                                moduleIndex + 1
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-white font-medium text-base">
                                {module.title}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {moduleIndex === currentLessonIndex && !isLessonCompleted(module.id) && (
                              <div 
                                className="flex items-center border border-[#404040] rounded px-2 py-1 cursor-pointer hover:bg-[#404040]/20 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkComplete(module.id);
                                }}
                              >
                                <Check size={12} className="mr-1 text-gray-400" />
                                <span className="text-gray-400 font-satoshi text-[11px]">Marcar</span>
                              </div>
                            )}
                            
                            {hasSubLessons && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleModuleCollapse(module.id);
                                }}
                                className="p-1 hover:bg-[#404040]/30 rounded transition-colors"
                              >
                                <ChevronRight 
                                  size={18} 
                                  className={cn(
                                    "text-gray-400 transition-transform",
                                    !isCollapsed && "rotate-90"
                                  )}
                                />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sub-lessons */}
                      {hasSubLessons && !isCollapsed && subLessons.map((subLesson: any) => {
                        const subIndex = lessonsArray.findIndex((l: any) => l.id === subLesson.id);
                        return (
                          <div
                            key={subLesson.id}
                            onClick={() => {
                              handleLessonClick(subIndex);
                              setIsMobileLessonsOpen(false);
                            }}
                            className={cn(
                              "p-3 ml-6 rounded-lg cursor-pointer transition-all",
                              subIndex === currentLessonIndex 
                                ? "bg-[#262626] border border-[#404040]" 
                                : "bg-transparent hover:bg-[#262626]/50"
                            )}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-7 h-7 rounded-lg border flex items-center justify-center font-medium flex-shrink-0 bg-gray-600 text-white border-gray-600 text-xs">
                                {isLessonCompleted(subLesson.id) ? (
                                  <Check size={14} className="text-green-400" />
                                ) : (
                                  subIndex + 1
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="text-white font-normal text-sm mb-1">
                                  {subLesson.title}
                                </div>
                                {isLessonCompleted(subLesson.id) ? (
                                  <div className="flex items-center text-green-400 text-xs">
                                    <Check size={12} className="mr-1" />
                                    <span>Completado</span>
                                  </div>
                                ) : subIndex === currentLessonIndex && (
                                  <div 
                                    className="flex items-center border border-[#404040] rounded px-2 py-1 cursor-pointer hover:bg-[#404040]/20 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkComplete(subLesson.id);
                                    }}
                                  >
                                    <Check size={10} className="mr-1 text-gray-400" />
                                    <span className="text-gray-400 font-satoshi text-[10px]">Marcar</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Final Exam Button - Only show when currently on last lesson (Mobile) */}
                {!isRoomContext && lessonsArray.length > 0 && currentLessonIndex >= lessonsArray.length - 1 && (
                  <div className="p-4">
                    <button 
                      className="w-full bg-white hover:bg-gray-100 text-black font-satoshi font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center text-[15px]"
                      data-testid="button-final-exam-mobile"
                      onClick={() => {
                        setIsExamModalOpen(true);
                        setCurrentQuestionIndex(0);
                        setSelectedAnswers({});
                        setIsMobileLessonsOpen(false);
                      }}
                    >
                      🎓 Tomar el examen final
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}