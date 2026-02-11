import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLessonPosition } from "@/hooks/useLessonPosition";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LessonResources } from "@/components/lesson-resources";
import { LessonComments } from "@/components/LessonComments";
import { Award, Check, ChevronRight, ChevronLeft, Menu, Users, Bot, Code, Megaphone, Settings, DollarSign, Heart, Building, CheckSquare, Scale, BarChart, GraduationCap, PlayCircle, Clock, CheckCircle2, BookOpen, Play, Lock, MessageCirclePlus, Link as LinkIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
  const [location, setLocation] = useLocation();
  const isRoomContext = location.startsWith('/sala/'); // Detect if viewing from a room context
  const isAgentesIARoom = isRoomContext && roomSlug === 'agentes-ia'; // Only Agentes IA 2.0 room gets orange theme
  
  // Debug: Log room detection
  useEffect(() => {
    if (isRoomContext) {
      console.log('🏠 Room Context Detected:', { roomSlug, isAgentesIARoom, location });
    }
  }, [roomSlug, isAgentesIARoom, isRoomContext, location]);
  const backUrl = isRoomContext && roomSlug ? `/sala/${roomSlug}` : '/courses';
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [hasCheckedSavedPosition, setHasCheckedSavedPosition] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Right sidebar state - starts expanded on large screens, collapsed on smaller
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  // Tab state for lesson content/comments
  const [activeTab, setActiveTab] = useState<'content' | 'comments'>('content');
  // Ask question modal state
  const [askQuestionOpen, setAskQuestionOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const queryClient = useQueryClient();
  const { getSavedLessonPosition, saveLessonPosition } = useLessonPosition();

  // Fetch channels to find the correct one for the question
  const { data: channels } = useQuery({
    queryKey: ["/api/community/channels"],
    enabled: askQuestionOpen && !!roomSlug,
  });

  // Find the channel for the current room
  const questionChannel = useMemo(() => {
    if (!roomSlug || !channels) return null;
    const channelSlug = `dudas-${roomSlug}`;
    return (channels as any[])?.find((ch: any) => ch.slug === channelSlug);
  }, [roomSlug, channels]);

  // Handle question submission
  const handleSubmitQuestion = async () => {
    if (!questionText.trim() || !questionChannel) {
      toast({
        title: "Error",
        description: "Por favor escribe una pregunta y asegúrate de que el curso pertenezca a una sala.",
        variant: "destructive",
      });
      return;
    }

    if (!currentLesson) {
      toast({
        title: "Error",
        description: "No hay una lección seleccionada.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingQuestion(true);
    try {
      // Create post content with just the question text (clean and focused)
      const postContent = questionText.trim();

      // Create post in community channel with lesson reference in metadata
      const postData: any = {
        title: "",
        content: postContent,
      };

      // Add lesson reference to metadata if available
      if (currentLesson) {
        postData.metadata = {
          lessonId: currentLesson.id,
          courseId: courseId,
          lessonTitle: currentLesson.title,
        };
      }

      const communityResponse = await apiRequest('POST', `/api/community/channels/${questionChannel.id}/posts`, postData);

      if (!communityResponse.ok) {
        throw new Error("Error al publicar la pregunta en la comunidad");
      }

      toast({
        title: "¡Pregunta publicada!",
        description: `Tu pregunta se ha publicado en ${questionChannel.name}`,
      });
      setAskQuestionOpen(false);
      setQuestionText("");
      // Optionally redirect to community
      // window.location.href = `/community?channel=${questionChannel.slug}`;
    } catch (error: any) {
      console.error("Error submitting question:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo publicar la pregunta. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  // Initialize right sidebar based on screen width
  useEffect(() => {
    const handleResize = () => {
      // Auto-collapse on screens smaller than 1440px
      if (window.innerWidth < 1440) {
        setRightSidebarOpen(false);
      } else {
        setRightSidebarOpen(true);
      }
    };
    
    // Check on mount
    handleResize();
    
    // Listen for resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  // Initialize with all modules collapsed except the first one
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

  // Extract the actual course ID (in case id is a slug)
  const courseId: string = (course && typeof course === 'object' && 'id' in course && typeof (course as any).id === 'string') 
    ? (course as any).id 
    : id;

  // Get next course in room if in room context
  const { data: nextCourse } = useQuery<{ courseId: string; slug?: string; title: string; coverImageUrl: string | null } | null>({
    queryKey: [`/api/rooms/${roomSlug}/next-course/${courseId}`],
    enabled: !!roomSlug && !!courseId && isRoomContext,
  });

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}/lessons`],
    enabled: !!courseId, // Use actual course ID, not slug
  });

  const { data: completedLessons = [] } = useQuery<string[]>({
    queryKey: [`/api/courses/${courseId}/progress`],
    enabled: isAuthenticated && !!courseId, // Use actual course ID, not slug
  });

  // Check if course is saved/bookmarked
  const { data: savedCourses } = useQuery({
    queryKey: ['/api/users/saved-courses'],
    enabled: isAuthenticated,
    retry: false,
  });
  
  const isSaved = Array.isArray(savedCourses) && savedCourses.some(
    (savedCourse: any) => savedCourse.courseId === courseId
  );
  
  // Save/unsave course mutation
  const saveCourseMutation = useMutation({
    mutationFn: async () => {
      const method = isSaved ? 'DELETE' : 'POST';
      const url = isSaved 
        ? `/api/users/saved-courses/${id}`
        : '/api/users/saved-courses';
      
      if (method === 'POST') {
        return await apiRequest('POST', url, { 
          courseId: courseId,
          roomSlug: roomSlug || null, // Include room context if available
        });
      } else {
        return await apiRequest('DELETE', url);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/saved-courses'] });
      toast({
        title: isSaved ? "Curso removido" : "Curso guardado",
        description: isSaved 
          ? "El curso fue removido de tus favoritos" 
          : "El curso fue guardado en tus favoritos",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo guardar el curso",
        variant: "destructive",
      });
    },
  });

  // Ensure lessons is always an array
  const lessonsArray = Array.isArray(lessons) ? lessons : [];

  // Organize lessons into hierarchical structure (modules + sub-lessons)
  // Memoize to prevent re-renders from changing object identity
  const modules = useMemo(() => {
    return lessonsArray.filter((lesson: any) => !lesson.parentLessonId)
      .sort((a: any, b: any) => a.order - b.order);
  }, [lessonsArray]);
  
  const subLessonsByParent = useMemo(() => {
    const grouped = lessonsArray
      .filter((lesson: any) => lesson.parentLessonId)
      .reduce((acc: any, lesson: any) => {
        if (!acc[lesson.parentLessonId]) {
          acc[lesson.parentLessonId] = [];
        }
        acc[lesson.parentLessonId].push(lesson);
        return acc;
      }, {});
    
    // Sort sub-lessons within each parent
    Object.keys(grouped).forEach(parentId => {
      grouped[parentId].sort((a: any, b: any) => a.order - b.order);
    });
    
    return grouped;
  }, [lessonsArray]);

  // Detect if course should show as numbered list (no modules structure)
  // This happens when:
  // 1. All lessons are direct (no parentLessonId) and none have sublessons
  // 2. All lessons are orphaned sublessons (parent doesn't exist)
  // 3. Mix of direct lessons and orphaned sublessons
  const hasNoModulesButHasLessons = useMemo(() => {
    // Check if there are any lessons at all
    if (lessonsArray.length === 0) {
      return false;
    }
    
    // Check if there are orphaned sublessons (sublessons whose parent doesn't exist)
    const moduleIds = new Set(modules.map((m: any) => m.id));
    const orphanedSubLessons = lessonsArray.filter((lesson: any) => 
      lesson.parentLessonId && !moduleIds.has(lesson.parentLessonId)
    );
    
    // Check if there are direct lessons (no parent)
    const directLessons = lessonsArray.filter((lesson: any) => !lesson.parentLessonId);
    
    // Check if any direct lessons have sublessons (if so, they're modules)
    const directLessonsWithSubLessons = directLessons.filter((lesson: any) => 
      subLessonsByParent[lesson.id] && subLessonsByParent[lesson.id].length > 0
    );
    
    // If all direct lessons have sublessons, they are modules - use normal view
    if (directLessons.length > 0 && directLessons.length === directLessonsWithSubLessons.length && orphanedSubLessons.length === 0) {
      return false;
    }
    
    // Show as numbered list if:
    // - All lessons are direct and none have sublessons (simple list)
    // - There are orphaned sublessons (parent module doesn't exist)
    // - Mix of direct lessons without sublessons and orphaned sublessons
    const shouldShow = orphanedSubLessons.length > 0 || 
                      (directLessons.length > 0 && directLessonsWithSubLessons.length === 0);
    
    return shouldShow;
  }, [modules, lessonsArray, subLessonsByParent]);

  // Get lessons to display as numbered list (when no modules)
  const directLessonsForList = useMemo(() => {
    if (!hasNoModulesButHasLessons) {
      return [];
    }
    
    // Get all lessons that should be shown (direct lessons + orphaned sublessons)
    const moduleIds = new Set(modules.map((m: any) => m.id));
    const lessonsToShow = lessonsArray.filter((lesson: any) => {
      // Include direct lessons (no parent) or orphaned sublessons (parent doesn't exist in modules)
      return !lesson.parentLessonId || !moduleIds.has(lesson.parentLessonId);
    });
    
    // Sort by order
    return lessonsToShow.sort((a: any, b: any) => a.order - b.order);
  }, [hasNoModulesButHasLessons, modules, lessonsArray]);
  
  // Calculate progress per module for room context timeline
  const moduleProgress = useMemo(() => {
    const progress: Record<number, { total: number; completed: number; percentage: number }> = {};
    
    modules.forEach((module: any) => {
      const subLessons = subLessonsByParent[module.id] || [];
      const playableLessons = subLessons.length > 0 ? subLessons : [module];
      const total = playableLessons.length;
      const completed = playableLessons.filter((lesson: any) => 
        completedLessons.includes(lesson.id)
      ).length;
      
      progress[module.id] = {
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });
    
    console.log('🔄 Module Progress Recalculated:', {
      completedLessonsCount: completedLessons.length,
      completedLessons,
      progress
    });
    
    return progress;
  }, [modules, subLessonsByParent, completedLessons]);

  // Reset saved position check when course ID changes
  useEffect(() => {
    setHasCheckedSavedPosition(false);
    setCurrentLessonIndex(0);
  }, [id]);

  // Get indices of only navigable lessons (leaf lessons) in lessonsArray
  const navigableLessonIndices = useMemo(() => {
    const indices = lessonsArray
      .map((lesson: any, index: number) => {
        // Include if it's a sub-lesson OR a module without sub-lessons
        const isNavigable = lesson.parentLessonId || !subLessonsByParent[lesson.id]?.length;
        return isNavigable ? index : -1;
      })
      .filter((index: number) => index !== -1);
    
    console.log('📊 Navigable Indices Updated:', {
      totalLessons: lessonsArray.length,
      navigableCount: indices.length,
      indices,
      lessonTitles: indices.map(idx => lessonsArray[idx]?.title)
    });
    
    return indices;
  }, [lessonsArray, subLessonsByParent]);

  // Get the first navigable lesson index (for non-authenticated users)
  const firstNavigableLessonIndex = navigableLessonIndices.length > 0 ? navigableLessonIndices[0] : -1;
  
  // Check if a lesson is the first navigable lesson (accessible for non-authenticated users)
  const isFirstNavigableLesson = (lessonIndex: number) => {
    return lessonIndex === firstNavigableLessonIndex;
  };
  
  // Check if a lesson is accessible for non-authenticated users
  const isLessonAccessible = (lessonIndex: number) => {
    if (isAuthenticated) return true;
    return isFirstNavigableLesson(lessonIndex);
  };
  
  // Initialize collapsed modules - only keep first module open
  useEffect(() => {
    if (modules.length > 0 && collapsedModules.size === 0) {
      // Collapse all modules except the first one
      const modulesToCollapse = modules.slice(1).map((m: any) => m.id);
      setCollapsedModules(new Set(modulesToCollapse));
    }
  }, [modules.length]); // Only run when modules are first loaded

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
      
      // No saved lesson found - find first playable lesson (first sub-lesson or first module without children)
      // For non-authenticated users, always use the first navigable lesson
      if (!isAuthenticated && firstNavigableLessonIndex !== -1) {
        setCurrentLessonIndex(firstNavigableLessonIndex);
        setHasCheckedSavedPosition(true);
        return;
      }
      
      const firstModule = modules[0];
      if (firstModule) {
        const firstModuleSubLessons = subLessonsByParent[firstModule.id];
        if (firstModuleSubLessons && firstModuleSubLessons.length > 0) {
          // If first module has sub-lessons, select the first sub-lesson
          const firstSubLessonIndex = lessonsArray.findIndex((l: any) => l.id === firstModuleSubLessons[0].id);
          if (firstSubLessonIndex !== -1) {
            setCurrentLessonIndex(firstSubLessonIndex);
          }
        }
        // If first module has no sub-lessons, default behavior (index 0) is already correct
      }
      
      // console.log('✅ Setting hasCheckedSavedPosition to true');
      setHasCheckedSavedPosition(true);
    }
  }, [id, lessonsArray, hasCheckedSavedPosition, getSavedLessonPosition, setLocation, modules, subLessonsByParent, isAuthenticated, firstNavigableLessonIndex]);

  const markLessonCompleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      return await apiRequest('POST', `/api/lessons/${lessonId}/complete`);
    },
    onMutate: async (lessonId: string) => {
      // Optimistically update the completed lessons list
      await queryClient.cancelQueries({ queryKey: [`/api/courses/${courseId}/progress`] });
      const previousCompletedLessons = queryClient.getQueryData<string[]>([`/api/courses/${courseId}/progress`]);
      queryClient.setQueryData<string[]>([`/api/courses/${courseId}/progress`], (old = []) => {
        if (!old.includes(lessonId)) {
          return [...old, lessonId];
        }
        return old;
      });
      return { previousCompletedLessons };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/progress`] });
      // Also invalidate room progress if in room context
      if (roomSlug && isRoomContext) {
        queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomSlug}/user-progress`] });
      }
      toast({
        title: "Lección completada",
        description: "Has marcado la lección como completada exitosamente.",
      });
    },
    onError: (error: any, lessonId: string, context: any) => {
      // Rollback optimistic update on error
      if (context?.previousCompletedLessons) {
        queryClient.setQueryData([`/api/courses/${courseId}/progress`], context.previousCompletedLessons);
      }
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

  const unmarkLessonCompleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      return await apiRequest('DELETE', `/api/lessons/${lessonId}/complete`);
    },
    onMutate: async (lessonId: string) => {
      // Optimistically update the completed lessons list
      await queryClient.cancelQueries({ queryKey: [`/api/courses/${courseId}/progress`] });
      const previousCompletedLessons = queryClient.getQueryData<string[]>([`/api/courses/${courseId}/progress`]);
      queryClient.setQueryData<string[]>([`/api/courses/${courseId}/progress`], (old = []) => {
        return old.filter(id => id !== lessonId);
      });
      return { previousCompletedLessons };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/progress`] });
      // Also invalidate room progress if in room context
      if (roomSlug && isRoomContext) {
        queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomSlug}/user-progress`] });
      }
      toast({
        title: "Lección desmarcada",
        description: "Has desmarcado la lección como completada.",
      });
    },
    onError: (error: any, lessonId: string, context: any) => {
      // Rollback optimistic update on error
      if (context?.previousCompletedLessons) {
        queryClient.setQueryData([`/api/courses/${courseId}/progress`], context.previousCompletedLessons);
      }
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
        description: "No se pudo desmarcar la lección. Inténtalo de nuevo.",
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
        <Sidebar />
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
        <Sidebar />
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
    // Block navigation to non-accessible lessons for non-authenticated users
    if (!isLessonAccessible(lessonIndex)) {
      toast({
        title: "Acceso restringido",
        description: "Necesitas suscribirte para acceder a esta lección.",
        variant: "destructive",
      });
      return;
    }
    setCurrentLessonIndex(lessonIndex);
    // Guardar la posición de la nueva lección
    const lesson = lessonsArray[lessonIndex];
    if (lesson && courseId) {
      saveLessonPosition(courseId, lesson.id, (course as any)?.type, roomSlug);
    }
  };

  const handlePreviousLesson = () => {
    // Find current position in navigable lessons
    const currentPositionInNavigable = navigableLessonIndices.indexOf(currentLessonIndex);
    
    console.log('⬅️ Previous Lesson Clicked:', {
      currentLessonIndex,
      currentLesson: lessonsArray[currentLessonIndex]?.title,
      currentPositionInNavigable,
      navigableLessonIndices,
      canGoPrevious: currentPositionInNavigable > 0
    });
    
    if (currentPositionInNavigable === -1) {
      // Current lesson is not navigable (probably a module header)
      // Find the previous navigable lesson before currentLessonIndex
      const prevNavigable = [...navigableLessonIndices].reverse().find(idx => idx < currentLessonIndex);
      if (prevNavigable !== undefined) {
        console.log('✅ Jumping to previous navigable:', prevNavigable, lessonsArray[prevNavigable]?.title);
        setCurrentLessonIndex(prevNavigable);
        const lesson = lessonsArray[prevNavigable];
        if (lesson && id) {
          saveLessonPosition(courseId, lesson.id, (course as any)?.type, roomSlug);
        }
      } else {
        console.log('❌ No previous navigable lesson found');
      }
    } else if (currentPositionInNavigable > 0) {
      // Go to previous navigable lesson
      const newIndex = navigableLessonIndices[currentPositionInNavigable - 1];
      console.log('✅ Going to previous navigable:', newIndex, lessonsArray[newIndex]?.title);
      setCurrentLessonIndex(newIndex);
      // Guardar la posición de la nueva lección
      const lesson = lessonsArray[newIndex];
      if (lesson && id) {
        saveLessonPosition(courseId, lesson.id, (course as any)?.type, roomSlug);
      }
    } else {
      console.log('❌ Already at first lesson');
    }
  };

  const handleNextLesson = () => {
    // Find current position in navigable lessons
    const currentPositionInNavigable = navigableLessonIndices.indexOf(currentLessonIndex);
    
    console.log('➡️ Next Lesson Clicked:', {
      currentLessonIndex,
      currentLesson: lessonsArray[currentLessonIndex]?.title,
      currentPositionInNavigable,
      navigableLessonIndices,
      totalNavigable: navigableLessonIndices.length,
      canGoNext: currentPositionInNavigable < navigableLessonIndices.length - 1
    });
    
    if (currentPositionInNavigable === -1) {
      // Current lesson is not navigable (probably a module header)
      // Find the next navigable lesson after currentLessonIndex
      const nextNavigable = navigableLessonIndices.find(idx => idx > currentLessonIndex);
      if (nextNavigable !== undefined) {
        console.log('✅ Jumping to next navigable:', nextNavigable, lessonsArray[nextNavigable]?.title);
        setCurrentLessonIndex(nextNavigable);
        const lesson = lessonsArray[nextNavigable];
        if (lesson && id) {
          saveLessonPosition(courseId, lesson.id, (course as any)?.type, roomSlug);
        }
      } else {
        console.log('❌ No next navigable lesson found');
      }
    } else if (currentPositionInNavigable < navigableLessonIndices.length - 1) {
      // Go to next navigable lesson
      const newIndex = navigableLessonIndices[currentPositionInNavigable + 1];
      console.log('✅ Going to next navigable:', newIndex, lessonsArray[newIndex]?.title);
      setCurrentLessonIndex(newIndex);
      // Guardar la posición de la nueva lección
      const lesson = lessonsArray[newIndex];
      if (lesson && id) {
        saveLessonPosition(courseId, lesson.id, (course as any)?.type, roomSlug);
      }
    } else {
      console.log('❌ Already at last lesson');
    }
  };

  const isLessonCompleted = (lessonId: string) => completedLessons.includes(lessonId);

  const handleMarkComplete = (lessonId: string) => {
    markLessonCompleteMutation.mutate(lessonId);
  };

  const handleToggleComplete = (lessonId: string) => {
    // Toggle completion status
    if (isLessonCompleted(lessonId)) {
      // Uncomplete the lesson
      unmarkLessonCompleteMutation.mutate(lessonId);
    } else {
      // Complete the lesson
      markLessonCompleteMutation.mutate(lessonId);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <MobileHeader />
      <div className="flex relative">
        {/* Sidebar - Hidden on mobile, with toggle on desktop */}
        {sidebarOpen && (
          <div className="hidden lg:block">
            <Sidebar onToggle={() => setSidebarOpen(false)} />
          </div>
        )}
        
        {/* Reopen Button - Only visible when sidebar is closed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="hidden lg:flex fixed top-4 left-4 z-50 items-center justify-center w-10 h-10 bg-card hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg shadow-lg transition-all"
            title="Mostrar sidebar"
            data-testid="sidebar-reopen-button"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        
      <div className={cn(
        "flex-1 flex bg-background h-screen overflow-y-auto hide-scrollbar transition-all duration-300",
        sidebarOpen ? "lg:ml-[250px]" : "lg:ml-0",
        rightSidebarOpen ? "lg:mr-[320px] xl:mr-[360px] 2xl:mr-[30vw]" : "lg:mr-0"
      )}>
        {/* Main Content - Center Column - Full width on mobile */}
        <main className="flex-1 w-full bg-background overflow-y-auto hide-scrollbar h-screen">
          {/* Top Navigation Bar */}
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
            <Link href={backUrl} className="flex-1 mt-[5px] mb-[5px]">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  isAgentesIARoom && "text-[#faa318] hover:text-[#faa318] hover:bg-black"
                )}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {isRoomContext ? 'Volver a la sala' : 'Volver a los cursos'}
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
            <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">{(course as any)?.title}</h1>
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
                {!isAuthenticated && !isFirstNavigableLesson(currentLessonIndex) ? (
                  // Blocked video/media for lessons after the first when not authenticated
                  (<>
                    {/* Media Area - Blocked for non-authenticated users (except first lesson) */}
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

                {/* Lesson Content with Tabs and Side-by-side Layout */}
                <div className="space-y-6 lg:space-y-8">
                  {/* Lesson Header with Title and Action Buttons */}
                  <div className="bg-card rounded-xl px-4 lg:px-8 py-4 lg:py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                      <div className="flex items-center flex-1">
                        <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg mr-2 lg:mr-3 flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#363636'}}>
                          <GraduationCap className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-foreground" />
                        </div>
                        <h2 className="text-base lg:text-lg font-bold text-foreground font-satoshi flex-1 text-[16px] lg:text-[18px]">
                          {currentLesson.title}
                        </h2>
                      </div>
                      {isAuthenticated && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleComplete(currentLesson.id)}
                            disabled={markLessonCompleteMutation.isPending || unmarkLessonCompleteMutation.isPending}
                            className={cn(
                              "h-8 px-3",
                              isLessonCompleted(currentLesson.id) && (isAgentesIARoom ? "bg-[#faa318] text-white border-[#faa318] hover:bg-[#faa318]/90" : "bg-primary text-white border-primary hover:bg-primary/90")
                            )}
                          >
                            <CheckCircle2 className={cn("h-4 w-4", isLessonCompleted(currentLesson.id) && "fill-current")} />
                            <span className="ml-2 hidden sm:inline">Concluir</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => saveCourseMutation.mutate()}
                            disabled={saveCourseMutation.isPending}
                            className={cn(
                              "h-8 px-3",
                              isSaved && (isAgentesIARoom ? "bg-[#faa318] text-white border-[#faa318] hover:bg-[#faa318]/90" : "bg-primary text-white border-primary hover:bg-primary/90")
                            )}
                          >
                            <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
                            <span className="ml-2 hidden sm:inline">Favoritos</span>
                          </Button>
                        </div>
                      )}
                    </div>
                    {currentLesson.description && (
                      <p className="text-muted-foreground text-sm lg:text-base mb-4">
                        {currentLesson.description}
                      </p>
                    )}

                    {/* Tabs - Mobile: Switch between content/comments, Desktop: Always visible */}
                    <div className="flex items-center gap-6 border-b border-border">
                      <button
                        onClick={() => setActiveTab('content')}
                        className={cn(
                          "pb-3 px-1 text-sm font-medium transition-colors border-b-2",
                          activeTab === 'content'
                            ? isAgentesIARoom 
                              ? "text-[#faa318] border-[#faa318]" 
                              : "text-primary border-primary"
                            : "text-muted-foreground border-transparent hover:text-foreground"
                        )}
                      >
                        Información
                      </button>
                      {isAuthenticated && (
                        <button
                          onClick={() => setActiveTab('comments')}
                          className={cn(
                            "pb-3 px-1 text-sm font-medium transition-colors border-b-2",
                            activeTab === 'comments'
                              ? isAgentesIARoom 
                                ? "text-[#faa318] border-[#faa318]" 
                                : "text-primary border-primary"
                              : "text-muted-foreground border-transparent hover:text-foreground"
                          )}
                        >
                          Comentários
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content Area - Shows only active tab content */}
                  <div>
                    {/* Informações Tab Content */}
                    {activeTab === 'content' && (
                      <div className="bg-card rounded-xl px-4 lg:px-8 py-4 lg:py-6 font-satoshi font-normal text-[13px] lg:text-[15px] leading-[20px] lg:leading-[24px] text-card-foreground">
                        {!isAuthenticated ? (
                          currentLessonIndex === 0 ? (
                            <div className="prose prose-sm lg:prose-base max-w-none">
                              {currentLesson.content && (
                                <div className={cn("markdown-content", isRoomContext && "room-context")}>
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
                          <div className="prose prose-sm lg:prose-base max-w-none">
                            {currentLesson.content && (
                              <div className={cn("markdown-content", isRoomContext && "room-context")}>
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
                    )}

                    {/* Comentários Tab Content */}
                    {activeTab === 'comments' && isAuthenticated && currentLesson && (
                      <div>
                        <LessonComments lessonId={currentLesson.id} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Lesson Resources Section - Mobile Only */}
                {currentLesson && (
                  <div className="lg:hidden mt-6">
                    <LessonResources lessonId={currentLesson.id} />
                  </div>
                )}

                {/* Mobile & Tablet Lesson Navigation */}
                <div className="lg:hidden mt-6">
                  <div className="space-y-3">
                    {/* Next Lesson Button - White */}
                    <button 
                      onClick={handleNextLesson}
                      disabled={currentLessonIndex >= lessonsArray.length - 1}
                      className={cn(
                        "w-full text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center",
                        isAgentesIARoom ? "bg-[#faa318] hover:bg-[#faa318]/90" : "bg-primary hover:bg-primary/90"
                      )}
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
                  
                  {/* Next Lesson Button - Orange */}
                  <Button 
                    onClick={handleNextLesson}
                    disabled={currentLessonIndex >= lessonsArray.length - 1}
                    className={cn(
                      "flex-1 text-white font-medium py-3 disabled:opacity-30 disabled:cursor-not-allowed",
                      isAgentesIARoom ? "bg-[#faa318] hover:bg-[#faa318]/90 disabled:hover:bg-[#faa318]" : "bg-primary hover:bg-primary/90 disabled:hover:bg-primary"
                    )}
                  >
                    Próxima lección
                    <ChevronRight className="ml-2" size={16} />
                  </Button>
                </div>
              </section>
            )}
          </div>
        </main>

        {/* Right Sidebar Toggle Button - Shows when sidebar is collapsed */}
        {!rightSidebarOpen && (
          <button
            onClick={() => setRightSidebarOpen(true)}
            className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-card hover:bg-muted border border-border rounded-l-lg p-2 transition-all duration-200 shadow-lg"
            title="Mostrar contenido del curso"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        )}

        {/* Right Sidebar - Course Info & Lessons - Hidden on mobile */}
        <aside className={cn(
          "hidden lg:block w-[320px] xl:w-[360px] 2xl:w-[30vw] bg-background fixed right-0 top-0 h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent transition-transform duration-300 ease-in-out z-40",
          rightSidebarOpen ? "translate-x-0" : "translate-x-full"
        )}>
          {/* Collapse Button */}
          <div className="pl-3 xl:pl-4 2xl:pl-6 pr-3 xl:pr-4 2xl:pr-8 py-4 flex items-center justify-between">
            <button
              onClick={() => setRightSidebarOpen(false)}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              title="Ocultar panel"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Action Buttons - Save Course & Ask Question - Aligned with video */}
          <div className="px-4 xl:px-5 2xl:px-6 min-[1920px]:px-8 pt-[88px] lg:pt-[70px] pb-2 space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-muted-foreground hover:text-foreground text-[13px] xl:text-[14px] 2xl:text-[16px] bg-muted hover:bg-muted/80 justify-start"
              onClick={() => saveCourseMutation.mutate()}
              disabled={saveCourseMutation.isPending}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Guardar curso
            </Button>
            {isAuthenticated && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-muted-foreground hover:text-foreground text-[13px] xl:text-[14px] 2xl:text-[16px] bg-muted hover:bg-muted/80 justify-start"
                onClick={() => setAskQuestionOpen(true)}
              >
                <MessageCirclePlus className="h-4 w-4 mr-2" />
                Haz una pregunta
              </Button>
            )}
          </div>
          
          <div className="px-4 xl:px-5 2xl:px-6 min-[1920px]:px-8 pt-2 space-y-2 xl:space-y-2.5 2xl:space-y-3 min-[1920px]:space-y-3.5 flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {/* Progress Card - Aligned with video */}
            <div className="bg-card rounded-lg p-4 xl:p-5 min-[1920px]:p-6">
              <div className="flex justify-between items-center mb-3">
                <span className="font-satoshi font-medium text-foreground text-sm xl:text-[15px] min-[1920px]:text-base">Progreso del curso</span>
                <span className="font-satoshi font-normal text-xs xl:text-sm min-[1920px]:text-[15px] leading-[20px] text-muted-foreground">
                  {isAuthenticated ? `${Math.round(progressPercentage)}% Completado` : "0% Completado"}
                </span>
              </div>
              <Progress value={isAuthenticated ? progressPercentage : 0} className={cn("h-2 min-[1920px]:h-2.5 bg-muted", isAgentesIARoom ? "[&>div]:bg-[#faa318]" : "[&>div]:bg-primary")} />
            </div>

            {/* Lesson Resources Card - Show only if current lesson has resources */}
            {currentLesson && (
              <div className="flex-shrink-0">
                <LessonResources lessonId={currentLesson.id} />
              </div>
            )}

            {/* Lessons List Card - Separate card */}
            <div className="bg-card rounded-lg p-4 xl:p-5 2xl:p-6 min-[1920px]:p-7 mt-0 mb-2 flex-1 flex flex-col min-h-0">
              <h3 className="font-satoshi font-medium text-foreground mb-4 text-[15px] xl:text-base 2xl:text-lg min-[1920px]:text-xl">Contenido del curso</h3>
              <div className="space-y-2 min-[1920px]:space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent pr-2">
                {hasNoModulesButHasLessons && directLessonsForList.length > 0 ? (
                  /* Numbered List View for courses without modules - Similar to image style */
                  <div className="relative pl-8">
                    {directLessonsForList.map((lesson: any, index: number) => {
                      const lessonIndex = lessonsArray.findIndex((l: any) => l.id === lesson.id);
                      const isCurrentLesson = lessonIndex === currentLessonIndex;
                      const isCompleted = isLessonCompleted(lesson.id);
                      const isLast = index === directLessonsForList.length - 1;
                      const lessonNumber = index + 1;

                      // Check if current lesson is completed to determine line style
                      // The line connects the current lesson to the next one, so it should be solid if current is completed
                      const currentLessonCompleted = isCompleted;

                      return (
                        <div key={`lesson-${lesson.id}-${currentLessonCompleted}`} className="relative flex items-start gap-4 pb-6">
                          {/* Vertical line connector - solid and colored if current lesson is completed */}
                          {!isLast && (
                            <div 
                              key={`line-${lesson.id}-${currentLessonCompleted ? 'solid' : 'dashed'}`}
                              className="absolute left-[15px] top-8 bottom-0 w-[2px] transition-all duration-300 z-0"
                              style={currentLessonCompleted ? {
                                // Solid colored line when current lesson is completed
                                backgroundColor: isAgentesIARoom ? '#faa318' : '#6366f1',
                                backgroundImage: 'none',
                                opacity: 1
                              } : {
                                // Dashed line when current lesson is not completed - ALWAYS GRAY
                                // Pattern: 6px line, 3px gap = 9px cycle (shows exactly 3 dashes: 6+3+6+3+6 = 24px)
                                backgroundImage: `repeating-linear-gradient(
                                  to bottom,
                                  #6b7280 0px,
                                  #6b7280 6px,
                                  transparent 6px,
                                  transparent 9px
                                )`,
                                backgroundColor: 'transparent',
                                opacity: 1
                              }}
                            />
                          )}
                          
                          {/* Circle with number or checkmark */}
                          <div className="relative z-10 flex-shrink-0">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                                isCompleted
                                  ? isAgentesIARoom 
                                    ? "bg-[#faa318] border-[#faa318]" 
                                    : "bg-primary border-primary"
                                  : isCurrentLesson && isAgentesIARoom
                                    ? "bg-transparent border-[#faa318]"
                                    : isCurrentLesson
                                    ? "bg-transparent border-primary"
                                    : "bg-transparent border-border/60",
                                isCurrentLesson && (isAgentesIARoom ? "ring-2 ring-[#faa318]/40" : "ring-2 ring-primary/40"),
                                isLessonAccessible(lessonIndex) && "cursor-pointer hover:scale-110"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isLessonAccessible(lessonIndex)) {
                                  handleToggleComplete(lesson.id);
                                }
                              }}
                            >
                              {isCompleted ? (
                                <Check size={16} className="text-white" />
                              ) : (
                                <span className={cn(
                                  "text-sm font-semibold leading-none",
                                  isCurrentLesson 
                                    ? isAgentesIARoom ? "text-[#faa318]" : "text-primary"
                                    : "text-muted-foreground"
                                )}>
                                  {lessonNumber}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Lesson content */}
                          <div 
                            className={cn(
                              "flex-1 min-w-0 pt-1",
                              isLessonAccessible(lessonIndex) && "cursor-pointer"
                            )}
                            onClick={() => isLessonAccessible(lessonIndex) && handleLessonClick(lessonIndex)}
                          >
                            <div className={cn(
                              "font-satoshi text-sm xl:text-[15px] min-[1920px]:text-base transition-colors",
                              isCurrentLesson
                                ? isAgentesIARoom ? "text-[#faa318] font-semibold" : "text-primary font-semibold"
                                : "text-foreground hover:text-primary"
                            )}>
                              {lesson.title}
                            </div>
                            
                            {/* Lock icon for non-authenticated users */}
                            {!isAuthenticated && !isFirstNavigableLesson(lessonIndex) && (
                              <div className="flex items-center gap-2 mt-1">
                                <Lock size={12} className="text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Bloqueado</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : isRoomContext ? (
                  /* Room Context Timeline Design */
                  (modules.map((module: any, moduleIdx: number) => {
                    const moduleIndex = lessonsArray.findIndex((l: any) => l.id === module.id);
                    const subLessons = subLessonsByParent[module.id] || [];
                    const isCollapsed = collapsedModules.has(module.id);
                    const hasSubLessons = subLessons.length > 0;
                    const progress = moduleProgress[module.id] || { total: 0, completed: 0, percentage: 0 };

                    return (
                      <div key={module.id} className="mb-4 border border-border/40 rounded-lg overflow-hidden">
                        {/* Module Header with Circle and Progress */}
                        <div 
                          className={cn(
                            "flex items-start gap-3 p-4 transition-colors cursor-pointer",
                            isCollapsed 
                              ? "bg-transparent hover:bg-border/10" 
                              : "bg-[#191919] border-b border-border/40"
                          )}
                          onClick={() => {
                            if (!hasSubLessons) {
                              if (isLessonAccessible(moduleIndex)) {
                                handleLessonClick(moduleIndex);
                              }
                            } else {
                              toggleModuleCollapse(module.id);
                            }
                          }}
                        >
                          <div className="h-3 w-3 rounded-full border border-primary/60 bg-transparent flex-shrink-0 mt-2" />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h4 className="font-satoshi font-medium text-foreground text-sm xl:text-[15px] min-[1920px]:text-base">
                                {module.title}
                              </h4>
                              <span className={cn("font-semibold text-sm min-[1920px]:text-[15px] ml-2 flex-shrink-0", isAgentesIARoom ? "text-[#faa318]" : "text-primary")}>
                                {progress.percentage}%
                              </span>
                            </div>
                          </div>
                          {hasSubLessons && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleModuleCollapse(module.id);
                              }}
                              className="p-1 hover:bg-muted/30 rounded transition-colors flex-shrink-0"
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
                        {/* Sub-lessons Timeline */}
                        {hasSubLessons && !isCollapsed && (
                          <div className="relative px-6 py-4 flex flex-col gap-4">
                            {subLessons.map((subLesson: any, subIdx: number) => {
                              const subIndex = lessonsArray.findIndex((l: any) => l.id === subLesson.id);
                              const isCurrentLesson = subIndex === currentLessonIndex;
                              const isCompleted = isLessonCompleted(subLesson.id);

                              return (
                                <div key={subLesson.id} className="relative">
                                  {/* Lesson Row */}
                                  <div
                                    className={cn(
                                      "group relative flex items-start gap-3 min-h-[32px] rounded-lg px-3 py-3 transition-all",
                                      isCurrentLesson 
                                        ? isAgentesIARoom ? "bg-[#2d2d2d] border-2 border-[#ffa018]" : "bg-muted border-2 border-primary" 
                                        : "bg-[#262626] border border-border/30 hover:bg-[#2d2d2d] hover:border-border/50"
                                    )}
                                  >
                                    {/* Circle Marker - Clickable to toggle completion */}
                                    <div 
                                      className={cn(
                                        "h-4 w-4 rounded-full border-2 flex-shrink-0 transition-all relative z-10 mt-0.5",
                                        isCompleted 
                                          ? isAgentesIARoom ? "bg-[#faa318] border-[#faa318]" : "bg-primary border-primary" 
                                          : "bg-transparent border-border",
                                        isCurrentLesson && (isAgentesIARoom ? "ring-2 ring-[#faa318]/40" : "ring-2 ring-primary/40"),
                                        !isLessonAccessible(subIndex) && "bg-muted border-muted",
                                        isLessonAccessible(subIndex) && "cursor-pointer hover:scale-110"
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isLessonAccessible(subIndex)) {
                                          handleToggleComplete(subLesson.id);
                                        }
                                      }}
                                    >
                                      {isCompleted && (
                                        <Check size={10} className="text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                      )}
                                    </div>
                                    
                                    {/* Lesson Text - Clickable to navigate */}
                                    <div 
                                      className={cn(
                                        "flex-1 min-w-0",
                                        isLessonAccessible(subIndex) && "cursor-pointer"
                                      )}
                                      onClick={() => isLessonAccessible(subIndex) && handleLessonClick(subIndex)}
                                    >
                                      <div className={cn("font-satoshi pr-2 transition-colors text-muted-foreground text-[15px]", isAgentesIARoom ? "hover:text-[#faa318]" : "hover:text-primary")}>
                                        {subLesson.title}
                                      </div>
                                    </div>
                                    
                                    {/* Lock Icon - Show for non-authenticated users except first lesson */}
                                    {!isAuthenticated && !isFirstNavigableLesson(subIndex) && (
                                      <Lock size={12} className="text-muted-foreground flex-shrink-0 mt-1" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }))
                ) : (
                  /* Original Design for Regular Courses */
                  (modules.map((module: any, moduleIdx: number) => {
                  const moduleIndex = lessonsArray.findIndex((l: any) => l.id === module.id);
                  const subLessons = subLessonsByParent[module.id] || [];
                  const isCollapsed = collapsedModules.has(module.id);
                  const hasSubLessons = subLessons.length > 0;
                  const moduleNumber = moduleIdx + 1;

                  return (
                    <div key={module.id} className="space-y-1">
                      {/* Module Header */}
                      <div
                        className={cn(
                          "group py-4 px-4 rounded-lg transition-colors cursor-pointer",
                          hasSubLessons 
                            ? "text-muted-foreground hover:bg-muted/30" 
                            : isAuthenticated 
                              ? cn(
                                  "text-muted-foreground",
                                  moduleIndex === currentLessonIndex 
                                    ? "bg-muted border border-border" 
                                    : "hover:bg-muted/50 hover:border hover:border-border"
                                )
                              : "hover:bg-muted/30 text-muted-foreground"
                        )}
                        onClick={() => {
                          if (!hasSubLessons) {
                            if (isLessonAccessible(moduleIndex)) {
                              handleLessonClick(moduleIndex);
                            }
                          } else {
                            toggleModuleCollapse(module.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex items-start space-x-3 flex-1"
                          >
                            <div className="w-6 h-6 rounded border flex items-center justify-center font-medium flex-shrink-0 bg-muted text-foreground border-border text-[14px]">
                              {!hasSubLessons && !isLessonAccessible(moduleIndex) ? (
                                <Lock size={10} className="text-muted-foreground" />
                              ) : !hasSubLessons && isLessonCompleted(module.id) ? (
                                <Check size={12} />
                              ) : (
                                moduleNumber
                              )}
                            </div>
                            <div className="flex-1">
                              <div className={cn(
                                "font-satoshi font-medium text-[15px]",
                                !hasSubLessons && moduleIndex === currentLessonIndex ? "text-foreground" : "text-foreground"
                              )}>
                                {module.title}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!hasSubLessons && !isLessonAccessible(moduleIndex) && (
                              <Lock size={14} className="text-muted-foreground mt-1" />
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
                      {hasSubLessons && !isCollapsed && subLessons.map((subLesson: any, subIdx: number) => {
                        const subIndex = lessonsArray.findIndex((l: any) => l.id === subLesson.id);
                        const subLessonNumber = `${moduleNumber}.${subIdx + 1}`;
                        const isCurrentLesson = subIndex === currentLessonIndex;
                        const isAccessible = isLessonAccessible(subIndex);
                        
                        return (
                          <div
                            key={subLesson.id}
                            onClick={() => isAccessible && handleLessonClick(subIndex)}
                            className={cn(
                              "group py-3 px-4 ml-6 rounded-lg transition-colors",
                              isAccessible 
                                ? cn(
                                    "cursor-pointer text-muted-foreground",
                                    isCurrentLesson 
                                      ? "bg-muted border border-border" 
                                      : "hover:bg-muted/50 hover:border hover:border-border"
                                  )
                                : "cursor-not-allowed hover:bg-muted/30 text-muted-foreground"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <div className="w-auto min-w-[28px] h-5 px-1.5 rounded border flex items-center justify-center font-medium flex-shrink-0 bg-muted text-foreground border-border text-[12px]">
                                  {!isAccessible ? (
                                    <Lock size={8} className="text-muted-foreground" />
                                  ) : isLessonCompleted(subLesson.id) ? (
                                    <Check size={8} />
                                  ) : (
                                    subLessonNumber
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className={cn(
                                    "font-satoshi font-normal text-[14px]",
                                    subIndex === currentLessonIndex ? "text-foreground" : "text-muted-foreground"
                                  )}>
                                    {subLesson.title}
                                  </div>
                                </div>
                              </div>
                              {!isAccessible && (
                                <Lock size={12} className="text-muted-foreground mt-1" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }))
                )}
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

              {/* Next Course Card - Desktop - Only show in room context when there is a next course */}
              {isRoomContext && nextCourse && (
                <Link href={`/sala/${roomSlug}/curso/${nextCourse.slug || nextCourse.courseId}`}>
                  <div className={cn("p-4 bg-[#1a1a1a] border rounded-lg cursor-pointer hover:bg-[#1a1a1a]/80 transition-all pt-[6px] pb-[6px] mt-[16px] mb-[16px]", isAgentesIARoom ? "border-[#faa318]" : "border-primary")}>
                    <div className="text-xs text-gray-400 mb-2 font-satoshi">Próximo contenido</div>
                    <div className="flex items-center gap-3">
                      {nextCourse.coverImageUrl && (
                        <img 
                          src={nextCourse.coverImageUrl} 
                          alt={nextCourse.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className={cn("font-satoshi text-[16px] font-bold", isAgentesIARoom ? "text-[#faa318]" : "text-primary")}>
                          {nextCourse.title}
                        </div>
                      </div>
                      <div className={isAgentesIARoom ? "text-[#faa318]" : "text-primary"}>
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                </Link>
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
          <div className="fixed right-0 top-0 h-full w-[85%] max-w-md bg-[#171717] flex flex-col animate-in slide-in-from-right duration-300">
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
                {isRoomContext ? (
                  /* Room Context Timeline Design (Mobile) */
                  (modules.map((module: any, moduleIdx: number) => {
                    const moduleIndex = lessonsArray.findIndex((l: any) => l.id === module.id);
                    const subLessons = subLessonsByParent[module.id] || [];
                    const isCollapsed = collapsedModules.has(module.id);
                    const hasSubLessons = subLessons.length > 0;
                    const progress = moduleProgress[module.id] || { total: 0, completed: 0, percentage: 0 };

                    return (
                      <div key={module.id} className="mb-4 border border-gray-700 rounded-lg overflow-hidden">
                        {/* Module Header with Circle and Progress */}
                        <div 
                          className="flex items-start gap-3 p-4 bg-black/40 border-b border-gray-700 cursor-pointer hover:bg-black/50 transition-colors"
                          onClick={() => {
                            if (!hasSubLessons) {
                              isAuthenticated && handleLessonClick(moduleIndex);
                              setIsMobileLessonsOpen(false);
                            } else {
                              toggleModuleCollapse(module.id);
                            }
                          }}
                        >
                          <div className="h-3 w-3 rounded-full border border-primary/60 bg-transparent flex-shrink-0 mt-2" />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h4 className="font-satoshi font-medium text-[15px] text-white">
                                {module.title}
                              </h4>
                              <span className={cn("font-semibold text-sm ml-2 flex-shrink-0", isAgentesIARoom ? "text-[#faa318]" : "text-primary")}>
                                {progress.percentage}%
                              </span>
                            </div>
                          </div>
                          {hasSubLessons && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleModuleCollapse(module.id);
                              }}
                              className="p-1 hover:bg-[#404040]/30 rounded transition-colors flex-shrink-0"
                            >
                              <ChevronRight 
                                size={16} 
                                className={cn(
                                  "text-gray-400 transition-transform",
                                  !isCollapsed && "rotate-90"
                                )}
                              />
                            </button>
                          )}
                        </div>

                        {/* Sub-lessons Timeline */}
                        {hasSubLessons && !isCollapsed && (
                          <div className="relative px-6 py-4 flex flex-col gap-3">
                            {subLessons.map((subLesson: any, subIdx: number) => {
                              const subIndex = lessonsArray.findIndex((l: any) => l.id === subLesson.id);
                              const isCurrentLesson = subIndex === currentLessonIndex;
                              const isCompleted = isLessonCompleted(subLesson.id);

                              return (
                                <div key={subLesson.id} className="relative">
                                  {/* Lesson Row */}
                                  <div
                                    className={cn(
                                      "group relative flex items-center gap-4 min-h-[32px] rounded-lg px-2 py-1 -mx-2 transition-all",
                                      isCurrentLesson 
                                        ? isAgentesIARoom ? "bg-[#2d2d2d] border-2 border-[#ffa018]" : "bg-muted border-2 border-primary" 
                                        : "hover:bg-gray-800/30"
                                    )}
                                  >
                                    {/* Circle Marker - Clickable to toggle completion */}
                                    <div 
                                      className={cn(
                                        "h-5 w-5 rounded-full border-[2.5px] flex-shrink-0 transition-all relative z-10",
                                        isCompleted 
                                          ? isAgentesIARoom ? "bg-[#faa318] border-[#faa318] shadow-lg shadow-[#faa318]/20" : "bg-primary border-primary shadow-lg shadow-primary/20" 
                                          : "bg-black border-gray-600",
                                        isCurrentLesson && (isAgentesIARoom ? "ring-2 ring-[#faa318]/40 ring-offset-2 ring-offset-black" : "ring-2 ring-primary/40 ring-offset-2 ring-offset-black"),
                                        "cursor-pointer hover:scale-110",
                                        isAgentesIARoom ? "hover:border-[#faa318]/60" : "hover:border-primary/60"
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleComplete(subLesson.id);
                                      }}
                                    >
                                      {isCompleted && (
                                        <Check size={12} className="text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                      )}
                                    </div>
                                    
                                    {/* Lesson Text - Clickable to navigate */}
                                    <div 
                                      className="flex-1 min-w-0 cursor-pointer"
                                      onClick={() => {
                                        handleLessonClick(subIndex);
                                        setIsMobileLessonsOpen(false);
                                      }}
                                    >
                                      <div className={cn(
                                        "font-satoshi text-[14px] pr-2 transition-colors hover:text-[#151515]",
                                        isCurrentLesson ? "text-[#151515] font-medium" : "text-gray-300"
                                      )}>
                                        {subLesson.title}
                                      </div>
                                    </div>
                                    
                                    {/* Mark Complete Button */}
                                    {!isCompleted && (
                                      <div 
                                        className="opacity-0 group-hover:opacity-100 flex items-center border border-gray-600 rounded px-2 py-0.5 cursor-pointer hover:bg-[#404040]/20 transition-all flex-shrink-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMarkComplete(subLesson.id);
                                        }}
                                      >
                                        <Check size={10} className="mr-1 text-gray-400" />
                                        <span className="text-gray-400 font-satoshi text-[11px]">Marcar</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }))
                ) : (
                  /* Original Design for Regular Courses (Mobile) */
                  (modules.map((module: any, moduleIdx: number) => {
                    const moduleIndex = lessonsArray.findIndex((l: any) => l.id === module.id);
                    const subLessons = subLessonsByParent[module.id] || [];
                    const isCollapsed = collapsedModules.has(module.id);
                    const hasSubLessons = subLessons.length > 0;
                    const moduleNumber = moduleIdx + 1;

                    return (
                      <div key={module.id} className="space-y-1">
                      {/* Module Header */}
                      <div
                        className={cn(
                          "group p-4 rounded-lg transition-all cursor-pointer",
                          hasSubLessons 
                            ? "bg-transparent hover:bg-[#262626]/30" 
                            : cn(
                                moduleIndex === currentLessonIndex 
                                  ? "bg-[#262626] border border-[#404040]" 
                                  : "bg-transparent hover:bg-[#262626]/50"
                              )
                        )}
                        onClick={() => {
                          if (!hasSubLessons) {
                            handleLessonClick(moduleIndex);
                            setIsMobileLessonsOpen(false);
                          } else {
                            toggleModuleCollapse(module.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex items-start space-x-3 flex-1"
                          >
                            <div className="w-8 h-8 rounded-lg border flex items-center justify-center font-medium flex-shrink-0 bg-gray-600 text-white border-gray-600 text-sm">
                              {moduleNumber}
                            </div>
                            <div className="flex-1">
                              <div className={cn(
                                "font-medium text-base",
                                !hasSubLessons && moduleIndex === currentLessonIndex ? "text-white" : "text-white"
                              )}>
                                {module.title}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!hasSubLessons && !isLessonCompleted(module.id) && (
                              <div 
                                className="opacity-0 group-hover:opacity-100 flex items-center border border-[#404040] rounded px-2 py-1 cursor-pointer hover:bg-[#404040]/20 transition-all"
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
                      {hasSubLessons && !isCollapsed && subLessons.map((subLesson: any, subIdx: number) => {
                        const subIndex = lessonsArray.findIndex((l: any) => l.id === subLesson.id);
                        const subLessonNumber = `${moduleNumber}.${subIdx + 1}`;
                        const isCurrentLesson = subIndex === currentLessonIndex;
                        
                        return (
                          <div
                            key={subLesson.id}
                            onClick={() => {
                              handleLessonClick(subIndex);
                              setIsMobileLessonsOpen(false);
                            }}
                            className={cn(
                              "group p-3 ml-6 rounded-lg cursor-pointer transition-all",
                              isCurrentLesson 
                                ? "bg-[#262626] border border-[#404040]" 
                                : "bg-transparent hover:bg-[#262626]/50"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <div className="w-auto min-w-[32px] h-7 px-1.5 rounded-lg border flex items-center justify-center font-medium flex-shrink-0 bg-gray-600 text-white border-gray-600 text-xs">
                                  {isLessonCompleted(subLesson.id) ? (
                                    <Check size={14} className="text-green-400" />
                                  ) : (
                                    subLessonNumber
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className={cn(
                                    "font-normal text-sm",
                                    subIndex === currentLessonIndex ? "text-white" : "text-gray-300"
                                  )}>
                                    {subLesson.title}
                                  </div>
                                </div>
                              </div>
                              {!isLessonCompleted(subLesson.id) && (
                                <div 
                                  className="opacity-0 group-hover:opacity-100 flex items-center border border-[#404040] rounded px-2 py-1 cursor-pointer hover:bg-[#404040]/20 transition-all ml-2"
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
                        );
                      })}
                    </div>
                  );
                }))
                )}

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

                {/* Next Course Card - Only show in room context when there is a next course */}
                {isRoomContext && nextCourse && (
                  <Link href={`/sala/${roomSlug}/curso/${nextCourse.slug || nextCourse.courseId}`}>
                    <div className={cn("mt-4 p-4 bg-[#1a1a1a] border rounded-lg cursor-pointer hover:bg-[#1a1a1a]/80 transition-all", isAgentesIARoom ? "border-[#faa318]" : "border-primary")}>
                      <div className="text-xs text-gray-400 mb-2 font-satoshi">Próximo contenido</div>
                      <div className="flex items-center gap-3">
                        {nextCourse.coverImageUrl && (
                          <img 
                            src={nextCourse.coverImageUrl} 
                            alt={nextCourse.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className={cn("font-medium text-sm font-satoshi", isAgentesIARoom ? "text-[#faa318]" : "text-primary")}>
                            {nextCourse.title}
                          </div>
                        </div>
                        <div className={isAgentesIARoom ? "text-[#faa318]" : "text-primary"}>
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ask Question Modal */}
      <Dialog open={askQuestionOpen} onOpenChange={setAskQuestionOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Haz una pregunta</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Escribe tu pregunta y se publicará en el canal de dudas correspondiente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Escribe tu pregunta aquí..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="min-h-[150px] resize-none"
            />
            
            {!questionChannel && roomSlug && askQuestionOpen && (
              <p className="text-sm text-muted-foreground">
                Buscando canal de dudas para esta sala...
              </p>
            )}
            
            {!roomSlug && (
              <p className="text-sm text-amber-500">
                Este curso no está asociado a una sala. Las preguntas solo están disponibles para cursos dentro de salas.
              </p>
            )}
            
            {questionChannel && (
              <p className="text-sm text-muted-foreground">
                Tu pregunta se publicará en: <span className="font-medium text-foreground">#{questionChannel.name}</span>
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAskQuestionOpen(false);
                setQuestionText("");
              }}
              disabled={isSubmittingQuestion}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitQuestion}
              disabled={!questionText.trim() || !questionChannel || isSubmittingQuestion}
              className={cn(
                isAgentesIARoom ? "bg-[#faa318] hover:bg-[#faa318]/90" : "bg-primary hover:bg-primary/90"
              )}
            >
              {isSubmittingQuestion ? "Publicando..." : questionChannel ? `Publicar en #${questionChannel.name}` : "Publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}