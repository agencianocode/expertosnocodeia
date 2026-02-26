import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  ArrowLeft,
  BookOpen,
  Play,
  Edit,
  Trash2,
  Move,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";

export default function CourseLessons() {
  const [match, params] = useRoute("/admin/content/course/:id/lessons");
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  /** Módulos colapsados (por id). Solo se abren cuando el usuario hace clic. Por defecto todos colapsados. */
  const [collapsedModuleIds, setCollapsedModuleIds] = useState<Set<string>>(new Set());
  const collapsedInitializedForCourse = useRef<string | null>(null);
  const { toast } = useToast();

  const toggleModule = (moduleId: string) => {
    setCollapsedModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };
  const queryClient = useQueryClient();

  // Verificar que la ruta coincide
  if (!match) {
    return null;
  }

  const courseId = params?.id;

  const { data: course, isLoading: courseLoading, error: courseError } = useQuery({
    queryKey: ["/api/admin/courses", courseId],
    queryFn: async () => {
      const token = localStorage.getItem('simpleAuthToken');
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Course not found');
      }
      return response.json();
    },
    enabled: !!courseId,
    retry: false,
  });

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ["/api/admin/courses", courseId, "lessons"],
    queryFn: async () => {
      const token = localStorage.getItem('simpleAuthToken');
      const response = await fetch(`/api/admin/courses/${courseId}/lessons`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Lessons not found');
      }
      return response.json();
    },
    enabled: !!courseId && !!course,
    retry: false,
  });

  // Inicializar colapsados: por defecto todos cerrados; si hay estado guardado (sessionStorage), restaurarlo
  useEffect(() => {
    if (!courseId) return;
    if (collapsedInitializedForCourse.current === courseId) return;
    const allLessons = lessons || [];
    const modules = (allLessons as any[]).filter((l: any) => !l.parentLessonId).sort((a: any, b: any) => a.order - b.order);
    if (modules.length === 0) return;
    const storageKey = `course-lessons-collapsed-${courseId}`;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const ids = JSON.parse(saved) as string[];
        if (Array.isArray(ids)) setCollapsedModuleIds(new Set(ids));
      } else {
        setCollapsedModuleIds(new Set(modules.map((m: any) => m.id)));
      }
    } catch {
      setCollapsedModuleIds(new Set(modules.map((m: any) => m.id)));
    }
    collapsedInitializedForCourse.current = courseId;
  }, [courseId, lessons]);

  // Al cambiar de curso, permitir reinicializar
  useEffect(() => {
    if (!courseId) collapsedInitializedForCourse.current = null;
  }, [courseId]);

  // Persistir qué módulos están colapsados al cambiar (así no se abren solos al volver de "Nueva Lección")
  useEffect(() => {
    if (!courseId) return;
    const storageKey = `course-lessons-collapsed-${courseId}`;
    sessionStorage.setItem(storageKey, JSON.stringify(Array.from(collapsedModuleIds)));
  }, [courseId, collapsedModuleIds]);

  const deleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const token = localStorage.getItem('simpleAuthToken');
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Error al eliminar la lección');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Éxito!",
        description: "Lección eliminada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId, "lessons"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al eliminar la lección",
        variant: "destructive",
      });
    },
  });

  const moveLessonUpMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const token = localStorage.getItem('simpleAuthToken');
      const response = await fetch(`/api/admin/lessons/${lessonId}/move-up`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Error al mover la lección hacia arriba');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Éxito!",
        description: "Lección movida hacia arriba",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId, "lessons"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo mover la lección hacia arriba",
        variant: "destructive",
      });
    },
  });

  const moveLessonDownMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const token = localStorage.getItem('simpleAuthToken');
      const response = await fetch(`/api/admin/lessons/${lessonId}/move-down`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Error al mover la lección hacia abajo');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Éxito!",
        description: "Lección movida hacia abajo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId, "lessons"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo mover la lección hacia abajo",
        variant: "destructive",
      });
    },
  });

  if (adminLoading || courseLoading || lessonsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold text-red-500">Acceso Denegado</h1>
        <p className="text-gray-400">No tienes privilegios de administrador.</p>
        <Link href="/">
          <Button>Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  if (courseError || (!courseLoading && !course)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold text-red-500">Curso no encontrado</h1>
        <p className="text-gray-400">El curso solicitado no existe o no tienes acceso.</p>
        <Link href="/admin/content">
          <Button>Volver a Contenido</Button>
        </Link>
      </div>
    );
  }

  // Organize lessons into hierarchical structure
  const allLessons = lessons || [];
  const modules = (allLessons as any)?.filter((lesson: any) => !lesson.parentLessonId)
    .sort((a: any, b: any) => a.order - b.order) || [];
  const subLessons = (allLessons as any)?.filter((lesson: any) => lesson.parentLessonId) || [];
  
  // Create map of sub-lessons by parent ID
  const subLessonsByParent = subLessons.reduce((acc: any, lesson: any) => {
    if (!acc[lesson.parentLessonId]) {
      acc[lesson.parentLessonId] = [];
    }
    acc[lesson.parentLessonId].push(lesson);
    return acc;
  }, {});

  // Identify orphaned sub-lessons (parent doesn't exist)
  const moduleIds = new Set(modules.map((m: any) => m.id));
  const orphanedSubLessons = subLessons.filter((lesson: any) => !moduleIds.has(lesson.parentLessonId));

  // Build flat list with hierarchy indicators for rendering
  const hierarchicalLessons = modules.reduce((acc: any[], module: any) => {
    // Add module
    acc.push({ ...module, isModule: true, level: 0 });
    // Add its sub-lessons (sorted by order)
    const subs = (subLessonsByParent[module.id] || []).sort((a: any, b: any) => a.order - b.order);
    subs.forEach((subLesson: any) => {
      acc.push({ ...subLesson, isModule: false, level: 1, parentTitle: module.title });
    });
    return acc;
  }, []);

  // Add orphaned sub-lessons at the end with warning
  orphanedSubLessons.forEach((orphan: any) => {
    hierarchicalLessons.push({ ...orphan, isModule: false, level: 1, isOrphan: true, parentTitle: "Módulo no encontrado" });
  });

  // Filter by search term
  const filteredLessons = hierarchicalLessons.filter((lesson: any) =>
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar por módulo para poder colapsar/expandir (módulo + sus sub-lecciones)
  type ModuleGroup = { module: any; subs: any[] };
  const moduleGroups: ModuleGroup[] = [];
  let orphanSubs: any[] = [];
  let currentGroup: ModuleGroup | null = null;
  for (const lesson of filteredLessons) {
    if (lesson.isModule) {
      currentGroup = { module: lesson, subs: [] };
      moduleGroups.push(currentGroup);
    } else if (lesson.isOrphan) {
      orphanSubs.push(lesson);
    } else if (currentGroup) {
      currentGroup.subs.push(lesson);
    }
  }
  const getLessonIndex = (id: string) => filteredLessons.findIndex((l: any) => l.id === id);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return Play;
      case 'text':
        return BookOpen;
      case 'quiz':
        return Edit;
      default:
        return BookOpen;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-red-500/20 text-red-400';
      case 'text':
        return 'bg-blue-500/20 text-blue-400';
      case 'quiz':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'video':
        return 'Video';
      case 'text':
        return 'Texto';
      case 'quiz':
        return 'Quiz';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 lg:ml-[250px]">
          <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/content">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Contenido
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">Lecciones: {course.title}</h1>
          <p className="text-gray-400 mt-1">Gestiona el contenido y estructura del curso</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/content/lesson/new/${courseId}`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Lección
            </Button>
          </Link>
          <Link href={`/course/${courseId}`}>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Ver Curso
            </Button>
          </Link>
        </div>
      </div>

      {/* Course Info Card */}
      <Card className="bg-slate-900/50 border-slate-700 mb-6">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-white font-medium mb-2">{course.title}</h3>
              {course.description && (
                <div className="text-gray-400 text-sm mt-1">
                  {(() => {
                    const description = course.description || '';
                    // Detectar si el contenido tiene HTML
                    const isHtml = /<[^>]+>/.test(description);
                    
                    if (isHtml) {
                      // Si es HTML, renderizar con dangerouslySetInnerHTML pero con estilos
                      return (
                        <div 
                          className="prose prose-invert prose-sm max-w-none text-gray-400 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_li]:mb-1.5 [&_p]:mb-3 [&_p]:leading-relaxed [&_strong]:text-white [&_strong]:font-semibold [&_h1]:text-white [&_h1]:text-lg [&_h1]:mb-3 [&_h2]:text-white [&_h2]:text-base [&_h2]:mb-2 [&_h3]:text-white [&_h3]:text-sm [&_h3]:mb-2 [&_h4]:text-white [&_h4]:text-sm [&_h4]:mb-2"
                          dangerouslySetInnerHTML={{ __html: description }}
                        />
                      );
                    }
                    
                    // Si es Markdown o texto plano, usar ReactMarkdown
                    return (
                      <div className="markdown-content">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight, rehypeRaw]}
                          components={{
                            p: ({ children }) => <p className="mb-3 text-gray-400 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-2 text-gray-400 pl-5">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-2 text-gray-400 pl-5">{children}</ol>,
                            li: ({ children }) => <li className="mb-1.5 text-gray-400">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                            em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
                            h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-3 mt-4 first:mt-0">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold text-white mb-2 mt-3 first:mt-0">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold text-white mb-2 mt-2 first:mt-0">{children}</h3>,
                            h4: ({ children }) => <h4 className="text-sm font-semibold text-white mb-2 mt-2 first:mt-0">{children}</h4>,
                            code: ({ children }) => <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-purple-300">{children}</code>,
                            blockquote: ({ children }) => <blockquote className="border-l-2 border-slate-600 pl-3 italic my-3 text-gray-500">{children}</blockquote>,
                          }}
                        >
                          {description}
                        </ReactMarkdown>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400 flex-shrink-0">
              <div>Tipo: {course.type}</div>
              <div>Dificultad: {course.difficulty}</div>
              <div>Lecciones: {filteredLessons.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar lecciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-700"
          />
        </div>
      </div>

      <div className="space-y-4">
        {moduleGroups.map(({ module: mod, subs }) => {
          const isCollapsed = collapsedModuleIds.has(mod.id);
          return (
            <div key={mod.id} className="space-y-2">
              {/* Cabecera del módulo: clic para colapsar/expandir */}
              <Card className="bg-slate-900/50 border-slate-700 border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-5 w-5 text-orange-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-orange-400 flex-shrink-0" />
                      )}
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-gray-400 text-sm font-medium flex-shrink-0">
                        {mod.order ?? 0}
                      </div>
                      <div className="min-w-0">
                        <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 text-xs mr-2">
                          Módulo
                        </Badge>
                        <h3 className="text-white font-medium truncate">{mod.title}</h3>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {subs.length} sub-lección{subs.length !== 1 ? "es" : ""}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); moveLessonUpMutation.mutate(mod.id); }}
                          disabled={getLessonIndex(mod.id) === 0 || moveLessonUpMutation.isPending}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); moveLessonDownMutation.mutate(mod.id); }}
                          disabled={getLessonIndex(mod.id) === filteredLessons.length - 1 || moveLessonDownMutation.isPending}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/admin/content/lesson/${mod.id}/edit`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar Módulo
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/course/${courseId}/lesson/${mod.id}`} target="_blank">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Vista Previa
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            className="text-red-400"
                            onClick={() => deleteMutation.mutate(mod.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar Módulo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sub-lecciones del módulo (ocultas si está colapsado) */}
              {!isCollapsed && (
                <div className="ml-4 space-y-2 border-l-2 border-slate-700 pl-4">
                  {subs.map((lesson: any) => {
                    const TypeIcon = getTypeIcon(lesson.type);
                    const index = getLessonIndex(lesson.id);
                    return (
                      <div key={lesson.id}>
                        <Card className="bg-slate-900/50 border-slate-700 border-l-4 border-l-purple-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-gray-400 text-sm font-medium">
                                  {lesson.order ?? index + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs">
                                      Sub-lección
                                    </Badge>
                                    <h3 className="text-white font-medium">{lesson.title}</h3>
                                    <Badge className={getTypeColor(lesson.type)}>
                                      <TypeIcon className="h-3 w-3 mr-1" />
                                      {getTypeText(lesson.type)}
                                    </Badge>
                                    {lesson.isPublished ? (
                                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                                        Publicado
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="bg-gray-500/20 text-gray-400">
                                        Borrador
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-gray-400 text-sm mb-2">{lesson.description}</p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    {lesson.duration && (
                                      <div>Duración: {lesson.duration} min</div>
                                    )}
                                    <div>Creado: {new Date(lesson.createdAt).toLocaleDateString()}</div>
                                    {lesson.parentTitle && (
                                      <div className="text-purple-400">↳ Parte de: {lesson.parentTitle}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveLessonUpMutation.mutate(lesson.id)}
                                    disabled={index === 0 || moveLessonUpMutation.isPending}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveLessonDownMutation.mutate(lesson.id)}
                                    disabled={index === filteredLessons.length - 1 || moveLessonDownMutation.isPending}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <Link href={`/admin/content/lesson/${lesson.id}/edit`}>
                                      <DropdownMenuItem>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar Lección
                                      </DropdownMenuItem>
                                    </Link>
                                    <Link href={`/course/${courseId}/lesson/${lesson.id}`} target="_blank">
                                      <DropdownMenuItem>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Vista Previa
                                      </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuItem
                                      className="text-red-400"
                                      onClick={() => deleteMutation.mutate(lesson.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar Lección
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Lecciones huérfanas (sin módulo) */}
        {orphanSubs.length > 0 && (
          <div className="space-y-2 mt-6">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Badge variant="secondary" className="bg-red-500/20 text-red-400 text-xs">
                Sin módulo
              </Badge>
              {orphanSubs.length} lección{orphanSubs.length !== 1 ? "es" : ""}
            </h3>
            <div className="space-y-2">
              {orphanSubs.map((lesson: any) => {
                const TypeIcon = getTypeIcon(lesson.type);
                const index = getLessonIndex(lesson.id);
                return (
                  <div key={lesson.id} className="ml-4">
                    <Card className="bg-slate-900/50 border-slate-700 border-l-4 border-l-red-500/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-gray-400 text-sm font-medium">
                              {lesson.order ?? index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <Badge variant="secondary" className="bg-red-500/20 text-red-400 text-xs">
                                  ⚠️ Huérfana
                                </Badge>
                                <h3 className="text-white font-medium">{lesson.title}</h3>
                                <Badge className={getTypeColor(lesson.type)}>
                                  <TypeIcon className="h-3 w-3 mr-1" />
                                  {getTypeText(lesson.type)}
                                </Badge>
                              </div>
                              <p className="text-gray-400 text-sm mb-2">{lesson.description}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {lesson.duration && <div>Duración: {lesson.duration} min</div>}
                                <div>Creado: {new Date(lesson.createdAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveLessonUpMutation.mutate(lesson.id)}
                                disabled={index === 0 || moveLessonUpMutation.isPending}
                                className="h-6 w-6 p-0"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveLessonDownMutation.mutate(lesson.id)}
                                disabled={index === filteredLessons.length - 1 || moveLessonDownMutation.isPending}
                                className="h-6 w-6 p-0"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <Link href={`/admin/content/lesson/${lesson.id}/edit`}>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar Lección
                                  </DropdownMenuItem>
                                </Link>
                                <Link href={`/course/${courseId}/lesson/${lesson.id}`} target="_blank">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Vista Previa
                                  </DropdownMenuItem>
                                </Link>
                                <DropdownMenuItem
                                  className="text-red-400"
                                  onClick={() => deleteMutation.mutate(lesson.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar Lección
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filteredLessons.length === 0 && (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">No hay lecciones</h3>
              <p className="text-gray-400 mb-4">
                {searchTerm ? "No se encontraron lecciones que coincidan con tu búsqueda." : "Este curso aún no tiene lecciones creadas."}
              </p>
              <Link href={`/admin/content/lesson/new/${courseId}`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Lección
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      {filteredLessons.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Acciones Rápidas</CardTitle>
            <CardDescription className="text-gray-400">
              Herramientas para gestionar todas las lecciones
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button variant="outline">
              Reordenar Lecciones
            </Button>
            <Button variant="outline">
              Publicar Todas
            </Button>
            <Button variant="outline">
              Exportar Contenido
            </Button>
          </CardContent>
        </Card>
      )}
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}