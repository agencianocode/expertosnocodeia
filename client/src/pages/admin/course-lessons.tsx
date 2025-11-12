import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  ChevronDown
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
  const { toast } = useToast();
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

  const deleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'DELETE',
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
      const response = await fetch(`/api/admin/lessons/${lessonId}/move-up`, {
        method: 'PUT',
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
      const response = await fetch(`/api/admin/lessons/${lessonId}/move-down`, {
        method: 'PUT',
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
    <div className="min-h-screen bg-dark-bg text-white">
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">{course.title}</h3>
              <p className="text-gray-400 text-sm mt-1">{course.description}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
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
        {filteredLessons.map((lesson: any, index: number) => {
          const TypeIcon = getTypeIcon(lesson.type);
          const isSubLesson = lesson.level === 1;
          return (
            <div 
              key={lesson.id} 
              className={isSubLesson ? "ml-12" : ""}
            >
              <Card className={`bg-slate-900/50 border-slate-700 ${isSubLesson ? 'border-l-4 border-l-purple-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-gray-400 text-sm font-medium">
                        {lesson.order || index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          {lesson.isOrphan && (
                            <Badge variant="secondary" className="bg-red-500/20 text-red-400 text-xs">
                              ⚠️ Huérfana
                            </Badge>
                          )}
                          {isSubLesson && !lesson.isOrphan && (
                            <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs">
                              Sub-lección
                            </Badge>
                          )}
                          {lesson.isModule && (
                            <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 text-xs">
                              Módulo
                            </Badge>
                          )}
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
                          {isSubLesson && lesson.parentTitle && (
                            <div className="text-purple-400">↳ Parte de: {lesson.parentTitle}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  <div className="flex items-center gap-2">
                    {/* Reorder buttons */}
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