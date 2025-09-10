import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import CourseCard from "@/components/course-card";
import TopicCard from "@/components/topic-card";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionBadge";
import { Button } from "@/components/ui/button";
import { Bell, ChevronLeft, ChevronRight, Plus, Shield, Lightbulb, Zap, Users, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { subscription, isFreePlan } = useSubscription();
  const [currentSlide, setCurrentSlide] = useState(0);

  // No authentication redirect - allow public access with locked content

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    enabled: true, // Allow fetching for all users to show real content
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  if (isLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-64 bg-card border-r border-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Use real data for all users - authenticated users get progress, non-authenticated see locked content
  const continueCourses = (dashboardData as any)?.continueCourses || [];
  const recommendedCourses = (dashboardData as any)?.recommendedCourses || [];
  const categories = (dashboardData as any)?.categories || [];

  const cardsPerView = 4;
  const maxCourses = Math.min(continueCourses.length, 8);
  const maxSlidePosition = Math.max(0, maxCourses - cardsPerView);
  
  const nextSlide = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, maxSlidePosition));
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };
  
  // No longer needed since we're using CSS transforms
  // const getCurrentCards = () => {
  //   const startIndex = currentSlide;
  //   return continueCourses.slice(startIndex, startIndex + cardsPerView);
  // };

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
        <div className="p-6 space-y-8">
          {/* Continue Learning Section OR Premium Features Section */}
          <section>
            {isAuthenticated ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-foreground text-[24px]">Continúa donde lo dejaste</h2>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted disabled:opacity-50"
                      onClick={prevSlide}
                      disabled={currentSlide <= 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted disabled:opacity-50"
                      onClick={nextSlide}
                      disabled={currentSlide >= maxSlidePosition}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ 
                      transform: `translateX(-${currentSlide * (100/4)}%)`,
                      gap: '1.5rem'
                    }}
                  >
                    {continueCourses.slice(0, 8).map((item: any, index: number) => (
                      <div 
                        key={item.course?.id} 
                        className="flex-shrink-0"
                        style={{ width: 'calc(25% - 1.125rem)' }}
                      >
                        <CourseCard
                          course={item.course}
                          category={item.category}
                          progress={item.progress}
                          lastLessonId={item.lastLessonId} // Pass the last lesson ID for intelligent navigation
                          showContinueText={true} // Enable "continue where you left off" navigation
                          isAuthenticated={isAuthenticated}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {continueCourses.length === 0 && (
                  <div className="w-full text-center py-12 text-muted-foreground">
                    <p>No has visitado ningún curso aún. ¡Explora y comienza a aprender algo nuevo!</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-xl p-12">
                {/* Single row with two columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Header + Features (longer column) */}
                  <div>
                    {/* Header */}
                    <div className="mb-6">
                      <h2 className="text-4xl font-bold text-white mb-2 leading-tight">
                        Capacitar a mil millones de personas para el futuro<br />
                        Un mundo donde la IA es lo primero
                      </h2>
                      <p className="text-gray-400 text-base">
                        Obten formación en IA personalizada, adaptada a tu estilo de aprendizaje, objetivos profesionales y 
                        necesidades del sector. Únete a más de 10,000 profesionales que ya están transformando sus carreras.
                      </p>
                    </div>

                    {/* Features Grid 2x2 */}
                    <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center mt-1">
                        <Lightbulb className="w-3 h-3 text-gray-300" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white mb-1">Más de 300 casos de uso de IA</h3>
                        <p className="text-sm text-gray-400">Tutoriales paso a paso para aplicación inmediata</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center mt-1">
                        <Zap className="w-3 h-3 text-gray-300" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white mb-1">Contenido diario</h3>
                        <p className="text-sm text-gray-400">Mantente a la vanguardia con las actualizaciones diarias de herramientas de IA</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center mt-1">
                        <Users className="w-3 h-3 text-gray-300" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white mb-1">Comunidad exclusiva</h3>
                        <p className="text-sm text-gray-400">Establece contactos con profesionales que priorizan la IA</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center mt-1">
                        <CheckCircle className="w-3 h-3 text-gray-300" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white mb-1">Certificaciones de IA</h3>
                        <p className="text-sm text-gray-400">Impulsa tu carrera con credenciales reconocidas</p>
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* Right Column: Quote + CTA (shorter column) */}
                  <div className="space-y-6">
                    {/* Quote Card */}
                    <div className="bg-gray-800 rounded-xl p-6 text-center">
                      <blockquote className="text-lg text-white mb-4">
                        "La IA no reemplazará a los humanos, pero los humanos que 
                        la usan reemplazarán a los humanos que no la usan"
                      </blockquote>
                      <cite className="text-sm text-gray-400 font-medium">— Fei-Fei Li</cite>
                    </div>

                    {/* CTA */}
                    <div>
                      <Button 
                        size="lg" 
                        className="bg-white text-black hover:bg-gray-100 text-base px-8 py-3 rounded-lg mb-3 font-medium w-full"
                        onClick={() => window.location.href = '/universidad-nocode-ia'}
                      >
                        Comience una prueba gratuita →
                      </Button>
                      <p className="text-sm text-gray-400 text-center">
                        <span className="text-green-400">✓</span> Más de 10,000 miembros • Prueba gratuita de 14 días
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Guide Recommendations */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground text-[24px]">Recomendaciones de la guía</h2>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground mb-6 text-[16px]">Basándonos en tus respuestas a la encuesta y tu historial en la plataforma, hemos seleccionado las mejores guías de IA para consultores . Siempre puedes cambiar tu enfoque en tu perfil.</p>

            {recommendedCourses.filter((item: any) => item.course?.type === 'guide').slice(0, 1).map((item: any) => (
              <div key={item.course.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer mb-6">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <CourseCard
                      course={item.course}
                      category={item.category}
                      progress={item.progress}
                      variant="horizontal"
                      isAuthenticated={isAuthenticated}
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Course Recommendations */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-foreground text-[24px]">Recomendaciones de cursos</h2>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendedCourses.filter((item: any) => item.course?.type === 'course').slice(0, 4).map((item: any) => (
                <CourseCard
                  key={item.course.id}
                  course={item.course}
                  category={item.category}
                  progress={item.progress}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          </section>

          {/* All Topics */}
          <section>
            <h2 className="font-semibold mb-6 text-foreground text-[24px]">Todos los temas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {categories.map((category: any) => (
                <TopicCard key={category.id} category={category} />
              ))}
            </div>
          </section>
        </div>
        </main>
      </div>
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
