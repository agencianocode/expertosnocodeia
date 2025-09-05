import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import CourseCard from "@/components/course-card";
import { 
  BookOpen,
  Award,
  FileText,
  ChevronRight
} from "lucide-react";

export default function MyProgress() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "No autorizado",
        description: "Has cerrado sesión. Iniciando sesión nuevamente...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Profile progress query
  const { data: profileProgress, isLoading: progressLoading, error } = useQuery({
    queryKey: ['/api/users/profile-progress'],
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Sesión expirada",
        description: "Tu sesión ha expirado. Redirigiendo...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex">
        <div className="w-[250px] bg-dark-card border-r border-dark-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Cargando autenticación...</div>
        </div>
      </div>
    );
  }

  if (progressLoading) {
    return (
      <div className="min-h-screen bg-dark-bg text-white">
        <MobileHeader />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px]">
            <div className="flex items-center justify-center h-screen">
              <div className="text-white">Cargando progreso...</div>
            </div>
          </main>
        </div>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px]">
          {/* Header */}
          <header className="bg-dark-card border-b border-dark-border p-6">
            <h1 className="text-2xl font-bold text-white">Mi progreso</h1>
            <p className="text-gray-400 mt-1">Revisa el seguimiento de tu progreso de los cursos y guías completados.</p>
          </header>

          <div className="p-6 space-y-8">
            {/* Cursos en curso */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <BookOpen className="h-6 w-6 mr-3 text-blue-400" />
                Cursos en curso
              </h2>
              {(profileProgress as any)?.coursesInProgress?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {(profileProgress as any).coursesInProgress.map((item: any, index: number) => (
                    <CourseCard 
                      key={item.course.id}
                      course={item.course}
                      category={item.category}
                      progress={item.progress}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400 bg-dark-card rounded-xl border border-dark-border">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-white mb-2">No tienes cursos en progreso</h3>
                  <p className="text-sm">Comienza un nuevo curso para ver tu progreso aquí</p>
                </div>
              )}
            </section>

            {/* Cursos completados */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Award className="h-6 w-6 mr-3 text-green-400" />
                Cursos completados
              </h2>
              {(profileProgress as any)?.completedCourses?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {(profileProgress as any).completedCourses.map((item: any, index: number) => (
                    <CourseCard 
                      key={item.course.id}
                      course={item.course}
                      category={item.category}
                      progress={item.progress}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400 bg-dark-card rounded-xl border border-dark-border">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-white mb-2">Aún no has completado ningún curso</h3>
                  <p className="text-sm">Completa tu primer curso para obtener tu certificado</p>
                </div>
              )}
            </section>

            {/* Guías completadas */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <FileText className="h-6 w-6 mr-3 text-purple-400" />
                Guías completadas
              </h2>
              {(profileProgress as any)?.completedGuides?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {(profileProgress as any).completedGuides.map((item: any, index: number) => (
                    <CourseCard 
                      key={item.course.id}
                      course={item.course}
                      category={item.category}
                      progress={item.progress}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400 bg-dark-card rounded-xl border border-dark-border">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-white mb-2">Aún no hay guías completadas</h3>
                  <p className="text-sm">Lee tu primera guía para verla aquí</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}