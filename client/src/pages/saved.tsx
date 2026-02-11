import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import CourseCard from "@/components/course-card";
import { Bookmark } from "lucide-react";

export default function Saved() {
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

  // Saved courses query
  const { data: savedCourses, isLoading: savedLoading, error } = useQuery({
    queryKey: ['/api/users/saved-courses'],
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
      <div className="min-h-screen bg-background flex">
        <div className="w-[250px] bg-card border-r border-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-foreground">Cargando autenticación...</div>
        </div>
      </div>
    );
  }

  if (savedLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <MobileHeader />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px]">
            <div className="flex items-center justify-center h-screen">
              <div className="text-foreground">Cargando elementos guardados...</div>
            </div>
          </main>
        </div>
        <MobileNav />
      </div>
    );
  }

  const savedCoursesArray = Array.isArray(savedCourses) ? savedCourses : [];
  const hasSavedItems = savedCoursesArray.length > 0;

  // Separate courses and guides
  const savedCoursesFiltered = savedCoursesArray.filter((item: any) => item.course?.type === 'course');
  const savedGuides = savedCoursesArray.filter((item: any) => item.course?.type === 'guide');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px] p-6">
          <div className="bg-card rounded-lg p-8 mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Tus elementos guardados</h1>
            <p className="text-muted-foreground">Revisa tus cursos, guías, beneficios y talleres guardados</p>
          </div>

          {hasSavedItems ? (
            <div className="space-y-8">
              {/* Saved Courses */}
              {savedCoursesFiltered.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                    <Bookmark className="h-6 w-6 mr-3 text-blue-400" />
                    Cursos guardados
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {savedCoursesFiltered.map((item: any) => (
                      <CourseCard 
                        key={item.courseId}
                        course={item.course}
                        category={item.category}
                        roomSlug={item.roomSlug}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Saved Guides */}
              {savedGuides.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                    <Bookmark className="h-6 w-6 mr-3 text-purple-400" />
                    Guías guardadas
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {savedGuides.map((item: any) => (
                      <CourseCard 
                        key={item.courseId}
                        course={item.course}
                        category={item.category}
                        roomSlug={item.roomSlug}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-card rounded-lg p-12 text-center">
              <Bookmark className="h-16 w-16 mx-auto mb-6 opacity-50 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground mb-4">Aún no has guardado nada.</h2>
              <p className="text-base text-muted-foreground">
                Explora nuestros{' '}
                <Link href="/courses">
                  <span className="text-blue-400 hover:text-blue-300 cursor-pointer underline">
                    cursos
                  </span>
                </Link>
                {' '}o{' '}
                <Link href="/guides">
                  <span className="text-purple-400 hover:text-purple-300 cursor-pointer underline">
                    guías
                  </span>
                </Link>
                {' '}para empezar a ahorrar.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}