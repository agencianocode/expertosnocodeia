import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Search, 
  BookOpen, 
  FileText, 
  Settings, 
  Edit,
  Eye,
  Users,
  Calendar,
  Trash2,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ContentManagement() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses } = useQuery({
    queryKey: ["/api/admin/courses"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return await apiRequest('DELETE', `/api/admin/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({
        title: "Curso eliminado",
        description: "El curso ha sido eliminado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el curso",
        variant: "destructive",
      });
    },
  });

  // Move course up mutation
  const moveCourseUpMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return await apiRequest('PUT', `/api/admin/courses/${courseId}/move-up`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({
        title: "Curso movido",
        description: "El curso se ha movido hacia arriba",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo mover el curso",
        variant: "destructive",
      });
    },
  });

  // Move course down mutation
  const moveCourseDownMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return await apiRequest('PUT', `/api/admin/courses/${courseId}/move-down`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({
        title: "Curso movido",
        description: "El curso se ha movido hacia abajo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo mover el curso",
        variant: "destructive",
      });
    },
  });

  if (adminLoading) {
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

  const filteredCourses = (courses as any)?.filter((course: any) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Filter by content type and separate courses by room context
  const allCourses = filteredCourses.filter((item: any) => item.type === 'course');
  const coursesList = allCourses.filter((item: any) => !item.roomContext || item.roomContext.length === 0); // Cursos de /courses
  const roomCoursesList = allCourses.filter((item: any) => item.roomContext && item.roomContext.length > 0); // Cursos de salas
  const workshopsList = filteredCourses.filter((item: any) => item.type === 'workshop');
  const guidesList = filteredCourses.filter((item: any) => item.type === 'guide');

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'advanced':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'course':
        return 'bg-blue-500/20 text-blue-400';
      case 'guide':
        return 'bg-purple-500/20 text-purple-400';
      case 'workshop':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
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
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">Gestión de Contenido</h1>
          <p className="text-gray-400 mt-1">Crea y administra cursos, lecciones y categorías</p>
        </div>
      </div>
      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-900/50 border-slate-700">
          <TabsTrigger value="courses" className="data-[state=active]:bg-purple-600">
            <BookOpen className="h-4 w-4 mr-2" />
            Cursos ({coursesList.length})
          </TabsTrigger>
          <TabsTrigger value="room-courses" className="data-[state=active]:bg-purple-600">
            <BookOpen className="h-4 w-4 mr-2" />
            Cursos de Salas ({roomCoursesList.length})
          </TabsTrigger>
          <TabsTrigger value="workshops" className="data-[state=active]:bg-purple-600">
            <Users className="h-4 w-4 mr-2" />
            Talleres ({workshopsList.length})
          </TabsTrigger>
          <TabsTrigger value="guides" className="data-[state=active]:bg-purple-600">
            <FileText className="h-4 w-4 mr-2" />
            Guías ({guidesList.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-purple-600">
            <Settings className="h-4 w-4 mr-2" />
            Categorías ({(categories as any)?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700"
              />
            </div>
            <Link href="/admin/content/course/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Curso
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coursesList.map((course: any, index: number) => (
              <Card key={course.id} className="bg-slate-900/50 border-slate-700 hover:bg-slate-900/70 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-white text-lg line-clamp-2">{course.title}</CardTitle>
                    <div className="flex gap-1 ml-2">
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-1 mr-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => moveCourseUpMutation.mutate(course.id)}
                          disabled={index === 0 || moveCourseUpMutation.isPending}
                          className="h-6 w-6 p-0"
                          title="Mover arriba"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => moveCourseDownMutation.mutate(course.id)}
                          disabled={index === coursesList.length - 1 || moveCourseDownMutation.isPending}
                          className="h-6 w-6 p-0"
                          title="Mover abajo"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <Link href={`/admin/content/course/${course.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/course/${course.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-900 border-slate-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">¿Eliminar curso?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                              Esta acción no se puede deshacer. Se eliminará permanentemente el curso "{course.title}" y todas sus lecciones.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMutation.mutate(course.id)}
                              disabled={deleteMutation.isPending}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-400 text-sm line-clamp-2">{course.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getTypeColor(course.type)}>
                      {course.type}
                    </Badge>
                    <Badge className={getDifficultyColor(course.difficulty)}>
                      {course.difficulty}
                    </Badge>
                    {course.isPublished ? (
                      <Badge className="bg-green-500/20 text-green-400">Publicado</Badge>
                    ) : (
                      <Badge className="bg-gray-500/20 text-gray-400">Borrador</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {course.estimatedHours}h
                    </div>
                    <Link href={`/admin/content/course/${course.id}/lessons`}>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        Lecciones
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {coursesList.length === 0 && (
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No hay cursos</h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm ? "No se encontraron cursos que coincidan con tu búsqueda." : "Aún no hay cursos creados."}
                </p>
                <Link href="/admin/content/course/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Curso
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Room Courses Tab */}
        <TabsContent value="room-courses" className="space-y-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar cursos de salas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700"
              />
            </div>
            <Link href="/admin/content/course/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Curso
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomCoursesList.map((course: any, index: number) => (
              <Card key={course.id} className="bg-slate-900/50 border-slate-700 hover:bg-slate-900/70 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-white text-lg line-clamp-2">{course.title}</CardTitle>
                    <div className="flex gap-1 ml-2">
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-1 mr-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => moveCourseUpMutation.mutate(course.id)}
                          disabled={index === 0 || moveCourseUpMutation.isPending}
                          className="h-6 w-6 p-0"
                          title="Mover arriba"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => moveCourseDownMutation.mutate(course.id)}
                          disabled={index === roomCoursesList.length - 1 || moveCourseDownMutation.isPending}
                          className="h-6 w-6 p-0"
                          title="Mover abajo"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <Link href={`/admin/content/course/${course.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/course/${course.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-900 border-slate-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">¿Eliminar curso?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                              Esta acción no se puede deshacer. Se eliminará permanentemente el curso "{course.title}" y todas sus lecciones.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMutation.mutate(course.id)}
                              disabled={deleteMutation.isPending}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-400 text-sm line-clamp-2">{course.description}</p>
                  
                  {/* Room information */}
                  {course.roomContext && course.roomContext.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {course.roomContext.map((room: any, idx: number) => (
                        <Badge key={idx} className="bg-blue-500/20 text-blue-400">
                          Sala: {room.roomTitle || room.roomSlug}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getTypeColor(course.type)}>
                      {course.type}
                    </Badge>
                    <Badge className={getDifficultyColor(course.difficulty)}>
                      {course.difficulty}
                    </Badge>
                    {course.isPublished ? (
                      <Badge className="bg-green-500/20 text-green-400">Publicado</Badge>
                    ) : (
                      <Badge className="bg-gray-500/20 text-gray-400">Borrador</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {course.estimatedHours}h
                    </div>
                    <Link href={`/admin/content/course/${course.id}/lessons`}>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        Lecciones
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {roomCoursesList.length === 0 && (
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No hay cursos de salas</h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm ? "No se encontraron cursos de salas que coincidan con tu búsqueda." : "Aún no hay cursos de salas creados."}
                </p>
                <Link href="/admin/content/course/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Curso
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Workshops Tab */}
        <TabsContent value="workshops" className="space-y-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar talleres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700"
              />
            </div>
            <Link href="/admin/workshops/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Taller
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workshopsList.map((workshop: any) => (
              <Card key={workshop.id} className="bg-slate-900/50 border-slate-700 hover:bg-slate-900/70 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-white text-lg line-clamp-2">{workshop.title}</CardTitle>
                    <div className="flex gap-1 ml-2">
                      <Link href={`/admin/workshops/edit/${workshop.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/taller/${workshop.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-900 border-slate-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">¿Eliminar taller?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                              Esta acción no se puede deshacer. Se eliminará permanentemente el taller "{workshop.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMutation.mutate(workshop.id)}
                              disabled={deleteMutation.isPending}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-400 text-sm line-clamp-2">{workshop.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getTypeColor(workshop.type)}>
                      {workshop.type}
                    </Badge>
                    <Badge className={getDifficultyColor(workshop.difficulty)}>
                      {workshop.difficulty || 'No definido'}
                    </Badge>
                    {workshop.isPublished ? (
                      <Badge className="bg-green-500/20 text-green-400">Publicado</Badge>
                    ) : (
                      <Badge className="bg-gray-500/20 text-gray-400">Borrador</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {workshop.estimatedHours}h
                    </div>
                    <Badge className="bg-orange-500/20 text-orange-400 text-xs">
                      Sesión en vivo
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {workshopsList.length === 0 && (
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No hay talleres</h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm ? "No se encontraron talleres que coincidan con tu búsqueda." : "Aún no hay talleres creados."}
                </p>
                <Link href="/admin/content/course/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Taller
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Guides Tab */}
        <TabsContent value="guides" className="space-y-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar guías..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700"
              />
            </div>
            <Link href="/admin/content/course/new?type=guide">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Guía
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guidesList.map((guide: any) => (
              <Card key={guide.id} className="bg-slate-900/50 border-slate-700 hover:bg-slate-900/70 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-white text-lg line-clamp-2">{guide.title}</CardTitle>
                    <div className="flex gap-1 ml-2">
                      <Link href={`/admin/content/course/${guide.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/curso/${guide.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-900 border-slate-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">¿Eliminar guía?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                              Esta acción no se puede deshacer. Se eliminará permanentemente la guía "{guide.title}" y todas sus lecciones.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMutation.mutate(guide.id)}
                              disabled={deleteMutation.isPending}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-400 text-sm line-clamp-2">{guide.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getTypeColor(guide.type)}>
                      {guide.type}
                    </Badge>
                    <Badge className={getDifficultyColor(guide.difficulty)}>
                      {guide.difficulty || 'No definido'}
                    </Badge>
                    {guide.isPublished ? (
                      <Badge className="bg-green-500/20 text-green-400">Publicado</Badge>
                    ) : (
                      <Badge className="bg-gray-500/20 text-gray-400">Borrador</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {guide.estimatedHours}h
                    </div>
                    <Link href={`/admin/content/course/${guide.id}/lessons`}>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        Lecciones
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {guidesList.length === 0 && (
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No hay guías</h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm ? "No se encontraron guías que coincidan con tu búsqueda." : "Aún no hay guías creadas."}
                </p>
                <Link href="/admin/content/course/new?type=guide">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Guía
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">Categorías de Contenido</h3>
            <Link href="/admin/content/category/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Categoría
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(categories as any)?.map((category: any) => (
              <Card key={category.id} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{category.name}</h4>
                      <p className="text-gray-400 text-sm">{category.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="quick" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Crear Curso Completo
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Workflow guiado para crear un curso desde cero
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/content/course/new">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Comenzar Curso
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-600/20 to-teal-600/20 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Lección Rápida
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Agrega contenido a un curso existente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredCourses.slice(0, 3).map((course: any) => (
                    <Link key={course.id} href={`/admin/content/lesson/new/${course.id}`}>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        + {course.title}
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Organización
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Gestiona categorías y estructura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href="/admin/content/category/new">
                    <Button variant="outline" size="sm" className="w-full">
                      Nueva Categoría
                    </Button>
                  </Link>
                  <Link href="/admin/media">
                    <Button variant="outline" size="sm" className="w-full">
                      Gestión de Archivos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}