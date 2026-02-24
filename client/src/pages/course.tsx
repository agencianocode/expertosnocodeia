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
import { UnlockContentCTA } from "@/components/UnlockContentCTA";
import { Award, Check, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Menu, Users, Bot, Code, Megaphone, Settings, DollarSign, Heart, Building, CheckSquare, Scale, BarChart, GraduationCap, PlayCircle, Clock, CheckCircle2, BookOpen, Play, Lock, MessageCirclePlus, Link as LinkIcon, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
  const [showCourseInfo, setShowCourseInfo] = useState(true); // Show course info first if no saved position
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

  // Mobile Lessons Modal State
  const [isMobileLessonsOpen, setIsMobileLessonsOpen] = useState(false);
  
  // Collapsed modules state (stores module IDs that are collapsed)
  // Initialize with all modules collapsed except the first one
  const [collapsedModules, setCollapsedModules] = useState<Set<number>>(new Set());

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

  const progressQueryKey = `/api/courses/${courseId}/progress${roomSlug ? `?roomSlug=${encodeURIComponent(roomSlug)}` : ""}`;
  const { data: progressData } = useQuery<{ completedLessonIds: string[]; lastLessonId?: string }>({
    queryKey: [progressQueryKey],
    enabled: isAuthenticated && !!courseId,
  });
  const completedLessons = progressData?.completedLessonIds ?? [];

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

  // Verificar si hay una lección guardada (localStorage o backend) y redirigir automáticamente
  useEffect(() => {
    if (!course || !courseId || lessonsArray.length === 0 || hasCheckedSavedPosition) {
      return;
    }
    const savedLessonId = getSavedLessonPosition(courseId);
    if (savedLessonId) {
      const savedLessonIndex = lessonsArray.findIndex((lesson: any) => lesson.id === savedLessonId);
      if (savedLessonIndex !== -1) {
        setCurrentLessonIndex(savedLessonIndex);
        // Solo saltar la introducción si la posición guardada NO es la primera lección (así siempre se ve la intro al entrar)
        const isFirstLesson = savedLessonIndex === firstNavigableLessonIndex || savedLessonIndex === 0;
        setShowCourseInfo(!!isFirstLesson);
        setHasCheckedSavedPosition(true);
        return;
      }
    }
    // Si no hay en localStorage pero el usuario está autenticado, esperar progreso del backend (lastLessonId)
    if (isAuthenticated && progressData === undefined) {
      return; // No marcar como comprobado hasta tener progreso para poder usar lastLessonId
    }
    if (isAuthenticated && progressData?.lastLessonId) {
      const lastIndex = lessonsArray.findIndex((lesson: any) => lesson.id === progressData.lastLessonId);
      if (lastIndex !== -1) {
        setCurrentLessonIndex(lastIndex);
        const isFirstLesson = lastIndex === firstNavigableLessonIndex || lastIndex === 0;
        setShowCourseInfo(!!isFirstLesson);
        setHasCheckedSavedPosition(true);
        return;
      }
    }
    // Siempre mostrar la sección de introducción al entrar al curso (con o sin sala)
    if (isRoomContext) {
      if (!isAuthenticated && firstNavigableLessonIndex !== -1) {
        setCurrentLessonIndex(firstNavigableLessonIndex);
      } else {
        const firstModule = modules[0];
        if (firstModule) {
          const firstModuleSubLessons = subLessonsByParent[firstModule.id];
          if (firstModuleSubLessons && firstModuleSubLessons.length > 0) {
            const firstSubLessonIndex = lessonsArray.findIndex((l: any) => l.id === firstModuleSubLessons[0].id);
            if (firstSubLessonIndex !== -1) {
              setCurrentLessonIndex(firstSubLessonIndex);
            }
          }
        }
      }
    }
    setShowCourseInfo(true);
    setHasCheckedSavedPosition(true);
  }, [course, courseId, lessonsArray, hasCheckedSavedPosition, getSavedLessonPosition, isAuthenticated, isRoomContext, firstNavigableLessonIndex, modules, subLessonsByParent, progressData]);

  const markLessonCompleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      return await apiRequest('POST', `/api/lessons/${lessonId}/complete`);
    },
    onMutate: async (lessonId: string) => {
      await queryClient.cancelQueries({ queryKey: [progressQueryKey] });
      const previous = queryClient.getQueryData<{ completedLessonIds: string[]; lastLessonId?: string }>([progressQueryKey]);
      queryClient.setQueryData([progressQueryKey], (old: { completedLessonIds: string[]; lastLessonId?: string } | undefined) => {
        const list = old?.completedLessonIds ?? [];
        if (list.includes(lessonId)) return old ?? { completedLessonIds: list };
        return { ...old, completedLessonIds: [...list, lessonId], lastLessonId: old?.lastLessonId };
      });
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [progressQueryKey] });
      // Also invalidate room progress if in room context
      if (roomSlug && isRoomContext) {
        queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomSlug}/user-progress`] });
      }
      toast({
        title: "Lección completada",
        description: "Has marcado la lección como completada exitosamente.",
      });
    },
    onError: (error: any, _lessonId: string, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData([progressQueryKey], context.previous);
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
      await queryClient.cancelQueries({ queryKey: [progressQueryKey] });
      const previous = queryClient.getQueryData<{ completedLessonIds: string[]; lastLessonId?: string }>([progressQueryKey]);
      queryClient.setQueryData([progressQueryKey], (old: { completedLessonIds: string[]; lastLessonId?: string } | undefined) => {
        const list = old?.completedLessonIds ?? [];
        return { ...old, completedLessonIds: list.filter(id => id !== lessonId), lastLessonId: old?.lastLessonId };
      });
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [progressQueryKey] });
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
      if (context?.previous) {
        queryClient.setQueryData([progressQueryKey], context.previous);
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

  const resetProgressMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/courses/${courseId}/progress${roomSlug ? `?roomSlug=${encodeURIComponent(roomSlug)}` : ""}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [progressQueryKey] });
      if (roomSlug && isRoomContext) {
        queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomSlug}/user-progress`] });
      }
      setIsMobileLessonsOpen(false);
      toast({ title: "Progreso restablecido", description: "El progreso del curso se ha reiniciado." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo restablecer el progreso.", variant: "destructive" });
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

  const getDifficultyLabel = (difficulty?: string) => {
    if (difficulty === "beginner") return "Principiante";
    if (difficulty === "intermediate") return "Intermedio";
    if (difficulty === "advanced") return "Avanzado";
    return difficulty || "Nivel";
  };

  const getDifficultyColors = (difficulty?: string) => {
    if (difficulty === "beginner") return "bg-green-500/15 text-green-400 border-green-500/30";
    if (difficulty === "intermediate") return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    if (difficulty === "advanced") return "bg-red-500/15 text-red-400 border-red-500/30";
    return "bg-muted text-muted-foreground border-border";
  };

  const formatCourseDate = (dateString: string | undefined) => {
    if (!dateString) return "Fecha no disponible";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatEstimatedTime = (hours: number | undefined) => {
    if (hours == null || hours === 0) return "—";
    if (hours === 1) return "1 hora";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h} horas`;
    return `${h} ${h === 1 ? "hora" : "horas"} y ${m} minutos`;
  };

  if (authLoading || courseLoading || lessonsLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-64 bg-card border-r border-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex">
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
      <div className="min-h-screen bg-background flex">
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

  // Parse metadata to get FAQs
  const parseMetadata = (raw: any): Record<string, any> => {
    if (!raw) return {};
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return raw;
  };

  const courseMetadata = parseMetadata((course as any)?.metadata);
  const courseFaqs = courseMetadata?.faqs || [];
  const presentationVideoUrl = courseMetadata?.presentationVideoUrl || "";

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
        sidebarOpen ? "lg:ml-[250px]" : "lg:ml-0"
      )}>
        {/* Main Content - Center Column - Full width on mobile */}
        <main className="flex-1 w-full bg-background overflow-y-auto hide-scrollbar h-screen">
          {/* Contenedor igual que en guías: max-w-[1200px] centrado */}
          <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6 lg:py-8 pb-24 lg:pb-8">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between mb-4">
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

            {/* Card superior informativa (igual que en guías) */}
            <div className="bg-background rounded-xl p-5 lg:p-8 border border-border mb-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary" className="text-[14px] uppercase">
                  Curso
                </Badge>
                {(course as any)?.difficulty && (
                  <Badge className={cn("text-[14px] uppercase border", getDifficultyColors((course as any).difficulty))}>
                    {getDifficultyLabel((course as any).difficulty)}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground mb-3">
                {(course as any)?.title}
              </h1>
              {courseData.introduction && (
                <p className="text-muted-foreground text-sm lg:text-base leading-relaxed mb-4 line-clamp-3">
                  {typeof courseData.introduction === "string" && courseData.introduction.length > 320
                    ? courseData.introduction.replace(/<[^>]+>/g, "").slice(0, 320).trim() + "…"
                    : typeof courseData.introduction === "string"
                      ? courseData.introduction.replace(/<[^>]+>/g, "")
                      : courseData.introduction}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="bg-muted/50 rounded-xl p-4 border border-border">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Lecciones
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {lessonsArray.length} {lessonsArray.length === 1 ? "lección" : "lecciones"}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 border border-border">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Tiempo estimado
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {formatEstimatedTime((course as any)?.estimatedHours)}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 border border-border">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Actualizado
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {formatCourseDate((course as any)?.updatedAt ?? (course as any)?.createdAt)}
                  </div>
                </div>
              </div>
            </div>
            {/* Progress bar - Solo móvil, como imagen 1: "Progreso" + barra + "% completado" */}
            <div
              className="lg:hidden mt-6 mb-6 rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer hover:opacity-95 transition-opacity"
              style={{ backgroundColor: "#0f0f1a" }}
              onClick={() => setIsMobileLessonsOpen(true)}
            >
              <span className="text-sm font-medium text-foreground flex-shrink-0">Progreso</span>
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <div className="flex-1 min-w-0 bg-muted/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn("h-1.5 rounded-full transition-all duration-300", isAgentesIARoom ? "bg-[#faa318]" : "bg-primary")}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-foreground flex-shrink-0 tabular-nums">
                {isAuthenticated ? `${Math.round(progressPercentage)}% completado` : "0% completado"}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>

            {/* Grid dos columnas (igual que en guías) - sidebar siempre visible en PC */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_22vw] gap-6 mb-6">
            <div className="min-w-0">
            {/* Course Info View - Show before lessons if no saved position */}
            {showCourseInfo && (
              <section className="space-y-6 lg:space-y-8">
                {/* Presentation Video - invitados: difuminado + candado. Si no hay video de presentación, invitados ven la primera lección bloqueada (igual que en /courses). */}
                {presentationVideoUrl ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      className={cn(
                        "absolute top-0 left-0 w-full h-full border-0",
                        !isAuthenticated && "blur-md select-none pointer-events-none"
                      )}
                      src={getYouTubeEmbedUrl(presentationVideoUrl)}
                      title="Video de presentación del curso"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    {!isAuthenticated && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                        <Lock className="h-16 w-16 text-white drop-shadow-lg" />
                      </div>
                    )}
                  </div>
                ) : !isAuthenticated && firstNavigableLessonIndex >= 0 ? (
                  (() => {
                    const firstLesson = lessonsArray[firstNavigableLessonIndex];
                    const firstVideoUrl = firstLesson?.videoUrl;
                    const firstImageUrl = firstLesson?.imageUrl;
                    if (firstVideoUrl) {
                      return (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                          <iframe
                            className="absolute top-0 left-0 w-full h-full border-0 blur-md select-none pointer-events-none"
                            src={getYouTubeEmbedUrl(firstVideoUrl)}
                            title={firstLesson?.title || "Video"}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                            <Lock className="h-16 w-16 text-white drop-shadow-lg" />
                          </div>
                        </div>
                      );
                    }
                    if (firstImageUrl) {
                      return (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                          <img
                            src={firstImageUrl}
                            alt=""
                            className="absolute top-0 left-0 w-full h-full object-cover blur-md select-none pointer-events-none"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                            <Lock className="h-16 w-16 text-white drop-shadow-lg" />
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                          <Lock className="h-16 w-16 text-white drop-shadow-lg" />
                        </div>
                      </div>
                    );
                  })()
                ) : null}

                {/* CTA para invitados: debajo del video */}
                {!isAuthenticated && (
                  <div className="pb-4">
                    <UnlockContentCTA variant="course" backUrl={backUrl} />
                  </div>
                )}

                {/* Course Description */}
                {courseData.introduction && (
                  <div className="bg-card rounded-xl p-5 lg:p-8">
                    <div className="prose prose-sm lg:prose-base max-w-none">
                      {(() => {
                        const description = courseData.introduction;
                        const isHtml = /<[^>]+>/.test(description);
                        
                        if (isHtml) {
                          return (
                            <div 
                              className="prose prose-invert prose-sm max-w-none text-foreground/80 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_li]:mb-1.5 [&_p]:mb-3 [&_p]:leading-relaxed [&_strong]:text-foreground [&_strong]:font-semibold [&_h1]:text-foreground [&_h1]:text-lg [&_h1]:mb-3 [&_h2]:text-foreground [&_h2]:text-base [&_h2]:mb-2 [&_h3]:text-foreground [&_h3]:text-sm [&_h3]:mb-2"
                              dangerouslySetInnerHTML={{ __html: description }}
                            />
                          );
                        }
                        
                        return (
                          <div className="markdown-content">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight, rehypeRaw]}
                              components={{
                                p: ({ children }) => <p className="mb-3 text-foreground/80 leading-relaxed">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-2 text-foreground/80 pl-5">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-2 text-foreground/80 pl-5">{children}</ol>,
                                li: ({ children }) => <li className="mb-1.5 text-foreground/80">{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                                em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
                                h1: ({ children }) => <h1 className="text-lg font-bold text-foreground mb-3 mt-4 first:mt-0">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-base font-bold text-foreground mb-2 mt-3 first:mt-0">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mb-2 mt-2 first:mt-0">{children}</h3>,
                                code: ({ children }) => <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary">{children}</code>,
                                blockquote: ({ children }) => <blockquote className="border-l-2 border-border pl-3 italic my-3 text-muted-foreground">{children}</blockquote>,
                              }}
                            >
                              {description}
                            </ReactMarkdown>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* FAQs Section */}
                {courseFaqs && courseFaqs.length > 0 && (
                  <div className="bg-card rounded-xl p-5 lg:p-8">
                    <h3 className="text-lg lg:text-xl font-bold text-foreground mb-4 font-satoshi">
                      Preguntas frecuentes
                    </h3>
                    <Accordion type="single" collapsible className="w-full">
                      {courseFaqs.map((faq: any, index: number) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
                          <AccordionTrigger className="text-left text-foreground hover:no-underline py-4">
                            <span className="font-medium">{faq.question}</span>
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}

                {/* Botones Anterior y Próximo - mismo tamaño, ancho completo */}
                <div className="grid grid-cols-2 w-full gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setLocation(backUrl || "/cursos")}
                    size="lg"
                    className="w-full text-foreground hover:opacity-90 border-0"
                    style={{ backgroundColor: '#29282d' }}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>
                  <Button
                    onClick={() => {
                      // La intro (descripción + FAQs) no es una lección. Próximo lleva a la primera lección (1.1).
                      let firstLessonIndex = 0;
                      if (navigableLessonIndices.length > 0) {
                        firstLessonIndex = navigableLessonIndices[0];
                      } else {
                        const firstModule = modules[0];
                        if (firstModule) {
                          const firstModuleSubLessons = subLessonsByParent[firstModule.id];
                          if (firstModuleSubLessons && firstModuleSubLessons.length > 0) {
                            const firstSubLessonIndex = lessonsArray.findIndex((l: any) => l.id === firstModuleSubLessons[0].id);
                            if (firstSubLessonIndex !== -1) firstLessonIndex = firstSubLessonIndex;
                          }
                        }
                      }
                      setCurrentLessonIndex(firstLessonIndex);
                      setShowCourseInfo(false);
                      if (lessonsArray[firstLessonIndex] && courseId) {
                        saveLessonPosition(courseId, lessonsArray[firstLessonIndex].id, (course as any)?.type, roomSlug);
                      }
                    }}
                    size="lg"
                    className="w-full text-white hover:opacity-90 border-0"
                    style={{ backgroundColor: '#000000' }}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </section>
            )}

            {/* Current Lesson Content */}
            {!showCourseInfo && currentLesson && (
              <section>
                {!isAuthenticated ? (
                  /* Vista para invitados (todas las lecciones, incluida 1.1): video difuminado+candado, Desbloquea, card título/mensaje, Anterior/Próximo */
                  <>
                    {/* 1. Video/imagen de la lección arriba: visible pero difuminado y con candado */}
                    {currentLesson.videoUrl ? (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black mb-6 lg:mb-8">
                        <iframe
                          className="absolute top-0 left-0 w-full h-full blur-md select-none pointer-events-none"
                          src={getYouTubeEmbedUrl(currentLesson.videoUrl)}
                          title={currentLesson.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                          <Lock className="h-16 w-16 text-white drop-shadow-lg" />
                        </div>
                      </div>
                    ) : currentLesson.imageUrl ? (
                      <div className="relative rounded-lg overflow-hidden mb-6 lg:mb-8">
                        <img
                          src={currentLesson.imageUrl}
                          alt={currentLesson.title}
                          className="w-full h-auto rounded-lg blur-md select-none pointer-events-none"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                          <Lock className="h-16 w-16 text-white drop-shadow-lg" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-6 lg:mb-8 bg-muted">
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Lock className="h-16 w-16 text-white drop-shadow-lg" />
                        </div>
                      </div>
                    )}
                    {/* 2. Card Desbloquea este curso */}
                    <div className="mb-6">
                      <UnlockContentCTA variant="course" backUrl={backUrl} />
                    </div>
                    {/* 3. Card con título de la lección y mensaje Pro */}
                    <div className="bg-card rounded-xl p-5 lg:p-8 border border-border mb-6">
                      <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-3 font-satoshi">
                        {currentLesson.title}
                      </h2>
                      <p className="text-muted-foreground">
                        Las notas de lecciones se desbloquean con Pro.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 w-full gap-3">
                      <Button
                        variant="outline"
                        onClick={isFirstNavigableLesson(currentLessonIndex) ? () => setShowCourseInfo(true) : handlePreviousLesson}
                        size="lg"
                        className="w-full text-foreground hover:opacity-90 border-0"
                        style={{ backgroundColor: '#29282d' }}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Anterior
                      </Button>
                      <Button
                        onClick={handleNextLesson}
                        disabled={currentLessonIndex >= lessonsArray.length - 1}
                        size="lg"
                        className="w-full text-white hover:opacity-90 border-0 disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#000000' }}
                      >
                        Próximo
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                {/* Media Area - Video/Image/Empty based on lesson content (solo autenticados) */}
                {currentLesson.videoUrl ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black mb-6 lg:mb-8">
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

                {/* Lesson Content with Tabs and Side-by-side Layout */}
                <div className="space-y-6 lg:space-y-8">
                  {/* Lesson Header with Title and Action Buttons */}
                  <div className="bg-card rounded-xl p-5 lg:p-8">
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
                      <div className="bg-card rounded-xl p-5 lg:p-8 font-satoshi font-normal text-[13px] lg:text-[15px] leading-[20px] lg:leading-[24px] text-card-foreground">
                        {!isAuthenticated ? (
                          isFirstNavigableLesson(currentLessonIndex) ? (
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
                  </>
                )}
              </section>
            )}
            </div>

            {/* Right column - sidebar (desktop) - alineado con card superior, sin dropdown */}
            <div className="hidden lg:flex flex-col min-w-0 pl-5 lg:pl-8 pr-0">
                {/* Action Buttons - Save Course & Ask Question - alineado en altura con el video */}
                <div className="pt-0 pb-2 space-y-2">
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
          
                <div className="pt-2 space-y-2 xl:space-y-2.5 2xl:space-y-3 min-[1920px]:space-y-3.5 flex flex-col flex-1 min-h-0" style={{ maxHeight: 'calc(100vh - 200px)' }}>
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
                          {/* Vertical line connector - solid gray if current lesson is completed */}
                          {!isLast && (
                            <div 
                              key={`line-${lesson.id}-${currentLessonCompleted ? 'solid' : 'dashed'}`}
                              className="absolute left-[15px] top-8 bottom-0 w-[2px] transition-all duration-300 z-0"
                              style={currentLessonCompleted ? {
                                // Solid gray line when current lesson is completed
                                backgroundColor: '#6b7280',
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
                                  ? "bg-muted-foreground border-muted-foreground"
                                  : isCurrentLesson
                                    ? "bg-transparent border-muted-foreground"
                                    : "bg-transparent border-border/60",
                                isCurrentLesson && "ring-2 ring-muted-foreground/40",
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
                                <Check size={16} className="text-background" />
                              ) : (
                                <span className={cn(
                                  "text-sm font-semibold leading-none",
                                  isCurrentLesson 
                                    ? "text-muted-foreground"
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
                                ? "text-foreground font-semibold"
                                : "text-foreground hover:text-muted-foreground"
                            )}>
                              {lesson.title}
                            </div>
                            {!isAuthenticated && (
                              <span className="text-xs text-muted-foreground mt-1 block">Bloqueado</span>
                            )}
                          </div>
                          {/* Candado a la derecha - no autenticado: bg #373737, candado #606060 (incluye 1.1) */}
                          {!isAuthenticated && (
                            <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#373737' }}>
                              <Lock size={14} style={{ color: '#606060' }} />
                            </div>
                          )}
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
                              ? "bg-transparent hover:bg-muted/50" 
                              : "bg-muted border-b border-border/40"
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
                              className="p-1 hover:opacity-90 rounded transition-opacity flex-shrink-0"
                              style={{ backgroundColor: '#303030' }}
                            >
                              {isCollapsed ? (
                                <ChevronDown size={16} className="text-muted-foreground" />
                              ) : (
                                <ChevronUp size={16} className="text-muted-foreground" />
                              )}
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
                                        ? isAgentesIARoom ? "bg-muted border-2 border-[#faa318]" : "bg-muted border-2 border-primary" 
                                        : "bg-muted/70 border border-border/30 hover:bg-muted hover:border-border/50"
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
                                    {/* Candado a la derecha - no autenticado: bg #373737, candado #606060 (incluye 1.1) */}
                                    {!isAuthenticated && (
                                      <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#373737' }}>
                                        <Lock size={14} style={{ color: '#606060' }} />
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
                  /* New Design for Regular Courses - Based on Image */
                  (modules.map((module: any, moduleIdx: number) => {
                  const moduleIndex = lessonsArray.findIndex((l: any) => l.id === module.id);
                  const subLessons = subLessonsByParent[module.id] || [];
                  const isCollapsed = collapsedModules.has(module.id);
                  const hasSubLessons = subLessons.length > 0;
                  const moduleNumber = moduleIdx + 1;
                  const progress = moduleProgress[module.id] || { total: 0, completed: 0, percentage: 0 };

                  return (
                    <div key={module.id} className="mb-3 border border-border/40 rounded-lg overflow-hidden bg-card">
                      {/* Module Header with Progress */}
                      <div 
                        className={cn(
                          "flex items-center justify-between p-4 transition-colors cursor-pointer",
                          isCollapsed 
                            ? "bg-transparent hover:bg-muted/10" 
                            : "bg-muted border-b border-border/40"
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
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <h4 className="font-satoshi font-medium text-foreground text-sm xl:text-[15px] min-[1920px]:text-base">
                            {moduleNumber}- {module.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="font-semibold text-sm min-[1920px]:text-[15px] text-muted-foreground">
                            {progress.percentage}%
                          </span>
                          {hasSubLessons && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleModuleCollapse(module.id);
                              }}
                              className="p-1 hover:opacity-90 rounded transition-opacity"
                              style={{ backgroundColor: '#303030' }}
                            >
                              {isCollapsed ? (
                                <ChevronDown size={16} className="text-muted-foreground" />
                              ) : (
                                <ChevronUp size={16} className="text-muted-foreground" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Sub-lessons List */}
                      {hasSubLessons && !isCollapsed && (
                        <div className="px-4 py-3 space-y-2 bg-muted/50">
                          {subLessons.map((subLesson: any, subIdx: number) => {
                            const subIndex = lessonsArray.findIndex((l: any) => l.id === subLesson.id);
                            const subLessonNumber = `${moduleNumber}.${subIdx + 1}`;
                            const isCurrentLesson = subIndex === currentLessonIndex;
                            const isAccessible = isLessonAccessible(subIndex);
                            const isCompleted = isLessonCompleted(subLesson.id);
                            
                            return (
                              <div
                                key={subLesson.id}
                                className={cn(
                                  "flex items-start gap-3 p-3 rounded-lg border transition-all",
                                  isCurrentLesson
                                    ? "bg-muted/20 border-border"
                                    : "bg-transparent border-border/30 hover:bg-muted/10 hover:border-border/50"
                                )}
                              >
                                {/* Circle for completion - Clickable */}
                                <div 
                                  className={cn(
                                    "h-4 w-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all relative z-10",
                                    isCompleted 
                                      ? "bg-muted-foreground border-muted-foreground" 
                                      : "bg-transparent border-border",
                                    isCurrentLesson && "ring-2 ring-muted-foreground/40",
                                    isAccessible && "cursor-pointer hover:scale-110"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isAccessible) {
                                      handleToggleComplete(subLesson.id);
                                    }
                                  }}
                                >
                                  {isCompleted && (
                                    <Check size={10} className="text-background absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                  )}
                                </div>
                                
                                {/* Lesson Text - Clickable to navigate */}
                                <div 
                                  className={cn(
                                    "flex-1 min-w-0",
                                    isAccessible && "cursor-pointer"
                                  )}
                                  onClick={() => isAccessible && handleLessonClick(subIndex)}
                                >
                                  <div className={cn(
                                    "font-satoshi text-sm xl:text-[15px] transition-colors",
                                    isCurrentLesson 
                                      ? "text-foreground font-medium" 
                                      : "text-muted-foreground hover:text-foreground"
                                  )}>
                                    {subLessonNumber} - {subLesson.title}
                                  </div>
                                </div>
                                {/* Candado a la derecha - no autenticado (incluye 1.1): bg #373737, candado #606060 */}
                                {!isAuthenticated && (
                                  <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#373737' }}>
                                    <Lock size={14} style={{ color: '#606060' }} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }))
                )}
              </div>

              {/* Next Course Card - Desktop - Only show in room context when there is a next course */}
              {isRoomContext && nextCourse && (
                <Link href={`/sala/${roomSlug}/curso/${nextCourse.slug || nextCourse.courseId}`}>
                  <div className={cn("p-4 bg-card border rounded-lg cursor-pointer hover:bg-muted/80 transition-all pt-[6px] pb-[6px] mt-[16px] mb-[16px]", isAgentesIARoom ? "border-[#faa318]" : "border-primary")}>
                    <div className="text-xs text-muted-foreground mb-2 font-satoshi">Próximo contenido</div>
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
            </div>
          </div>
          </div>
        </main>
        </div>
      </div>
      {/* Mobile Navigation */}
      <MobileNav />
      {/* Mobile Lessons Sidebar - ancho completo como imagen 1 */}
      {isMobileLessonsOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileLessonsOpen(false)} aria-hidden />
          <div className="fixed right-0 top-0 h-full w-full max-w-full bg-background flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header: Lecciones y módulos */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-foreground font-bold text-xl">Lecciones y módulos</h2>
              <button
                onClick={() => setIsMobileLessonsOpen(false)}
                className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                aria-label="Cerrar"
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            </div>

            {/* Progreso + % completado — barra visible: track #262626, fill #a173ef */}
            <div className="p-4 border-b border-border" style={{ backgroundColor: "#0f0f1a" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-foreground font-medium">Progreso</span>
                <span className="text-foreground text-sm tabular-nums">{Math.round(progressPercentage)}% completado</span>
              </div>
              <div className="w-full rounded-full h-2 mb-3 overflow-hidden" style={{ backgroundColor: "#262626" }}>
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%`, backgroundColor: "#a173ef" }}
                />
              </div>
              <p className="text-muted-foreground text-sm">
                Tiempo estimado: {formatEstimatedTime((course as any)?.estimatedHours)}
              </p>
            </div>

            {/* Curso: título */}
            <div className="p-4 border-b border-border">
              <h3 className="text-foreground font-bold text-lg">{(course as any)?.title}</h3>
            </div>

            {/* Lista de lecciones - scroll */}
            <div className="flex-1 overflow-y-auto min-h-0">
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
                      <div key={module.id} className="mb-4 border border-border rounded-lg overflow-hidden">
                        {/* Module Header with Circle and Progress */}
                        <div 
                          className="flex items-start gap-3 p-4 bg-muted/50 border-b border-border cursor-pointer hover:bg-muted transition-colors"
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
                              <h4 className="font-satoshi font-medium text-[15px] text-foreground">
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
                              className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
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
                                        ? isAgentesIARoom ? "bg-muted border-2 border-[#faa318]" : "bg-muted border-2 border-primary" 
                                        : "hover:bg-muted/70"
                                    )}
                                  >
                                    {/* Circle Marker - Clickable to toggle completion */}
                                    <div 
                                      className={cn(
                                        "h-5 w-5 rounded-full border-[2.5px] flex-shrink-0 transition-all relative z-10",
                                        isCompleted 
                                          ? isAgentesIARoom ? "bg-[#faa318] border-[#faa318] shadow-lg shadow-[#faa318]/20" : "bg-primary border-primary shadow-lg shadow-primary/20" 
                                          : "bg-transparent border-border",
                                        isCurrentLesson && (isAgentesIARoom ? "ring-2 ring-[#faa318]/40 ring-offset-2 ring-offset-background" : "ring-2 ring-primary/40 ring-offset-2 ring-offset-background"),
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
                                        "font-satoshi text-[14px] pr-2 transition-colors hover:text-foreground",
                                        isCurrentLesson ? "text-foreground font-medium" : "text-muted-foreground"
                                      )}>
                                        {subLesson.title}
                                      </div>
                                    </div>
                                    
                                    {/* Mark Complete Button */}
                                    {!isCompleted && (
                                      <div 
                                        className="opacity-0 group-hover:opacity-100 flex items-center border border-border rounded px-2 py-0.5 cursor-pointer hover:bg-muted transition-all flex-shrink-0"
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
                            ? "bg-transparent hover:bg-muted/50" 
                            : cn(
                                moduleIndex === currentLessonIndex 
                                  ? "bg-muted border border-border" 
                                  : "bg-transparent hover:bg-muted/50"
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
                            <div className="w-8 h-8 rounded-lg border flex items-center justify-center font-medium flex-shrink-0 bg-muted text-foreground border-border text-sm">
                              {moduleNumber}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-base text-foreground">
                                {module.title}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!hasSubLessons && !isLessonCompleted(module.id) && (
                              <div 
                                className="opacity-0 group-hover:opacity-100 flex items-center border border-border rounded px-2 py-1 cursor-pointer hover:bg-muted transition-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkComplete(module.id);
                                }}
                              >
                                <Check size={12} className="mr-1 text-muted-foreground" />
                                <span className="text-muted-foreground font-satoshi text-[11px]">Marcar</span>
                              </div>
                            )}
                            
                            {hasSubLessons && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleModuleCollapse(module.id);
                                }}
                                className="p-1 hover:opacity-90 rounded transition-colors"
                                style={{ backgroundColor: '#303030' }}
                              >
                                {isCollapsed ? (
                                  <ChevronDown size={18} className="text-muted-foreground" />
                                ) : (
                                  <ChevronUp size={18} className="text-muted-foreground" />
                                )}
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
                                ? "bg-muted border border-border" 
                                : "bg-transparent hover:bg-muted/50"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <div className="w-auto min-w-[32px] h-7 px-1.5 rounded-lg border flex items-center justify-center font-medium flex-shrink-0 bg-muted text-foreground border-border text-xs">
                                  {isLessonCompleted(subLesson.id) ? (
                                    <Check size={14} className="text-primary" />
                                  ) : (
                                    subLessonNumber
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className={cn(
                                    "font-normal text-sm",
                                    subIndex === currentLessonIndex ? "text-foreground" : "text-muted-foreground"
                                  )}>
                                    {subLesson.title}
                                  </div>
                                </div>
                              </div>
                              {!isLessonCompleted(subLesson.id) && (
                                <div 
                                  className="opacity-0 group-hover:opacity-100 flex items-center border border-border rounded px-2 py-1 cursor-pointer hover:bg-muted transition-all ml-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkComplete(subLesson.id);
                                  }}
                                >
                                  <Check size={10} className="mr-1 text-muted-foreground" />
                                  <span className="text-muted-foreground font-satoshi text-[10px]">Marcar</span>
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

                {/* Next Course Card - Only show in room context when there is a next course */}
                {isRoomContext && nextCourse && (
                  <Link href={`/sala/${roomSlug}/curso/${nextCourse.slug || nextCourse.courseId}`}>
                    <div className={cn("mt-4 p-4 bg-card border rounded-lg cursor-pointer hover:bg-muted/80 transition-all", isAgentesIARoom ? "border-[#faa318]" : "border-primary")}>
                      <div className="text-xs text-muted-foreground mb-2 font-satoshi">Próximo contenido</div>
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

            {/* Restablecer progreso - como imagen 1 */}
            <div className="flex-shrink-0 p-4 border-t border-border bg-background">
              <Button
                variant="outline"
                className="w-full justify-center gap-2 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500"
                onClick={() => {
                  if (window.confirm("¿Restablecer el progreso de este curso? Se perderán todas las lecciones marcadas como completadas.")) {
                    resetProgressMutation.mutate();
                  }
                }}
                disabled={resetProgressMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
                Restablecer progreso
              </Button>
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